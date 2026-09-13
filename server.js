/**
 * Florescer API — Express + Postgres (Supabase)
 * Versão migrada do SQLite (better-sqlite3) para pg
 * Porta padrão: 3001
 */
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { db, transaction } = require("./db");
const { mailConfigured, enviarVerificacao, enviarResetSenha } = require("./email");

// Dependências de segurança (opcionais no require para não quebrar se npm install falhar)
let helmet, rateLimit;
try { helmet = require("helmet"); } catch (_) { helmet = null; }
try { rateLimit = require("express-rate-limit"); } catch (_) { rateLimit = null; }

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret: usa variável de ambiente, senão gera um temporário (só para não quebrar)
const JWT_SECRET = process.env.JWT_SECRET || ("dev-" + crypto.randomBytes(24).toString("hex"));
if (!process.env.JWT_SECRET) {
  console.warn("[AVISO] JWT_SECRET não definido. Defina no Render (Environment) para produção.");
}

async function garantirColunasAuthEmail() {
  try {
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao TEXT`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao_expira TIMESTAMPTZ`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset TEXT`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_expira TIMESTAMPTZ`);
    // Contas antigas (sem fluxo de verificação): liberar login
    await db.query(`
      UPDATE usuarios
      SET email_verificado = TRUE
      WHERE COALESCE(email_verificado, FALSE) = FALSE
        AND token_verificacao IS NULL
    `);
    if (!mailConfigured()) {
      console.warn("[AVISO] GMAIL_USER / GMAIL_APP_PASSWORD não definidos. Verificação e recuperação de senha não enviarão e-mail.");
    }
  } catch (e) {
    console.warn("[auth-email] migração:", e.message);
  }
}
garantirColunasAuthEmail();

/* ---------- Segurança básica ---------- */
app.set("trust proxy", 1);
app.disable("x-powered-by");

if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "200kb" }));

const authLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { erro: "Muitas tentativas. Aguarde alguns minutos." }
    })
  : (req, res, next) => next();

const frontendDir = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

function uid() {
  return crypto.randomBytes(5).toString("hex");
}

async function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Não autenticado" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id]);
    const user = rows[0];
    if (!user) return res.status(401).json({ erro: "Usuário inválido" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

async function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id]);
      req.user = rows[0] || null;
    } catch {
      req.user = null;
    }
  }
  next();
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    brotos: u.brotos,
    emailVerificado: !!u.email_verificado,
    criadoEm: u.criado_em,
    endereco: {
      cep: u.cep || "",
      rua: u.rua || "",
      bairro: u.bairro || "",
      cidade: u.cidade || "",
      complemento: u.complemento || ""
    }
  };
}

function clean(str, max = 200) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, max);
}

function tokenAleatorio() {
  return crypto.randomBytes(32).toString("hex");
}

/* ---------- Auth ---------- */
app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 80);
    const email = clean(req.body?.email, 120).toLowerCase();
    const senha = req.body?.senha || "";

    if (!nome || nome.length < 3) return res.status(400).json({ erro: "Informe o nome completo." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "E-mail inválido." });
    if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha mínima de 6 caracteres." });
    if (senha.length > 72) return res.status(400).json({ erro: "Senha muito longa." });

    const { rows: existsRows } = await db.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existsRows[0]) return res.status(409).json({ erro: "Já existe conta com este e-mail." });

    const hash = bcrypt.hashSync(senha, 12);
    const tokenVerif = tokenAleatorio();
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, brotos, email_verificado, token_verificacao, token_verificacao_expira)
       VALUES ($1, $2, $3, 100, FALSE, $4, $5) RETURNING id`,
      [nome, email, hash, tokenVerif, expira]
    );

    const envio = await enviarVerificacao(email, nome, tokenVerif);

    res.status(201).json({
      ok: true,
      email,
      emailEnviado: !!envio.ok,
      mensagem: envio.ok
        ? "Conta criada! Enviamos um link de verificação para o seu e-mail."
        : "Conta criada, mas não foi possível enviar o e-mail agora. Use \"Reenviar verificação\" no login."
    });
  } catch (err) { next(err); }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const email = clean(req.body?.email, 120).toLowerCase();
    const senha = req.body?.senha || "";

    const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    if (!user.email_verificado) {
      return res.status(403).json({
        erro: "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada (e o spam).",
        precisaVerificar: true,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, usuario: publicUser(user) });
  } catch (err) { next(err); }
});

app.post("/api/auth/verificar", authLimiter, async (req, res, next) => {
  try {
    const token = clean(req.body?.token, 80);
    if (!token) return res.status(400).json({ erro: "Token inválido." });

    const { rows } = await db.query("SELECT * FROM usuarios WHERE token_verificacao = $1", [token]);
    const user = rows[0];
    if (!user) return res.status(400).json({ erro: "Link inválido ou já usado." });
    if (user.email_verificado) {
      return res.json({ ok: true, mensagem: "E-mail já estava confirmado. Você pode entrar." });
    }
    if (user.token_verificacao_expira && new Date(user.token_verificacao_expira) < new Date()) {
      return res.status(400).json({ erro: "Link expirado. Peça um novo em \"Reenviar verificação\"." });
    }

    await db.query(
      `UPDATE usuarios SET email_verificado = TRUE, token_verificacao = NULL, token_verificacao_expira = NULL WHERE id = $1`,
      [user.id]
    );
    res.json({ ok: true, mensagem: "E-mail confirmado! Agora você pode entrar na sua conta." });
  } catch (err) { next(err); }
});

app.post("/api/auth/reenviar-verificacao", authLimiter, async (req, res, next) => {
  try {
    const email = clean(req.body?.email, 120).toLowerCase();
    if (!email) return res.status(400).json({ erro: "Informe o e-mail." });

    const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) {
      return res.json({ ok: true, mensagem: "Se este e-mail estiver cadastrado e ainda não verificado, enviaremos um novo link." });
    }
    if (user.email_verificado) {
      return res.json({ ok: true, mensagem: "Este e-mail já está verificado. Você pode entrar." });
    }

    const tokenVerif = tokenAleatorio();
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      `UPDATE usuarios SET token_verificacao = $1, token_verificacao_expira = $2 WHERE id = $3`,
      [tokenVerif, expira, user.id]
    );
    const envio = await enviarVerificacao(user.email, user.nome, tokenVerif);
    res.json({
      ok: true,
      emailEnviado: !!envio.ok,
      mensagem: envio.ok
        ? "Enviamos um novo link de verificação."
        : "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos."
    });
  } catch (err) { next(err); }
});

app.post("/api/auth/esqueci-senha", authLimiter, async (req, res, next) => {
  try {
    const email = clean(req.body?.email, 120).toLowerCase();
    if (!email) return res.status(400).json({ erro: "Informe o e-mail da conta." });

    const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) {
      return res.json({ ok: true, mensagem: "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha." });
    }

    const tokenReset = tokenAleatorio();
    const expira = new Date(Date.now() + 60 * 60 * 1000);
    await db.query(
      `UPDATE usuarios SET token_reset = $1, token_reset_expira = $2 WHERE id = $3`,
      [tokenReset, expira, user.id]
    );
    const envio = await enviarResetSenha(user.email, user.nome, tokenReset);
    res.json({
      ok: true,
      emailEnviado: !!envio.ok,
      mensagem: envio.ok
        ? "Enviamos um link para redefinir sua senha. Confira o e-mail (e o spam)."
        : "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos."
    });
  } catch (err) { next(err); }
});

app.post("/api/auth/redefinir-senha", authLimiter, async (req, res, next) => {
  try {
    const token = clean(req.body?.token, 80);
    const senha = req.body?.senha || "";
    if (!token) return res.status(400).json({ erro: "Token inválido." });
    if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha mínima de 6 caracteres." });
    if (senha.length > 72) return res.status(400).json({ erro: "Senha muito longa." });

    const { rows } = await db.query("SELECT * FROM usuarios WHERE token_reset = $1", [token]);
    const user = rows[0];
    if (!user) return res.status(400).json({ erro: "Link inválido ou já usado." });
    if (user.token_reset_expira && new Date(user.token_reset_expira) < new Date()) {
      return res.status(400).json({ erro: "Link expirado. Peça um novo em \"Esqueci minha senha\"." });
    }

    const hash = bcrypt.hashSync(senha, 12);
    await db.query(
      `UPDATE usuarios
       SET senha_hash = $1, token_reset = NULL, token_reset_expira = NULL, email_verificado = TRUE
       WHERE id = $2`,
      [hash, user.id]
    );
    res.json({ ok: true, mensagem: "Senha alterada! Você já pode entrar com a nova senha." });
  } catch (err) { next(err); }
});

app.get("/api/me", auth, (req, res) => {
  res.json({ usuario: publicUser(req.user) });
});

/* ---------- Catálogo ---------- */
app.get("/api/plantas", async (req, res, next) => {
  try {
    const { busca, categoria, ambiente, luz, pet, ordem } = req.query;
    let sql = "SELECT * FROM plantas WHERE ativo = 1";
    const params = [];
    let i = 0;
    const ph = () => { i += 1; return `$${i}`; };

    if (busca && typeof busca === "string") {
      const t = `%${busca.toLowerCase().slice(0, 80)}%`;
      sql += ` AND (lower(nome) LIKE ${ph()} OR lower(cientifico) LIKE ${ph()} OR lower(categoria) LIKE ${ph()})`;
      params.push(t, t, t);
    }
    if (categoria) { sql += ` AND categoria = ${ph()}`; params.push(String(categoria).slice(0, 50)); }
    if (ambiente) { sql += ` AND ambiente = ${ph()}`; params.push(String(ambiente).slice(0, 50)); }
    if (pet === "1" || pet === "true") { sql += " AND pet_friendly = 1"; }
    if (luz) {
      if (luz === "sol") sql += " AND (lower(luz) LIKE '%sol direto%' OR lower(luz) LIKE '%sol pleno%')";
      else if (luz === "indireta") sql += " AND lower(luz) LIKE '%indireta%'";
      else if (luz === "sombra") sql += " AND lower(luz) LIKE '%sombra%'";
    }

    if (ordem === "menor") sql += " ORDER BY preco ASC";
    else if (ordem === "maior") sql += " ORDER BY preco DESC";
    else if (ordem === "nome") sql += " ORDER BY lower(nome) ASC";
    else sql += " ORDER BY id ASC";

    const { rows } = await db.query(sql, params);
    res.json(rows.map(mapPlanta));
  } catch (err) { next(err); }
});

app.get("/api/plantas/:id", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM plantas WHERE id = $1", [String(req.params.id).slice(0, 20)]);
    const p = rows[0];
    if (!p) return res.status(404).json({ erro: "Planta não encontrada" });
    res.json(mapPlanta(p));
  } catch (err) { next(err); }
});

function mapPlanta(p) {
  return {
    id: p.id,
    nome: p.nome,
    cientifico: p.cientifico,
    emoji: p.emoji,
    imagem: p.imagem || null,
    preco: p.preco,
    categoria: p.categoria,
    ambiente: p.ambiente,
    luz: p.luz,
    agua: p.agua,
    umidade: p.umidade,
    porte: p.porte,
    dificuldade: p.dificuldade,
    petFriendly: !!p.pet_friendly,
    resumo: p.resumo,
    historia: p.historia
  };
}

/* ---------- Cursos ---------- */
app.get("/api/cursos", optionalAuth, async (req, res, next) => {
  try {
    const { rows: cursos } = await db.query("SELECT * FROM cursos ORDER BY id");
    const out = [];
    for (const c of cursos) {
      const { rows: aulasRows } = await db.query(
        "SELECT titulo, ordem FROM curso_aulas WHERE curso_id = $1 ORDER BY ordem",
        [c.id]
      );
      const aulas = aulasRows.map((a) => a.titulo);
      let progresso = { aulas: [], concluido: false, codigo: null, dataConclusao: null };
      if (req.user) {
        const { rows: progRows } = await db.query(
          "SELECT * FROM usuario_cursos WHERE usuario_id = $1 AND curso_id = $2",
          [req.user.id, c.id]
        );
        const reg = progRows[0];
        if (reg) {
          progresso = {
            aulas: JSON.parse(reg.aulas_feitas || "[]"),
            concluido: !!reg.concluido,
            codigo: reg.codigo,
            dataConclusao: reg.data_conclusao
          };
        }
      }
      out.push({
        id: c.id, titulo: c.titulo, nivel: c.nivel, duracao: c.duracao, emoji: c.emoji,
        imagem: c.imagem || null, descricao: c.descricao, link: c.link, brotos: c.brotos, aulas, progresso
      });
    }
    res.json(out);
  } catch (err) { next(err); }
});

app.post("/api/cursos/:id/aulas", auth, async (req, res, next) => {
  try {
    const { rows: cursoRows } = await db.query("SELECT * FROM cursos WHERE id = $1", [String(req.params.id).slice(0, 20)]);
    const curso = cursoRows[0];
    if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
    const { indice, marcado } = req.body || {};
    const { rows: regRows } = await db.query(
      "SELECT * FROM usuario_cursos WHERE usuario_id = $1 AND curso_id = $2",
      [req.user.id, curso.id]
    );
    let reg = regRows[0];
    if (!reg) {
      await db.query(
        "INSERT INTO usuario_cursos (usuario_id, curso_id, aulas_feitas) VALUES ($1, $2, '[]')",
        [req.user.id, curso.id]
      );
      reg = { aulas_feitas: "[]" };
    }
    const set = new Set(JSON.parse(reg.aulas_feitas || "[]"));
    if (marcado) set.add(Number(indice));
    else set.delete(Number(indice));
    const aulas = [...set].sort((a, b) => a - b);
    await db.query(
      "UPDATE usuario_cursos SET aulas_feitas = $1 WHERE usuario_id = $2 AND curso_id = $3",
      [JSON.stringify(aulas), req.user.id, curso.id]
    );
    res.json({ aulas });
  } catch (err) { next(err); }
});

app.post("/api/cursos/:id/concluir", auth, async (req, res, next) => {
  try {
    const { rows: cursoRows } = await db.query("SELECT * FROM cursos WHERE id = $1", [String(req.params.id).slice(0, 20)]);
    const curso = cursoRows[0];
    if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
    const { rows: countRows } = await db.query("SELECT COUNT(*) AS n FROM curso_aulas WHERE curso_id = $1", [curso.id]);
    const totalAulas = Number(countRows[0].n);
    const { rows: regRows } = await db.query(
      "SELECT * FROM usuario_cursos WHERE usuario_id = $1 AND curso_id = $2",
      [req.user.id, curso.id]
    );
    const reg = regRows[0];
    if (!reg) return res.status(400).json({ erro: "Nenhum progresso registrado." });
    const feitas = JSON.parse(reg.aulas_feitas || "[]");
    if (feitas.length < totalAulas) return res.status(400).json({ erro: "Complete todas as aulas." });
    let codigo = reg.codigo;
    let brotosGanhos = 0;
    if (!reg.concluido) {
      codigo = "FL-" + curso.id.toUpperCase() + "-" + uid().toUpperCase();
      await db.query(
        "UPDATE usuario_cursos SET concluido = 1, data_conclusao = NOW(), codigo = $1 WHERE usuario_id = $2 AND curso_id = $3",
        [codigo, req.user.id, curso.id]
      );
      await db.query("UPDATE usuarios SET brotos = brotos + $1 WHERE id = $2", [curso.brotos, req.user.id]);
      brotosGanhos = curso.brotos;
    }
    const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    const user = userRows[0];
    res.json({ codigo, brotosGanhos, brotos: user.brotos, dataConclusao: new Date().toISOString(), usuario: publicUser(user) });
  } catch (err) { next(err); }
});

/* ---------- Recompensas ---------- */
app.get("/api/recompensas", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM recompensas ORDER BY custo ASC");
    res.json(rows.map((r) => ({ id: r.id, nome: r.nome, desc: r.descricao, custo: r.custo, emoji: r.emoji, tipo: r.tipo, valor: r.valor })));
  } catch (err) { next(err); }
});

app.get("/api/resgates", auth, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT rg.*, r.nome, r.emoji, r.descricao, r.tipo, r.valor, r.custo
      FROM resgates rg JOIN recompensas r ON r.id = rg.recompensa_id
      WHERE rg.usuario_id = $1 ORDER BY rg.data DESC
    `, [req.user.id]);
    res.json(rows.map((r) => ({
      id: r.id, recompensaId: r.recompensa_id, usado: !!r.usado, data: r.data,
      recompensa: { id: r.recompensa_id, nome: r.nome, emoji: r.emoji, desc: r.descricao, tipo: r.tipo, valor: r.valor, custo: r.custo }
    })));
  } catch (err) { next(err); }
});

app.post("/api/resgates", auth, async (req, res, next) => {
  try {
    const recompensaId = String(req.body?.recompensaId || "").slice(0, 20);
    const { rows: rRows } = await db.query("SELECT * FROM recompensas WHERE id = $1", [recompensaId]);
    const r = rRows[0];
    if (!r) return res.status(404).json({ erro: "Recompensa não encontrada" });
    if (req.user.brotos < r.custo) return res.status(400).json({ erro: "Brotos insuficientes." });
    const id = uid();
    await transaction(async (client) => {
      await client.query("UPDATE usuarios SET brotos = brotos - $1 WHERE id = $2", [r.custo, req.user.id]);
      await client.query("INSERT INTO resgates (id, usuario_id, recompensa_id, usado) VALUES ($1, $2, $3, 0)", [id, req.user.id, r.id]);
    });
    const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    res.json({ id, brotos: userRows[0].brotos, usuario: publicUser(userRows[0]) });
  } catch (err) { next(err); }
});

/* ---------- Carrinho ---------- */
app.get("/api/carrinho", auth, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT c.planta_id AS id, c.quantidade AS qtd, p.nome, p.preco, p.emoji, p.cientifico
      FROM carrinho_itens c JOIN plantas p ON p.id = c.planta_id WHERE c.usuario_id = $1
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

app.put("/api/carrinho", auth, async (req, res, next) => {
  try {
    const itens = Array.isArray(req.body) ? req.body.slice(0, 50) : [];
    await transaction(async (client) => {
      await client.query("DELETE FROM carrinho_itens WHERE usuario_id = $1", [req.user.id]);
      for (const i of itens) {
        const qtd = Math.min(99, Math.max(0, Number(i.qtd) || 0));
        if (qtd > 0 && i.id) {
          await client.query("INSERT INTO carrinho_itens (usuario_id, planta_id, quantidade) VALUES ($1, $2, $3)", [req.user.id, String(i.id).slice(0, 20), qtd]);
        }
      }
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.post("/api/carrinho/add", auth, async (req, res, next) => {
  try {
    const id = String(req.body?.id || "").slice(0, 20);
    const qtd = Math.min(99, Math.max(1, Number(req.body?.qtd) || 1));
    const { rows: plantaRows } = await db.query("SELECT id FROM plantas WHERE id = $1", [id]);
    if (!plantaRows[0]) return res.status(404).json({ erro: "Planta não encontrada" });
    const { rows: existRows } = await db.query("SELECT * FROM carrinho_itens WHERE usuario_id = $1 AND planta_id = $2", [req.user.id, id]);
    if (existRows[0]) {
      await db.query("UPDATE carrinho_itens SET quantidade = quantidade + $1 WHERE id = $2", [qtd, existRows[0].id]);
    } else {
      await db.query("INSERT INTO carrinho_itens (usuario_id, planta_id, quantidade) VALUES ($1, $2, $3)", [req.user.id, id, qtd]);
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/* ---------- Pedidos ---------- */
app.post("/api/pedidos", auth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const itens = Array.isArray(body.itens) ? body.itens.slice(0, 50) : [];
    if (!itens.length) return res.status(400).json({ erro: "Carrinho vazio." });
    let subtotal = 0;
    const itensDb = [];
    for (const i of itens) {
      const { rows: pRows } = await db.query("SELECT * FROM plantas WHERE id = $1 AND ativo = 1", [String(i.id).slice(0, 20)]);
      const p = pRows[0];
      if (!p) return res.status(400).json({ erro: "Planta inválida" });
      const qtd = Math.min(99, Math.max(1, Number(i.qtd) || 1));
      subtotal += p.preco * qtd;
      itensDb.push({ id: p.id, nome: p.nome, qtd, preco: p.preco });
    }
    const recompensasIds = Array.isArray(body.recompensasAplicadas) ? body.recompensasAplicadas.slice(0, 10).map((id) => String(id).slice(0, 20)) : [];
    const { rows: resgatesDisponiveis } = await db.query("SELECT * FROM resgates WHERE usuario_id = $1 AND usado = 0", [req.user.id]);
    let frete = Math.max(0, Number(body.frete?.valor) || 0);
    let desconto = 0;
    let embalagem = body.presente ? 12.9 : 0;
    for (const rid of recompensasIds) {
      const rg = resgatesDisponiveis.find((x) => x.recompensa_id === rid);
      if (!rg) continue;
      const { rows: rRows } = await db.query("SELECT * FROM recompensas WHERE id = $1", [rid]);
      const r = rRows[0];
      if (!r) continue;
      if (r.tipo === "frete" || r.tipo === "expresso") frete = 0;
      if (r.tipo === "desconto") desconto += r.valor || 0;
      if (r.tipo === "percentual") desconto += subtotal * ((r.valor || 0) / 100);
      if (r.tipo === "brinde" && r.id === "r7") embalagem = 0;
    }
    if (subtotal >= 299 && body.frete?.modalidade === "padrao") frete = 0;
    desconto = Math.min(desconto, subtotal);
    const metodo = ["pix", "cartao", "boleto"].includes(body.pagamento?.metodo) ? body.pagamento.metodo : "pix";
    const baseAntesPix = subtotal - desconto + frete + embalagem;
    const descontoPix = metodo === "pix" ? baseAntesPix * 0.05 : 0;
    const total = Math.max(0, baseAntesPix - descontoPix);
    const id = "P" + uid().toUpperCase();
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO pedidos (id, usuario_id, subtotal, frete, desconto, total, metodo, status, presente, frete_regiao, frete_prazo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pago', $8, $9, $10)`,
        [id, req.user.id, subtotal, frete, desconto + descontoPix, total, metodo, body.presente ? 1 : 0, body.frete?.regiao || null, body.frete?.prazo ? JSON.stringify(body.frete.prazo) : null]
      );
      for (const it of itensDb) {
        await client.query("INSERT INTO pedido_itens (pedido_id, planta_id, nome, quantidade, preco) VALUES ($1, $2, $3, $4, $5)", [id, it.id, it.nome, it.qtd, it.preco]);
      }
      for (const rid of recompensasIds) {
        await client.query("UPDATE resgates SET usado = 1 WHERE usuario_id = $1 AND recompensa_id = $2 AND usado = 0", [req.user.id, rid]);
      }
      await client.query("DELETE FROM carrinho_itens WHERE usuario_id = $1", [req.user.id]);
      await client.query("UPDATE usuarios SET brotos = brotos + $1 WHERE id = $2", [Math.floor(total), req.user.id]);
    });
    const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    res.json({ id, total, brotos: userRows[0].brotos, usuario: publicUser(userRows[0]) });
  } catch (err) { next(err); }
});

app.get("/api/pedidos", auth, async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50", [req.user.id]);
    res.json(rows.map((p) => ({ id: p.id, subtotal: p.subtotal, frete: p.frete, desconto: p.desconto, total: p.total, metodo: p.metodo, status: p.status, presente: !!p.presente, criadoEm: p.criado_em })));
  } catch (err) { next(err); }
});

/* ---------- Avaliações ---------- */
app.get("/api/avaliacoes", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM avaliacoes ORDER BY data DESC LIMIT 100");
    res.json(rows.map((a) => ({ id: a.id, plantaId: a.planta_id, nota: a.nota, texto: a.texto, autor: a.autor, data: a.data })));
  } catch (err) { next(err); }
});

app.post("/api/avaliacoes", auth, async (req, res, next) => {
  try {
    const plantaId = String(req.body?.plantaId || "").slice(0, 20);
    const nota = Math.min(5, Math.max(1, Number(req.body?.nota) || 5));
    const texto = clean(req.body?.texto, 500);
    if (!plantaId) return res.status(400).json({ erro: "Informe a planta." });
    const id = uid();
    await db.query("INSERT INTO avaliacoes (id, usuario_id, planta_id, nota, texto, autor) VALUES ($1, $2, $3, $4, $5, $6)", [id, req.user.id, plantaId, nota, texto, req.user.nome]);
    await db.query("UPDATE usuarios SET brotos = brotos + 50 WHERE id = $1", [req.user.id]);
    const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    res.json({ id, brotos: userRows[0].brotos, usuario: publicUser(userRows[0]) });
  } catch (err) { next(err); }
});

/* ---------- FAQ + meta ---------- */
app.get("/api/faq", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT pergunta AS q, resposta AS a FROM faq ORDER BY ordem");
    res.json(rows);
  } catch (err) { next(err); }
});

app.get("/api/meta", async (req, res, next) => {
  try {
    const { rows: catRows } = await db.query("SELECT DISTINCT categoria FROM plantas ORDER BY categoria");
    const { rows: ambRows } = await db.query("SELECT DISTINCT ambiente FROM plantas ORDER BY ambiente");
    res.json({ categorias: catRows.map((r) => r.categoria), ambientes: ambRows.map((r) => r.ambiente) });
  } catch (err) { next(err); }
});

/* ---------- Endereço ---------- */
app.put("/api/me/endereco", auth, async (req, res, next) => {
  try {
    await db.query("UPDATE usuarios SET cep = $1, rua = $2, bairro = $3, cidade = $4, complemento = $5 WHERE id = $6", [
      clean(req.body?.cep, 12) || null, clean(req.body?.rua, 120) || null, clean(req.body?.bairro, 80) || null,
      clean(req.body?.cidade, 80) || null, clean(req.body?.complemento, 80) || null, req.user.id
    ]);
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    res.json({ usuario: publicUser(rows[0]) });
  } catch (err) { next(err); }
});

try {
  require("./flora-api")(app, { db, mapPlanta, clean, rateLimit });
} catch (e) {
  console.warn("[Flora] módulo não carregou:", e.message);
}

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Florescer rodando em http://localhost:${PORT}`);
});

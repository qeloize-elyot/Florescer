/**
 * Florescer API — Express + SQLite
 * Versão reforçada de segurança
 * Porta padrão: 3001
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- Segurança: JWT Secret ----------
// Em produção OBRIGATÓRIO definir JWT_SECRET no ambiente (Render → Environment)
const isProd = process.env.NODE_ENV === "production" || !!process.env.RENDER;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (isProd) {
    console.error("ERRO CRÍTICO: JWT_SECRET não definido em produção. Defina a variável de ambiente.");
    process.exit(1);
  }
  console.warn("AVISO: usando JWT_SECRET de desenvolvimento. Nunca use isso em produção.");
}
const SECRET = JWT_SECRET || "florescer-dev-secret-APENAS-LOCAL-" + crypto.randomBytes(8).toString("hex");

// ---------- Middlewares de segurança ----------
app.set("trust proxy", 1); // necessário no Render / proxies
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS — em produção restrinja ao seu domínio
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true; // em dev aceita qualquer origem

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "100kb" })); // limite menor que 1mb

// Rate limit geral (protege contra abuso)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições. Tente novamente em alguns minutos." }
});
app.use(generalLimiter);

// Rate limit mais rigoroso para login/register (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 tentativas por 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde 15 minutos." }
});

// Serve o frontend estático
const frontendDir = require("fs").existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

/* ---------- helpers ---------- */
function uid() {
  return crypto.randomBytes(6).toString("hex");
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Não autenticado" });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ erro: "Usuário inválido" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(payload.id) || null;
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

function sanitizeString(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

/* ---------- Auth ---------- */
app.post("/api/auth/register", authLimiter, (req, res) => {
  const nome = sanitizeString(req.body?.nome, 80);
  const email = sanitizeString(req.body?.email, 120).toLowerCase();
  const senha = req.body?.senha || "";

  if (!nome || nome.length < 3) return res.status(400).json({ erro: "Informe o nome completo." });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "E-mail inválido." });
  if (!senha || senha.length < 8) return res.status(400).json({ erro: "Senha mínima de 8 caracteres." });
  if (senha.length > 72) return res.status(400).json({ erro: "Senha muito longa." }); // bcrypt limit

  const exists = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ erro: "Já existe conta com este e-mail." });

  const hash = bcrypt.hashSync(senha, 12); // custo um pouco maior
  const info = db.prepare(
    "INSERT INTO usuarios (nome, email, senha_hash, brotos) VALUES (?, ?, ?, 100)"
  ).run(nome, email, hash);

  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" }); // 7 dias em vez de 30
  res.json({ token, usuario: publicUser(user) });
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const email = sanitizeString(req.body?.email, 120).toLowerCase();
  const senha = req.body?.senha || "";

  const user = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email);
  // Resposta genérica para não revelar se o e-mail existe
  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
  res.json({ token, usuario: publicUser(user) });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ usuario: publicUser(req.user) });
});

/* ---------- Catálogo ---------- */
app.get("/api/plantas", (req, res) => {
  const { busca, categoria, ambiente, luz, pet, ordem } = req.query;
  let sql = "SELECT * FROM plantas WHERE ativo = 1";
  const params = [];

  if (busca && typeof busca === "string") {
    sql += " AND (lower(nome) LIKE ? OR lower(cientifico) LIKE ? OR lower(categoria) LIKE ?)";
    const t = `%${busca.toLowerCase().slice(0, 80)}%`;
    params.push(t, t, t);
  }
  if (categoria) { sql += " AND categoria = ?"; params.push(String(categoria).slice(0, 50)); }
  if (ambiente) { sql += " AND ambiente = ?"; params.push(String(ambiente).slice(0, 50)); }
  if (pet === "1" || pet === "true") { sql += " AND pet_friendly = 1"; }
  if (luz) {
    if (luz === "sol") sql += " AND (lower(luz) LIKE '%sol direto%' OR lower(luz) LIKE '%sol pleno%')";
    else if (luz === "indireta") sql += " AND lower(luz) LIKE '%indireta%'";
    else if (luz === "sombra") sql += " AND lower(luz) LIKE '%sombra%'";
  }

  if (ordem === "menor") sql += " ORDER BY preco ASC";
  else if (ordem === "maior") sql += " ORDER BY preco DESC";
  else if (ordem === "nome") sql += " ORDER BY nome COLLATE NOCASE ASC";
  else sql += " ORDER BY id ASC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(mapPlanta));
});

app.get("/api/plantas/:id", (req, res) => {
  const p = db.prepare("SELECT * FROM plantas WHERE id = ?").get(String(req.params.id).slice(0, 20));
  if (!p) return res.status(404).json({ erro: "Planta não encontrada" });
  res.json(mapPlanta(p));
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
app.get("/api/cursos", optionalAuth, (req, res) => {
  const cursos = db.prepare("SELECT * FROM cursos ORDER BY id").all();
  const aulasStmt = db.prepare("SELECT titulo, ordem FROM curso_aulas WHERE curso_id = ? ORDER BY ordem");
  const progStmt = req.user
    ? db.prepare("SELECT * FROM usuario_cursos WHERE usuario_id = ? AND curso_id = ?")
    : null;

  const out = cursos.map((c) => {
    const aulas = aulasStmt.all(c.id).map((a) => a.titulo);
    let progresso = { aulas: [], concluido: false, codigo: null, dataConclusao: null };
    if (req.user) {
      const reg = progStmt.get(req.user.id, c.id);
      if (reg) {
        progresso = {
          aulas: JSON.parse(reg.aulas_feitas || "[]"),
          concluido: !!reg.concluido,
          codigo: reg.codigo,
          dataConclusao: reg.data_conclusao
        };
      }
    }
    return {
      id: c.id,
      titulo: c.titulo,
      nivel: c.nivel,
      duracao: c.duracao,
      emoji: c.emoji,
      imagem: c.imagem || null,
      descricao: c.descricao,
      link: c.link,
      brotos: c.brotos,
      aulas,
      progresso
    };
  });
  res.json(out);
});

app.post("/api/cursos/:id/aulas", auth, (req, res) => {
  const { indice, marcado } = req.body || {};
  const curso = db.prepare("SELECT * FROM cursos WHERE id = ?").get(String(req.params.id).slice(0, 20));
  if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });

  let reg = db.prepare("SELECT * FROM usuario_cursos WHERE usuario_id = ? AND curso_id = ?")
    .get(req.user.id, curso.id);

  if (!reg) {
    db.prepare("INSERT INTO usuario_cursos (usuario_id, curso_id, aulas_feitas) VALUES (?, ?, '[]')")
      .run(req.user.id, curso.id);
    reg = { aulas_feitas: "[]", concluido: 0 };
  }

  const set = new Set(JSON.parse(reg.aulas_feitas || "[]"));
  if (marcado) set.add(Number(indice));
  else set.delete(Number(indice));
  const aulas = [...set].sort((a, b) => a - b);

  db.prepare("UPDATE usuario_cursos SET aulas_feitas = ? WHERE usuario_id = ? AND curso_id = ?")
    .run(JSON.stringify(aulas), req.user.id, curso.id);

  res.json({ aulas });
});

app.post("/api/cursos/:id/concluir", auth, (req, res) => {
  const curso = db.prepare("SELECT * FROM cursos WHERE id = ?").get(String(req.params.id).slice(0, 20));
  if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });

  const totalAulas = db.prepare("SELECT COUNT(*) AS n FROM curso_aulas WHERE curso_id = ?").get(curso.id).n;
  let reg = db.prepare("SELECT * FROM usuario_cursos WHERE usuario_id = ? AND curso_id = ?")
    .get(req.user.id, curso.id);

  if (!reg) return res.status(400).json({ erro: "Nenhum progresso registrado." });
  const feitas = JSON.parse(reg.aulas_feitas || "[]");
  if (feitas.length < totalAulas) return res.status(400).json({ erro: "Complete todas as aulas." });

  let codigo = reg.codigo;
  let brotosGanhos = 0;
  if (!reg.concluido) {
    codigo = "FL-" + curso.id.toUpperCase() + "-" + uid().toUpperCase();
    db.prepare(`
      UPDATE usuario_cursos
      SET concluido = 1, data_conclusao = datetime('now'), codigo = ?
      WHERE usuario_id = ? AND curso_id = ?
    `).run(codigo, req.user.id, curso.id);
    db.prepare("UPDATE usuarios SET brotos = brotos + ? WHERE id = ?").run(curso.brotos, req.user.id);
    brotosGanhos = curso.brotos;
  }

  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);
  res.json({
    codigo,
    brotosGanhos,
    brotos: user.brotos,
    dataConclusao: new Date().toISOString(),
    usuario: publicUser(user)
  });
});

/* ---------- Recompensas / Brotos ---------- */
app.get("/api/recompensas", (req, res) => {
  const rows = db.prepare("SELECT * FROM recompensas ORDER BY custo ASC").all();
  res.json(rows.map((r) => ({
    id: r.id, nome: r.nome, desc: r.descricao, custo: r.custo,
    emoji: r.emoji, tipo: r.tipo, valor: r.valor
  })));
});

app.get("/api/resgates", auth, (req, res) => {
  const rows = db.prepare(`
    SELECT rg.*, r.nome, r.emoji, r.descricao, r.tipo, r.valor, r.custo
    FROM resgates rg
    JOIN recompensas r ON r.id = rg.recompensa_id
    WHERE rg.usuario_id = ?
    ORDER BY rg.data DESC
  `).all(req.user.id);
  res.json(rows.map((r) => ({
    id: r.id,
    recompensaId: r.recompensa_id,
    usado: !!r.usado,
    data: r.data,
    recompensa: {
      id: r.recompensa_id, nome: r.nome, emoji: r.emoji,
      desc: r.descricao, tipo: r.tipo, valor: r.valor, custo: r.custo
    }
  })));
});

app.post("/api/resgates", auth, (req, res) => {
  const recompensaId = String(req.body?.recompensaId || "").slice(0, 20);
  const r = db.prepare("SELECT * FROM recompensas WHERE id = ?").get(recompensaId);
  if (!r) return res.status(404).json({ erro: "Recompensa não encontrada" });
  if (req.user.brotos < r.custo) return res.status(400).json({ erro: "Brotos insuficientes." });

  const id = uid();
  const tx = db.transaction(() => {
    db.prepare("UPDATE usuarios SET brotos = brotos - ? WHERE id = ?").run(r.custo, req.user.id);
    db.prepare("INSERT INTO resgates (id, usuario_id, recompensa_id, usado) VALUES (?, ?, ?, 0)")
      .run(id, req.user.id, r.id);
  });
  tx();

  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);
  res.json({ id, brotos: user.brotos, usuario: publicUser(user) });
});

/* ---------- Carrinho ---------- */
app.get("/api/carrinho", auth, (req, res) => {
  const itens = db.prepare(`
    SELECT c.planta_id AS id, c.quantidade AS qtd, p.nome, p.preco, p.emoji, p.cientifico
    FROM carrinho_itens c
    JOIN plantas p ON p.id = c.planta_id
    WHERE c.usuario_id = ?
  `).all(req.user.id);
  res.json(itens);
});

app.put("/api/carrinho", auth, (req, res) => {
  const itens = Array.isArray(req.body) ? req.body.slice(0, 50) : [];
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM carrinho_itens WHERE usuario_id = ?").run(req.user.id);
    const ins = db.prepare(
      "INSERT INTO carrinho_itens (usuario_id, planta_id, quantidade) VALUES (?, ?, ?)"
    );
    for (const i of itens) {
      const qtd = Math.min(99, Math.max(0, Number(i.qtd) || 0));
      if (qtd > 0 && i.id) ins.run(req.user.id, String(i.id).slice(0, 20), qtd);
    }
  });
  tx();
  res.json({ ok: true });
});

app.post("/api/carrinho/add", auth, (req, res) => {
  const id = String(req.body?.id || "").slice(0, 20);
  const qtd = Math.min(99, Math.max(1, Number(req.body?.qtd) || 1));
  const planta = db.prepare("SELECT id FROM plantas WHERE id = ?").get(id);
  if (!planta) return res.status(404).json({ erro: "Planta não encontrada" });

  const exist = db.prepare(
    "SELECT * FROM carrinho_itens WHERE usuario_id = ? AND planta_id = ?"
  ).get(req.user.id, id);

  if (exist) {
    db.prepare("UPDATE carrinho_itens SET quantidade = quantidade + ? WHERE id = ?")
      .run(qtd, exist.id);
  } else {
    db.prepare("INSERT INTO carrinho_itens (usuario_id, planta_id, quantidade) VALUES (?, ?, ?)")
      .run(req.user.id, id, qtd);
  }
  res.json({ ok: true });
});

/* ---------- Pedidos ---------- */
app.post("/api/pedidos", auth, (req, res) => {
  const body = req.body || {};
  const itens = Array.isArray(body.itens) ? body.itens.slice(0, 50) : [];
  if (!itens.length) return res.status(400).json({ erro: "Carrinho vazio." });

  // Valida plantas e recalcula subtotal no servidor (nunca confia no front)
  let subtotal = 0;
  const itensDb = [];
  for (const i of itens) {
    const p = db.prepare("SELECT * FROM plantas WHERE id = ? AND ativo = 1").get(String(i.id).slice(0, 20));
    if (!p) return res.status(400).json({ erro: `Planta inválida` });
    const qtd = Math.min(99, Math.max(1, Number(i.qtd) || 1));
    subtotal += p.preco * qtd;
    itensDb.push({ id: p.id, nome: p.nome, qtd, preco: p.preco });
  }

  const recompensasIds = Array.isArray(body.recompensasAplicadas)
    ? body.recompensasAplicadas.slice(0, 10).map((id) => String(id).slice(0, 20))
    : [];
  const resgatesDisponiveis = db.prepare(
    "SELECT * FROM resgates WHERE usuario_id = ? AND usado = 0"
  ).all(req.user.id);

  let frete = Math.max(0, Number(body.frete?.valor) || 0);
  let desconto = 0;
  let embalagem = body.presente ? 12.9 : 0;
  const brindes = [];

  for (const rid of recompensasIds) {
    const rg = resgatesDisponiveis.find((x) => x.recompensa_id === rid);
    if (!rg) continue;
    const r = db.prepare("SELECT * FROM recompensas WHERE id = ?").get(rid);
    if (!r) continue;
    if (r.tipo === "frete" || r.tipo === "expresso") frete = 0;
    if (r.tipo === "desconto") desconto += r.valor || 0;
    if (r.tipo === "percentual") desconto += subtotal * ((r.valor || 0) / 100);
    if (r.tipo === "brinde") {
      brindes.push(r.nome);
      if (r.id === "r7") embalagem = 0;
    }
  }

  if (subtotal >= 299 && body.frete?.modalidade === "padrao") frete = 0;
  desconto = Math.min(desconto, subtotal);

  const metodo = ["pix", "cartao", "boleto"].includes(body.pagamento?.metodo)
    ? body.pagamento.metodo
    : "pix";
  const baseAntesPix = subtotal - desconto + frete + embalagem;
  const descontoPix = metodo === "pix" ? baseAntesPix * 0.05 : 0;
  const total = Math.max(0, baseAntesPix - descontoPix);
  const brotosGanhos = Math.floor(total);

  const pedidoId = "FL" + Date.now().toString().slice(-8) + uid().slice(0, 4);
  const end = body.endereco || {};
  const pres = body.presente || null;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO pedidos (
        id, usuario_id, status, subtotal, frete, desconto, embalagem, desconto_pix, total, brotos_ganhos,
        frete_regiao, frete_prazo_min, frete_prazo_max, frete_modalidade,
        cep, rua, numero, bairro, cidade, complemento,
        pagamento_metodo, pagamento_parcelas,
        presente_para, presente_de, presente_msg, presente_ocultar
      ) VALUES (
        ?, ?, 'Em preparo', ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      pedidoId, req.user.id, subtotal, frete, desconto, embalagem, descontoPix, total, brotosGanhos,
      sanitizeString(body.frete?.regiao, 40) || null,
      body.frete?.prazo?.[0] ?? null,
      body.frete?.prazo?.[1] ?? null,
      sanitizeString(body.frete?.modalidade, 20) || null,
      sanitizeString(end.cep, 12), sanitizeString(end.rua, 120), sanitizeString(end.numero, 20),
      sanitizeString(end.bairro, 80), sanitizeString(end.cidade, 80), sanitizeString(end.complemento, 80),
      metodo, Math.min(12, Math.max(1, Number(body.pagamento?.parcelas) || 1)),
      sanitizeString(pres?.para, 80) || null,
      sanitizeString(pres?.de, 80) || null,
      sanitizeString(pres?.mensagem, 300) || null,
      pres?.ocultarValores ? 1 : 0
    );

    const insItem = db.prepare(
      "INSERT INTO pedido_itens (pedido_id, planta_id, nome, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)"
    );
    for (const i of itensDb) insItem.run(pedidoId, i.id, i.nome, i.qtd, i.preco);

    for (const rid of recompensasIds) {
      db.prepare(
        "UPDATE resgates SET usado = 1 WHERE usuario_id = ? AND recompensa_id = ? AND usado = 0"
      ).run(req.user.id, rid);
    }

    db.prepare("UPDATE usuarios SET brotos = brotos + ? WHERE id = ?").run(brotosGanhos, req.user.id);
    db.prepare("DELETE FROM carrinho_itens WHERE usuario_id = ?").run(req.user.id);
  });
  tx();

  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);
  res.json({
    pedido: {
      id: pedidoId,
      total,
      brotosGanhos,
      frete: body.frete,
      status: "Em preparo"
    },
    usuario: publicUser(user)
  });
});

app.get("/api/pedidos", auth, (req, res) => {
  const pedidos = db.prepare(
    "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data DESC"
  ).all(req.user.id);

  const itensStmt = db.prepare("SELECT * FROM pedido_itens WHERE pedido_id = ?");
  const out = pedidos.map((p) => ({
    id: p.id,
    data: p.data,
    status: p.status,
    totais: {
      sub: p.subtotal,
      frete: p.frete,
      desconto: p.desconto,
      embalagem: p.embalagem,
      descontoPix: p.desconto_pix,
      total: p.total
    },
    frete: {
      regiao: p.frete_regiao,
      prazo: [p.frete_prazo_min, p.frete_prazo_max],
      modalidade: p.frete_modalidade
    },
    endereco: {
      cep: p.cep, rua: p.rua, numero: p.numero,
      bairro: p.bairro, cidade: p.cidade, complemento: p.complemento
    },
    pagamento: { metodo: p.pagamento_metodo, parcelas: p.pagamento_parcelas },
    presente: p.presente_para ? {
      para: p.presente_para, de: p.presente_de,
      mensagem: p.presente_msg, ocultarValores: !!p.presente_ocultar
    } : null,
    brotosGanhos: p.brotos_ganhos,
    itens: itensStmt.all(p.id).map((i) => ({
      id: i.planta_id, nome: i.nome, qtd: i.quantidade, preco: i.preco_unitario
    }))
  }));
  res.json(out);
});

/* ---------- Avaliações ---------- */
app.get("/api/avaliacoes", (req, res) => {
  const rows = db.prepare("SELECT * FROM avaliacoes ORDER BY data DESC LIMIT 100").all();
  res.json(rows.map((a) => ({
    id: a.id,
    plantaId: a.planta_id,
    nota: a.nota,
    texto: a.texto,
    autor: a.autor,
    data: a.data
  })));
});

app.post("/api/avaliacoes", auth, (req, res) => {
  const plantaId = String(req.body?.plantaId || "").slice(0, 20);
  const nota = Math.min(5, Math.max(1, Number(req.body?.nota) || 0));
  const texto = sanitizeString(req.body?.texto, 500);

  if (!plantaId || !nota || texto.length < 10) {
    return res.status(400).json({ erro: "Dados incompletos (mín. 10 caracteres)." });
  }

  const comprou = db.prepare(`
    SELECT 1 FROM pedido_itens pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE p.usuario_id = ? AND pi.planta_id = ?
    LIMIT 1
  `).get(req.user.id, plantaId);
  if (!comprou) return res.status(400).json({ erro: "Você só pode avaliar plantas que comprou." });

  const id = uid();
  db.prepare(`
    INSERT INTO avaliacoes (id, usuario_id, planta_id, nota, texto, autor)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, plantaId, nota, texto, req.user.nome);

  db.prepare("UPDATE usuarios SET brotos = brotos + 50 WHERE id = ?").run(req.user.id);
  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);

  res.json({ id, brotos: user.brotos, usuario: publicUser(user) });
});

/* ---------- FAQ + filtros auxiliares ---------- */
app.get("/api/faq", (req, res) => {
  const rows = db.prepare("SELECT pergunta AS q, resposta AS a FROM faq ORDER BY ordem").all();
  res.json(rows);
});

app.get("/api/meta", (req, res) => {
  const categorias = db.prepare("SELECT DISTINCT categoria FROM plantas ORDER BY categoria").all().map((r) => r.categoria);
  const ambientes = db.prepare("SELECT DISTINCT ambiente FROM plantas ORDER BY ambiente").all().map((r) => r.ambiente);
  res.json({ categorias, ambientes });
});

/* ---------- Endereço do usuário ---------- */
app.put("/api/me/endereco", auth, (req, res) => {
  const cep = sanitizeString(req.body?.cep, 12);
  const rua = sanitizeString(req.body?.rua, 120);
  const bairro = sanitizeString(req.body?.bairro, 80);
  const cidade = sanitizeString(req.body?.cidade, 80);
  const complemento = sanitizeString(req.body?.complemento, 80);

  db.prepare(`
    UPDATE usuarios SET cep = ?, rua = ?, bairro = ?, cidade = ?, complemento = ?
    WHERE id = ?
  `).run(cep || null, rua || null, bairro || null, cidade || null, complemento || null, req.user.id);
  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);
  res.json({ usuario: publicUser(user) });
});

/* ---------- Fallback SPA ---------- */
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Florescer API rodando em http://localhost:${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn("→ Lembrete: defina JWT_SECRET no ambiente antes de ir para produção.");
  }
});

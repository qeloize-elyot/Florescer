/**
 * Florescer API — recovery (email verify off)
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

let helmet = null, rateLimit = null;
try { helmet = require("helmet"); } catch (_) {}
try { rateLimit = require("express-rate-limit"); } catch (_) {}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || ("dev-" + crypto.randomBytes(24).toString("hex"));
if (!process.env.JWT_SECRET) console.warn("[AVISO] JWT_SECRET não definido.");

(async function garantirColunasAuthEmail() {
  try {
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao TEXT`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao_expira TIMESTAMPTZ`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset TEXT`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_expira TIMESTAMPTZ`);
    await db.query(`UPDATE usuarios SET email_verificado = TRUE, token_verificacao = NULL, token_verificacao_expira = NULL WHERE COALESCE(email_verificado, FALSE) = FALSE`);
  } catch (e) { console.warn("[auth-email]", e.message); }
})();

app.set("trust proxy", 1);
app.disable("x-powered-by");
if (helmet) app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "200kb" }));

const authLimiter = rateLimit
  ? rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { erro: "Muitas tentativas. Aguarde alguns minutos." } })
  : (_req, _res, next) => next();

const frontendDir = fs.existsSync(path.join(__dirname, "index.html")) ? __dirname : path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

function uid() { return crypto.randomBytes(5).toString("hex"); }
function clean(str, max = 200) { return typeof str === "string" ? str.trim().slice(0, max) : ""; }
function tokenAleatorio() { return crypto.randomBytes(32).toString("hex"); }

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, nome: u.nome, email: u.email, brotos: u.brotos, emailVerificado: true, criadoEm: u.criado_em,
    endereco: { cep: u.cep || "", rua: u.rua || "", bairro: u.bairro || "", cidade: u.cidade || "", complemento: u.complemento || "" }
  };
}

async function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Não autenticado" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id]);
    if (!rows[0]) return res.status(401).json({ erro: "Usuário inválido" });
    req.user = rows[0];
    next();
  } catch { return res.status(401).json({ erro: "Token inválido ou expirado" }); }
}

async function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id]);
      req.user = rows[0] || null;
    } catch { req.user = null; }
  }
  next();
}

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 80);
    const email = clean(req.body?.email, 120).toLowerCase();
    const senha = req.body?.senha || "";
    if (!nome || nome.length < 3) return res.status(400).json({ erro: "Informe o nome completo." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "E-mail inválido." });
    if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha mínima de 6 caracteres." });
    const { rows: existsRows } = await db.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existsRows[0]) return res.status(409).json({ erro: "Já existe conta com este e-mail." });
    const hash = bcrypt.hashSync(senha, 12);
    const { rows: created } = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, brotos, email_verificado) VALUES ($1, $2, $3, 100, TRUE) RETURNING *`,
      [nome, email, hash]
    );
    const user = created[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ ok: true, email, token, usuario: publicUser(user), mensagem: "Conta criada! Você já pode usar o Florescer." });
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
    // Verificação de e-mail DESATIVADA — login liberado
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, usuario: publicUser(user) });
  } catch (err) { next(err); }
});

app.post("/api/auth/verificar", authLimiter, async (_req, res) => {
  res.json({ ok: true, mensagem: "Verificação não é mais necessária. Você já pode entrar." });
});

app.post("/api/auth/reenviar-verificacao", authLimiter, async (_req, res) => {
  res.json({ ok: true, mensagem: "Verificação não é mais necessária. Faça login normalmente." });
});

app.post("/api/auth/esqueci-senha", authLimiter, async (req, res, next) => {
  try {
    const email = clean(req.body?.email, 120).toLowerCase();
    if (!email) return res.status(400).json({ erro: "Informe o e-mail da conta." });
    const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.json({ ok: true, mensagem: "Se este e-mail estiver cadastrado, enviaremos um link." });
    const tokenReset = tokenAleatorio();
    const expira = new Date(Date.now() + 60 * 60 * 1000);
    await db.query(`UPDATE usuarios SET token_reset = $1, token_reset_expira = $2 WHERE id = $3`, [tokenReset, expira, user.id]);
    const envio = await enviarResetSenha(user.email, user.nome, tokenReset);
    res.json({ ok: true, emailEnviado: !!envio.ok, mensagem: envio.ok ? "Enviamos um link para redefinir sua senha." : "Não foi possível enviar o e-mail agora." });
  } catch (err) { next(err); }
});

app.post("/api/auth/redefinir-senha", authLimiter, async (req, res, next) => {
  try {
    const token = clean(req.body?.token, 80);
    const senha = req.body?.senha || "";
    if (!token) return res.status(400).json({ erro: "Token inválido." });
    if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha mínima de 6 caracteres." });
    const { rows } = await db.query("SELECT * FROM usuarios WHERE token_reset = $1", [token]);
    const user = rows[0];
    if (!user) return res.status(400).json({ erro: "Link inválido ou já usado." });
    if (user.token_reset_expira && new Date(user.token_reset_expira) < new Date()) return res.status(400).json({ erro: "Link expirado." });
    const hash = bcrypt.hashSync(senha, 12);
    await db.query(`UPDATE usuarios SET senha_hash = $1, token_reset = NULL, token_reset_expira = NULL, email_verificado = TRUE WHERE id = $2`, [hash, user.id]);
    res.json({ ok: true, mensagem: "Senha alterada! Você já pode entrar." });
  } catch (err) { next(err); }
});

app.get("/api/me", auth, (req, res) => res.json({ usuario: publicUser(req.user) }));

function mapPlanta(p) {
  return {
    id: p.id, nome: p.nome, cientifico: p.cientifico, emoji: p.emoji, imagem: p.imagem || null,
    preco: p.preco, categoria: p.categoria, ambiente: p.ambiente, luz: p.luz, agua: p.agua,
    umidade: p.umidade, porte: p.porte, dificuldade: p.dificuldade, petFriendly: !!p.pet_friendly,
    resumo: p.resumo, historia: p.historia
  };
}

app.get("/api/plantas", async (req, res, next) => {
  try {
    const { busca, categoria, ambiente, luz, pet, ordem } = req.query;
    let sql = "SELECT * FROM plantas WHERE ativo = 1";
    const params = []; let i = 0;
    const ph = () => { i += 1; return `$${i}`; };
    if (busca && typeof busca === "string") {
      const t = `%${busca.toLowerCase().slice(0, 80)}%`;
      sql += ` AND (lower(nome) LIKE ${ph()} OR lower(cientifico) LIKE ${ph()} OR lower(categoria) LIKE ${ph()})`;
      params.push(t, t, t);
    }
    if (categoria) { sql += ` AND categoria = ${ph()}`; params.push(String(categoria).slice(0, 50)); }
    if (ambiente) { sql += ` AND ambiente = ${ph()}`; params.push(String(ambiente).slice(0, 50)); }
    if (pet === "1" || pet === "true") sql += " AND pet_friendly = 1";
    if (luz === "sol") sql += " AND (lower(luz) LIKE '%sol direto%' OR lower(luz) LIKE '%sol pleno%')";
    else if (luz === "indireta") sql += " AND lower(luz) LIKE '%indireta%'";
    else if (luz === "sombra") sql += " AND lower(luz) LIKE '%sombra%'";
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
    if (!rows[0]) return res.status(404).json({ erro: "Planta não encontrada" });
    res.json(mapPlanta(rows[0]));
  } catch (err) { next(err); }
});

const helpers = { db, auth, optionalAuth, publicUser, clean, mapPlanta, transaction, uid, JWT_SECRET, rateLimit };
for (const mod of ["./routes-catalog", "./routes-pedidos", "./routes-pedidos-extra", "./routes-conta", "./routes-admin", "./routes-rastreio", "./routes-reembolso", "./boot"]) {
  try {
    const m = require(mod);
    if (typeof m === "function") m(app, helpers);
    else if (m && typeof m.register === "function") m.register(app, helpers);
  } catch (e) { console.warn("[routes]", mod, e.message); }
}
try { require("./flora-api")(app, helpers); } catch (e) { console.warn("[Flora]", e.message); }

app.get("*", (req, res) => res.sendFile(path.join(frontendDir, "index.html")));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ erro: "Erro interno do servidor." }); });
app.listen(PORT, () => console.log(`Florescer rodando em http://localhost:${PORT}`));

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
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role || "cliente",
    brotos: u.brotos,
    email_verificado: u.email_verificado !== false && u.email_verificado !== 0
  };
}

function mapPlanta(p) {
  if (!p) return null;
  return {
    id: p.id,
    nome: p.nome,
    cientifico: p.cientifico || p.nome_cientifico || "",
    preco: Number(p.preco),
    imagem: p.imagem,
    categoria: p.categoria,
    ambiente: p.ambiente,
    luz: p.luz,
    rega: p.rega,
    dificuldade: p.dificuldade,
    petFriendly: !!(p.pet_friendly || p.petFriendly),
    descricao: p.descricao,
    cuidados: p.cuidados,
    historia: p.historia
  };
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) return res.status(401).json({ erro: "Não autenticado." });
  try {
    const payload = jwt.verify(t, JWT_SECRET);
    db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id])
      .then(({ rows }) => {
        if (!rows[0]) return res.status(401).json({ erro: "Sessão inválida." });
        req.user = rows[0];
        next();
      })
      .catch(next);
  } catch (_) {
    return res.status(401).json({ erro: "Token inválido." });
  }
}

function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) return next();
  try {
    const payload = jwt.verify(t, JWT_SECRET);
    db.query("SELECT * FROM usuarios WHERE id = $1", [payload.id])
      .then(({ rows }) => {
        if (rows[0]) req.user = rows[0];
        next();
      })
      .catch(() => next());
  } catch (_) {
    next();
  }
}

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 80);
    const email = clean(req.body?.email, 120).toLowerCase();
    const senha = req.body?.senha || "";
    if (!nome || nome.length < 3) return res.status(400).json({ erro: "Nome inválido." });
    if (!email || !email.includes("@")) return res.status(400).json({ erro: "E-mail inválido." });
    if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha mínima de 6 caracteres." });
    const { rows: exists } = await db.query("SELECT id FROM usuarios WHERE lower(email) = lower($1)", [email]);
    if (exists[0]) return res.status(409).json({ erro: "E-mail já cadastrado." });
    const hash = bcrypt.hashSync(senha, 12);
    const { rows } = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, brotos, role, email_verificado)
       VALUES ($1, $2, $3, 100, 'cliente', TRUE) RETURNING *`,
      [nome, email, hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, usuario: publicUser(user) });
  } catch (err) { next(err); }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const email = clean(req.body?.email, 120).toLowerCase();
    const senha = req.body?.senha || "";
    const { rows } = await db.query("SELECT * FROM usuarios WHERE lower(email) = lower($1)", [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, usuario: publicUser(user) });
  } catch (err) { next(err); }
});

app.get("/api/me", auth, (req, res) => {
  res.json({ usuario: publicUser(req.user) });
});

app.get("/api/plantas", async (req, res, next) => {
  try {
    let sql = "SELECT * FROM plantas WHERE 1=1";
    const params = [];
    if (req.query.q) {
      params.push("%" + String(req.query.q).toLowerCase() + "%");
      sql += ` AND (lower(nome) LIKE $${params.length} OR lower(COALESCE(cientifico,'')) LIKE $${params.length})`;
    }
    if (req.query.categoria) {
      params.push(String(req.query.categoria));
      sql += ` AND categoria = $${params.length}`;
    }
    if (req.query.ambiente) {
      params.push(String(req.query.ambiente));
      sql += ` AND ambiente = $${params.length}`;
    }
    if (req.query.luz) {
      params.push("%" + String(req.query.luz).toLowerCase() + "%");
      sql += ` AND lower(COALESCE(luz,'')) LIKE $${params.length}`;
    }
    if (req.query.pet === "1" || req.query.pet === "true") {
      sql += " AND (pet_friendly = TRUE OR pet_friendly = 1)";
    }
    const ordem = String(req.query.ordem || "");
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
for (const mod of ["./routes-catalog", "./routes-pedidos", "./routes-pedidos-extra", "./routes-conta", "./routes-admin", "./routes-rastreio", "./routes-reembolso", "./routes-brotos", "./boot"]) {
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

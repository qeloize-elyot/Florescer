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
    // Verificação desativada: libera todas as contas existentes
    await db.query(`
      UPDATE usuarios
      SET email_verificado = TRUE,
          token_verificacao = NULL,
          token_verificacao_expira = NULL
      WHERE COALESCE(email_verificado, FALSE) = FALSE
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

    // Verificação de e-mail desativada: conta já nasce liberada para login
    const { rows: created } = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, brotos, email_verificado, token_verificacao, token_verificacao_expira)
       VALUES ($1, $2, $3, 100, TRUE, NULL, NULL) RETURNING *`,
      [nome, email, hash]
    );
    const user = created[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      ok: true,
      email,
      token,
      usuario: publicUser(user),
      mensagem: "Conta criada! Você já pode usar o Florescer."
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

    // Verificação de e-mail desativada — login liberado mesmo sem confirmar
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, usuario: publicUser(user) });
  } catch (err) { next(err); }
});

/* AUTH_REST_PLACEHOLDER */

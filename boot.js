/**
 * Boot:
 * - ignora rotas quebradas de catálogo/pedidos do server.js
 * - registra rotas corretas ANTES do catch-all SPA
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-" + crypto.randomBytes(24).toString("hex");
  console.warn("[boot] JWT_SECRET gerado em runtime — defina no Render para produção.");
}
const JWT_SECRET = process.env.JWT_SECRET;

const { db, transaction } = require("./db");

const SKIP_GET = new Set([
  "/api/pedidos",
  "/api/plantas",
  "/api/cursos",
  "/api/recompensas",
  "/api/faq",
  "/api/meta"
]);
const SKIP_POST = new Set(["/api/pedidos"]);

let blocking = true;

const origPost = express.application.post;
const origGet = express.application.get;
const origListen = express.application.listen;

express.application.post = function (path, ...args) {
  if (blocking && SKIP_POST.has(path)) {
    console.log("[boot] ignorando POST", path);
    return this;
  }
  return origPost.apply(this, [path, ...args]);
};

express.application.get = function (path, ...args) {
  if (
    blocking &&
    (SKIP_GET.has(path) || (typeof path === "string" && path.startsWith("/api/plantas")))
  ) {
    console.log("[boot] ignorando GET", path);
    return this;
  }
  return origGet.apply(this, [path, ...args]);
};

/** Garante que rotas /api fiquem antes do app.get('*') do SPA */
function ensureApiBeforeCatchAll(app) {
  if (!app || !app._router || !Array.isArray(app._router.stack)) return;
  const stack = app._router.stack;
  const api = [];
  const other = [];
  const catchAll = [];
  for (const layer of stack) {
    const path = layer.route && layer.route.path;
    if (path === "*") {
      catchAll.push(layer);
    } else if (typeof path === "string" && path.startsWith("/api")) {
      api.push(layer);
    } else {
      other.push(layer);
    }
  }
  app._router.stack = other.concat(api).concat(catchAll);
  console.log("[boot] ordem das rotas: other", other.length, "api", api.length, "catchAll", catchAll.length);
}

express.application.listen = function (...args) {
  const app = this;
  blocking = false;

  function uid() {
    return crypto.randomBytes(5).toString("hex");
  }

  function clean(str, max = 200) {
    if (typeof str !== "string") return "";
    return str.trim().slice(0, max);
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

  try {
    require("./routes-catalog")(app, { db, optionalAuth });
    console.log("[boot] catálogo/cursos com fallback estático");
  } catch (e) {
    console.error("[boot] routes-catalog:", e.message);
  }

  try {
    require("./routes-pedidos")(app, { auth, db, transaction, publicUser, uid, clean });
    console.log("[boot] rotas de pedidos");
  } catch (e) {
    console.error("[boot] routes-pedidos:", e.message);
  }

  try {
    require("./routes-reembolso")(app, { auth, db, transaction, publicUser, clean });
    console.log("[boot] rotas de reembolso");
  } catch (e) {
    console.error("[boot] routes-reembolso:", e.message);
  }

  // CRÍTICO: /api/* precisa vir antes do SPA catch-all
  ensureApiBeforeCatchAll(app);

  db.query("SELECT 1 AS ok")
    .then(() => console.log("[boot] conexão Postgres OK"))
    .catch((e) =>
      console.error("[boot] Postgres FALHOU — catálogo via dados.js:", e.message)
    );

  return origListen.apply(this, args);
};

require("./server.js");

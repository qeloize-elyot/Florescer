/**
 * Boot: rotas corrigidas + admin + rastreio + schema
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

function ensureApiBeforeCatchAll(app) {
  if (!app || !app._router || !Array.isArray(app._router.stack)) return;
  const stack = app._router.stack;
  const api = [];
  const other = [];
  const catchAll = [];
  for (const layer of stack) {
    const path = layer.route && layer.route.path;
    if (path === "*") catchAll.push(layer);
    else if (typeof path === "string" && path.startsWith("/api")) api.push(layer);
    else other.push(layer);
  }
  app._router.stack = other.concat(api).concat(catchAll);
  console.log("[boot] ordem rotas other", other.length, "api", api.length, "*", catchAll.length);
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
      role: u.role || "cliente",
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

  // schema + admin email
  try {
    const { garantirSchemaExtras } = require("./garantir-schema");
    garantirSchemaExtras(db).then(() => console.log("[boot] schema extras OK"));
  } catch (e) {
    console.warn("[boot] schema:", e.message);
  }

  try {
    require("./routes-catalog")(app, { db, optionalAuth });
    console.log("[boot] catálogo");
  } catch (e) {
    console.error("[boot] catalog:", e.message);
  }

  try {
    require("./routes-pedidos")(app, { auth, db, transaction, publicUser, uid, clean });
    console.log("[boot] pedidos");
  } catch (e) {
    console.error("[boot] pedidos:", e.message);
  }

  try {
    require("./routes-reembolso")(app, { auth, db, transaction, publicUser, clean });
    console.log("[boot] reembolso");
  } catch (e) {
    console.error("[boot] reembolso:", e.message);
  }

  try {
    require("./routes-admin")(app, { auth, db, clean });
    console.log("[boot] admin");
  } catch (e) {
    console.error("[boot] admin:", e.message);
  }

  try {
    require("./routes-rastreio")(app, { auth, db, clean });
    console.log("[boot] rastreio");
  } catch (e) {
    console.error("[boot] rastreio:", e.message);
  }

  // sobrescreve /api/me para incluir role (server já registrou)
  app.get("/api/me", auth, (req, res) => {
    res.json({ usuario: publicUser(req.user) });
  });

  ensureApiBeforeCatchAll(app);

  db.query("SELECT 1 AS ok")
    .then(() => console.log("[boot] Postgres OK"))
    .catch((e) => console.error("[boot] Postgres:", e.message));

  return origListen.apply(this, args);
};

require("./server.js");

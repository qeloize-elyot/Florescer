/**
 * Boot: impede o server.js de registrar as rotas de pedidos com SQL errado
 * e registra routes-pedidos.js (colunas alinhadas ao schema).
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, transaction } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || ("dev-" + crypto.randomBytes(24).toString("hex"));

const origPost = express.application.post;
const origGet = express.application.get;
const origListen = express.application.listen;

express.application.post = function (path, ...args) {
  if (path === "/api/pedidos") {
    console.log("[boot] ignorando POST /api/pedidos antigo do server.js");
    return this;
  }
  return origPost.apply(this, [path, ...args]);
};

express.application.get = function (path, ...args) {
  if (path === "/api/pedidos") {
    console.log("[boot] ignorando GET /api/pedidos antigo do server.js");
    return this;
  }
  return origGet.apply(this, [path, ...args]);
};

express.application.listen = function (...args) {
  const app = this;

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

  try {
    require("./routes-pedidos")(app, { auth, db, transaction, publicUser, uid, clean });
    console.log("[boot] rotas de pedidos corrigidas registradas");
  } catch (e) {
    console.error("[boot] falha ao carregar routes-pedidos:", e.message);
  }

  return origListen.apply(this, args);
};

require("./server.js");

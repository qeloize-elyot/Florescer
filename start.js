/**
 * Entrada única do Render.
 * 1) Sobe o Express com fallback de catálogo/cursos (dados.js)
 * 2) Não derruba o processo se o Postgres estiver offline
 */
"use strict";

process.on("uncaughtException", (err) => {
  console.error("[start] uncaughtException:", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (err) => {
  console.error("[start] unhandledRejection:", err && err.stack ? err.stack : err);
});

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-" + crypto.randomBytes(24).toString("hex");
  console.warn("[start] JWT_SECRET gerado em runtime");
}

// --- catálogo estático (sempre disponível) ---
let staticData;
try {
  staticData = require("./static-data").loadStaticData();
} catch (e) {
  console.error("[start] static-data:", e.message);
  staticData = { CATALOGO: [], CURSOS: [], RECOMPENSAS: [], FAQ: [] };
}

function mapPlanta(p) {
  return {
    id: p.id,
    nome: p.nome,
    cientifico: p.cientifico,
    emoji: p.emoji,
    imagem: p.imagem || null,
    preco: Number(p.preco),
    categoria: p.categoria,
    ambiente: p.ambiente,
    luz: p.luz,
    agua: p.agua,
    umidade: p.umidade,
    porte: p.porte,
    dificuldade: p.dificuldade,
    petFriendly: !!(p.petFriendly || p.pet_friendly),
    resumo: p.resumo,
    historia: p.historia
  };
}

function filtrar(lista, q) {
  let out = lista.slice();
  const { busca, categoria, ambiente, luz, pet, ordem } = q || {};
  if (busca) {
    const t = String(busca).toLowerCase().slice(0, 80);
    out = out.filter(
      (p) =>
        (p.nome || "").toLowerCase().includes(t) ||
        (p.cientifico || "").toLowerCase().includes(t) ||
        (p.categoria || "").toLowerCase().includes(t)
    );
  }
  if (categoria) out = out.filter((p) => p.categoria === categoria);
  if (ambiente) out = out.filter((p) => p.ambiente === ambiente);
  if (pet === "1" || pet === "true") out = out.filter((p) => p.petFriendly);
  if (luz) {
    out = out.filter((p) => {
      const l = (p.luz || "").toLowerCase();
      if (luz === "sol") return l.includes("sol direto") || l.includes("sol pleno");
      if (luz === "indireta") return l.includes("indireta");
      if (luz === "sombra") return l.includes("sombra");
      return true;
    });
  }
  if (ordem === "menor") out.sort((a, b) => a.preco - b.preco);
  else if (ordem === "maior") out.sort((a, b) => b.preco - a.preco);
  else if (ordem === "nome") out.sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
  return out;
}

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

try {
  const cors = require("cors");
  app.use(cors({ origin: true, credentials: true }));
} catch (_) {}

// health
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    plantas: (staticData.CATALOGO || []).length,
    cursos: (staticData.CURSOS || []).length
  });
});

// catálogo — sempre do estático (banco pode estar fora)
app.get("/api/plantas", (req, res) => {
  res.json(filtrar((staticData.CATALOGO || []).map(mapPlanta), req.query));
});

app.get("/api/plantas/:id", (req, res) => {
  const id = String(req.params.id).slice(0, 20);
  const p = (staticData.CATALOGO || []).find((x) => x.id === id);
  if (!p) return res.status(404).json({ erro: "Planta não encontrada" });
  res.json(mapPlanta(p));
});

app.get("/api/cursos", (_req, res) => {
  res.json(
    (staticData.CURSOS || []).map((c) => ({
      id: c.id,
      titulo: c.titulo,
      nivel: c.nivel,
      duracao: c.duracao,
      emoji: c.emoji,
      imagem: c.imagem || null,
      descricao: c.descricao,
      link: c.link,
      brotos: c.brotos,
      aulas: c.aulas || [],
      progresso: { aulas: [], concluido: false, codigo: null, dataConclusao: null }
    }))
  );
});

app.get("/api/recompensas", (_req, res) => {
  res.json(staticData.RECOMPENSAS || []);
});

app.get("/api/faq", (_req, res) => {
  res.json(staticData.FAQ || []);
});

app.get("/api/meta", (_req, res) => {
  const cats = [...new Set((staticData.CATALOGO || []).map((p) => p.categoria).filter(Boolean))].sort();
  const ambs = [...new Set((staticData.CATALOGO || []).map((p) => p.ambiente).filter(Boolean))].sort();
  res.json({ categorias: cats, ambientes: ambs });
});

app.get("/api/avaliacoes", (_req, res) => res.json([]));

// tenta carregar o server completo (auth, pedidos, etc.) SEM derrubar se falhar
let fullServerLoaded = false;
try {
  // Monkey-patch: server.js não deve escutar porta sozinho — só montar rotas
  const origListen = express.application.listen;
  let capturedApp = null;
  express.application.listen = function (...args) {
    capturedApp = this;
    // não chama listen de verdade — o start.js escuta abaixo
    console.log("[start] server.js tentou listen — ignorado (start.js controla a porta)");
    return this;
  };

  // server.js cria OUTRO app — isso é o problema do design antigo.
  // Em vez de require server (que cria app novo), só servimos estático + tentamos db auth depois.
  express.application.listen = origListen;
  console.log("[start] modo estável: catálogo estático + arquivos do site");
} catch (e) {
  console.error("[start] patch:", e.message);
}

// arquivos estáticos do site
const frontendDir = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

// SPA fallback
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ erro: "Rota não encontrada" });
  }
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("[start] error middleware:", err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`[start] Florescer online na porta ${PORT}`);
  console.log(
    `[start] catálogo: ${(staticData.CATALOGO || []).length} plantas, ${(staticData.CURSOS || []).length} cursos`
  );
});

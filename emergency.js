/**
 * Modo emergência: catálogo + cursos + front, sem depender do Postgres.
 */
"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3001;

let staticData = { CATALOGO: [], CURSOS: [], RECOMPENSAS: [], FAQ: [] };
try {
  staticData = require("./static-data").loadStaticData();
} catch (e) {
  console.error("[emergency] static-data:", e.message);
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
    petFriendly: !!p.petFriendly,
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
app.use(express.json({ limit: "200kb" }));
try {
  app.use(require("cors")({ origin: true, credentials: true }));
} catch (_) {}

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, mode: "emergency", plantas: staticData.CATALOGO.length })
);

app.get("/api/plantas", (req, res) => {
  res.json(filtrar(staticData.CATALOGO.map(mapPlanta), req.query));
});

app.get("/api/plantas/:id", (req, res) => {
  const p = staticData.CATALOGO.find((x) => x.id === String(req.params.id).slice(0, 20));
  if (!p) return res.status(404).json({ erro: "Planta não encontrada" });
  res.json(mapPlanta(p));
});

app.get("/api/cursos", (_req, res) => {
  res.json(
    staticData.CURSOS.map((c) => ({
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

app.get("/api/recompensas", (_req, res) => res.json(staticData.RECOMPENSAS || []));
app.get("/api/faq", (_req, res) => res.json(staticData.FAQ || []));
app.get("/api/meta", (_req, res) => {
  const categorias = [...new Set(staticData.CATALOGO.map((p) => p.categoria).filter(Boolean))].sort();
  const ambientes = [...new Set(staticData.CATALOGO.map((p) => p.ambiente).filter(Boolean))].sort();
  res.json({ categorias, ambientes });
});
app.get("/api/avaliacoes", (_req, res) => res.json([]));

const frontendDir = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ erro: "Rota não encontrada" });
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[emergency] online :${PORT} — ${staticData.CATALOGO.length} plantas`);
});

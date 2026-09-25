/**
 * Carrega CATALOGO, CURSOS, RECOMPENSAS e FAQ de dados.js
 * Usado quando o Postgres/Supabase falha ou está vazio.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let cache = null;

function loadStaticData() {
  if (cache) return cache;
  const candidatos = [
    path.join(__dirname, "dados.js"),
    path.join(__dirname, "..", "frontend", "dados.js")
  ];
  const dadosPath = candidatos.find((p) => fs.existsSync(p));
  if (!dadosPath) {
    console.warn("[static-data] dados.js não encontrado");
    cache = { CATALOGO: [], CURSOS: [], RECOMPENSAS: [], FAQ: [] };
    return cache;
  }
  const codigo = fs.readFileSync(dadosPath, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    codigo +
      "\n; this.CATALOGO = typeof CATALOGO !== 'undefined' ? CATALOGO : [];" +
      " this.CURSOS = typeof CURSOS !== 'undefined' ? CURSOS : [];" +
      " this.RECOMPENSAS = typeof RECOMPENSAS !== 'undefined' ? RECOMPENSAS : [];" +
      " this.FAQ = typeof FAQ !== 'undefined' ? FAQ : [];",
    sandbox
  );
  cache = {
    CATALOGO: sandbox.CATALOGO || [],
    CURSOS: sandbox.CURSOS || [],
    RECOMPENSAS: sandbox.RECOMPENSAS || [],
    FAQ: sandbox.FAQ || []
  };
  console.log(
    `[static-data] ${cache.CATALOGO.length} plantas, ${cache.CURSOS.length} cursos, ${cache.RECOMPENSAS.length} recompensas`
  );
  return cache;
}

function mapPlantaStatic(p) {
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
    petFriendly: !!p.petFriendly,
    resumo: p.resumo,
    historia: p.historia
  };
}

module.exports = { loadStaticData, mapPlantaStatic };

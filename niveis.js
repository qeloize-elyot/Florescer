/**
 * Florescer — Níveis de cultivo (programa de Brotos)
 */
const NIVEIS = [
  { nivel: 1,  nome: "Semente",          min: 0 },
  { nivel: 2,  nome: "Broto",            min: 50 },
  { nivel: 3,  nome: "Muda",             min: 200 },
  { nivel: 4,  nome: "Folhagem",         min: 450 },
  { nivel: 5,  nome: "Botão",            min: 800 },
  { nivel: 6,  nome: "Flor",             min: 1300 },
  { nivel: 7,  nome: "Jardim",           min: 2000 },
  { nivel: 8,  nome: "Pomar",            min: 3200 },
  { nivel: 9,  nome: "Floresta",         min: 5500 },
  { nivel: 10, nome: "Árvore Ancestral", min: 10000 }
];

function nivelDe(brotosAcumulados) {
  const n = Number(brotosAcumulados) || 0;
  return [...NIVEIS].reverse().find((x) => n >= x.min) || NIVEIS[0];
}

function proximoNivel(brotosAcumulados) {
  const atual = nivelDe(brotosAcumulados);
  return NIVEIS.find((x) => x.nivel === atual.nivel + 1) || null;
}

function progressoNivel(brotosAcumulados) {
  const atual = nivelDe(brotosAcumulados);
  const prox = proximoNivel(brotosAcumulados);
  if (!prox) return { atual, proximo: null, pct: 100, falta: 0 };
  const faixa = prox.min - atual.min;
  const feito = Math.max(0, (Number(brotosAcumulados) || 0) - atual.min);
  const pct = Math.min(100, Math.round((feito / faixa) * 100));
  return { atual, proximo: prox, pct, falta: Math.max(0, prox.min - (Number(brotosAcumulados) || 0)) };
}

if (typeof window !== "undefined") {
  window.NIVEIS = NIVEIS;
  window.nivelDe = nivelDe;
  window.proximoNivel = proximoNivel;
  window.progressoNivel = progressoNivel;
}

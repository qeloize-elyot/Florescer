/**
 * Entrada do Render — NÃO pode falhar.
 * Garante catálogo/cursos mesmo com banco offline.
 * Depois tenta carregar boot.js (auth, pedidos, reembolso).
 */
"use strict";

process.on("uncaughtException", (err) => {
  console.error("[start] uncaughtException:", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (err) => {
  console.error("[start] unhandledRejection:", err && err.stack ? err.stack : err);
});

// Tenta o sistema completo (boot → server). Se quebrar, sobe modo emergência.
try {
  require("./boot.js");
  console.log("[start] boot.js carregado");
} catch (e) {
  console.error("[start] boot falhou, subindo modo emergência:", e && e.message);
  require("./emergency.js");
}

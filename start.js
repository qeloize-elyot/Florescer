/**
 * Entrada do Render — sempre sobe o modo estável com catálogo.
 * Não depende do Postgres nem do boot antigo.
 */
"use strict";

process.on("uncaughtException", (err) => {
  console.error("[start] uncaughtException:", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (err) => {
  console.error("[start] unhandledRejection:", err && err.stack ? err.stack : err);
});

// Modo estável: catálogo + cursos + site (dados.js)
require("./emergency.js");

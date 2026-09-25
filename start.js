/**
 * Entrada do Render
 * 1) Tenta o sistema completo (login, pedidos, catálogo)
 * 2) Se der erro na carga, sobe só o catálogo (emergency)
 */
"use strict";

process.on("uncaughtException", (err) => {
  console.error("[start] uncaughtException:", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (err) => {
  console.error("[start] unhandledRejection:", err && err.stack ? err.stack : err);
});

try {
  console.log("[start] carregando servidor completo (boot.js)...");
  require("./boot.js");
} catch (e) {
  console.error("[start] boot falhou:", e && e.message);
  console.error(e && e.stack);
  console.log("[start] subindo modo emergência (só catálogo)...");
  require("./emergency.js");
}

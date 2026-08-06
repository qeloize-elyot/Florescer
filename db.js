/**
 * Florescer — conexão e inicialização do SQLite
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "data", "florescer.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function resolveSchemaPath() {
  // GitHub flat: schema.sql ao lado de db.js
  const flat = path.join(__dirname, "schema.sql");
  // Estrutura com pastas: ../schema.sql
  const nested = path.join(__dirname, "..", "schema.sql");
  if (fs.existsSync(flat)) return flat;
  if (fs.existsSync(nested)) return nested;
  throw new Error("schema.sql não encontrado. Coloque schema.sql na mesma pasta do db.js ou na pasta pai.");
}

function initSchema() {
  const sql = fs.readFileSync(resolveSchemaPath(), "utf8");
  db.exec(sql);
}

initSchema();

module.exports = db;

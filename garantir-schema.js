/**
 * Migrações leves ao subir o servidor
 */
async function garantirSchemaExtras(db) {
  const stmts = [
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'cliente'`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao TEXT`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacao_expira TIMESTAMPTZ`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset TEXT`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_reset_expira TIMESTAMPTZ`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS rastreio_codigo TEXT`
  ];
  for (const sql of stmts) {
    try {
      await db.query(sql);
    } catch (e) {
      console.warn("[schema]", e.message);
    }
  }

  // Promove admin pelo e-mail configurado no Render
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (adminEmail) {
    try {
      const { rowCount } = await db.query(
        `UPDATE usuarios SET role = 'admin', email_verificado = TRUE WHERE LOWER(email) = $1`,
        [adminEmail]
      );
      if (rowCount > 0) console.log("[schema] admin garantido:", adminEmail);
    } catch (e) {
      console.warn("[schema] admin:", e.message);
    }
  }
}

module.exports = { garantirSchemaExtras };

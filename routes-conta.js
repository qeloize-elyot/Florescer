/**
 * Conta do usuário: perfil e senha
 */
const bcrypt = require("bcryptjs");

module.exports = function registerConta(app, { auth, db, publicUser, clean }) {
  app.put("/api/me/perfil", auth, async (req, res, next) => {
    try {
      const nome = clean(req.body?.nome, 80);
      if (!nome || nome.length < 3) {
        return res.status(400).json({ erro: "Informe o nome completo (mín. 3 caracteres)." });
      }
      await db.query("UPDATE usuarios SET nome = $1 WHERE id = $2", [nome, req.user.id]);
      const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
      res.json({ usuario: publicUser(rows[0]), mensagem: "Perfil atualizado." });
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/me/senha", auth, async (req, res, next) => {
    try {
      const atual = req.body?.senhaAtual || "";
      const nova = req.body?.senhaNova || "";
      if (!atual || !nova) {
        return res.status(400).json({ erro: "Informe a senha atual e a nova senha." });
      }
      if (nova.length < 6) {
        return res.status(400).json({ erro: "A nova senha precisa ter no mínimo 6 caracteres." });
      }
      if (nova.length > 72) {
        return res.status(400).json({ erro: "Senha muito longa." });
      }
      if (!bcrypt.compareSync(atual, req.user.senha_hash)) {
        return res.status(401).json({ erro: "Senha atual incorreta." });
      }
      const hash = bcrypt.hashSync(nova, 12);
      await db.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [hash, req.user.id]);
      res.json({ ok: true, mensagem: "Senha alterada com sucesso." });
    } catch (err) {
      next(err);
    }
  });
};

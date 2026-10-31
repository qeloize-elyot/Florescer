/**
 * Rastreio de pedidos (cliente dono do pedido ou admin)
 */
const { montarRastreio } = require("./rastreio");

module.exports = function registerRastreio(app, { auth, db, clean }) {
  app.get("/api/pedidos/:id/rastreio", auth, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 40);
      const { rows } = await db.query("SELECT * FROM pedidos WHERE id = $1", [id]);
      const pedido = rows[0];
      if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado." });

      const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
      if (!isAdmin && Number(pedido.usuario_id) !== Number(req.user.id)) {
        return res.status(403).json({ erro: "Este pedido não é seu." });
      }

      const rastreio = montarRastreio(pedido);
      res.json({ pedidoId: id, status: pedido.status, rastreio });
    } catch (err) {
      next(err);
    }
  });
};

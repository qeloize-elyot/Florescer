/**
 * Reembolso de pedidos pelo cliente
 * POST /api/pedidos/:id/reembolso  { motivo?: string }
 * Regras: pedido do próprio usuário, status pago/Em preparo, até 7 dias.
 */
module.exports = function registerReembolso(app, { auth, db, transaction, publicUser, clean }) {
  app.post("/api/pedidos/:id/reembolso", auth, async (req, res, next) => {
    try {
      const id = String(req.params.id || "").slice(0, 30);
      const motivo = clean(req.body?.motivo || "Solicitado pelo cliente", 300);

      const { rows } = await db.query("SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2", [
        id,
        req.user.id
      ]);
      const pedido = rows[0];
      if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado." });

      const statusAtual = String(pedido.status || "").toLowerCase();
      if (["reembolsado", "cancelado", "estornado"].includes(statusAtual)) {
        return res.status(400).json({ erro: "Este pedido já foi reembolsado ou cancelado." });
      }

      const dataPedido = pedido.data || pedido.criado_em;
      if (dataPedido) {
        const criado = new Date(dataPedido);
        const limite = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (!Number.isNaN(criado.getTime()) && criado < limite) {
          return res.status(400).json({
            erro: "O prazo de 7 dias para solicitar reembolso já encerrou."
          });
        }
      }

      const brotosDevolver = Math.max(0, Number(pedido.brotos_ganhos) || Math.floor(Number(pedido.total) || 0));

      await transaction(async (client) => {
        try {
          await client.query(
            `UPDATE pedidos SET status = 'reembolsado' WHERE id = $1 AND usuario_id = $2`,
            [id, req.user.id]
          );
        } catch (e) {
          // schema antigo sem algumas colunas
          await client.query(`UPDATE pedidos SET status = 'reembolsado' WHERE id = $1`, [id]);
        }
        if (brotosDevolver > 0) {
          await client.query(
            `UPDATE usuarios SET brotos = GREATEST(0, brotos - $1) WHERE id = $2`,
            [brotosDevolver, req.user.id]
          );
        }
        // tenta registrar motivo se coluna existir (ignora erro)
        try {
          await client.query(
            `UPDATE pedidos SET presente_msg = COALESCE(presente_msg, '') || $1 WHERE id = $2`,
            [`\n[Reembolso] ${motivo}`, id]
          );
        } catch (_) {}
      });

      const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
      res.json({
        ok: true,
        mensagem: "Reembolso solicitado com sucesso. O status do pedido foi atualizado.",
        pedidoId: id,
        status: "reembolsado",
        brotosEstornados: brotosDevolver,
        usuario: publicUser(userRows[0])
      });
    } catch (err) {
      next(err);
    }
  });
};

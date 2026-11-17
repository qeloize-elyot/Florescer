/**
 * Avaliações públicas + criar avaliação de itens de pedidos finalizados
 */
module.exports = function registerAvaliacoes(app, { auth, db, clean, uid }) {
  app.get("/api/avaliacoes", async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT a.*, p.nome AS planta_nome
         FROM avaliacoes a
         LEFT JOIN plantas p ON p.id = a.planta_id
         ORDER BY a.data DESC NULLS LAST
         LIMIT 100`
      );
      res.json(
        rows.map((a) => ({
          id: a.id,
          plantaId: a.planta_id,
          plantaNome: a.planta_nome,
          nota: a.nota,
          texto: a.texto,
          autor: a.autor,
          data: a.data
        }))
      );
    } catch (err) {
      next(err);
    }
  });

  // pedidos do usuário que ainda podem ser avaliados (itens)
  app.get("/api/avaliacoes/pendentes", auth, async (req, res, next) => {
    try {
      const { rows: pedidos } = await db.query(
        `SELECT * FROM pedidos
         WHERE usuario_id = $1
           AND lower(COALESCE(status,'')) IN ('pago','entregue','finalizado','concluido')
         ORDER BY data DESC NULLS LAST
         LIMIT 30`,
        [req.user.id]
      );
      const out = [];
      for (const p of pedidos) {
        let itens = [];
        try {
          const { rows } = await db.query(
            "SELECT * FROM pedido_itens WHERE pedido_id = $1",
            [p.id]
          );
          itens = rows;
        } catch (_) {}
        for (const it of itens) {
          // já avaliou esta planta?
          let ja = false;
          try {
            const { rows: av } = await db.query(
              "SELECT id FROM avaliacoes WHERE usuario_id = $1 AND planta_id = $2 LIMIT 1",
              [req.user.id, it.planta_id]
            );
            ja = !!av[0];
          } catch (_) {}
          if (!ja) {
            out.push({
              pedidoId: p.id,
              plantaId: it.planta_id,
              nome: it.nome,
              data: p.data
            });
          }
        }
      }
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/avaliacoes", auth, async (req, res, next) => {
    try {
      const plantaId = clean(req.body?.plantaId || req.body?.planta_id, 40);
      const texto = clean(req.body?.texto || req.body?.comentario, 600);
      let nota = Number(req.body?.nota || 0);
      if (!plantaId) return res.status(400).json({ erro: "Informe a planta." });
      if (!(nota >= 1 && nota <= 5)) return res.status(400).json({ erro: "Nota de 1 a 5." });
      if (!texto || texto.length < 3) return res.status(400).json({ erro: "Escreva um comentário." });

      // só se comprou
      const { rows: comprou } = await db.query(
        `SELECT pi.id FROM pedido_itens pi
         JOIN pedidos pe ON pe.id = pi.pedido_id
         WHERE pe.usuario_id = $1 AND pi.planta_id = $2
           AND lower(COALESCE(pe.status,'')) NOT IN ('cancelado','cancelada')
         LIMIT 1`,
        [req.user.id, plantaId]
      );
      if (!comprou[0]) {
        return res.status(400).json({ erro: "Só dá para avaliar plantas que você comprou." });
      }

      const { rows: existe } = await db.query(
        "SELECT id FROM avaliacoes WHERE usuario_id = $1 AND planta_id = $2 LIMIT 1",
        [req.user.id, plantaId]
      );
      if (existe[0]) return res.status(400).json({ erro: "Você já avaliou esta planta." });

      const id = uid();
      const autor = clean(req.user.nome || "Cliente", 80);
      try {
        await db.query(
          `INSERT INTO avaliacoes (id, usuario_id, planta_id, nota, texto, autor, data)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
          [id, req.user.id, plantaId, nota, texto, autor]
        );
      } catch (_) {
        await db.query(
          `INSERT INTO avaliacoes (id, usuario_id, planta_id, nota, texto, autor, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [id, req.user.id, plantaId, nota, texto, autor, new Date().toISOString()]
        );
      }

      // bônus 50 brotos
      try {
        await db.query("UPDATE usuarios SET brotos = brotos + 50 WHERE id = $1", [req.user.id]);
      } catch (_) {}

      const { rows: u } = await db.query("SELECT brotos FROM usuarios WHERE id = $1", [req.user.id]);
      res.json({
        ok: true,
        mensagem: "Avaliação publicada. +50 Brotos!",
        brotos: u[0] ? u[0].brotos : null
      });
    } catch (err) {
      next(err);
    }
  });
};

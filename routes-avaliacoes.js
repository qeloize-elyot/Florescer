/**
 * Avaliações: lista pública + pendentes de pedidos do usuário + criar
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
          plantaNome: a.planta_nome || a.planta_id,
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

  /**
   * Itens de pedidos do usuário que ainda não foram avaliados.
   * Aceita qualquer status EXCETO cancelado (antes só 'pago' e o pedido
   * ficava de fora → lista vazia / undefined).
   */
  app.get("/api/avaliacoes/pendentes", auth, async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT
           pe.id AS pedido_id,
           pe.data AS pedido_data,
           pe.status AS pedido_status,
           pi.planta_id,
           COALESCE(pi.nome, pl.nome, pi.planta_id) AS nome
         FROM pedidos pe
         INNER JOIN pedido_itens pi ON pi.pedido_id = pe.id
         LEFT JOIN plantas pl ON pl.id = pi.planta_id
         WHERE pe.usuario_id = $1
           AND lower(COALESCE(pe.status, '')) NOT IN ('cancelado', 'cancelada')
           AND NOT EXISTS (
             SELECT 1 FROM avaliacoes av
             WHERE av.usuario_id = pe.usuario_id
               AND av.planta_id = pi.planta_id
           )
         ORDER BY pe.data DESC NULLS LAST
         LIMIT 50`,
        [req.user.id]
      );

      // fallback se join falhar por schema antigo: varre pedidos
      if (!rows.length) {
        const { rows: pedidos } = await db.query(
          `SELECT * FROM pedidos
           WHERE usuario_id = $1
             AND lower(COALESCE(status,'')) NOT IN ('cancelado','cancelada')
           ORDER BY data DESC NULLS LAST LIMIT 30`,
          [req.user.id]
        );
        const out = [];
        for (const p of pedidos) {
          let itens = [];
          try {
            const r = await db.query("SELECT * FROM pedido_itens WHERE pedido_id = $1", [p.id]);
            itens = r.rows || [];
          } catch (_) {}
          for (const it of itens) {
            const plantaId = it.planta_id || it.plantaId || it.id_planta;
            if (!plantaId) continue;
            let ja = false;
            try {
              const av = await db.query(
                "SELECT id FROM avaliacoes WHERE usuario_id = $1 AND planta_id = $2 LIMIT 1",
                [req.user.id, plantaId]
              );
              ja = !!(av.rows && av.rows[0]);
            } catch (_) {}
            if (ja) continue;
            out.push({
              pedidoId: p.id,
              plantaId: String(plantaId),
              nome: it.nome || it.planta_nome || String(plantaId),
              data: p.data,
              status: p.status
            });
          }
        }
        return res.json(out);
      }

      res.json(
        rows.map((r) => ({
          pedidoId: r.pedido_id,
          plantaId: r.planta_id,
          nome: r.nome || r.planta_id || "Planta",
          data: r.pedido_data,
          status: r.pedido_status
        }))
      );
    } catch (err) {
      console.error("[avaliacoes/pendentes]", err);
      next(err);
    }
  });

  app.post("/api/avaliacoes", auth, async (req, res, next) => {
    try {
      const plantaId = clean(req.body?.plantaId || req.body?.planta_id, 40);
      const texto = clean(req.body?.texto || req.body?.comentario, 600);
      const nota = Number(req.body?.nota || 0);
      if (!plantaId) return res.status(400).json({ erro: "Informe a planta." });
      if (!(nota >= 1 && nota <= 5)) return res.status(400).json({ erro: "Nota de 1 a 5." });
      if (!texto || texto.length < 3) return res.status(400).json({ erro: "Escreva um comentário." });

      // comprou? (qualquer status menos cancelado)
      const { rows: comprou } = await db.query(
        `SELECT pi.id
         FROM pedido_itens pi
         JOIN pedidos pe ON pe.id = pi.pedido_id
         WHERE pe.usuario_id = $1
           AND pi.planta_id = $2
           AND lower(COALESCE(pe.status,'')) NOT IN ('cancelado','cancelada')
         LIMIT 1`,
        [req.user.id, plantaId]
      );
      if (!comprou[0]) {
        return res.status(400).json({
          erro: "Só dá para avaliar plantas que você já comprou (pedido não cancelado)."
        });
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

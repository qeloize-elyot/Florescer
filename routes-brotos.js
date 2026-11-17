/**
 * Brotos: listar e resgatar recompensas
 */
module.exports = function registerBrotos(app, { auth, db, publicUser, clean, uid }) {
  // Garante linhas de recompensas (idempotente)
  (async function seedRecompensas() {
    try {
      const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM recompensas");
      if (rows[0] && rows[0].n > 0) return;
      const lista = [
        ["r1", "Frete grátis sem valor mínimo", "Zera o frete do pedido.", 300, "🚚", "frete", null],
        ["r2", "Cupom R$ 20 de desconto", "Abate R$ 20 do subtotal.", 250, "🏷️", "desconto", 20],
        ["r3", "Cupom R$ 50 de desconto", "Abate R$ 50 do subtotal.", 550, "💸", "desconto", 50],
        ["r4", "10% off no pedido", "Desconto percentual sobre o subtotal.", 400, "📉", "percentual", 10],
        ["r5", "Kit adubo orgânico de brinde", "Um pote de 500 g no pedido.", 200, "🧴", "brinde", null],
        ["r6", "Muda surpresa de brinde", "Uma mudinha do viveiro.", 350, "🌿", "brinde", null],
        ["r7", "Embalagem presente premium", "Caixa kraft e cartão.", 150, "🎁", "brinde", null],
        ["r8", "Entrega expressa gratuita", "Upgrade expresso sem custo.", 500, "⚡", "expresso", null]
      ];
      for (const r of lista) {
        await db.query(
          `INSERT INTO recompensas (id, nome, descricao, custo, emoji, tipo, valor)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO NOTHING`,
          r
        );
      }
      console.log("[brotos] recompensas seed ok");
    } catch (e) {
      console.warn("[brotos] seed", e.message);
    }
  })();

  app.get("/api/resgates", auth, async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT rg.id, rg.recompensa_id, rg.usado, rg.data,
                rec.nome, rec.descricao, rec.custo, rec.emoji, rec.tipo, rec.valor
         FROM resgates rg
         LEFT JOIN recompensas rec ON rec.id = rg.recompensa_id
         WHERE rg.usuario_id = $1
         ORDER BY rg.usado ASC, rg.data DESC`,
        [req.user.id]
      );
      res.json(
        rows.map((r) => ({
          id: r.id,
          recompensa_id: r.recompensa_id,
          usado: !!r.usado,
          data: r.data,
          nome: r.nome,
          desc: r.descricao,
          custo: r.custo,
          emoji: r.emoji,
          tipo: r.tipo,
          valor: r.valor
        }))
      );
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/resgates", auth, async (req, res, next) => {
    try {
      const recompensaId = clean(req.body?.recompensaId || req.body?.id, 20);
      if (!recompensaId) {
        return res.status(400).json({ erro: "Informe a recompensa." });
      }

      const { rows: recRows } = await db.query("SELECT * FROM recompensas WHERE id = $1", [
        recompensaId
      ]);
      const rec = recRows[0];
      if (!rec) return res.status(404).json({ erro: "Recompensa não encontrada." });

      const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [
        req.user.id
      ]);
      const user = userRows[0];
      if (!user) return res.status(401).json({ erro: "Usuário inválido." });

      const brotos = Number(user.brotos || 0);
      const custo = Number(rec.custo || 0);
      if (brotos < custo) {
        return res.status(400).json({
          erro: `Você tem ${brotos} Brotos. Esta recompensa pede ${custo}.`
        });
      }

      // evita acumular o mesmo tipo não usado em excesso (opcional: 1 pendente por id)
      const { rows: pend } = await db.query(
        "SELECT id FROM resgates WHERE usuario_id = $1 AND recompensa_id = $2 AND usado = 0 LIMIT 1",
        [req.user.id, recompensaId]
      );
      if (pend[0]) {
        return res.status(400).json({
          erro: "Você já tem essa recompensa disponível no carrinho. Use antes de resgatar de novo."
        });
      }

      const id = uid();
      try {
        await db.query("BEGIN");
        await db.query("UPDATE usuarios SET brotos = brotos - $1 WHERE id = $2 AND brotos >= $1", [
          custo,
          req.user.id
        ]);
        const { rowCount } = await db.query(
          "SELECT brotos FROM usuarios WHERE id = $1 AND brotos >= 0", /* no-op check */
          [req.user.id]
        );
        await db.query(
          `INSERT INTO resgates (id, usuario_id, recompensa_id, usado, data)
           VALUES ($1, $2, $3, 0, NOW())`,
          [id, req.user.id, recompensaId]
        );
        await db.query("COMMIT");
      } catch (e) {
        try {
          await db.query("ROLLBACK");
        } catch (_) {}
        // fallback sem transaction (sqlite/pg mixed)
        await db.query("UPDATE usuarios SET brotos = brotos - $1 WHERE id = $2", [custo, req.user.id]);
        try {
          await db.query(
            `INSERT INTO resgates (id, usuario_id, recompensa_id, usado, data)
             VALUES ($1, $2, $3, 0, NOW())`,
            [id, req.user.id, recompensaId]
          );
        } catch (e2) {
          // tenta data texto
          await db.query(
            `INSERT INTO resgates (id, usuario_id, recompensa_id, usado, data)
             VALUES ($1, $2, $3, 0, $4)`,
            [id, req.user.id, recompensaId, new Date().toISOString()]
          );
        }
      }

      const { rows: after } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
      res.json({
        ok: true,
        mensagem: `Resgatou: ${rec.nome}`,
        resgate: {
          id,
          recompensa_id: recompensaId,
          nome: rec.nome,
          tipo: rec.tipo,
          valor: rec.valor,
          usado: false
        },
        usuario: publicUser(after[0] || user),
        brotos: after[0] ? after[0].brotos : brotos - custo
      });
    } catch (err) {
      console.error("[resgates POST]", err);
      next(err);
    }
  });
};

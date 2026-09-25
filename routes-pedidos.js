/**
 * Rotas de pedidos — schema alinhado + fallback de preços via dados.js
 */
const { loadStaticData, mapPlantaStatic } = require("./static-data");

module.exports = function registerPedidos(app, { auth, db, transaction, publicUser, uid, clean }) {
  const staticData = loadStaticData();

  async function resolverPlanta(id) {
    const pid = String(id).slice(0, 20);
    try {
      const { rows } = await db.query(
        "SELECT * FROM plantas WHERE id = $1 AND COALESCE(ativo, 1) = 1",
        [pid]
      );
      if (rows[0]) {
        const p = rows[0];
        return {
          id: p.id,
          nome: p.nome,
          preco: Number(p.preco)
        };
      }
    } catch (e) {
      console.warn("[pedidos] planta DB:", e.message);
    }
    const p = staticData.CATALOGO.find((x) => x.id === pid);
    if (!p) return null;
    return { id: p.id, nome: p.nome, preco: Number(p.preco) };
  }

  app.post("/api/pedidos", auth, async (req, res, next) => {
    try {
      const body = req.body || {};
      const itens = Array.isArray(body.itens) ? body.itens.slice(0, 50) : [];
      if (!itens.length) return res.status(400).json({ erro: "Carrinho vazio." });

      let subtotal = 0;
      const itensDb = [];
      for (const i of itens) {
        const p = await resolverPlanta(i.id);
        if (!p) return res.status(400).json({ erro: "Planta inválida" });
        const qtd = Math.min(99, Math.max(1, Number(i.qtd) || 1));
        subtotal += p.preco * qtd;
        itensDb.push({ id: p.id, nome: p.nome, qtd, preco: p.preco });
      }

      const recompensasIds = Array.isArray(body.recompensasAplicadas)
        ? body.recompensasAplicadas.slice(0, 10).map((id) => String(id).slice(0, 20))
        : [];

      let resgatesDisponiveis = [];
      try {
        const { rows } = await db.query("SELECT * FROM resgates WHERE usuario_id = $1 AND usado = 0", [
          req.user.id
        ]);
        resgatesDisponiveis = rows;
      } catch (_) {}

      let frete = Math.max(0, Number(body.frete?.valor) || 0);
      let desconto = 0;
      const temPresente = !!body.presente;
      let embalagem = temPresente ? 12.9 : 0;

      for (const rid of recompensasIds) {
        const rg = resgatesDisponiveis.find((x) => x.recompensa_id === rid);
        if (!rg) continue;
        try {
          const { rows: rRows } = await db.query("SELECT * FROM recompensas WHERE id = $1", [rid]);
          const r = rRows[0];
          if (!r) continue;
          if (r.tipo === "frete" || r.tipo === "expresso") frete = 0;
          if (r.tipo === "desconto") desconto += Number(r.valor) || 0;
          if (r.tipo === "percentual") desconto += subtotal * ((Number(r.valor) || 0) / 100);
          if (r.tipo === "brinde" && r.id === "r7") embalagem = 0;
        } catch (_) {}
      }

      if (subtotal >= 299 && body.frete?.modalidade === "padrao") frete = 0;
      desconto = Math.min(desconto, subtotal);

      const metodo = ["pix", "cartao", "boleto"].includes(body.pagamento?.metodo)
        ? body.pagamento.metodo
        : "pix";
      const parcelas = Math.min(12, Math.max(1, Number(body.pagamento?.parcelas) || 1));
      const baseAntesPix = subtotal - desconto + frete + embalagem;
      const descontoPix = metodo === "pix" ? baseAntesPix * 0.05 : 0;
      const total = Math.max(0, baseAntesPix - descontoPix);
      const brotosGanhos = Math.floor(total);
      const id = "P" + uid().toUpperCase();

      const end = body.endereco || {};
      const prazo = Array.isArray(body.frete?.prazo) ? body.frete.prazo : [null, null];
      const presente = typeof body.presente === "object" && body.presente ? body.presente : null;

      await transaction(async (client) => {
        await client.query(
          `INSERT INTO pedidos (
            id, usuario_id, status,
            subtotal, frete, desconto, embalagem, desconto_pix, total, brotos_ganhos,
            frete_regiao, frete_prazo_min, frete_prazo_max, frete_modalidade,
            cep, rua, numero, bairro, cidade, complemento,
            pagamento_metodo, pagamento_parcelas,
            presente_para, presente_de, presente_msg, presente_ocultar
          ) VALUES (
            $1, $2, 'pago',
            $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19,
            $20, $21,
            $22, $23, $24, $25
          )`,
          [
            id,
            req.user.id,
            subtotal,
            frete,
            desconto,
            embalagem,
            descontoPix,
            total,
            brotosGanhos,
            body.frete?.regiao || null,
            prazo[0] != null ? Number(prazo[0]) : null,
            prazo[1] != null ? Number(prazo[1]) : null,
            body.frete?.modalidade || null,
            clean(end.cep, 12) || null,
            clean(end.rua, 120) || null,
            clean(String(end.numero || ""), 20) || null,
            clean(end.bairro, 80) || null,
            clean(end.cidade, 80) || null,
            clean(end.complemento, 80) || null,
            metodo,
            parcelas,
            presente ? clean(presente.para, 80) : null,
            presente ? clean(presente.de, 80) : null,
            presente ? clean(presente.mensagem, 300) : null,
            presente && presente.ocultarValores ? 1 : 0
          ]
        );

        for (const it of itensDb) {
          await client.query(
            `INSERT INTO pedido_itens (pedido_id, planta_id, nome, quantidade, preco_unitario)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, it.id, it.nome, it.qtd, it.preco]
          );
        }

        for (const rid of recompensasIds) {
          try {
            await client.query(
              "UPDATE resgates SET usado = 1 WHERE usuario_id = $1 AND recompensa_id = $2 AND usado = 0",
              [req.user.id, rid]
            );
          } catch (_) {}
        }

        try {
          await client.query("DELETE FROM carrinho_itens WHERE usuario_id = $1", [req.user.id]);
        } catch (_) {}
        try {
          await client.query("UPDATE usuarios SET brotos = brotos + $1 WHERE id = $2", [
            brotosGanhos,
            req.user.id
          ]);
        } catch (_) {}
      });

      let usuario = publicUser(req.user);
      try {
        const { rows: userRows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
        if (userRows[0]) usuario = publicUser(userRows[0]);
      } catch (_) {}

      res.json({
        id,
        total,
        brotos: usuario.brotos,
        usuario,
        pedido: {
          id,
          total,
          brotosGanhos,
          frete: {
            valor: frete,
            regiao: body.frete?.regiao || null,
            prazo: body.frete?.prazo || null,
            modalidade: body.frete?.modalidade || null
          }
        }
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/pedidos", auth, async (req, res, next) => {
    try {
      const { rows } = await db.query(
        "SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data DESC NULLS LAST LIMIT 50",
        [req.user.id]
      );
      res.json(
        rows.map((p) => ({
          id: p.id,
          subtotal: p.subtotal,
          frete: p.frete,
          desconto: p.desconto,
          total: p.total,
          metodo: p.pagamento_metodo || p.metodo,
          status: p.status,
          presente: !!(p.presente_para || p.presente),
          criadoEm: p.data || p.criado_em,
          podeReembolsar:
            !["reembolsado", "cancelado", "estornado"].includes(String(p.status || "").toLowerCase())
        }))
      );
    } catch (err) {
      next(err);
    }
  });
};

/**
 * Pedidos: detalhe, cancelamento e lista com filtro (estilo Shopee)
 */
const { montarRastreio } = require("./rastreio");

function categoriaPedido(p) {
  const st = String(p.status || "").toLowerCase();
  if (["cancelado", "reembolsado", "estornado"].includes(st)) return "cancelados";
  const r = montarRastreio(p);
  if (r.statusAtual === "Entregue" || st === "entregue" || st === "finalizado") return "finalizados";
  if (
    ["Saiu para entrega", "Na base regional", "No centro de distribuição", "Em trânsito"].includes(
      r.statusAtual
    )
  ) {
    return "a_caminho";
  }
  return "em_andamento"; // pago / preparando
}

function mapPedido(p, itens, incluirRastreio) {
  const rastreio = montarRastreio(p);
  const cat = categoriaPedido(p);
  const podeCancelar =
    cat === "em_andamento" &&
    !["cancelado", "reembolsado", "estornado", "entregue"].includes(
      String(p.status || "").toLowerCase()
    );

  return {
    id: p.id,
    subtotal: Number(p.subtotal) || 0,
    frete: Number(p.frete) || 0,
    desconto: Number(p.desconto) || 0,
    total: Number(p.total) || 0,
    metodo: p.pagamento_metodo || p.metodo,
    status: p.status,
    statusExibicao: cat === "cancelados" ? p.status || "Cancelado" : rastreio.statusAtual,
    categoria: cat,
    presente: !!(p.presente_para || p.presente),
    criadoEm: p.data || p.criado_em,
    endereco: {
      cep: p.cep || "",
      rua: p.rua || "",
      numero: p.numero || "",
      bairro: p.bairro || "",
      cidade: p.cidade || "",
      complemento: p.complemento || ""
    },
    itens: (itens || []).map((i) => ({
      plantaId: i.planta_id,
      nome: i.nome,
      quantidade: i.quantidade,
      preco: Number(i.preco_unitario)
    })),
    podeCancelar,
    podeReembolsar: podeCancelar,
    rastreio: incluirRastreio
      ? rastreio
      : {
          codigo: rastreio.codigo,
          statusAtual: rastreio.statusAtual,
          progressoPct: rastreio.progressoPct
        }
  };
}

module.exports = function registerPedidosExtra(app, { auth, db, transaction, publicUser, clean }) {
  // sobrescreve listagem com itens + filtro
  app.get("/api/pedidos", auth, async (req, res, next) => {
    try {
      const filtro = String(req.query.status || "todos").toLowerCase();
      const { rows } = await db.query(
        "SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data DESC NULLS LAST LIMIT 80",
        [req.user.id]
      );

      const out = [];
      for (const p of rows) {
        let itens = [];
        try {
          const { rows: its } = await db.query(
            "SELECT * FROM pedido_itens WHERE pedido_id = $1",
            [p.id]
          );
          itens = its;
        } catch (_) {}
        const mapped = mapPedido(p, itens, false);
        if (filtro === "todos" || filtro === mapped.categoria) out.push(mapped);
      }
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/pedidos/:id", auth, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 40);
      const { rows } = await db.query("SELECT * FROM pedidos WHERE id = $1", [id]);
      const p = rows[0];
      if (!p) return res.status(404).json({ erro: "Pedido não encontrado." });
      const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
      if (!isAdmin && Number(p.usuario_id) !== Number(req.user.id)) {
        return res.status(403).json({ erro: "Este pedido não é seu." });
      }
      let itens = [];
      try {
        const { rows: its } = await db.query("SELECT * FROM pedido_itens WHERE pedido_id = $1", [
          id
        ]);
        itens = its;
      } catch (_) {}
      res.json(mapPedido(p, itens, true));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/pedidos/:id/cancelar", auth, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 40);
      const motivo = clean(req.body?.motivo || "Cancelado pelo cliente", 200);

      const { rows } = await db.query("SELECT * FROM pedidos WHERE id = $1", [id]);
      const p = rows[0];
      if (!p) return res.status(404).json({ erro: "Pedido não encontrado." });
      if (Number(p.usuario_id) !== Number(req.user.id)) {
        return res.status(403).json({ erro: "Este pedido não é seu." });
      }

      const cat = categoriaPedido(p);
      if (cat !== "em_andamento") {
        return res.status(400).json({
          erro:
            cat === "cancelados"
              ? "Este pedido já está cancelado."
              : "Não é possível cancelar: o pedido já saiu para entrega ou foi finalizado."
        });
      }

      const brotos = Number(p.brotos_ganhos) || 0;

      await transaction(async (client) => {
        await client.query(
          `UPDATE pedidos SET status = 'cancelado' WHERE id = $1`,
          [id]
        );
        if (brotos > 0) {
          try {
            await client.query(
              `UPDATE usuarios SET brotos = GREATEST(0, brotos - $1) WHERE id = $2`,
              [brotos, req.user.id]
            );
          } catch (_) {}
        }
      });

      let usuario = publicUser(req.user);
      try {
        const { rows: u } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
        if (u[0]) usuario = publicUser(u[0]);
      } catch (_) {}

      res.json({
        ok: true,
        id,
        status: "cancelado",
        motivo,
        mensagem: "Pedido cancelado. Os Brotos desta compra foram estornados (quando havia).",
        usuario
      });
    } catch (err) {
      next(err);
    }
  });
};

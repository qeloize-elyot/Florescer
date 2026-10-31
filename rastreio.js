/**
 * Rastreio simulado — avança com o tempo desde a compra
 */

const CENTROS = [
  {
    codigo: "CD-MGA",
    nome: "CD Florescer Maringá — PR",
    cidade: "Maringá",
    descricao: "Pedido conferido e embalado no viveiro."
  },
  {
    codigo: "HUB-CWB",
    nome: "Hub Logístico Curitiba — PR",
    cidade: "Curitiba",
    descricao: "Volume recebido no hub regional e separado para transferência."
  },
  {
    codigo: "CD-SP",
    nome: "Centro de Distribuição São Paulo — SP",
    cidade: "São Paulo",
    descricao: "Chegada ao centro de distribuição interestadual."
  },
  {
    codigo: "BASE-REG",
    nome: "Base Regional de Entrega",
    cidade: "Base local",
    descricao: "Pacote na base mais próxima do CEP de destino."
  },
  {
    codigo: "ROTA",
    nome: "Em rota de entrega",
    cidade: "Destino",
    descricao: "Saiu para entrega no endereço informado."
  }
];

/** Intervalos em horas a partir da criação do pedido */
const MARCOS_HORAS = [0, 2, 8, 20, 36, 48];

function statusLabel(etapa) {
  const map = [
    "Pedido confirmado",
    "Em preparação no viveiro",
    "Em trânsito",
    "No centro de distribuição",
    "Na base regional",
    "Saiu para entrega",
    "Entregue"
  ];
  return map[Math.min(etapa, map.length - 1)];
}

/**
 * @param {object} pedido — precisa de data | criado_em e opcionalmente status
 */
function montarRastreio(pedido) {
  const raw = pedido.data || pedido.criado_em || pedido.criadoEm;
  const criado = raw ? new Date(raw) : new Date();
  const criadoOk = !Number.isNaN(criado.getTime()) ? criado : new Date();
  const horas = Math.max(0, (Date.now() - criadoOk.getTime()) / 3600000);

  // status manual reembolsado/cancelado
  const st = String(pedido.status || "").toLowerCase();
  if (["reembolsado", "cancelado", "estornado"].includes(st)) {
    return {
      codigo: pedido.rastreio_codigo || pedido.id,
      statusAtual: pedido.status,
      etapaAtual: 0,
      progressoPct: 0,
      eventos: [
        {
          quando: criadoOk.toISOString(),
          titulo: "Pedido " + pedido.status,
          local: "—",
          detalhes: "Este pedido não segue mais no fluxo de entrega."
        }
      ],
      previsaoEntrega: null
    };
  }

  let etapa = 0;
  for (let i = 0; i < MARCOS_HORAS.length; i++) {
    if (horas >= MARCOS_HORAS[i]) etapa = i;
  }
  // entregue após último marco + 12h
  const entregue = horas >= MARCOS_HORAS[MARCOS_HORAS.length - 1] + 12;
  if (entregue) etapa = MARCOS_HORAS.length;

  const eventos = [];
  // confirmação
  eventos.push({
    quando: criadoOk.toISOString(),
    titulo: "Pedido confirmado",
    local: CENTROS[0].nome,
    detalhes: "Pagamento aprovado. Aguardando separação das plantas."
  });

  for (let i = 0; i < CENTROS.length; i++) {
    const marcoH = MARCOS_HORAS[Math.min(i + 1, MARCOS_HORAS.length - 1)];
    if (horas < marcoH && !entregue) break;
    const quando = new Date(criadoOk.getTime() + marcoH * 3600000);
    eventos.push({
      quando: quando.toISOString(),
      titulo: i === CENTROS.length - 1 ? "Saiu para entrega" : "Passou pelo centro logístico",
      local: CENTROS[i].nome,
      detalhes: CENTROS[i].descricao,
      centro: CENTROS[i]
    });
  }

  if (entregue) {
    const quando = new Date(criadoOk.getTime() + (MARCOS_HORAS[MARCOS_HORAS.length - 1] + 12) * 3600000);
    eventos.push({
      quando: quando.toISOString(),
      titulo: "Entregue",
      local: [pedido.cidade, pedido.bairro].filter(Boolean).join(" — ") || "Endereço do cliente",
      detalhes: "Pedido entregue com sucesso (simulação)."
    });
  }

  const previsao = new Date(criadoOk.getTime() + (MARCOS_HORAS[MARCOS_HORAS.length - 1] + 12) * 3600000);
  const codigo =
    pedido.rastreio_codigo ||
    "FL" + String(pedido.id || "").replace(/\W/g, "").slice(-10).toUpperCase();

  return {
    codigo,
    statusAtual: statusLabel(etapa),
    etapaAtual: etapa,
    totalEtapas: MARCOS_HORAS.length + 1,
    progressoPct: Math.min(100, Math.round((etapa / (MARCOS_HORAS.length + 1)) * 100)),
    eventos: eventos.reverse(), // mais recente primeiro
    previsaoEntrega: entregue ? null : previsao.toISOString(),
    centros: CENTROS
  };
}

module.exports = { montarRastreio, CENTROS };

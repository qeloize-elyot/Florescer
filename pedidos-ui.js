/**
 * Área de pedidos (estilo Shopee): abas + cancelar + rota
 */
(function () {
  "use strict";

  var FILTRO = "todos";
  var CACHE = [];

  function token() {
    return localStorage.getItem("rf_token") || "";
  }

  function toast(msg, erro) {
    var box = document.getElementById("toasts");
    if (!box) {
      alert(msg);
      return;
    }
    var el = document.createElement("div");
    el.className = "toast" + (erro ? " erro" : "");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4000);
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    var res = await fetch("/api" + path, Object.assign({}, opts, { headers: headers }));
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.erro || "Erro na requisição");
    return data;
  }

  function money(n) {
    return "R$ " + (Number(n) || 0).toFixed(2).replace(".", ",");
  }

  function statusClass(cat) {
    if (cat === "cancelados") return "cancelado";
    if (cat === "finalizados") return "finalizado";
    return "";
  }

  function ensureUI() {
    var cont = document.getElementById("conteudoConta");
    if (!cont) return null;

    var wrap = document.getElementById("pedidosShopee");
    if (wrap) return wrap;

    wrap = document.createElement("div");
    wrap.id = "pedidosShopee";
    wrap.className = "ped-wrap";
    wrap.innerHTML =
      "<h3 style=\"margin:20px 0 8px\">Meus pedidos</h3>" +
      '<div class="ped-tabs" role="tablist">' +
      '<button type="button" class="ped-tab ativo" data-filtro="todos">Todos</button>' +
      '<button type="button" class="ped-tab" data-filtro="em_andamento">Em andamento</button>' +
      '<button type="button" class="ped-tab" data-filtro="a_caminho">A caminho</button>' +
      '<button type="button" class="ped-tab" data-filtro="finalizados">Finalizados</button>' +
      '<button type="button" class="ped-tab" data-filtro="cancelados">Cancelados</button>' +
      "</div>" +
      '<div id="pedidosLista"></div>';

    cont.appendChild(wrap);

    wrap.querySelectorAll(".ped-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        FILTRO = btn.getAttribute("data-filtro") || "todos";
        wrap.querySelectorAll(".ped-tab").forEach(function (b) {
          b.classList.toggle("ativo", b === btn);
        });
        renderLista();
      });
    });

    return wrap;
  }

  function renderLista() {
    var box = document.getElementById("pedidosLista");
    if (!box) return;

    var lista = CACHE.filter(function (p) {
      return FILTRO === "todos" || p.categoria === FILTRO;
    });

    if (!lista.length) {
      box.innerHTML =
        '<div class="ped-vazio">Nenhum pedido nesta aba.<br/><span class="small">Quando você comprar, os pedidos aparecem aqui.</span></div>';
      return;
    }

    box.innerHTML = lista
      .map(function (p) {
        var itens = (p.itens || [])
          .map(function (i) {
            return "<li>" + (i.nome || i.plantaId) + " × " + i.quantidade + "</li>";
          })
          .join("");
        var prog = (p.rastreio && p.rastreio.progressoPct) || 0;
        return (
          '<article class="ped-card" data-pid="' +
          p.id +
          '">' +
          '<div class="ped-card-topo">' +
          '<span class="ped-id">' +
          p.id +
          "</span>" +
          '<span class="ped-status ' +
          statusClass(p.categoria) +
          '">' +
          (p.statusExibicao || p.status || "—") +
          "</span></div>" +
          (itens ? '<ul class="ped-itens">' + itens + "</ul>" : "") +
          '<div class="ped-total">Total: ' +
          money(p.total) +
          "</div>" +
          (p.criadoEm
            ? '<p class="small muted">' +
              new Date(p.criadoEm).toLocaleString("pt-BR") +
              "</p>"
            : "") +
          (p.categoria !== "cancelados"
            ? '<div class="ped-rota"><span class="small muted">Rota: ' +
              ((p.rastreio && p.rastreio.statusAtual) || "—") +
              '</span><div class="ped-rota-barra"><span style="width:' +
              prog +
              '%"></span></div></div>'
            : "") +
          '<div class="ped-acoes">' +
          '<button type="button" class="btn btn-ghost" data-rota="' +
          p.id +
          '">Ver rota</button>' +
          (p.podeCancelar
            ? '<button type="button" class="btn btn-ghost" data-cancelar="' +
              p.id +
              '">Cancelar pedido</button>'
            : "") +
          "</div></article>"
        );
      })
      .join("");

    box.querySelectorAll("[data-rota]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        abrirRota(btn.getAttribute("data-rota"));
      });
    });
    box.querySelectorAll("[data-cancelar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        cancelar(btn.getAttribute("data-cancelar"));
      });
    });
  }

  async function abrirRota(id) {
    try {
      var det = await api("/pedidos/" + encodeURIComponent(id));
      var r = det.rastreio || {};
      var eventos = r.eventos || [];
      var html =
        "<h3>Rota do pedido " +
        id +
        "</h3>" +
        "<p><strong>" +
        (r.statusAtual || det.statusExibicao || "") +
        "</strong></p>" +
        (r.codigo ? '<p class="small muted">Código: ' + r.codigo + "</p>" : "") +
        '<div class="ped-rota-barra"><span style="width:' +
        (r.progressoPct || 0) +
        '%"></span></div>';

      eventos.forEach(function (ev) {
        html +=
          '<div class="ped-evt"><strong>' +
          (ev.titulo || "") +
          "</strong>" +
          '<span class="muted">' +
          (ev.local || "") +
          "</span><br/>" +
          '<span class="muted">' +
          (ev.detalhes || "") +
          "</span><br/>" +
          '<span class="muted">' +
          (ev.quando ? new Date(ev.quando).toLocaleString("pt-BR") : "") +
          "</span></div>";
      });

      html +=
        '<p class="small muted" style="margin-top:12px">Simulação: a rota avança com o tempo desde a compra (centros logísticos fictícios).</p>';
      html +=
        '<button type="button" class="btn" id="pedFechaRota" style="margin-top:12px">Fechar</button>';

      var ov = document.getElementById("overlayRastreio");
      if (!ov) {
        ov = document.createElement("div");
        ov.className = "overlay";
        ov.id = "overlayRastreio";
        ov.innerHTML = '<div class="modal" id="modalRastreio" style="max-width:520px"></div>';
        document.body.appendChild(ov);
        ov.addEventListener("click", function (e) {
          if (e.target === ov) ov.classList.remove("aberto");
        });
      }
      var modal = document.getElementById("modalRastreio");
      modal.innerHTML = html;
      ov.classList.add("aberto");
      var fechar = document.getElementById("pedFechaRota");
      if (fechar)
        fechar.onclick = function () {
          ov.classList.remove("aberto");
        };
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function cancelar(id) {
    if (!confirm("Cancelar o pedido " + id + "?\nSó é possível enquanto ainda está em preparação.")) return;
    try {
      var r = await api("/pedidos/" + encodeURIComponent(id) + "/cancelar", {
        method: "POST",
        body: JSON.stringify({ motivo: "Cancelado pelo cliente" })
      });
      toast(r.mensagem || "Pedido cancelado");
      await carregar();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function carregar() {
    if (!token()) return;
    ensureUI();
    try {
      CACHE = await api("/pedidos?status=todos");
      if (!Array.isArray(CACHE)) CACHE = [];
      renderLista();
    } catch (e) {
      var box = document.getElementById("pedidosLista");
      if (box) box.innerHTML = '<p class="muted small">' + e.message + "</p>";
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest('[data-secao="conta"], [data-ir="conta"]');
    if (t) setTimeout(carregar, 600);
  });

  var obsTarget = null;
  function watchConta() {
    var cont = document.getElementById("conteudoConta");
    if (!cont || cont === obsTarget) return;
    obsTarget = cont;
    var mo = new MutationObserver(function () {
      if (token() && !document.getElementById("pedidosShopee")) carregar();
    });
    mo.observe(cont, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      watchConta();
      setTimeout(carregar, 1000);
    });
  } else {
    watchConta();
    setTimeout(carregar, 1000);
  }

  window.FlorescerPedidos = { carregar: carregar, abrirRota: abrirRota };
})();

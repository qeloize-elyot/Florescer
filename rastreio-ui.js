/**
 * Rastreio simulado — botão nos pedidos da conta
 */
(function () {
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
    }, 4500);
  }

  function ensureModal() {
    var ov = document.getElementById("overlayRastreio");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "overlay";
    ov.id = "overlayRastreio";
    ov.innerHTML = '<div class="modal" id="modalRastreio" style="max-width:520px"></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) ov.classList.remove("aberto");
    });
    return ov;
  }

  async function abrirRastreio(pedidoId) {
    var ov = ensureModal();
    var modal = document.getElementById("modalRastreio");
    modal.innerHTML = "<p class=\"muted\">Carregando rastreio…</p>";
    ov.classList.add("aberto");
    try {
      var res = await fetch("/api/pedidos/" + encodeURIComponent(pedidoId) + "/rastreio", {
        headers: { Authorization: "Bearer " + token() }
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) throw new Error(data.erro || "Não foi possível rastrear");
      var r = data.rastreio || {};
      var eventos = r.eventos || [];
      var html =
        "<h3>Rastreio " +
        (r.codigo || pedidoId) +
        "</h3>" +
        '<p><strong>Status:</strong> ' +
        (r.statusAtual || "—") +
        "</p>" +
        (r.previsaoEntrega
          ? "<p class=\"small muted\">Previsão: " +
            new Date(r.previsaoEntrega).toLocaleString("pt-BR") +
            "</p>"
          : "") +
        '<div class="barra" style="margin:12px 0"><div style="width:' +
        (r.progressoPct || 0) +
        '%;height:8px;background:var(--verde-700,#2a4a3a);border-radius:4px"></div></div>' +
        '<ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px">';

      eventos.forEach(function (ev) {
        html +=
          "<li style=\"border-left:3px solid var(--verde-500,#5a8f6a);padding-left:12px\">" +
          "<strong>" +
          (ev.titulo || "") +
          "</strong><br/>" +
          '<span class="small">' +
          (ev.local || "") +
          "</span><br/>" +
          '<span class="small muted">' +
          (ev.detalhes || "") +
          "</span><br/>" +
          '<span class="small muted">' +
          (ev.quando ? new Date(ev.quando).toLocaleString("pt-BR") : "") +
          "</span></li>";
      });
      html += "</ul>";
      html +=
        '<p class="small muted" style="margin-top:16px">Simulação educativa: os centros e horários avançam com o tempo desde a compra.</p>';
      html +=
        '<button type="button" class="btn btn-ghost" id="btnFecharRastreio" style="margin-top:12px">Fechar</button>';
      modal.innerHTML = html;
      document.getElementById("btnFecharRastreio").onclick = function () {
        ov.classList.remove("aberto");
      };
    } catch (e) {
      modal.innerHTML = "<p class=\"erro\">" + e.message + "</p>";
      toast(e.message, true);
    }
  }

  function injetarBotoes() {
    var cont = document.getElementById("conteudoConta");
    if (!cont) return;
    cont.querySelectorAll("article, .painel, .card, li, div").forEach(function (el) {
      if (el.dataset.rastreioReady) return;
      var txt = el.textContent || "";
      var m = txt.match(/\b(P[A-F0-9]{6,}|FL[A-Z0-9]{4,})\b/i);
      if (!m) return;
      if (!/R\$|total|pedido|status/i.test(txt)) return;
      if (el.querySelector("[data-rastrear]")) return;

      var id = m[1];
      var btn = document.createElement("button");
      btn.className = "btn btn-ghost btn-sm";
      btn.type = "button";
      btn.dataset.rastrear = id;
      btn.textContent = "Rastrear pedido";
      btn.style.marginTop = "8px";
      btn.style.marginRight = "8px";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        abrirRastreio(id);
      });
      el.appendChild(btn);
      el.dataset.rastreioReady = "1";
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest('[data-secao="conta"], [data-ir="conta"]');
    if (t) setTimeout(injetarBotoes, 700);
  });

  var obs = new MutationObserver(function () {
    injetarBotoes();
  });
  function start() {
    var cont = document.getElementById("conteudoConta");
    if (cont) obs.observe(cont, { childList: true, subtree: true });
    injetarBotoes();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.FlorescerRastreio = { abrirRastreio: abrirRastreio };
})();

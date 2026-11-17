/* Avaliações: listar + formulário para pedidos comprados */
(function () {
  "use strict";

  function token() {
    return localStorage.getItem("rf_token") || "";
  }
  function toast(msg) {
    if (typeof window.toast === "function") return window.toast(msg);
    alert(msg);
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    return fetch("/api" + path, Object.assign({}, opts, { headers: headers })).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && j.erro) || "Erro na requisição");
        return j;
      });
    });
  }

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }

  function renderLista(lista) {
    var box = document.getElementById("listaAvaliacoes");
    if (!box) return;
    if (!lista.length) {
      box.innerHTML = '<p class="muted small">Ainda não há avaliações.</p>';
      return;
    }
    box.innerHTML = lista
      .map(function (a) {
        return (
          '<div style="padding:12px 0;border-bottom:1px solid rgba(31,54,38,.08)">' +
          '<div style="color:#C9A227;letter-spacing:1px">' +
          stars(Number(a.nota) || 0) +
          "</div>" +
          "<strong>" +
          (a.plantaNome || a.plantaId || "Planta") +
          "</strong>" +
          '<div class="small muted">' +
          (a.autor || "Cliente") +
          "</div>" +
          "<p style=\"margin:6px 0 0\">" +
          (a.texto || "") +
          "</p></div>"
        );
      })
      .join("");
  }

  function renderForm(pendentes) {
    var box = document.getElementById("formAvaliacao");
    if (!box) return;
    if (!token()) {
      box.innerHTML = '<p class="muted small">Faça login para avaliar suas compras.</p>';
      return;
    }
    if (!pendentes.length) {
      box.innerHTML =
        '<p class="muted small">Nenhuma planta pendente de avaliação. Finalize uma compra e volte aqui.</p>';
      return;
    }
    box.innerHTML =
      '<div class="campos">' +
      '<div><label class="rot">Planta</label><select id="avPlanta">' +
      pendentes
        .map(function (p) {
          return (
            '<option value="' +
            p.plantaId +
            '">' +
            (p.nome || p.plantaId) +
            " (pedido " +
            String(p.pedidoId).slice(0, 8) +
            ")</option>"
          );
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Nota</label><select id="avNota">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return "<option value=\"" + n + "\">" + n + " — " + stars(n) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Comentário</label><textarea id="avTexto" rows="3" placeholder="Como chegou, como está em casa..."></textarea></div>' +
      '<button type="button" class="btn" id="btnEnviarAv">Publicar avaliação (+50 Brotos)</button>' +
      "</div>";

    document.getElementById("btnEnviarAv").onclick = function () {
      var plantaId = document.getElementById("avPlanta").value;
      var nota = Number(document.getElementById("avNota").value);
      var texto = document.getElementById("avTexto").value;
      api("/avaliacoes", {
        method: "POST",
        body: JSON.stringify({ plantaId: plantaId, nota: nota, texto: texto })
      })
        .then(function (j) {
          toast(j.mensagem || "Avaliação enviada");
          if (j.brotos != null) {
            var el = document.getElementById("saldoBrotos");
            if (el) el.textContent = j.brotos;
            var el2 = document.getElementById("saldoBrotosPainel");
            if (el2) el2.textContent = j.brotos;
          }
          boot();
        })
        .catch(function (e) {
          toast(e.message || "Erro");
        });
    };
  }

  function boot() {
    api("/avaliacoes")
      .then(renderLista)
      .catch(function () {
        var box = document.getElementById("listaAvaliacoes");
        if (box) box.innerHTML = '<p class="muted small">Não foi possível carregar avaliações.</p>';
      });

    if (token()) {
      api("/avaliacoes/pendentes")
        .then(renderForm)
        .catch(function () {
          renderForm([]);
        });
    } else {
      renderForm([]);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 900);

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-secao],[data-ir]");
    if (!b) return;
    var s = b.getAttribute("data-secao") || b.getAttribute("data-ir");
    if (s === "avaliacoes") setTimeout(boot, 150);
  });
})();

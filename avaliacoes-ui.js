/* Avaliações: lista + formulário com plantas compradas */
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
    if (!lista || !lista.length) {
      box.innerHTML = '<p class="muted small">Ainda não há avaliações publicadas.</p>';
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

    pendentes = (pendentes || []).filter(function (p) {
      return p && p.plantaId;
    });

    if (!pendentes.length) {
      box.innerHTML =
        '<p class="muted small">Nenhuma planta pendente de avaliação.</p>' +
        '<p class="small muted">Confira em <strong>Minha conta → Pedidos</strong> se a compra aparece. Pedidos cancelados não entram.</p>';
      return;
    }

    box.innerHTML =
      '<div class="campos">' +
      '<div><label class="rot">Planta comprada</label><select id="avPlanta">' +
      pendentes
        .map(function (p) {
          var label = p.nome || p.plantaNome || p.plantaId || "Planta";
          var ped = p.pedidoId ? " · pedido " + String(p.pedidoId).slice(0, 10) : "";
          return (
            '<option value="' +
            String(p.plantaId).replace(/"/g, "") +
            '">' +
            label +
            ped +
            "</option>"
          );
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Nota</label><select id="avNota">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return '<option value="' + n + '">' + n + " — " + stars(n) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Comentário</label>' +
      '<textarea id="avTexto" rows="3" placeholder="Como chegou, como está em casa..."></textarea></div>' +
      '<button type="button" class="btn" id="btnEnviarAv">Publicar avaliação (+50 Brotos)</button>' +
      "</div>";

    document.getElementById("btnEnviarAv").onclick = function () {
      var plantaId = document.getElementById("avPlanta").value;
      var nota = Number(document.getElementById("avNota").value);
      var texto = (document.getElementById("avTexto").value || "").trim();
      if (!plantaId) {
        toast("Escolha a planta");
        return;
      }
      api("/avaliacoes", {
        method: "POST",
        body: JSON.stringify({ plantaId: plantaId, nota: nota, texto: texto })
      })
        .then(function (j) {
          toast(j.mensagem || "Avaliação enviada");
          if (j.brotos != null) {
            ["saldoBrotos", "saldoBrotosPainel"].forEach(function (id) {
              var el = document.getElementById(id);
              if (el) el.textContent = j.brotos;
            });
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
        .then(function (lista) {
          console.log("[avaliacoes pendentes]", lista);
          renderForm(lista);
        })
        .catch(function (e) {
          console.warn("[avaliacoes pendentes]", e);
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
    if (s === "avaliacoes" || s === "conta") setTimeout(boot, 200);
  });
})();

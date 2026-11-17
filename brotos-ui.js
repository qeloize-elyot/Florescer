/* UI: resgatar Brotos + cupom no carrinho */
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
        if (!r.ok) throw new Error((j && (j.erro || j.message)) || "Erro na requisição");
        return j;
      });
    });
  }

  function setSaldo(n) {
    var s = String(n == null ? 0 : n);
    ["saldoBrotos", "saldoBrotosPainel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = s;
    });
  }

  function renderLista(recompensas, saldo) {
    var box = document.getElementById("listaRecompensas");
    if (!box) return;
    if (!recompensas.length) {
      box.innerHTML = '<p class="muted small">Nenhuma recompensa disponível no momento.</p>';
      return;
    }
    box.innerHTML = recompensas
      .map(function (r) {
        var pode = saldo >= Number(r.custo || 0);
        return (
          '<div class="recompensa-item" style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(31,54,38,.08)">' +
          '<div style="font-size:1.6rem;line-height:1">' +
          (r.emoji || "🌱") +
          "</div>" +
          '<div style="flex:1">' +
          "<strong>" +
          (r.nome || "Recompensa") +
          "</strong>" +
          '<div class="small muted">' +
          (r.desc || r.descricao || "") +
          "</div>" +
          '<div class="small" style="margin-top:4px;font-weight:600;color:#1F3626">' +
          Number(r.custo || 0) +
          " Brotos</div></div>" +
          '<button type="button" class="btn" data-resgatar="' +
          r.id +
          '" ' +
          (pode ? "" : "disabled style=\"opacity:.45\"") +
          ">" +
          (pode ? "Resgatar" : "Insuficiente") +
          "</button></div>"
        );
      })
      .join("");

    box.querySelectorAll("[data-resgatar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!token()) {
          toast("Faça login para resgatar");
          if (typeof window.irPara === "function") window.irPara("conta");
          return;
        }
        btn.disabled = true;
        api("/resgates", {
          method: "POST",
          body: JSON.stringify({ recompensaId: btn.getAttribute("data-resgatar") })
        })
          .then(function (j) {
            toast(j.mensagem || "Resgatado!");
            if (j.brotos != null) setSaldo(j.brotos);
            carregarTudo();
            montarCupomCarrinho();
          })
          .catch(function (e) {
            toast(e.message || "Erro na requisição");
            btn.disabled = false;
          });
      });
    });
  }

  function renderMeus(resgates) {
    var box = document.getElementById("meusResgates");
    if (!box) return;
    var ativos = (resgates || []).filter(function (r) {
      return !r.usado;
    });
    if (!ativos.length) {
      box.innerHTML = '<p class="muted small">Nenhum resgate ainda. Resgate acima para usar no carrinho.</p>';
      return;
    }
    box.innerHTML = ativos
      .map(function (r) {
        return (
          '<div class="small" style="padding:8px 0;border-bottom:1px solid rgba(31,54,38,.06)">' +
          (r.emoji || "🎟️") +
          " <strong>" +
          (r.nome || r.recompensa_id) +
          "</strong>" +
          ' <span class="muted">— disponível no carrinho</span></div>'
        );
      })
      .join("");
  }

  function carregarTudo() {
    api("/recompensas")
      .then(function (lista) {
        var saldo = 0;
        var el = document.getElementById("saldoBrotosPainel");
        if (el) saldo = Number(el.textContent) || 0;
        if (token()) {
          return api("/me")
            .then(function (me) {
              var u = me.usuario || me;
              if (u && u.brotos != null) {
                saldo = u.brotos;
                setSaldo(saldo);
              }
              renderLista(lista || [], saldo);
            })
            .catch(function () {
              renderLista(lista || [], saldo);
            });
        }
        renderLista(lista || [], saldo);
      })
      .catch(function () {
        var box = document.getElementById("listaRecompensas");
        if (box) box.innerHTML = '<p class="muted small">Não foi possível carregar as recompensas.</p>';
      });

    if (token()) {
      api("/resgates")
        .then(renderMeus)
        .catch(function () {
          /* silencioso */
        });
    }
  }

  function montarCupomCarrinho() {
    var painel = document.getElementById("painelResumo") || document.getElementById("sec-carrinho");
    if (!painel) return;

    // campo cupom
    if (!document.getElementById("campoCupomBox")) {
      var box = document.createElement("div");
      box.id = "campoCupomBox";
      box.className = "painel";
      box.style.marginTop = "12px";
      box.innerHTML =
        "<h3>Cupom</h3>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<input type="text" class="campo" id="inputCupom" placeholder="Ex.: BROTO10" style="flex:1;min-width:140px" />' +
        '<button type="button" class="btn" id="btnAplicarCupom">Aplicar</button></div>' +
        '<p class="small muted" id="cupomMsg" style="margin-top:8px"></p>';

      var resumo = document.getElementById("painelResumo");
      if (resumo) resumo.parentElement.insertBefore(box, resumo);
      else {
        var sec = document.getElementById("sec-carrinho");
        if (sec) sec.appendChild(box);
      }

      var hint = "";
      try {
        hint = localStorage.getItem("rf_cupom_hint") || "";
      } catch (_) {}
      if (hint && document.getElementById("inputCupom")) {
        document.getElementById("inputCupom").value = hint;
      }

      document.getElementById("btnAplicarCupom").addEventListener("click", function () {
        var code = (document.getElementById("inputCupom").value || "").trim().toUpperCase();
        var msg = document.getElementById("cupomMsg");
        if (code === "BROTO10") {
          try {
            localStorage.setItem("rf_cupom", "BROTO10");
            localStorage.setItem("rf_cupom_hint", "BROTO10");
          } catch (_) {}
          msg.textContent = "Cupom BROTO10 aplicado: 10% de desconto no subtotal.";
          msg.style.color = "#1F3626";
          toast("Cupom aplicado");
          aplicarDescontoCupomUI();
        } else if (!code) {
          msg.textContent = "Digite um cupom.";
        } else {
          msg.textContent = "Cupom inválido.";
          msg.style.color = "#a33";
        }
      });
    }

    // recompensas resgatadas no carrinho
    var slot = document.getElementById("recompensasCarrinho");
    if (!slot) return;
    if (!token()) {
      slot.innerHTML = '<p class="muted small">Faça login para ver recompensas resgatadas.</p>';
      return;
    }
    api("/resgates")
      .then(function (lista) {
        var ativos = (lista || []).filter(function (r) {
          return !r.usado;
        });
        if (!ativos.length) {
          slot.innerHTML =
            '<p class="muted small">Nenhuma recompensa resgatada. Vá em Brotos e resgate com seus pontos.</p>';
          return;
        }
        slot.innerHTML = ativos
          .map(function (r) {
            return (
              '<label class="check" style="display:flex;gap:8px;align-items:center;margin:8px 0">' +
              '<input type="checkbox" class="chk-recompensa" value="' +
              (r.recompensa_id || r.id) +
              '" checked /> ' +
              (r.emoji || "🎟️") +
              " " +
              (r.nome || r.recompensa_id) +
              "</label>"
            );
          })
          .join("") +
          '<p class="small muted">Marcadas serão enviadas no pedido.</p>';

        // expõe ids selecionados
        window.__recompensasSelecionadas = function () {
          return Array.prototype.slice
            .call(document.querySelectorAll(".chk-recompensa:checked"))
            .map(function (c) {
              return c.value;
            });
        };
      })
      .catch(function () {
        slot.innerHTML = '<p class="muted small">Não foi possível carregar recompensas.</p>';
      });
  }

  function aplicarDescontoCupomUI() {
    try {
      if (typeof window.renderCarrinho === "function") window.renderCarrinho();
    } catch (_) {}
    // anota no resumo visualmente
    var resumo = document.getElementById("resumo");
    if (!resumo) return;
    if (resumo.querySelector(".linha-cupom-broto")) return;
    var cupom = "";
    try {
      cupom = localStorage.getItem("rf_cupom") || "";
    } catch (_) {}
    if (cupom !== "BROTO10") return;
    var div = document.createElement("div");
    div.className = "linha-cupom-broto small";
    div.style.marginTop = "8px";
    div.style.color = "#1F3626";
    div.innerHTML = "<strong>Cupom BROTO10</strong> · 10% no subtotal";
    resumo.appendChild(div);
  }

  // patch leve: se existir finalizar, anexa recompensasAplicadas e cupom
  function patchFinalizar() {
    var btn = document.getElementById("btnFinalizar");
    if (!btn || btn.__brotosPatch) return;
    btn.__brotosPatch = true;
    btn.addEventListener(
      "click",
      function () {
        try {
          window.__pedidoExtra = window.__pedidoExtra || {};
          window.__pedidoExtra.recompensasAplicadas =
            typeof window.__recompensasSelecionadas === "function"
              ? window.__recompensasSelecionadas()
              : [];
          window.__pedidoExtra.cupom = localStorage.getItem("rf_cupom") || "";
        } catch (_) {}
      },
      true
    );
  }

  function boot() {
    carregarTudo();
    montarCupomCarrinho();
    patchFinalizar();
    aplicarDescontoCupomUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 800);
  setTimeout(boot, 2000);

  // quando navega para brotos/carrinho
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-secao],[data-ir]");
    if (!b) return;
    var s = b.getAttribute("data-secao") || b.getAttribute("data-ir");
    if (s === "brotos" || s === "carrinho") setTimeout(boot, 200);
  });
})();

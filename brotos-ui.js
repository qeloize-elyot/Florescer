/* UI: resgatar Brotos + cupom BROTO10 (10% no resumo) */
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

  function getCupom() {
    try {
      return (localStorage.getItem("rf_cupom") || "").toUpperCase();
    } catch (_) {
      return "";
    }
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
      box.innerHTML = '<p class="muted small">Nenhum resgate ainda.</p>';
      return;
    }
    box.innerHTML = ativos
      .map(function (r) {
        return (
          '<div class="small" style="padding:8px 0;border-bottom:1px solid rgba(31,54,38,.06)">' +
          (r.emoji || "🎟️") +
          " <strong>" +
          (r.nome || r.recompensa_id) +
          "</strong> — disponível no carrinho</div>"
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
      .catch(function () {});

    if (token()) {
      api("/resgates")
        .then(renderMeus)
        .catch(function () {});
    }
  }

  function parseMoney(txt) {
    if (!txt) return null;
    var m = String(txt).replace(/\s/g, "").match(/R\$\s*([\d.,]+)/i);
    if (!m) return null;
    var n = m[1].replace(/\./g, "").replace(",", ".");
    var v = Number(n);
    return isNaN(v) ? null : v;
  }

  function formatBRL(v) {
    return (
      "R$ " +
      Number(v)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }

  /** Injeta/atualiza linha de 10% no #resumo */
  function aplicarDescontoCupomUI() {
    var resumo = document.getElementById("resumo");
    if (!resumo) return;

    var cupom = getCupom();
    var old = resumo.querySelector(".linha-cupom-broto");
    if (old) old.remove();
    var oldTotal = resumo.querySelector(".linha-total-cupom");
    if (oldTotal) oldTotal.remove();

    if (cupom !== "BROTO10") return;

    // tenta achar subtotal no texto do resumo
    var text = resumo.innerText || resumo.textContent || "";
    var subtotal = null;
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      if (/subtotal/i.test(lines[i])) {
        subtotal = parseMoney(lines[i]);
        if (subtotal != null) break;
      }
    }
    if (subtotal == null) {
      // fallback: maior valor R$ no bloco (geralmente total)
      var all = text.match(/R\$\s*[\d.,]+/g) || [];
      var vals = all.map(parseMoney).filter(function (v) {
        return v != null;
      });
      if (vals.length) subtotal = Math.max.apply(null, vals);
    }

    var desconto = subtotal != null ? +(subtotal * 0.1).toFixed(2) : null;

    var div = document.createElement("div");
    div.className = "linha-cupom-broto";
    div.style.cssText = "margin-top:10px;padding-top:10px;border-top:1px dashed rgba(31,54,38,.15);color:#1F3626";
    div.innerHTML =
      "<div><strong>Cupom BROTO10</strong> · 10% no subtotal</div>" +
      (desconto != null
        ? '<div class="small">Desconto: −' + formatBRL(desconto) + "</div>"
        : "");
    resumo.appendChild(div);

    if (subtotal != null && desconto != null) {
      // tenta atualizar linha de total se existir
      var totalEl = null;
      resumo.querySelectorAll("*").forEach(function (el) {
        if (el.children.length) return;
        if (/total/i.test(el.textContent || "") && /R\$/.test(el.textContent || "")) totalEl = el;
      });
      // também guarda valor global para checkout
      window.__cupomDesconto = { code: "BROTO10", tipo: "percentual", valor: 10, desconto: desconto };
    }
  }

  function montarCupomCarrinho() {
    var painel = document.getElementById("painelResumo");
    if (!painel) return;

    if (!document.getElementById("campoCupomBox")) {
      var box = document.createElement("div");
      box.id = "campoCupomBox";
      box.className = "painel";
      box.style.marginTop = "12px";
      box.innerHTML =
        "<h3>Cupom</h3>" +
        '<p class="small muted" style="margin:0 0 8px">BROTO10 dá <strong>10% de desconto</strong> no subtotal — para qualquer conta.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<input type="text" class="campo" id="inputCupom" placeholder="Ex.: BROTO10" style="flex:1;min-width:140px" />' +
        '<button type="button" class="btn" id="btnAplicarCupom">Aplicar</button></div>' +
        '<p class="small" id="cupomMsg" style="margin-top:8px"></p>';

      if (painel.parentElement) painel.parentElement.insertBefore(box, painel);

      try {
        var hint = localStorage.getItem("rf_cupom_hint") || localStorage.getItem("rf_cupom") || "";
        if (hint) document.getElementById("inputCupom").value = hint;
      } catch (_) {}

      document.getElementById("btnAplicarCupom").addEventListener("click", function () {
        var code = (document.getElementById("inputCupom").value || "").trim().toUpperCase();
        var msg = document.getElementById("cupomMsg");
        if (code === "BROTO10") {
          try {
            localStorage.setItem("rf_cupom", "BROTO10");
            localStorage.setItem("rf_cupom_hint", "BROTO10");
          } catch (_) {}
          msg.style.color = "#1F3626";
          msg.textContent = "Cupom aplicado: 10% no subtotal.";
          toast("Cupom BROTO10 aplicado");
          setTimeout(aplicarDescontoCupomUI, 50);
          setTimeout(aplicarDescontoCupomUI, 400);
          try {
            if (typeof window.renderCarrinho === "function") window.renderCarrinho();
          } catch (_) {}
          setTimeout(aplicarDescontoCupomUI, 200);
        } else if (!code) {
          msg.textContent = "Digite um cupom.";
        } else {
          try {
            localStorage.removeItem("rf_cupom");
          } catch (_) {}
          msg.style.color = "#a33";
          msg.textContent = "Cupom inválido.";
          aplicarDescontoCupomUI();
        }
      });
    }

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
            '<p class="muted small">Nenhuma recompensa resgatada. Resgate na área Brotos.</p>';
          return;
        }
        slot.innerHTML =
          ativos
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
          '<p class="small muted">Marcadas entram no pedido.</p>';
        window.__recompensasSelecionadas = function () {
          return Array.prototype.slice
            .call(document.querySelectorAll(".chk-recompensa:checked"))
            .map(function (c) {
              return c.value;
            });
        };
      })
      .catch(function () {});
  }

  // observa mudanças no resumo para reaplicar desconto
  function observeResumo() {
    var resumo = document.getElementById("resumo");
    if (!resumo || resumo.__cupomObs) return;
    resumo.__cupomObs = true;
    var t = null;
    var mo = new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(aplicarDescontoCupomUI, 80);
    });
    mo.observe(resumo, { childList: true, subtree: true, characterData: true });
  }

  function boot() {
    carregarTudo();
    montarCupomCarrinho();
    observeResumo();
    aplicarDescontoCupomUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 800);
  setTimeout(boot, 2000);

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-secao],[data-ir]");
    if (!b) return;
    var s = b.getAttribute("data-secao") || b.getAttribute("data-ir");
    if (s === "brotos" || s === "carrinho") setTimeout(boot, 200);
  });
})();

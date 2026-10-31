/**
 * Florescer — celebração de brotos e level-up
 * Uso: Florescer.celebrate({ type: 'sprout'|'bloom', amount, title, subtitle })
 */
(function () {
  "use strict";

  function ensureOverlay() {
    var el = document.getElementById("fl-overlay");
    if (el) return el;
    el = document.createElement("div");
    el.id = "fl-overlay";
    el.className = "fl-overlay";
    el.innerHTML =
      '<div class="fl-card">' +
      '<div class="fl-petals" id="fl-petals"></div>' +
      '<div class="fl-ico" id="fl-ico">🌱</div>' +
      "<h3 id=\"fl-title\"></h3>" +
      '<p id="fl-sub"></p>' +
      '<div class="fl-amount" id="fl-amount" hidden></div>' +
      '<button type="button" class="fl-btn-fechar" id="fl-fechar">Continuar</button>' +
      "</div>";
    document.body.appendChild(el);
    document.getElementById("fl-fechar").onclick = function () {
      hide();
    };
    el.addEventListener("click", function (e) {
      if (e.target === el) hide();
    });
    return el;
  }

  function spawnPetals(n) {
    var box = document.getElementById("fl-petals");
    if (!box) return;
    box.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var p = document.createElement("span");
      p.className = "fl-petal";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 2.2 + Math.random() * 2 + "s";
      p.style.animationDelay = Math.random() * 0.8 + "s";
      p.style.width = 8 + Math.random() * 8 + "px";
      p.style.height = 10 + Math.random() * 10 + "px";
      box.appendChild(p);
    }
  }

  var hideTimer = null;

  function hide() {
    var el = document.getElementById("fl-overlay");
    if (!el) return;
    el.classList.remove("fl-visivel");
    if (hideTimer) clearTimeout(hideTimer);
  }

  function celebrate(opts) {
    opts = opts || {};
    var type = opts.type === "bloom" ? "bloom" : "sprout";
    var el = ensureOverlay();
    el.classList.toggle("fl-bloom", type === "bloom");
    document.getElementById("fl-ico").textContent = type === "bloom" ? "🌸" : "🌱";
    document.getElementById("fl-title").textContent = opts.title || (type === "bloom" ? "Novo nível!" : "Novos brotos!");
    document.getElementById("fl-sub").textContent = opts.subtitle || "";
    var amt = document.getElementById("fl-amount");
    if (opts.amount != null && opts.amount !== "") {
      amt.hidden = false;
      amt.textContent = "+" + opts.amount + " Brotos";
    } else {
      amt.hidden = true;
    }
    spawnPetals(type === "bloom" ? 28 : 16);
    el.classList.add("fl-visivel");
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, opts.duration || (type === "bloom" ? 7000 : 4500));
  }

  window.Florescer = window.Florescer || {};
  window.Florescer.celebrate = celebrate;
  window.Florescer.hideCelebrate = hide;

  /** Hook: após POST /api/pedidos com sucesso */
  function hookPedidos() {
    if (window.__flPedidosHook) return;
    window.__flPedidosHook = true;
    var orig = window.fetch;
    if (typeof orig !== "function") return;

    window.fetch = function (input, init) {
      var url = String(typeof input === "string" ? input : (input && input.url) || "");
      var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      var isPedido = method === "POST" && /\/api\/pedidos\/?$/.test(url.split("?")[0]);

      return orig.apply(this, arguments).then(function (res) {
        if (!isPedido || !res.ok) return res;
        var clone = res.clone();
        clone
          .json()
          .then(function (data) {
            try {
              var ganhos =
                (data.pedido && data.pedido.brotosGanhos) ||
                data.brotosGanhos ||
                (typeof data.brotos === "number" && data.pedido ? Math.floor(data.pedido.total || 0) : null) ||
                (data.pedido && Math.floor(Number(data.pedido.total) || 0)) ||
                0;
              ganhos = Number(ganhos) || 0;

              var totalDepois =
                (data.usuario && data.usuario.brotos) ||
                data.brotos ||
                ganhos;
              totalDepois = Number(totalDepois) || ganhos;
              var totalAntes = Math.max(0, totalDepois - ganhos);

              var nivelFn = window.nivelDe || function (n) {
                return { nivel: 1, nome: "Semente" };
              };
              var antes = nivelFn(totalAntes);
              var depois = nivelFn(totalDepois);

              if (ganhos > 0) {
                celebrate({
                  type: "sprout",
                  amount: ganhos,
                  title: "Novos brotos!",
                  subtitle: "Obrigada por cultivar com a gente."
                });
              }

              if (depois && antes && depois.nivel > antes.nivel) {
                setTimeout(function () {
                  celebrate({
                    type: "bloom",
                    amount: ganhos,
                    title: "Você chegou a " + depois.nome + "!",
                    subtitle: "Nível " + depois.nivel + " desbloqueado"
                  });
                }, 5500);
              }
            } catch (e) {
              console.warn("[Florescer] celebração:", e);
            }
          })
          .catch(function () {});
        return res;
      });
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookPedidos);
  } else {
    hookPedidos();
  }
})();

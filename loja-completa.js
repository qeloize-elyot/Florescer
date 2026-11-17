/* Florescer · loja completa — sem WhatsApp, sem emojis */
(function () {
  "use strict";

  // fotos estáveis, enquadramento central
  var KIT_IMGS = {
    iniciante:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&h=600&q=80",
    pet:
      "https://images.unsplash.com/photo-1459411552884-841db9b3cb2a?auto=format&fit=crop&w=900&h=600&q=80",
    presente:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&h=600&q=80"
  };

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function removerWhatsapp() {
    document.querySelectorAll(".wa-float, .btn-wa-mini").forEach(function (el) {
      el.remove();
    });
  }

  function montarTrust(inicio) {
    if (!inicio || inicio.querySelector(".trust-strip")) return;
    var el = document.createElement("div");
    el.className = "trust-strip";
    el.innerHTML =
      '<div class="t"><strong>Site seguro</strong>Dados protegidos na sua conta</div>' +
      '<div class="t"><strong>Frete transparente</strong>Calcule por CEP antes de pagar</div>' +
      '<div class="t"><strong>Troca e reembolso</strong>Pedidos com opção de cancelar</div>' +
      '<div class="t"><strong>Assistente Flora</strong>Dúvidas de cultivo no chat</div>';
    var promos = inicio.querySelector(".promo-grid");
    if (promos) promos.insertAdjacentElement("afterend", el);
    else inicio.appendChild(el);
  }

  function montarFreteMeta(inicio) {
    if (!inicio || inicio.querySelector(".frete-meta")) return;
    var el = document.createElement("div");
    el.className = "frete-meta";
    el.innerHTML =
      "<strong>Frete no checkout</strong> — informe o CEP no carrinho e veja o valor antes de confirmar.";
    var trust = inicio.querySelector(".trust-strip");
    if (trust) trust.insertAdjacentElement("afterend", el);
    else inicio.appendChild(el);
  }

  function montarMapaCats(inicio) {
    if (!inicio || inicio.querySelector(".mapa-cats")) return;
    var wrap = document.createElement("div");
    wrap.className = "mapa-cats";
    wrap.innerHTML = "<h2>Mapa de categorias</h2><div class=\"mapa-grid\"></div>";
    var grid = wrap.querySelector(".mapa-grid");
    var items = [
      { t: "Folhagens", q: "Folhagem" },
      { t: "Flores", q: "Flor" },
      { t: "Suculentas", q: "Suculenta" },
      { t: "Árvores", q: "Árvore" },
      { t: "Comestíveis", q: "Comest" },
      { t: "Pet friendly", q: "pet" },
      { t: "Iniciantes", q: "facil" },
      { t: "Cursos", q: "cursos" }
    ];
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mapa-item";
      b.textContent = it.t;
      b.addEventListener("click", function () {
        if (it.q === "cursos") {
          if (typeof window.irPara === "function") window.irPara("cursos");
          return;
        }
        if (typeof window.irPara === "function") window.irPara("catalogo");
        setTimeout(function () {
          var busca = document.getElementById("busca");
          var filtroCat = document.getElementById("filtroCategoria");
          var filtroPet = document.getElementById("filtroPet");
          if (it.q === "pet") {
            if (filtroPet) {
              filtroPet.checked = true;
              filtroPet.dispatchEvent(new Event("change", { bubbles: true }));
            }
          } else if (it.q === "facil") {
            if (busca) {
              busca.value = "fácil";
              busca.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else if (filtroCat) {
            var opts = Array.prototype.slice.call(filtroCat.options || []);
            var hit = opts.find(function (o) {
              return (o.value || o.textContent || "")
                .toLowerCase()
                .indexOf(it.q.toLowerCase()) !== -1;
            });
            if (hit) filtroCat.value = hit.value;
            else if (busca) busca.value = it.q;
            filtroCat.dispatchEvent(new Event("change", { bubbles: true }));
            if (busca) busca.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 150);
      });
      grid.appendChild(b);
    });
    var frete = inicio.querySelector(".frete-meta");
    if (frete) frete.insertAdjacentElement("afterend", wrap);
    else inicio.appendChild(wrap);
  }

  function montarKits(inicio) {
    if (!inicio) return;
    var old = inicio.querySelector(".kits-sec");
    if (old) old.remove();

    var sec = document.createElement("div");
    sec.className = "kits-sec";
    sec.innerHTML =
      "<h2>Kits prontos</h2>" +
      '<p class="sub">Combos simples para começar — abra o catálogo e monte o seu.</p>' +
      '<div class="kits-grid">' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.iniciante +
      '" alt="Kit iniciante" loading="lazy" />' +
      '<div class="kit-caption"><strong>Kit Iniciante</strong><span>Plantas que perdoam rega irregular</span></div></div>' +
      '<div class="kit-body"><ul><li>Espada-de-são-jorge</li><li>Suculenta fácil</li><li>Guia de rega</li></ul>' +
      '<button type="button" data-kit="iniciante">Ver no catálogo</button></div></article>' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.pet +
      '" alt="Kit pet friendly" loading="lazy" />' +
      '<div class="kit-caption"><strong>Kit Pet Friendly</strong><span>Seguras para casas com animais</span></div></div>' +
      '<div class="kit-body"><ul><li>Filtro pet friendly</li><li>Espécies indicadas</li><li>Dicas da Flora</li></ul>' +
      '<button type="button" data-kit="pet">Ver pet friendly</button></div></article>' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.presente +
      '" alt="Kit presente" loading="lazy" />' +
      '<div class="kit-caption"><strong>Kit Presente</strong><span>Embalagem e cartão no checkout</span></div></div>' +
      '<div class="kit-body"><ul><li>Escolha a planta</li><li>Marque como presente</li><li>Mensagem no cartão</li></ul>' +
      '<button type="button" data-kit="presente">Montar presente</button></div></article>' +
      "</div>";

    sec.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kit]");
      if (!b) return;
      var k = b.getAttribute("data-kit");
      if (k === "presente") {
        if (typeof window.irPara === "function") window.irPara("catalogo");
        toast && toast("Escolha a planta e marque presente no carrinho");
        return;
      }
      if (typeof window.irPara === "function") window.irPara("catalogo");
      setTimeout(function () {
        var filtroPet = document.getElementById("filtroPet");
        var busca = document.getElementById("busca");
        if (k === "pet" && filtroPet) {
          filtroPet.checked = true;
          filtroPet.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (k === "iniciante" && busca) {
          busca.value = "fácil";
          busca.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 150);
    });

    var mapa = inicio.querySelector(".mapa-cats");
    if (mapa) mapa.insertAdjacentElement("afterend", sec);
    else inicio.appendChild(sec);
  }

  function montarAjuda(inicio) {
    if (!inicio || inicio.querySelector(".ajuda-bloco")) return;
    var el = document.createElement("div");
    el.className = "ajuda-bloco";
    el.innerHTML =
      "<h3>Precisa de ajuda?</h3>" +
      "<p>Dúvidas de cultivo: use a assistente Flora (bolinha no canto). Cupom de primeira compra: <strong>BROTO10</strong>.</p>";
    var news = inicio.querySelector(".bloco-newsletter");
    if (news) news.insertAdjacentElement("beforebegin", el);
    else inicio.appendChild(el);
  }

  function boot() {
    removerWhatsapp();
    var inicio = document.getElementById("sec-inicio");
    if (inicio) {
      montarTrust(inicio);
      montarFreteMeta(inicio);
      montarMapaCats(inicio);
      montarKits(inicio);
      montarAjuda(inicio);
    }
    removerWhatsapp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setTimeout(boot, 900);
  setTimeout(boot, 2200);
  setTimeout(removerWhatsapp, 1500);
  setTimeout(removerWhatsapp, 3500);
})();

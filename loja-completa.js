/* Catálogo: mapa, kits e favoritas — home fica limpa */
(function () {
  "use strict";

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

  function removerLixo() {
    document.querySelectorAll(".wa-float, .btn-wa-mini").forEach(function (el) {
      el.remove();
    });
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    inicio
      .querySelectorAll(".mapa-cats, .kits-sec, .frete-meta, .trust-strip, .ajuda-bloco, .promo-grid, .cats-rapidas")
      .forEach(function (el) {
        el.remove();
      });
  }

  function montarMapaNoCatalogo() {
    var cat = document.getElementById("sec-catalogo");
    if (!cat || cat.querySelector(".mapa-cats")) return;
    var wrap = document.createElement("div");
    wrap.className = "mapa-cats";
    wrap.innerHTML = "<h2>Categorias</h2><div class=\"mapa-grid\"></div>";
    var grid = wrap.querySelector(".mapa-grid");
    var items = [
      { t: "Folhagens", q: "Folhagem" },
      { t: "Flores", q: "Flor" },
      { t: "Suculentas", q: "Suculenta" },
      { t: "Árvores", q: "Árvore" },
      { t: "Comestíveis", q: "Comest" },
      { t: "Pet friendly", q: "pet" },
      { t: "Iniciantes", q: "facil" }
    ];
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mapa-item";
      b.textContent = it.t;
      b.addEventListener("click", function () {
        var busca = document.getElementById("busca");
        var filtroCat = document.getElementById("filtroCategoria");
        var filtroPet = document.getElementById("filtroPet");
        if (it.q === "pet" && filtroPet) {
          filtroPet.checked = true;
          filtroPet.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (it.q === "facil" && busca) {
          busca.value = "fácil";
          busca.dispatchEvent(new Event("input", { bubbles: true }));
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
      });
      grid.appendChild(b);
    });
    var cab = cat.querySelector(".cabecalho-secao");
    if (cab) cab.insertAdjacentElement("afterend", wrap);
    else cat.prepend(wrap);
  }

  function montarKitsNoCatalogo() {
    var cat = document.getElementById("sec-catalogo");
    if (!cat) return;
    var old = cat.querySelector(".kits-sec");
    if (old) old.remove();

    var sec = document.createElement("div");
    sec.className = "kits-sec";
    sec.innerHTML =
      "<h2>Kits prontos</h2>" +
      '<p class="sub">Combos simples para começar.</p>' +
      '<div class="kits-grid">' +
      kitCard("iniciante", "Kit Iniciante", "Fáceis de cuidar", ["Espada-de-são-jorge", "Suculenta", "Guia de rega"]) +
      kitCard("pet", "Kit Pet Friendly", "Seguras para pets", ["Filtro pet friendly", "Espécies indicadas", "Dicas da Flora"]) +
      kitCard("presente", "Kit Presente", "Embalagem e cartão", ["Escolha a planta", "Marque como presente", "Mensagem no cartão"]) +
      "</div>";

    function kitCard(key, title, sub, lis) {
      return (
        '<article class="kit-card"><div class="kit-top">' +
        '<img src="' +
        KIT_IMGS[key] +
        '" alt="" loading="lazy" />' +
        '<div class="kit-caption"><strong>' +
        title +
        "</strong><span>" +
        sub +
        "</span></div></div>" +
        '<div class="kit-body"><ul>' +
        lis.map(function (x) {
          return "<li>" + x + "</li>";
        }).join("") +
        '</ul><button type="button" data-kit="' +
        key +
        '">Ver no catálogo</button></div></article>'
      );
    }

    sec.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kit]");
      if (!b) return;
      var k = b.getAttribute("data-kit");
      if (k === "presente") {
        toast && toast("Escolha a planta e marque presente no carrinho");
        return;
      }
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
    });

    var mapa = cat.querySelector(".mapa-cats");
    if (mapa) mapa.insertAdjacentElement("afterend", sec);
    else {
      var cab = cat.querySelector(".cabecalho-secao");
      if (cab) cab.insertAdjacentElement("afterend", sec);
      else cat.prepend(sec);
    }
  }

  function moverFavoritasParaCatalogo() {
    var cat = document.getElementById("sec-catalogo");
    var destaques = document.getElementById("destaques");
    if (!cat || !destaques || cat.querySelector(".bloco-favoritas-cat")) return;

    var bloco = document.createElement("div");
    bloco.className = "bloco-favoritas-cat";
    bloco.innerHTML =
      "<h2>Favoritas da estação</h2>" +
      "<p>Seleção para começar bem.</p>";
    // mostra a grade original
    destaques.style.display = "";
    bloco.appendChild(destaques);

    var kits = cat.querySelector(".kits-sec");
    if (kits) kits.insertAdjacentElement("afterend", bloco);
    else {
      var filtros = cat.querySelector(".filtros");
      if (filtros) filtros.insertAdjacentElement("beforebegin", bloco);
      else cat.appendChild(bloco);
    }
  }

  function boot() {
    removerLixo();
    montarMapaNoCatalogo();
    montarKitsNoCatalogo();
    moverFavoritasParaCatalogo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
})();

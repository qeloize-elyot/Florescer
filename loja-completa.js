/* Kits e categorias SÓ no catálogo — não mexe nas plantas (#grade) */
(function () {
  "use strict";

  var KIT_IMGS = {
    iniciante:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&h=600&q=80",
    pet:
      "https://images.unsplash.com/photo-1459411552884-841db9b3cb2a?auto=format&fit=crop&w=900&h=600&q=80",
    presente:
      "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&h=600&q=80"
  };

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function garantirCatalogoVisivel() {
    var grade = document.getElementById("grade");
    if (grade) {
      grade.style.display = "";
      grade.style.visibility = "visible";
    }
    var vazio = document.getElementById("vazioCatalogo");
    // não força hide do vazio se realmente estiver vazio
  }

  function limparHomeExtras() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    inicio.querySelectorAll(".mapa-cats, .kits-sec, .frete-meta, .trust-strip, .ajuda-bloco, .promo-grid").forEach(function (el) {
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
    [
      { t: "Folhagens", q: "Folhagem" },
      { t: "Flores", q: "Flor" },
      { t: "Suculentas", q: "Suculenta" },
      { t: "Árvores", q: "Árvore" },
      { t: "Comestíveis", q: "Comest" },
      { t: "Pet friendly", q: "pet" },
      { t: "Iniciantes", q: "facil" }
    ].forEach(function (it) {
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
            return (o.value || o.textContent || "").toLowerCase().indexOf(it.q.toLowerCase()) !== -1;
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

    function card(key, title, sub, items) {
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
        items
          .map(function (x) {
            return "<li>" + x + "</li>";
          })
          .join("") +
        '</ul><button type="button" data-kit="' +
        key +
        '">Filtrar no catálogo</button></div></article>'
      );
    }

    var sec = document.createElement("div");
    sec.className = "kits-sec";
    sec.innerHTML =
      "<h2>Kits prontos</h2>" +
      '<p class="sub">Atalhos para filtrar o catálogo.</p>' +
      '<div class="kits-grid">' +
      card("iniciante", "Kit Iniciante", "Fáceis de cuidar", ["Espada-de-são-jorge", "Suculenta", "Guia de rega"]) +
      card("pet", "Kit Pet Friendly", "Seguras para pets", ["Filtro pet friendly", "Espécies indicadas"]) +
      card("presente", "Kit Presente", "Embalagem e cartão", ["Marque presente no carrinho"]) +
      "</div>";

    sec.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kit]");
      if (!b) return;
      var k = b.getAttribute("data-kit");
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
      if (k === "presente") toast && toast("Escolha uma planta e marque presente no carrinho");
    });

    var mapa = cat.querySelector(".mapa-cats");
    if (mapa) mapa.insertAdjacentElement("afterend", sec);
    else {
      var cab = cat.querySelector(".cabecalho-secao");
      if (cab) cab.insertAdjacentElement("afterend", sec);
      else cat.prepend(sec);
    }
  }

  function boot() {
    limparHomeExtras();
    garantirCatalogoVisivel();
    montarMapaNoCatalogo();
    montarKitsNoCatalogo();
    garantirCatalogoVisivel();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
})();

/* Aplica estrutura do protótipo na home (sem quebrar funções) */
(function () {
  "use strict";

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function topbar() {
    if (document.querySelector(".proto-topbar")) return;
    var bar = document.createElement("div");
    bar.className = "proto-topbar";
    bar.innerHTML =
      '<div class="inner">' +
      "<span>Novas espécies chegaram! Conheça as novidades do catálogo e ganhe Brotos em cada compra.</span>" +
      '<div style="display:flex;gap:14px;align-items:center">' +
      '<a href="#" data-go="catalogo">Ver novidades</a>' +
      '<button type="button" aria-label="Fechar" data-close>&times;</button>' +
      "</div></div>";
    document.body.insertBefore(bar, document.body.firstChild);
    bar.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) bar.remove();
      if (e.target.closest("[data-go=catalogo]") && typeof window.irPara === "function") {
        e.preventDefault();
        window.irPara("catalogo");
      }
    });
  }

  function logoSub() {
    var logo = document.querySelector(".logo .logo-text, .logo-text");
    if (!logo || logo.parentElement.querySelector(".logo-sub")) return;
    var sub = document.createElement("span");
    sub.className = "logo-sub";
    sub.textContent = "PLANTAS · CURSOS · BEM-ESTAR";
    logo.parentElement.appendChild(sub);
  }

  function heroProto() {
    var hero = document.querySelector("#sec-inicio .hero");
    if (!hero) return;
    hero.classList.add("proto-hero");

    var title = hero.querySelector("h1");
    if (title) {
      title.innerHTML = 'Um pouco de <em>natureza</em> transforma qualquer espaço.';
    }
    var p = hero.querySelector("p");
    if (p) {
      p.textContent =
        "Encontre plantas que combinam com sua casa e aprenda a cuidar delas com nosso guia honesto de luz e rega.";
    }

    // badge
    if (!hero.querySelector(".badge-proto")) {
      var badge = document.createElement("span");
      badge.className = "badge-proto";
      badge.textContent = "CULTIVE NO SEU RITMO";
      var block = hero.querySelector("div") || hero;
      if (title) title.parentElement.insertBefore(badge, title);
      else block.prepend(badge);
    }

    // CTAs
    var acoes = hero.querySelector(".hero-acoes");
    if (acoes) {
      acoes.innerHTML =
        '<button type="button" class="btn" data-ir="catalogo">Explorar plantas</button>' +
        '<button type="button" class="btn btn-ghost" data-quiz>Descobrir minha planta ideal</button>';
      acoes.addEventListener("click", function (e) {
        var q = e.target.closest("[data-quiz]");
        if (!q) return;
        var quiz = document.querySelector(".quiz-fofo");
        if (quiz) quiz.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function catsProto(inicio) {
    if (!inicio || inicio.querySelector(".proto-cats")) return;
    var row = document.createElement("div");
    row.className = "proto-cats";
    var items = [
      {
        t: "Plantas de interior",
        s: "Para sala e quarto",
        img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=200&h=200&q=80",
        q: "interior"
      },
      {
        t: "Meia-sombra",
        s: "Luz filtrada",
        img: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=200&h=200&q=80",
        q: "indireta"
      },
      {
        t: "Amigas dos pets",
        s: "Seguras em casa",
        img: "https://images.unsplash.com/photo-1459411552884-841db9b3cb2a?auto=format&fit=crop&w=200&h=200&q=80",
        q: "pet"
      },
      {
        t: "Fáceis de cuidar",
        s: "Baixa manutenção",
        img: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=200&h=200&q=80",
        q: "facil"
      }
    ];
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "proto-cat";
      b.innerHTML =
        '<img src="' + it.img + '" alt="" />' +
        '<span class="txt">' + it.t + "<small>" + it.s + "</small></span>";
      b.addEventListener("click", function () {
        if (typeof window.irPara === "function") window.irPara("catalogo");
        setTimeout(function () {
          var busca = document.getElementById("busca");
          var filtroPet = document.getElementById("filtroPet");
          var filtroLuz = document.getElementById("filtroLuz");
          if (it.q === "pet" && filtroPet) {
            filtroPet.checked = true;
            filtroPet.dispatchEvent(new Event("change", { bubbles: true }));
          } else if (it.q === "indireta" && filtroLuz) {
            filtroLuz.value = "indireta";
            filtroLuz.dispatchEvent(new Event("change", { bubbles: true }));
          } else if (busca) {
            busca.value = it.q === "facil" ? "fácil" : it.q;
            busca.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 180);
      });
      row.appendChild(b);
    });
    var hero = inicio.querySelector(".hero");
    if (hero) hero.insertAdjacentElement("afterend", row);
    else inicio.prepend(row);
  }

  function promo(inicio) {
    if (!inicio || inicio.querySelector(".proto-promo")) return;
    var el = document.createElement("div");
    el.className = "proto-promo";
    el.innerHTML =
      "<div>" +
      '<span class="tag">CAMPANHA</span>' +
      "<h2>Seu próximo cantinho verde começa aqui.</h2>" +
      "<p>Use o cupom BROTO10 na primeira compra.</p>" +
      '<button type="button" class="cta" data-cupom>Pegar cupom</button>' +
      "</div>";
    el.addEventListener("click", function (e) {
      if (!e.target.closest("[data-cupom]")) return;
      try {
        localStorage.setItem("rf_cupom_hint", "BROTO10");
      } catch (_) {}
      toast && toast("Cupom BROTO10 pronto no checkout");
      if (typeof window.irPara === "function") window.irPara("carrinho");
    });
    var cats = inicio.querySelector(".proto-cats");
    if (cats) cats.insertAdjacentElement("afterend", el);
    else inicio.appendChild(el);
  }

  function boot() {
    topbar();
    logoSub();
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    heroProto();
    catsProto(inicio);
    promo(inicio);
    // selos no final
    var selos = inicio.querySelector(".selos");
    if (selos) inicio.appendChild(selos);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 600);
  setTimeout(boot, 1600);
})();

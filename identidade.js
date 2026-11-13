/* Florescer · Sair no topo + seções calorosas (funções de loja completa) */
(function () {
  "use strict";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function toast(msg) {
    if (typeof window.toast === "function") return window.toast(msg);
    try {
      var t = document.getElementById("toasts");
      if (!t) return;
      var el = document.createElement("div");
      el.className = "toast";
      el.textContent = msg;
      t.appendChild(el);
      setTimeout(function () { el.remove(); }, 3200);
    } catch (_) {}
  }

  function token() {
    return localStorage.getItem("rf_token") || "";
  }

  function sairConta() {
    if (!confirm("Sair da sua conta?")) return;
    localStorage.removeItem("rf_token");
    try {
      if (typeof window.setToken === "function") window.setToken(null);
    } catch (_) {}
    // limpa estado em memória do app CDN se existir
    try {
      if (typeof window.usuario !== "undefined") window.usuario = null;
    } catch (_) {}
    atualizarSair();
    toast("Você saiu da conta.");
    setTimeout(function () {
      location.reload();
    }, 350);
  }

  function garantirBotaoSair() {
    var authBtn = document.getElementById("btnAuth");
    if (!authBtn) return;
    var wrap = authBtn.parentElement;
    if (!wrap) return;

    if (!wrap.classList.contains("auth-wrap") && wrap.classList.contains("acoes")) {
      // cria wrapper só em volta do auth
      var box = document.createElement("div");
      box.className = "auth-wrap";
      authBtn.parentNode.insertBefore(box, authBtn);
      box.appendChild(authBtn);
      wrap = box;
    } else if (!wrap.classList.contains("auth-wrap")) {
      wrap.classList.add("auth-wrap");
    }

    var sair = document.getElementById("btnSairTopo");
    if (!sair) {
      sair = document.createElement("button");
      sair.type = "button";
      sair.id = "btnSairTopo";
      sair.className = "btn-sair-topo";
      sair.textContent = "Sair";
      sair.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        sairConta();
      });
      wrap.appendChild(sair);
    }
    atualizarSair();
  }

  function atualizarSair() {
    var sair = document.getElementById("btnSairTopo");
    if (!sair) return;
    var logado = !!token();
    sair.style.display = logado ? "inline-flex" : "none";
  }

  function garantirFaixaCupom() {
    if (document.querySelector(".fx-bemvindo")) return;
    var header = document.querySelector("header.topo");
    if (!header) return;
    var bar = document.createElement("div");
    bar.className = "fx-bemvindo";
    bar.innerHTML =
      'Primeira compra no Florescer? Use o cupom <strong>BROTO10</strong> e ganhe carinho extra no pedido · Frete calculado no checkout';
    header.parentNode.insertBefore(bar, header);
  }

  function garantirCategorias() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio || inicio.querySelector(".cats-rapidas")) return;
    var hero = inicio.querySelector(".hero");
    if (!hero) return;

    var cats = document.createElement("div");
    cats.className = "cats-rapidas";
    cats.setAttribute("aria-label", "Categorias rápidas");
    var items = [
      { t: "Todas", v: "" },
      { t: "Folhagens", v: "Folhagem" },
      { t: "Flores", v: "Flor" },
      { t: "Suculentas", v: "Suculenta" },
      { t: "Para pets", v: "pet" },
      { t: "Iniciantes", v: "facil" }
    ];
    items.forEach(function (it, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cat-chip" + (idx === 0 ? " ativo" : "");
      b.textContent = it.t;
      b.addEventListener("click", function () {
        cats.querySelectorAll(".cat-chip").forEach(function (c) {
          c.classList.remove("ativo");
        });
        b.classList.add("ativo");
        if (typeof window.irPara === "function") window.irPara("catalogo");
        setTimeout(function () {
          var busca = document.getElementById("busca");
          var filtroCat = document.getElementById("filtroCategoria");
          var filtroPet = document.getElementById("filtroPet");
          if (it.v === "pet") {
            if (filtroPet) {
              filtroPet.checked = true;
              filtroPet.dispatchEvent(new Event("change", { bubbles: true }));
            }
          } else if (it.v === "facil") {
            if (busca) {
              busca.value = "fácil";
              busca.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else if (filtroCat) {
            // tenta casar option
            var opts = Array.prototype.slice.call(filtroCat.options || []);
            var hit = opts.find(function (o) {
              return (o.value || o.textContent || "").toLowerCase().indexOf(it.v.toLowerCase()) !== -1;
            });
            if (hit) filtroCat.value = hit.value;
            else if (busca) busca.value = it.v;
            filtroCat.dispatchEvent(new Event("change", { bubbles: true }));
            if (busca) busca.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 120);
      });
      cats.appendChild(b);
    });
    hero.insertAdjacentElement("afterend", cats);
  }

  function garantirConfiancaENews() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;

    if (!inicio.querySelector(".barra-confianca")) {
      var bar = document.createElement("div");
      bar.className = "barra-confianca";
      bar.innerHTML =
        '<div class="item"><strong>Guia de cuidados</strong>Luz, rega e pets em cada planta</div>' +
        '<div class="item"><strong>Cursos grátis</strong>Certificado nominal ao concluir</div>' +
        '<div class="item"><strong>Programa Brotos</strong>1 Broto por real em compras</div>' +
        '<div class="item"><strong>Presente pronto</strong>Cartão e embalagem especial</div>';
      var selos = inicio.querySelector(".selos");
      if (selos) selos.insertAdjacentElement("afterend", bar);
      else inicio.appendChild(bar);
    }

    if (!inicio.querySelector(".bloco-newsletter")) {
      var news = document.createElement("div");
      news.className = "bloco-newsletter";
      news.innerHTML =
        "<h3>Receba dicas de cultivo</h3>" +
        "<p>Novidades do catálogo, cuidados sazonais e cupons — sem spam.</p>" +
        '<form class="news-form" id="formNews">' +
        '<input type="email" required placeholder="seu@email.com" aria-label="E-mail" />' +
        "<button type="submit">Quero receber</button>" +
        "</form>";
      inicio.appendChild(news);
      var form = news.querySelector("#formNews");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var email = (form.querySelector("input") || {}).value || "";
          if (!email) return;
          try {
            localStorage.setItem("rf_newsletter", email.trim().toLowerCase());
          } catch (_) {}
          toast("Pronto! Você vai receber novidades no e-mail.");
          form.reset();
        });
      }
    }
  }

  function aquecerHero() {
    var h1 = document.querySelector("#sec-inicio .hero h1");
    var p = document.querySelector("#sec-inicio .hero p");
    if (h1 && !h1.dataset.warm) {
      h1.dataset.warm = "1";
      // mantém mensagem, só deixa mais humana se ainda estiver genérica
      if ((h1.textContent || "").length < 12) {
        h1.textContent = "Plantar é pra todo mundo — inclusive você";
      }
    }
    if (p && !p.dataset.warm) {
      p.dataset.warm = "1";
    }
  }

  function boot() {
    garantirFaixaCupom();
    garantirBotaoSair();
    garantirCategorias();
    garantirConfiancaENews();
    aquecerHero();

    // observa mudanças no botão Entrar (login/logout do app)
    var auth = document.getElementById("btnAuth");
    if (auth && !auth.__idObs) {
      auth.__idObs = true;
      new MutationObserver(function () {
        atualizarSair();
      }).observe(auth, { characterData: true, childList: true, subtree: true });
    }

    // re-checa periodicamente no início (app CDN carrega depois)
    var n = 0;
    var iv = setInterval(function () {
      n++;
      garantirBotaoSair();
      atualizarSair();
      if (n > 30) clearInterval(iv);
    }, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.FlorescerIdentidade = { sairConta: sairConta, atualizarSair: atualizarSair };
})();

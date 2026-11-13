/* Florescer · loja completa */
(function () {
  "use strict";

  var WA_NUM =
    (window.FLORESCER_WHATSAPP || localStorage.getItem("rf_whatsapp") || "").replace(/\D/g, "") ||
    "";

  var KIT_IMGS = {
    iniciante:
      "https://images.unsplash.com/photo-1459411552884-841db9b3cb2a?auto=format&fit=crop&w=800&h=500&q=80",
    pet:
      "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&h=500&q=80",
    presente:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&h=500&q=80"
  };

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function waLink(texto) {
    var msg = encodeURIComponent(texto || "Olá! Vim pelo Florescer e quero saber mais.");
    if (!WA_NUM) return null;
    return "https://wa.me/" + WA_NUM + "?text=" + msg;
  }

  function abrirWhats(texto) {
    var url = waLink(texto);
    if (!url) {
      toast(
        "Configure o WhatsApp: localStorage.setItem('rf_whatsapp','55SEUDDDNUMERO') e recarregue"
      );
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function garantirWaFloat() {
    if (document.querySelector(".wa-float")) return;
    var a = document.createElement("a");
    a.className = "wa-float";
    a.href = waLink("Olá! Preciso de ajuda com o Florescer.") || "#";
    a.target = "_blank";
    a.rel = "noopener";
    a.title = "Atendimento no WhatsApp";
    a.setAttribute("aria-label", "WhatsApp");
    a.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 2.1 17.4L1 23l5.8-1.5A11 11 0 1 0 20.5 3.5zm-8.6 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.4.9.9-3.3-.2-.3a9.1 9.1 0 1 1 7.6 4.2zm5-6.8c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3z"/></svg>';
    a.addEventListener("click", function (e) {
      if (!WA_NUM) {
        e.preventDefault();
        abrirWhats();
      }
    });
    document.body.appendChild(a);
  }

  function montarTrust(inicio) {
    if (!inicio || inicio.querySelector(".trust-strip")) return;
    var el = document.createElement("div");
    el.className = "trust-strip";
    el.innerHTML =
      '<div class="t"><strong>Site seguro</strong>Dados protegidos na sua conta</div>' +
      '<div class="t"><strong>Frete transparente</strong>Calcule por CEP antes de pagar</div>' +
      '<div class="t"><strong>Troca e reembolso</strong>Pedidos com opção de cancelar/reembolsar</div>' +
      '<div class="t"><strong>Atendimento</strong>WhatsApp + assistente Flora</div>';
    var promos = inicio.querySelector(".promo-grid");
    var selos = inicio.querySelector(".selos");
    if (promos) promos.insertAdjacentElement("afterend", el);
    else if (selos) selos.insertAdjacentElement("afterend", el);
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
      { e: "🌿", t: "Folhagens", q: "Folhagem" },
      { e: "🌺", t: "Flores", q: "Flor" },
      { e: "🌵", t: "Suculentas", q: "Suculenta" },
      { e: "🌳", t: "Árvores", q: "Árvore" },
      { e: "🥬", t: "Comestíveis", q: "Comest" },
      { e: "🐾", t: "Pet friendly", q: "pet" },
      { e: "✨", t: "Iniciantes", q: "facil" },
      { e: "🎓", t: "Cursos", q: "cursos" }
    ];
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mapa-item";
      b.innerHTML = "<span>" + it.e + "</span>" + it.t;
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
      '<p class="sub">Combos leves para começar — abra o catálogo e monte o seu.</p>' +
      '<div class="kits-grid">' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.iniciante +
      '" alt="" loading="lazy" />' +
      "<strong>Kit Iniciante</strong><p>Plantas que perdoam rega irregular</p></div>" +
      '<div class="kit-body"><ul><li>Espada-de-são-jorge</li><li>Suculenta fácil</li><li>Guia de rega</li></ul>' +
      '<button type="button" data-kit="iniciante">Ver no catálogo</button></div></article>' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.pet +
      '" alt="" loading="lazy" />' +
      "<strong>Kit Pet Friendly</strong><p>Seguras para casas com animais</p></div>" +
      '<div class="kit-body"><ul><li>Filtro pet friendly</li><li>Espécies indicadas</li><li>Dicas da Flora</li></ul>' +
      '<button type="button" data-kit="pet">Ver pet friendly</button></div></article>' +
      '<article class="kit-card"><div class="kit-top">' +
      '<img src="' +
      KIT_IMGS.presente +
      '" alt="" loading="lazy" />' +
      "<strong>Kit Presente</strong><p>Embalagem + cartão no checkout</p></div>" +
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
      "<h3>Atendimento</h3>" +
      "<p>Dúvidas de cultivo, pedido ou frete — WhatsApp ou a Flora (bolinha no canto).</p>" +
      '<p><a href="#" id="ajudaWa">Abrir WhatsApp</a> · cupom: <strong>BROTO10</strong></p>';
    var news = inicio.querySelector(".bloco-newsletter");
    if (news) news.insertAdjacentElement("beforebegin", el);
    else inicio.appendChild(el);
    var link = el.querySelector("#ajudaWa");
    if (link)
      link.addEventListener("click", function (e) {
        e.preventDefault();
        abrirWhats("Olá! Preciso de atendimento no Florescer.");
      });
  }

  function injetarBotoesWhatsNosCards() {
    document.querySelectorAll(".grade .card, #grade .card, #destaques .card").forEach(function (card) {
      if (card.querySelector(".btn-wa-mini")) return;
      var nome =
        (card.querySelector("h3, .nome, strong") || {}).textContent ||
        "uma planta do catálogo";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-wa-mini";
      btn.textContent = "WhatsApp";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        abrirWhats("Olá! Quero saber sobre: " + nome.trim());
      });
      var acoes = card.querySelector(".acoes, .card-acoes, .btns") || card;
      acoes.appendChild(btn);
    });
  }

  function boot() {
    var inicio = document.getElementById("sec-inicio");
    garantirWaFloat();
    if (inicio) {
      montarTrust(inicio);
      montarFreteMeta(inicio);
      montarMapaCats(inicio);
      montarKits(inicio);
      montarAjuda(inicio);
    }
    injetarBotoesWhatsNosCards();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setTimeout(boot, 900);
  setTimeout(boot, 2200);
  setTimeout(injetarBotoesWhatsNosCards, 1500);
  setTimeout(injetarBotoesWhatsNosCards, 3500);

  ["grade", "destaques"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || el.__waObs) return;
    el.__waObs = true;
    new MutationObserver(function () {
      injetarBotoesWhatsNosCards();
    }).observe(el, { childList: true, subtree: true });
  });

  window.FlorescerLoja = {
    abrirWhats: abrirWhats,
    setWhatsapp: function (n) {
      localStorage.setItem("rf_whatsapp", String(n || "").replace(/\D/g, ""));
      location.reload();
    }
  };
})();

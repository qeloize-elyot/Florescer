/* Home + quiz fofo com SVGs de plantinhas */
(function () {
  "use strict";

  var passo = 0;
  var respostas = {};

  // SVGs fofos (inline)
  var SVG = {
    sombra:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#E8F0E4"/><path d="M32 14c-7 6-12 14-12 22a12 12 0 0024 0c0-8-5-16-12-22z" fill="#5A8F62"/><path d="M32 28v18" stroke="#3D6B45" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="18" r="5" fill="#C9CEB8" opacity=".7"/></svg>',
    indireta:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#F5EFE4"/><path d="M20 40c6-14 12-20 12-20s6 6 12 20c-4 8-20 8-24 0z" fill="#6B9B6E"/><path d="M32 28v16" stroke="#3F6F44" stroke-width="2.5" stroke-linecap="round"/><circle cx="48" cy="16" r="7" fill="#E8C97A"/><path d="M48 8v3M48 21v3M40 16h3M53 16h3" stroke="#E8C97A" stroke-width="2" stroke-linecap="round"/></svg>',
    sol:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#FBF3D9"/><circle cx="32" cy="22" r="10" fill="#F0C14A"/><path d="M32 6v4M32 34v4M16 22h4M44 22h4M20 12l3 3M41 33l3 3M20 32l3-3M41 11l3-3" stroke="#F0C14A" stroke-width="2.5" stroke-linecap="round"/><path d="M22 44c4-6 7-8 10-8s6 2 10 8c-3 6-17 6-20 0z" fill="#5F9A5A"/></svg>',
    pet:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#F3EBE3"/><ellipse cx="24" cy="22" rx="7" ry="9" fill="#C4A484"/><ellipse cx="40" cy="22" rx="7" ry="9" fill="#C4A484"/><ellipse cx="18" cy="34" rx="6" ry="7" fill="#C4A484"/><ellipse cx="46" cy="34" rx="6" ry="7" fill="#C4A484"/><circle cx="32" cy="38" r="12" fill="#D4B896"/><circle cx="28" cy="36" r="2" fill="#5A4030"/><circle cx="36" cy="36" r="2" fill="#5A4030"/><path d="M30 42c1.2 1.5 2.8 1.5 4 0" stroke="#5A4030" stroke-width="1.5" stroke-linecap="round"/></svg>',
    nopet:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#EAF3EA"/><path d="M32 12c-8 8-14 18-14 26a14 14 0 0028 0c0-8-6-18-14-26z" fill="#6BAE6F"/><path d="M32 30v20" stroke="#3F7A44" stroke-width="3" stroke-linecap="round"/><path d="M24 36c4-2 6-2 8 2M40 36c-4-2-6-2-8 2" stroke="#3F7A44" stroke-width="2" stroke-linecap="round"/></svg>',
    iniciante:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#EEF6EB"/><path d="M32 38V18" stroke="#5A8F5E" stroke-width="3" stroke-linecap="round"/><path d="M32 24c-8-6-14-4-16 2 4-1 10 0 14 6M32 24c8-6 14-4 16 2-4-1-10 0-14 6" fill="#7CB87A"/><circle cx="32" cy="44" r="10" fill="#D2B48C"/><path d="M26 44h12" stroke="#B8956A" stroke-width="2" stroke-linecap="round"/></svg>',
    medio:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#F0F5EC"/><path d="M32 46V22" stroke="#4F7F52" stroke-width="3" stroke-linecap="round"/><path d="M32 28c-10-8-16-5-18 3 6-2 12 0 16 8M32 28c10-8 16-5 18 3-6-2-12 0-16 8" fill="#6FAE72"/><path d="M32 36c-7-5-11-3-12 2 4-1 8 0 10 5M32 36c7-5 11-3 12 2-4-1-8 0-10 5" fill="#8BC48A"/></svg>',
    avancado:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#E8F2E6"/><path d="M32 50V20" stroke="#3F6B42" stroke-width="3" stroke-linecap="round"/><path d="M32 24c-12-10-18-6-20 4 8-3 14 0 18 10M32 24c12-10 18-6 20 4-8-3-14 0-18 10" fill="#5A9A5E"/><path d="M32 34c-8-6-12-4-13 3 5-2 9 0 11 7M32 34c8-6 12-4 13 3-5-2-9 0-11 7" fill="#7CB87A"/><circle cx="38" cy="16" r="4" fill="#E8A99A"/></svg>',
    mascote:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#E8F0E4"/><path d="M32 12c-9 8-14 18-14 26a14 14 0 0028 0c0-8-5-18-14-26z" fill="#5A9A5E"/><path d="M32 28v22" stroke="#3F6B42" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="18" r="6" fill="#E8A99A"/></svg>',
    decor1:
      '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 8c-12 12-20 26-20 38a20 20 0 0040 0c0-12-8-26-20-38z" fill="#A8C9A6"/><path d="M40 30v36" stroke="#6B8F68" stroke-width="4" stroke-linecap="round"/></svg>',
    decor2:
      '<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 6c-8 8-14 16-14 24a14 14 0 0028 0c0-8-6-16-14-24z" fill="#B7D0B4"/><path d="M30 22v26" stroke="#7A9A76" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  var PERGUNTAS = [
    {
      id: "luz",
      titulo: "Como é a luz no cantinho dela?",
      opcoes: [
        { v: "baixa", t: "Pouca luz", s: "Canto mais sombreado", svg: "sombra" },
        { v: "indireta", t: "Luz indireta", s: "Perto da janela", svg: "indireta" },
        { v: "sol", t: "Sol direto", s: "Bem ensolarado", svg: "sol" }
      ]
    },
    {
      id: "pets",
      titulo: "Tem pets em casa?",
      opcoes: [
        { v: "sim", t: "Sim", s: "Precisa ser segura", svg: "pet" },
        { v: "nao", t: "Não", s: "Sem restrição", svg: "nopet" }
      ]
    },
    {
      id: "experiencia",
      titulo: "Como é sua mão pra planta?",
      opcoes: [
        { v: "iniciante", t: "Iniciante", s: "Quero algo fácil", svg: "iniciante" },
        { v: "medio", t: "Já cuido", s: "Tenho alguma prática", svg: "medio" },
        { v: "avancado", t: "Experiente", s: "Aceito desafio", svg: "avancado" }
      ]
    }
  ];

  var FOTO_BANNER =
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1800&h=900&q=85";

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function addCarrinho(id) {
    if (typeof window.addCarrinho === "function") {
      window.addCarrinho(id);
      return true;
    }
    return false;
  }

  function limparHome() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    inicio
      .querySelectorAll(
        ".promo-grid, .mapa-cats, .kits-sec, .frete-meta, .trust-strip, .ajuda-bloco, .cats-rapidas, #quizPlantas, .quiz-card-home"
      )
      .forEach(function (el) {
        el.remove();
      });
    var grade = document.getElementById("grade");
    if (grade) grade.style.display = "";
  }

  function montarBanners(inicio) {
    if (!inicio.querySelector(".home-destaque")) {
      var banner = document.createElement("div");
      banner.className = "home-destaque";
      banner.innerHTML =
        '<img src="' +
        FOTO_BANNER +
        '" alt="" />' +
        '<div class="veil"></div>' +
        '<div class="content">' +
        '<span class="tag">Primeira compra</span>' +
        "<h2>Um mimo para começar seu jardim</h2>" +
        "<p>Cupom BROTO10 na sua primeira compra.</p>" +
        '<button type="button" class="cta" data-go="cupom">Usar cupom</button></div>';
      var hero = inicio.querySelector(".hero");
      if (hero) hero.insertAdjacentElement("afterend", banner);
      else inicio.prepend(banner);
    }
    if (!inicio.querySelector(".home-cursos")) {
      var cursos = document.createElement("div");
      cursos.className = "home-cursos";
      cursos.innerHTML =
        "<div><h2>Aprenda. Cultive. Floresça.</h2><p>Cursos gratuitos com certificado.</p></div>" +
        '<button type="button" data-go="cursos">Ver cursos</button>';
      var after = inicio.querySelector(".home-destaque");
      if (after) after.insertAdjacentElement("afterend", cursos);
    }
    inicio.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (!b) return;
      if (b.getAttribute("data-go") === "cupom") {
        try {
          localStorage.setItem("rf_cupom_hint", "BROTO10");
        } catch (_) {}
        toast && toast("Cupom BROTO10 pronto no checkout");
        if (typeof window.irPara === "function") window.irPara("carrinho");
      }
      if (b.getAttribute("data-go") === "cursos" && typeof window.irPara === "function") {
        window.irPara("cursos");
      }
    });
    var selos = inicio.querySelector(".selos");
    if (selos) inicio.appendChild(selos);
  }

  function scorePlanta(p, r) {
    var s = 0;
    var luz = (p.luz || "").toLowerCase();
    var dif = (p.dificuldade || "").toLowerCase();
    if (r.luz === "baixa" && (luz.indexOf("sombra") !== -1 || luz.indexOf("meia") !== -1)) s += 3;
    if (r.luz === "indireta" && luz.indexOf("indiret") !== -1) s += 3;
    if (r.luz === "sol" && luz.indexOf("sol") !== -1) s += 3;
    if (r.pets === "sim") s += p.petFriendly ? 4 : -5;
    if (r.experiencia === "iniciante" && (dif.indexOf("fácil") !== -1 || dif.indexOf("facil") !== -1))
      s += 3;
    return s;
  }

  function pegarCatalogo() {
    return fetch("/api/plantas")
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return [];
      });
  }

  function renderQuiz(root) {
    var body = root.querySelector(".quiz-body");
    var steps = root.querySelectorAll(".quiz-steps span");
    steps.forEach(function (s, i) {
      s.classList.toggle("on", i < passo || (passo >= PERGUNTAS.length && i < steps.length));
    });
    if (!body) return;

    if (passo >= PERGUNTAS.length) {
      body.innerHTML = '<p class="q-title">Suas plantinhas...</p>';
      pegarCatalogo().then(function (lista) {
        var ranked = lista
          .map(function (p) {
            return { p: p, s: scorePlanta(p, respostas) };
          })
          .sort(function (a, b) {
            return b.s - a.s;
          })
          .slice(0, 3);
        if (!ranked.length)
          ranked = lista.slice(0, 3).map(function (p) {
            return { p: p, s: 1 };
          });

        var html = '<div class="resultados">';
        ranked.forEach(function (x) {
          var p = x.p;
          var id = p.id || p._id || "";
          html +=
            '<div class="res-item">' +
            (p.imagem
              ? '<img src="' + p.imagem + '" alt="" style="object-fit:cover;object-position:center" />'
              : "<div></div>") +
            "<div><strong>" +
            (p.nome || "Planta") +
            '</strong><span class="preco">R$ ' +
            Number(p.preco || 0).toFixed(2).replace(".", ",") +
            "</span></div>" +
            '<button type="button" data-add="' +
            id +
            '">Adicionar</button></div>';
        });
        html += '</div><button type="button" class="refazer" id="quizRestart">Refazer</button>';
        body.innerHTML = html;
        body.querySelectorAll("[data-add]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (addCarrinho(btn.getAttribute("data-add"))) toast && toast("Adicionado ao carrinho");
            else toast && toast("Não consegui adicionar agora");
          });
        });
        var re = body.querySelector("#quizRestart");
        if (re)
          re.onclick = function () {
            passo = 0;
            respostas = {};
            renderQuiz(root);
          };
      });
      return;
    }

    var q = PERGUNTAS[passo];
    var html = '<p class="q-title">' + q.titulo + '</p><div class="opts">';
    q.opcoes.forEach(function (o) {
      html +=
        '<button type="button" class="opt" data-v="' +
        o.v +
        '">' +
        (SVG[o.svg] || "") +
        '<span class="opt-label">' +
        o.t +
        '</span><span class="opt-sub">' +
        o.s +
        "</span></button>";
    });
    html += "</div>";
    body.innerHTML = html;
    body.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        respostas[q.id] = btn.getAttribute("data-v");
        body.querySelectorAll(".opt").forEach(function (b) {
          b.classList.remove("ativo");
        });
        btn.classList.add("ativo");
        setTimeout(function () {
          passo++;
          renderQuiz(root);
        }, 200);
      });
    });
  }

  function montarQuiz(inicio) {
    if (!inicio || inicio.querySelector(".quiz-fofo")) return;
    var card = document.createElement("section");
    card.className = "quiz-fofo";
    card.innerHTML =
      '<div class="decor d1">' +
      SVG.decor1 +
      "</div>" +
      '<div class="decor d2">' +
      SVG.decor2 +
      "</div>" +
      '<div class="quiz-fofo-head">' +
      '<div class="mascote">' +
      SVG.mascote +
      "</div>" +
      "<div><h2>Qual planta combina com você?</h2>" +
      "<p>Três perguntinhas e já pode adicionar ao carrinho.</p></div></div>" +
      '<div class="quiz-steps"><span></span><span></span><span></span></div>' +
      '<div class="quiz-body"></div>';
    var cursos = inicio.querySelector(".home-cursos");
    if (cursos) cursos.insertAdjacentElement("afterend", card);
    else inicio.appendChild(card);
    renderQuiz(card);
  }

  function boot() {
    limparHome();
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    montarBanners(inicio);
    montarQuiz(inicio);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 700);
  setTimeout(boot, 1800);
})();

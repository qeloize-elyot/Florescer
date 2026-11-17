/* Home visual + quiz no catálogo */
(function () {
  "use strict";

  var respostas = {};
  var passo = 0;

  var PERGUNTAS = [
    {
      id: "luz",
      titulo: "Como é a luz no lugar da planta?",
      opcoes: [
        { v: "baixa", t: "Pouca luz", s: "Canto ou corredor" },
        { v: "indireta", t: "Luz indireta", s: "Perto da janela" },
        { v: "sol", t: "Sol direto", s: "Varanda ensolarada" }
      ]
    },
    {
      id: "pets",
      titulo: "Tem pets em casa?",
      opcoes: [
        { v: "sim", t: "Sim", s: "Preciso de plantas seguras" },
        { v: "nao", t: "Não", s: "Sem restrição" }
      ]
    },
    {
      id: "experiencia",
      titulo: "Seu nível com plantas",
      opcoes: [
        { v: "iniciante", t: "Iniciante", s: "Algo que perdoe erros" },
        { v: "medio", t: "Intermediário", s: "Já cuido de algumas" },
        { v: "avancado", t: "Experiente", s: "Aceito exigentes" }
      ]
    }
  ];

  function toast(msg) {
    if (typeof window.toast === "function") window.toast(msg);
  }

  function limparHome() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    inicio
      .querySelectorAll(
        ".promo-grid, .mapa-cats, .kits-sec, .frete-meta, .trust-strip, .ajuda-bloco, #quizPlantas, .cats-rapidas, .home-destaque, .home-cursos"
      )
      .forEach(function (el) {
        el.remove();
      });

    // Favoritas da estação saem da home e vão pro catálogo
    var destaques = document.getElementById("destaques");
    if (destaques) {
      var cab = destaques.previousElementSibling;
      if (cab && cab.classList && cab.classList.contains("cabecalho-secao")) {
        cab.style.display = "none";
      }
      destaques.style.display = "none";
    }
  }

  function montarHomeVisual(inicio) {
    if (!inicio || inicio.querySelector(".home-destaque")) return;

    var banner = document.createElement("div");
    banner.className = "home-destaque";
    banner.innerHTML =
      '<img src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1600&h=700&q=80" alt="" />' +
      '<div class="veil"></div>' +
      '<div class="content">' +
      '<span class="tag">Primeira compra</span>' +
      "<h2>Um mimo para começar seu jardim</h2>" +
      "<p>Cupom BROTO10 na sua primeira compra.</p>" +
      '<button type="button" class="cta" data-go="cupom">Usar cupom</button>' +
      "</div>";

    var cursos = document.createElement("div");
    cursos.className = "home-cursos";
    cursos.innerHTML =
      "<div><h2>Aprenda. Cultive. Floresça.</h2>" +
      "<p>Cursos gratuitos com certificado nominal.</p></div>" +
      '<button type="button" data-go="cursos">Ver cursos</button>';

    var hero = inicio.querySelector(".hero");
    if (hero) {
      hero.insertAdjacentElement("afterend", banner);
      banner.insertAdjacentElement("afterend", cursos);
    } else {
      inicio.prepend(banner);
    }

    // Selos (Brotos, cursos, presente, frete) ficam no final da home
    var selos = inicio.querySelector(".selos");
    if (selos) inicio.appendChild(selos);

    inicio.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (!b) return;
      var g = b.getAttribute("data-go");
      if (g === "cupom") {
        try {
          localStorage.setItem("rf_cupom_hint", "BROTO10");
        } catch (_) {}
        toast && toast("Cupom BROTO10 pronto no checkout");
        if (typeof window.irPara === "function") window.irPara("carrinho");
      }
      if (g === "cursos" && typeof window.irPara === "function") window.irPara("cursos");
    });
  }

  function scorePlanta(p, r) {
    var s = 0;
    var luz = (p.luz || "").toLowerCase();
    var dif = (p.dificuldade || "").toLowerCase();
    if (r.luz === "baixa" && (luz.indexOf("sombra") !== -1 || luz.indexOf("meia") !== -1)) s += 3;
    if (r.luz === "indireta" && luz.indexOf("indiret") !== -1) s += 3;
    if (r.luz === "sol" && luz.indexOf("sol") !== -1) s += 3;
    if (r.pets === "sim") s += p.petFriendly ? 4 : -5;
    if (r.experiencia === "iniciante" && (dif.indexOf("fácil") !== -1 || dif.indexOf("facil") !== -1)) s += 3;
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

  function renderPasso(root) {
    var box = root.querySelector(".quiz-inner");
    if (!box) return;
    var prog = root.querySelector(".quiz-progress > span");
    if (prog) prog.style.width = Math.round((passo / PERGUNTAS.length) * 100) + "%";

    if (passo >= PERGUNTAS.length) {
      box.innerHTML = '<p class="quiz-sub">Escolhendo...</p>';
      pegarCatalogo().then(function (lista) {
        var ranked = lista
          .map(function (p) {
            return { p: p, s: scorePlanta(p, respostas) };
          })
          .sort(function (a, b) {
            return b.s - a.s;
          })
          .slice(0, 3);
        if (!ranked.length) ranked = lista.slice(0, 3).map(function (p) {
          return { p: p, s: 1 };
        });
        var html = "<h3>Indicações para você</h3><div class=\"quiz-resultados\">";
        ranked.forEach(function (x) {
          var p = x.p;
          html +=
            '<article class="quiz-result-card">' +
            (p.imagem ? '<img src="' + p.imagem + '" alt="" loading="lazy" />' : "") +
            '<div class="body"><strong>' +
            (p.nome || "Planta") +
            '</strong><div class="preco">R$ ' +
            Number(p.preco || 0).toFixed(2).replace(".", ",") +
            "</div></div></article>";
        });
        html +=
          '</div><div class="quiz-actions">' +
          '<button type="button" class="ghost" id="quizRestart">Refazer</button></div>';
        box.innerHTML = html;
        if (prog) prog.style.width = "100%";
        var re = root.querySelector("#quizRestart");
        if (re)
          re.onclick = function () {
            passo = 0;
            respostas = {};
            renderPasso(root);
          };
      });
      return;
    }

    var q = PERGUNTAS[passo];
    var html = "<h3>" + q.titulo + '</h3><div class="quiz-opts">';
    q.opcoes.forEach(function (o) {
      html +=
        '<button type="button" class="quiz-opt" data-v="' +
        o.v +
        '">' +
        o.t +
        "<small>" +
        o.s +
        "</small></button>";
    });
    html += "</div>";
    box.innerHTML = html;
    box.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        respostas[q.id] = btn.getAttribute("data-v");
        passo++;
        setTimeout(function () {
          renderPasso(root);
        }, 180);
      });
    });
  }

  function montarQuizNoCatalogo() {
    var cat = document.getElementById("sec-catalogo");
    if (!cat || document.getElementById("quizPlantas")) return;
    var wrap = document.createElement("section");
    wrap.id = "quizPlantas";
    wrap.className = "quiz-box";
    wrap.innerHTML =
      "<h2>Qual planta combina com a sua casa?</h2>" +
      '<p class="quiz-sub">Três perguntas rápidas.</p>' +
      '<div class="quiz-progress"><span></span></div>' +
      '<div class="quiz-inner"></div>';
    var filtros = cat.querySelector(".filtros");
    if (filtros) filtros.insertAdjacentElement("beforebegin", wrap);
    else cat.appendChild(wrap);
    renderPasso(wrap);
  }

  function boot() {
    limparHome();
    var inicio = document.getElementById("sec-inicio");
    if (inicio) montarHomeVisual(inicio);
    montarQuizNoCatalogo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 700);
  setTimeout(boot, 1800);
})();

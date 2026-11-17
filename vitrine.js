/* Home visual + quiz card (não mexe no catálogo #grade) */
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
        { v: "sim", t: "Sim", s: "Plantas seguras" },
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

  // foto DIFERENTE do hero
  var FOTO_BANNER =
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&h=800&q=80";

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

  function limparSujosDaHome() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    inicio
      .querySelectorAll(
        ".promo-grid, .mapa-cats, .kits-sec, .frete-meta, .trust-strip, .ajuda-bloco, .cats-rapidas, #quizPlantas"
      )
      .forEach(function (el) {
        el.remove();
      });
    // NUNCA esconder #grade (catálogo)
    var grade = document.getElementById("grade");
    if (grade) grade.style.display = "";
    // Favoritas podem ficar na home
    var dest = document.getElementById("destaques");
    if (dest) dest.style.display = "";
    var cab = dest && dest.previousElementSibling;
    if (cab && cab.classList && cab.classList.contains("cabecalho-secao")) {
      cab.style.display = "";
    }
  }

  function montarHome(inicio) {
    if (!inicio) return;

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
        '<button type="button" class="cta" data-go="cupom">Usar cupom</button>' +
        "</div>";
      var hero = inicio.querySelector(".hero");
      if (hero) hero.insertAdjacentElement("afterend", banner);
      else inicio.prepend(banner);
    }

    if (!inicio.querySelector(".home-cursos")) {
      var cursos = document.createElement("div");
      cursos.className = "home-cursos";
      cursos.innerHTML =
        "<div><h2>Aprenda. Cultive. Floresça.</h2>" +
        "<p>Cursos gratuitos com certificado nominal.</p></div>" +
        '<button type="button" data-go="cursos">Ver cursos</button>';
      var after = inicio.querySelector(".home-destaque");
      if (after) after.insertAdjacentElement("afterend", cursos);
    }

    inicio.onclick = function (e) {
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
    };

    // selos no final
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

  function renderQuiz(root) {
    var box = root.querySelector(".quiz-inner");
    var prog = root.querySelector(".quiz-progress > span");
    if (prog) prog.style.width = Math.round((passo / PERGUNTAS.length) * 100) + "%";
    if (!box) return;

    if (passo >= PERGUNTAS.length) {
      box.innerHTML = '<p class="quiz-sub">Escolhendo plantas...</p>';
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

        var html = '<div class="quiz-mini-results">';
        ranked.forEach(function (x) {
          var p = x.p;
          var id = p.id || p._id || "";
          html +=
            '<div class="quiz-mini-item">' +
            (p.imagem ? '<img src="' + p.imagem + '" alt="" />' : "<div></div>") +
            "<div><strong>" +
            (p.nome || "Planta") +
            '</strong><span class="preco">R$ ' +
            Number(p.preco || 0).toFixed(2).replace(".", ",") +
            "</span></div>" +
            '<button type="button" data-add="' +
            id +
            '">Adicionar</button></div>';
        });
        html +=
          '</div><div class="quiz-actions"><button type="button" id="quizRestart">Refazer quiz</button></div>';
        box.innerHTML = html;
        if (prog) prog.style.width = "100%";

        box.querySelectorAll("[data-add]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-add");
            if (addCarrinho(id)) toast && toast("Adicionado ao carrinho");
            else toast && toast("Abra o catálogo para adicionar");
          });
        });
        var re = box.querySelector("#quizRestart");
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
    var html = "<h3 style=\"margin:0 0 10px;font-size:1rem;color:#1E2920\">" + q.titulo + "</h3><div class=\"quiz-opts\">";
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
          renderQuiz(root);
        }, 160);
      });
    });
  }

  function montarQuizHome(inicio) {
    if (!inicio || inicio.querySelector(".quiz-card-home")) return;
    var card = document.createElement("section");
    card.className = "quiz-card-home";
    card.innerHTML =
      "<h2>Qual planta combina com você?</h2>" +
      '<p class="quiz-sub">Três perguntas rápidas e já pode adicionar ao carrinho.</p>' +
      '<div class="quiz-progress"><span></span></div>' +
      '<div class="quiz-inner"></div>';
    var cursos = inicio.querySelector(".home-cursos");
    if (cursos) cursos.insertAdjacentElement("afterend", card);
    else inicio.appendChild(card);
    renderQuiz(card);
  }

  function boot() {
    limparSujosDaHome();
    var inicio = document.getElementById("sec-inicio");
    if (inicio) {
      montarHome(inicio);
      montarQuizHome(inicio);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 700);
  setTimeout(boot, 1800);
})();

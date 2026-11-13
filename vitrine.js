/* Florescer · painéis de promoção + quiz "planta para sua casa" */
(function () {
  "use strict";

  var respostas = {};
  var passo = 0;

  var PERGUNTAS = [
    {
      id: "luz",
      titulo: "Como é a luz no lugar onde a planta vai ficar?",
      opcoes: [
        { v: "baixa", t: "Pouca luz", s: "Canto, corredor, janela longe" },
        { v: "indireta", t: "Luz indireta", s: "Perto da janela, sem sol direto" },
        { v: "sol", t: "Sol direto", s: "Varanda ou janela ensolarada" }
      ]
    },
    {
      id: "ambiente",
      titulo: "Onde ela vai viver?",
      opcoes: [
        { v: "interno", t: "Dentro de casa", s: "Sala, quarto, escritório" },
        { v: "externo", t: "Área externa", s: "Varanda, quintal, peitoril" },
        { v: "misto", t: "Tanto faz", s: "Posso adaptar o lugar" }
      ]
    },
    {
      id: "pets",
      titulo: "Tem pets ou crianças pequenas em casa?",
      opcoes: [
        { v: "sim", t: "Sim", s: "Preciso de plantas seguras" },
        { v: "nao", t: "Não", s: "Sem restrição de toxicidade" }
      ]
    },
    {
      id: "experiencia",
      titulo: "Qual seu nível com plantas?",
      opcoes: [
        { v: "iniciante", t: "Iniciante", s: "Quero algo que perdoe erros" },
        { v: "medio", t: "Já cuido de algumas", s: "Posso acompanhar rega e luz" },
        { v: "avancado", t: "Experiente", s: "Aceito plantas exigentes" }
      ]
    },
    {
      id: "estilo",
      titulo: "O que você mais busca agora?",
      opcoes: [
        { v: "facil", t: "Fácil de cuidar", s: "Baixa manutenção" },
        { v: "decor", t: "Visual marcante", s: "Folhagem bonita pro ambiente" },
        { v: "util", t: "Útil na cozinha", s: "Temperos e comestíveis" }
      ]
    }
  ];

  function toast(msg) {
    if (typeof window.toast === "function") return window.toast(msg);
  }

  function irCatalogo() {
    if (typeof window.irPara === "function") window.irPara("catalogo");
  }

  function montarPromos(inicio) {
    if (!inicio || inicio.querySelector(".promo-grid")) return;
    var grid = document.createElement("div");
    grid.className = "promo-grid";
    grid.innerHTML =
      '<article class="promo-card grande">' +
      '<span class="tag">Primeira compra</span>' +
      "<h3>10% OFF com o cupom BROTO10</h3>" +
      "<p>Válido para quem está começando no Florescer. Aplique no checkout.</p>" +
      '<button type="button" class="promo-cta" data-promo="cupom">Quero o desconto</button>' +
      "</article>" +
      '<article class="promo-card peach">' +
      '<span class="tag">Frete</span>' +
      "<h3>Calcule antes de pagar</h3>" +
      "<p>CEP, peso e modalidade — sem surpresa no final.</p>" +
      '<button type="button" class="promo-cta" data-promo="frete">Ver carrinho</button>' +
      "</article>" +
      '<article class="promo-card verde">' +
      '<span class="tag">Quiz</span>' +
      "<h3>Planta certa pra sua casa</h3>" +
      "<p>Responda 5 perguntas e receba indicações.</p>" +
      '<button type="button" class="promo-cta" data-promo="quiz">Fazer o quiz</button>' +
      "</article>" +
      '<article class="promo-card bege" style="grid-column: 1 / -1">' +
      '<span class="tag">Cursos</span>' +
      "<h3>Aprenda a cuidar — grátis, com certificado</h3>" +
      "<p>Aulas no YouTube + certificado nominal ao concluir. Ganhe Brotos no caminho.</p>" +
      '<button type="button" class="promo-cta" data-promo="cursos">Ver cursos</button>' +
      "</article>";

    var hero = inicio.querySelector(".hero");
    var cats = inicio.querySelector(".cats-rapidas");
    var anchor = cats || hero;
    if (anchor) anchor.insertAdjacentElement("afterend", grid);
    else inicio.prepend(grid);

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-promo]");
      if (!btn) return;
      var a = btn.getAttribute("data-promo");
      if (a === "cupom") {
        try {
          localStorage.setItem("rf_cupom_hint", "BROTO10");
        } catch (_) {}
        toast && toast("Cupom BROTO10 — use no checkout");
        if (typeof window.irPara === "function") window.irPara("carrinho");
      } else if (a === "frete") {
        if (typeof window.irPara === "function") window.irPara("carrinho");
      } else if (a === "quiz") {
        var q = document.getElementById("quizPlantas");
        if (q) q.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (a === "cursos") {
        if (typeof window.irPara === "function") window.irPara("cursos");
      }
    });
  }

  function scorePlanta(p, r) {
    var s = 0;
    var luz = (p.luz || "").toLowerCase();
    var amb = (p.ambiente || "").toLowerCase();
    var dif = (p.dificuldade || "").toLowerCase();
    var cat = (p.categoria || "").toLowerCase();

    if (r.luz === "baixa") {
      if (luz.indexOf("sombra") !== -1 || luz.indexOf("meia") !== -1 || luz.indexOf("tolera") !== -1) s += 3;
      if (luz.indexOf("sol") !== -1 && luz.indexOf("indiret") === -1) s -= 2;
    } else if (r.luz === "indireta") {
      if (luz.indexOf("indiret") !== -1 || luz.indexOf("filtr") !== -1) s += 3;
      if (luz.indexOf("sombra") !== -1) s += 1;
    } else if (r.luz === "sol") {
      if (luz.indexOf("sol") !== -1 || amb.indexOf("sol") !== -1) s += 3;
    }

    if (r.ambiente === "interno") {
      if (amb.indexOf("interno") !== -1) s += 2;
    } else if (r.ambiente === "externo") {
      if (amb.indexOf("sol") !== -1 || amb.indexOf("extern") !== -1) s += 2;
    } else s += 1;

    if (r.pets === "sim") {
      if (p.petFriendly) s += 4;
      else s -= 5;
    }

    if (r.experiencia === "iniciante") {
      if (dif.indexOf("muito f") !== -1) s += 3;
      else if (dif.indexOf("fácil") !== -1 || dif.indexOf("facil") !== -1) s += 2;
      if (dif.indexOf("difícil") !== -1 || dif.indexOf("dificil") !== -1) s -= 3;
    } else if (r.experiencia === "medio") {
      if (dif.indexOf("médi") !== -1 || dif.indexOf("facil") !== -1 || dif.indexOf("fácil") !== -1) s += 2;
    } else {
      if (dif.indexOf("difícil") !== -1 || dif.indexOf("dificil") !== -1) s += 2;
      s += 1;
    }

    if (r.estilo === "facil") {
      if (dif.indexOf("fácil") !== -1 || dif.indexOf("facil") !== -1 || dif.indexOf("muito") !== -1) s += 2;
    } else if (r.estilo === "decor") {
      if (cat.indexOf("folh") !== -1 || cat.indexOf("árvore") !== -1 || cat.indexOf("arvore") !== -1) s += 2;
    } else if (r.estilo === "util") {
      if (cat.indexOf("comest") !== -1 || cat.indexOf("erva") !== -1) s += 4;
    }

    return s;
  }

  function motivo(p, r) {
    var bits = [];
    if (r.pets === "sim" && p.petFriendly) bits.push("segura para pets");
    if ((p.dificuldade || "").toLowerCase().indexOf("f") !== -1 && r.experiencia === "iniciante")
      bits.push("boa para iniciantes");
    if ((p.luz || "").toLowerCase().indexOf("indiret") !== -1 && r.luz === "indireta")
      bits.push("combina com luz indireta");
    if ((p.luz || "").toLowerCase().indexOf("sol") !== -1 && r.luz === "sol") bits.push("gosta de sol");
    if ((p.categoria || "").toLowerCase().indexOf("comest") !== -1) bits.push("útil na cozinha");
    if (!bits.length) bits.push("encaixa no perfil da sua casa");
    return bits.slice(0, 2).join(" · ");
  }

  function pegarCatalogo() {
    return fetch("/api/plantas")
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return [];
      })
      .then(function (arr) {
        if (arr && arr.length) return arr;
        // fallback via dados.js se existir no window depois do app
        return [];
      });
  }

  function renderPasso(root) {
    var box = root.querySelector(".quiz-inner");
    if (!box) return;
    var prog = root.querySelector(".quiz-progress > span");
    if (prog) prog.style.width = Math.round((passo / PERGUNTAS.length) * 100) + "%";

    if (passo >= PERGUNTAS.length) {
      box.innerHTML = "<p class=\"quiz-sub\">Calculando as melhores plantas...</p>";
      pegarCatalogo().then(function (lista) {
        if (!lista.length) {
          box.innerHTML =
            '<p class="quiz-sub">Não consegui ler o catálogo agora. Abra o Catálogo e filtre por luz e pets.</p>' +
            '<div class="quiz-actions"><button type="button" class="ghost" id="quizRestart">Refazer</button>' +
            '<button type="button" id="quizGoCat">Ir ao catálogo</button></div>';
          bindResultActions(root);
          return;
        }
        var ranked = lista
          .map(function (p) {
            return { p: p, s: scorePlanta(p, respostas) };
          })
          .filter(function (x) {
            return x.s > 0;
          })
          .sort(function (a, b) {
            return b.s - a.s;
          })
          .slice(0, 3);

        if (!ranked.length) ranked = lista.slice(0, 3).map(function (p) {
          return { p: p, s: 1 };
        });

        var html =
          "<h3>Suas indicações</h3>" +
          '<p class="quiz-sub">Baseado no que você respondeu — abra os detalhes ou adicione ao carrinho no catálogo.</p>' +
          '<div class="quiz-resultados">';
        ranked.forEach(function (x) {
          var p = x.p;
          var img = p.imagem || "";
          html +=
            '<article class="quiz-result-card">' +
            (img ? '<img src="' + img + '" alt="' + (p.nome || "") + '" loading="lazy" />' : "") +
            '<div class="body">' +
            "<strong>" +
            (p.nome || "Planta") +
            "</strong>" +
            '<div class="why">' +
            motivo(p, respostas) +
            "</div>" +
            '<div class="preco">R$ ' +
            Number(p.preco || 0).toFixed(2).replace(".", ",") +
            "</div>" +
            "</div></article>";
        });
        html +=
          "</div><div class=\"quiz-actions\">" +
          '<button type="button" class="ghost" id="quizRestart">Refazer quiz</button>' +
          '<button type="button" id="quizGoCat">Ver no catálogo</button>' +
          "</div>";
        box.innerHTML = html;
        if (prog) prog.style.width = "100%";
        bindResultActions(root);
      });
      return;
    }

    var q = PERGUNTAS[passo];
    var html = "<h3>" + q.titulo + "</h3><div class=\"quiz-opts\">";
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
        box.querySelectorAll(".quiz-opt").forEach(function (b) {
          b.classList.remove("ativo");
        });
        btn.classList.add("ativo");
        setTimeout(function () {
          passo++;
          renderPasso(root);
        }, 220);
      });
    });
  }

  function bindResultActions(root) {
    var re = root.querySelector("#quizRestart");
    if (re)
      re.onclick = function () {
        passo = 0;
        respostas = {};
        renderPasso(root);
      };
    var go = root.querySelector("#quizGoCat");
    if (go) go.onclick = irCatalogo;
  }

  function montarQuiz(inicio) {
    if (!inicio || document.getElementById("quizPlantas")) return;
    var wrap = document.createElement("section");
    wrap.id = "quizPlantas";
    wrap.className = "quiz-box";
    wrap.innerHTML =
      "<h2>Qual planta combina com a sua casa?</h2>" +
      '<p class="quiz-sub">Um quiz rápido — luz, ambiente, pets e seu ritmo de cuidado.</p>' +
      '<div class="quiz-progress"><span></span></div>' +
      '<div class="quiz-inner"></div>';
    var news = inicio.querySelector(".bloco-newsletter");
    var destaques = inicio.querySelector("#destaques");
    if (destaques && destaques.parentElement) {
      // depois dos destaques
      var cab = null;
      var prev = destaques.previousElementSibling;
      // insert after grade destaques
      destaques.insertAdjacentElement("afterend", wrap);
    } else if (news) news.insertAdjacentElement("beforebegin", wrap);
    else inicio.appendChild(wrap);
    renderPasso(wrap);
  }

  function boot() {
    var inicio = document.getElementById("sec-inicio");
    if (!inicio) return;
    montarPromos(inicio);
    montarQuiz(inicio);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // re-tenta se a home for remontada
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
})();

/* Florescer: fallback de catálogo via dados.js quando a API falha */
(function () {
  "use strict";

  function injectFallbackFetch() {
    var staticData = null;
    function ensureData() {
      if (staticData) return Promise.resolve(staticData);
      return fetch("/dados.js")
        .then(function (r) { return r.text(); })
        .then(function (code) {
          var fn = new Function(code + "\n; return { CATALOGO: CATALOGO, CURSOS: CURSOS, RECOMPENSAS: RECOMPENSAS, FAQ: FAQ };");
          staticData = fn();
          return staticData;
        });
    }

    function mapPlanta(p) {
      return {
        id: p.id, nome: p.nome, cientifico: p.cientifico, emoji: p.emoji,
        imagem: p.imagem || null, preco: p.preco, categoria: p.categoria,
        ambiente: p.ambiente, luz: p.luz, agua: p.agua, umidade: p.umidade,
        porte: p.porte, dificuldade: p.dificuldade,
        petFriendly: !!p.petFriendly, resumo: p.resumo, historia: p.historia
      };
    }

    function jsonRes(data, status) {
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    var orig = window.fetch;
    window.fetch = function (input, init) {
      var url = String(typeof input === "string" ? input : (input && input.url) || "");
      var need =
        url.indexOf("/api/plantas") !== -1 ||
        url.indexOf("/api/cursos") !== -1 ||
        url.indexOf("/api/recompensas") !== -1 ||
        url.indexOf("/api/faq") !== -1 ||
        url.indexOf("/api/meta") !== -1;

      if (!need) return orig.apply(this, arguments);

      return orig.apply(this, arguments).then(function (res) {
        if (res.ok) {
          return res.clone().json().then(function (data) {
            if (Array.isArray(data) && data.length === 0 && (url.indexOf("plantas") !== -1 || url.indexOf("cursos") !== -1)) {
              return fallback(url);
            }
            return res;
          }).catch(function () { return res; });
        }
        return fallback(url);
      }).catch(function () {
        return fallback(url);
      });
    };

    function fallback(url) {
      return ensureData().then(function (d) {
        if (url.indexOf("/api/plantas/") !== -1) {
          var id = url.split("/api/plantas/")[1].split(/[?#]/)[0];
          var p = (d.CATALOGO || []).find(function (x) { return x.id === id; });
          return p ? jsonRes(mapPlanta(p)) : jsonRes({ erro: "Planta não encontrada" }, 404);
        }
        if (url.indexOf("/api/plantas") !== -1) {
          return jsonRes((d.CATALOGO || []).map(mapPlanta));
        }
        if (url.indexOf("/api/cursos") !== -1) {
          return jsonRes((d.CURSOS || []).map(function (c) {
            return {
              id: c.id, titulo: c.titulo, nivel: c.nivel, duracao: c.duracao,
              emoji: c.emoji, imagem: c.imagem || null, descricao: c.descricao,
              link: c.link, brotos: c.brotos, aulas: c.aulas || [],
              progresso: { aulas: [], concluido: false, codigo: null, dataConclusao: null }
            };
          }));
        }
        if (url.indexOf("/api/recompensas") !== -1) return jsonRes(d.RECOMPENSAS || []);
        if (url.indexOf("/api/faq") !== -1) return jsonRes(d.FAQ || []);
        if (url.indexOf("/api/meta") !== -1) {
          var cats = [], ambs = [], i, p;
          for (i = 0; i < (d.CATALOGO || []).length; i++) {
            p = d.CATALOGO[i];
            if (p.categoria && cats.indexOf(p.categoria) === -1) cats.push(p.categoria);
            if (p.ambiente && ambs.indexOf(p.ambiente) === -1) ambs.push(p.ambiente);
          }
          cats.sort(); ambs.sort();
          return jsonRes({ categorias: cats, ambientes: ambs });
        }
        return jsonRes({ erro: "fallback" }, 500);
      });
    }
  }

  injectFallbackFetch();

  var urls = [
    "https://cdn.jsdelivr.net/gh/qeloize-elyot/Florescer@f414a19/app.js",
    "https://fastly.jsdelivr.net/gh/qeloize-elyot/Florescer@f414a19/app.js"
  ];
  var i = 0;
  function tentar() {
    if (i >= urls.length) {
      console.error("[Florescer] CDN falhou");
      return;
    }
    var s = document.createElement("script");
    s.src = urls[i++];
    s.async = false;
    s.onload = function () {
      if (typeof init === "function" && document.readyState !== "loading") {
        try { init(); } catch (e) { console.error(e); }
      }
    };
    s.onerror = tentar;
    document.head.appendChild(s);
  }
  tentar();
})();

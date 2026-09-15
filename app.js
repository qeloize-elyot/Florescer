/* Bootstrap: carrega app.js estável e garante init() mesmo se o DOM já estiver pronto */
(function () {
  var urls = [
    "https://cdn.jsdelivr.net/gh/qeloize-elyot/Florescer@f414a19/app.js",
    "https://cdn.jsdelivr.net/gh/qeloize-elyot/Florescer2@f414a19/app.js",
    "https://fastly.jsdelivr.net/gh/qeloize-elyot/Florescer@f414a19/app.js"
  ];
  var i = 0;

  function tentar() {
    if (i >= urls.length) {
      console.error("[Florescer] todos os CDNs falharam");
      var t = document.getElementById("toasts");
      if (t) {
        var el = document.createElement("div");
        el.className = "toast erro";
        el.textContent = "Falha ao carregar o aplicativo. Atualize a página em alguns segundos.";
        t.appendChild(el);
      }
      return;
    }
    var s = document.createElement("script");
    s.src = urls[i++];
    s.async = false;
    s.onload = function () {
      console.log("[Florescer] app.js carregado de", s.src);
      if (typeof init === "function" && document.readyState !== "loading") {
        try { init(); } catch (e) { console.error("[Florescer] erro ao iniciar:", e); }
      }
    };
    s.onerror = function () {
      console.warn("[Florescer] falhou:", s.src);
      tentar();
    };
    document.head.appendChild(s);
  }

  tentar();
})();

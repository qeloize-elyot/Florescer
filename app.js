/* Bootstrap: carrega app.js estável e garante que init() rode mesmo se o DOM já estiver pronto */
(function () {
  var s = document.createElement("script");
  // hash curto f414a19 = commit estável com app completo (~48KB)
  s.src = "https://cdn.jsdelivr.net/gh/qeloize-elyot/Florescer@f414a19/app.js";
  s.async = false;
  s.onload = function () {
    console.log("[Florescer] app.js restaurado do commit f414a19");
    // Se o DOM já estiver pronto, o listener de DOMContentLoaded do app.js não dispara — chamamos init manualmente
    if (typeof init === "function" && document.readyState !== "loading") {
      try {
        init();
      } catch (e) {
        console.error("[Florescer] erro ao iniciar:", e);
      }
    }
  };
  s.onerror = function () {
    console.error("[Florescer] falha ao carregar app.js de backup");
    var t = document.getElementById("toasts");
    if (t) {
      var el = document.createElement("div");
      el.className = "toast erro";
      el.textContent = "Falha ao carregar o aplicativo. Atualize a página em alguns segundos.";
      t.appendChild(el);
    }
  };
  document.head.appendChild(s);
})();

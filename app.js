/* Bootstrap temporário: carrega o app.js estável do commit f414a19 */
(function () {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/qeloize-elyot/Florescer2@f414a19/app.js";
  s.async = false;
  s.onload = function () {
    console.log("[Florescer] app.js restaurado do commit f414a19");
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

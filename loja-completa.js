/* Limpeza: sem WhatsApp, sem kits, sem mapa de categorias */
(function () {
  "use strict";

  function limpar() {
    document.querySelectorAll(
      ".wa-float, .btn-wa-mini, .kits-sec, .mapa-cats, .frete-meta, .trust-strip, .ajuda-bloco, .promo-grid, .bloco-favoritas-cat"
    ).forEach(function (el) {
      el.remove();
    });

    // catálogo sempre visível
    var grade = document.getElementById("grade");
    if (grade) {
      grade.style.display = "";
      grade.style.visibility = "visible";
    }
    var dest = document.getElementById("destaques");
    if (dest) dest.style.display = "";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", limpar);
  else limpar();
  setTimeout(limpar, 600);
  setTimeout(limpar, 1600);
  setTimeout(limpar, 3000);
})();

/**
 * UI de reembolso — adiciona botão nos pedidos da conta
 */
(function () {
  function token() {
    return localStorage.getItem("rf_token") || "";
  }

  function toast(msg, erro) {
    const box = document.getElementById("toasts");
    if (!box) return alert(msg);
    const el = document.createElement("div");
    el.className = "toast" + (erro ? " erro" : "");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  async function pedirReembolso(pedidoId) {
    const motivo = prompt("Motivo do reembolso (opcional):", "Desisti da compra") || "Solicitado pelo cliente";
    if (motivo === null) return;
    try {
      const res = await fetch("/api/pedidos/" + encodeURIComponent(pedidoId) + "/reembolso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token()
        },
        body: JSON.stringify({ motivo })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.erro || "Não foi possível reembolsar");
      toast(data.mensagem || "Reembolso solicitado!");
      // tenta recarregar a conta
      const btn = document.querySelector('[data-secao="conta"]');
      if (btn) btn.click();
      else location.reload();
    } catch (e) {
      toast(e.message || "Erro no reembolso", true);
    }
  }

  function injetarBotoes() {
    const cont = document.getElementById("conteudoConta");
    if (!cont) return;
    // procura textos de pedido / IDs tipo PXXXX
    cont.querySelectorAll("article, .painel, .card, li, div").forEach((el) => {
      if (el.dataset.reembolsoReady) return;
      const txt = el.textContent || "";
      const m = txt.match(/\b(P[A-F0-9]{8,})\b/i);
      if (!m) return;
      if (/reembolsado|cancelado/i.test(txt) && !/pago|preparo|enviado/i.test(txt)) return;
      // só em blocos que parecem pedido (tem R$ ou Total)
      if (!/R\$|total|pedido/i.test(txt)) return;
      if (el.querySelector("[data-reembolsar]")) return;

      const id = m[1].toUpperCase();
      const btn = document.createElement("button");
      btn.className = "btn btn-ghost btn-sm";
      btn.type = "button";
      btn.dataset.reembolsar = id;
      btn.textContent = "Solicitar reembolso";
      btn.style.marginTop = "8px";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (confirm("Confirmar reembolso do pedido " + id + "?\n(Disponível em até 7 dias.)")) {
          pedirReembolso(id);
        }
      });
      el.appendChild(btn);
      el.dataset.reembolsoReady = "1";
    });
  }

  // API pública para a conta listar com botão explícito
  window.FlorescerReembolso = { pedirReembolso, injetarBotoes };

  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-secao=\"conta\"], [data-ir=\"conta\"]");
    if (t) setTimeout(injetarBotoes, 600);
  });

  // observer na seção conta
  const obs = new MutationObserver(() => injetarBotoes());
  const start = () => {
    const cont = document.getElementById("conteudoConta");
    if (cont) obs.observe(cont, { childList: true, subtree: true });
    injetarBotoes();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

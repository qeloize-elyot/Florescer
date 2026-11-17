/* Avaliações — sem corrida de scripts / sem undefined */
(function () {
  "use strict";

  var gen = 0;
  var inFlight = false;
  var lastPendentes = null; // cache do último resultado bom

  function token() {
    return localStorage.getItem("rf_token") || "";
  }
  function toast(msg) {
    if (typeof window.toast === "function") return window.toast(msg);
    alert(msg);
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    return fetch("/api" + path, Object.assign({}, opts, { headers: headers })).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && j.erro) || "Erro na requisição");
        return j;
      });
    });
  }

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }

  function normPendente(p) {
    if (!p || typeof p !== "object") return null;
    var plantaId = p.plantaId || p.planta_id || p.id_planta || p.plantId;
    if (plantaId == null || plantaId === "" || String(plantaId) === "undefined") return null;
    var nome = p.nome || p.plantaNome || p.planta_nome || p.name;
    if (!nome || String(nome) === "undefined") nome = String(plantaId);
    return {
      pedidoId: p.pedidoId || p.pedido_id || "",
      plantaId: String(plantaId),
      nome: String(nome),
      data: p.data || p.pedido_data || null
    };
  }

  function limparLista(lista) {
    var out = [];
    var seen = {};
    (lista || []).forEach(function (raw) {
      var p = normPendente(raw);
      if (!p) return;
      if (seen[p.plantaId]) return;
      seen[p.plantaId] = true;
      out.push(p);
    });
    return out;
  }

  /** Fallback: monta pendentes a partir de /api/pedidos */
  function pendentesDosPedidos() {
    return api("/pedidos")
      .then(function (lista) {
        if (!Array.isArray(lista)) lista = lista && lista.pedidos ? lista.pedidos : [];
        var out = [];
        lista.forEach(function (ped) {
          var st = String(ped.status || ped.statusExibicao || "").toLowerCase();
          if (st.indexOf("cancel") !== -1) return;
          var itens = ped.itens || ped.items || ped.produtos || [];
          itens.forEach(function (it) {
            out.push({
              pedidoId: ped.id || ped.pedidoId,
              plantaId: it.plantaId || it.planta_id || it.id,
              nome: it.nome || it.name || it.plantaNome,
              data: ped.data || ped.criadoEm
            });
          });
        });
        return limparLista(out);
      })
      .catch(function () {
        return [];
      });
  }

  function renderLista(lista) {
    var box = document.getElementById("listaAvaliacoes");
    if (!box) return;
    if (!lista || !lista.length) {
      box.innerHTML = '<p class="muted small">Ainda não há avaliações publicadas.</p>';
      return;
    }
    box.innerHTML = lista
      .map(function (a) {
        var nome = a.plantaNome || a.planta_nome || a.plantaId || "Planta";
        if (String(nome) === "undefined") nome = "Planta";
        return (
          '<div style="padding:12px 0;border-bottom:1px solid rgba(31,54,38,.08)">' +
          '<div style="color:#C9A227;letter-spacing:1px">' +
          stars(Number(a.nota) || 0) +
          "</div>" +
          "<strong>" +
          nome +
          "</strong>" +
          '<div class="small muted">' +
          (a.autor || "Cliente") +
          "</div>" +
          "<p style=\"margin:6px 0 0\">" +
          (a.texto || "") +
          "</p></div>"
        );
      })
      .join("");
  }

  function renderForm(pendentes, myGen) {
    if (myGen != null && myGen !== gen) return; // resposta antiga, ignora
    var box = document.getElementById("formAvaliacao");
    if (!box) return;

    if (!token()) {
      box.innerHTML = '<p class="muted small">Faça login para avaliar suas compras.</p>';
      return;
    }

    pendentes = limparLista(pendentes);

    // se veio vazio mas temos cache bom, mantém o cache
    if (!pendentes.length && lastPendentes && lastPendentes.length) {
      pendentes = lastPendentes;
    }

    if (pendentes.length) lastPendentes = pendentes;

    if (!pendentes.length) {
      // só mostra vazio se realmente não tem cache
      box.innerHTML =
        '<p class="muted small">Nenhuma planta pendente de avaliação.</p>' +
        '<p class="small muted">Se você acabou de comprar, abra <strong>Minha conta → Pedidos</strong> e volte aqui.</p>' +
        '<button type="button" class="btn btn-ghost" id="avRetry" style="margin-top:8px">Tentar de novo</button>';
      var retry = document.getElementById("avRetry");
      if (retry)
        retry.onclick = function () {
          lastPendentes = null;
          boot(true);
        };
      return;
    }

    box.innerHTML =
      '<div class="campos">' +
      '<div><label class="rot">Planta comprada</label><select id="avPlanta">' +
      pendentes
        .map(function (p) {
          var label = p.nome;
          var ped = p.pedidoId ? " · pedido " + String(p.pedidoId).slice(0, 10) : "";
          return (
            '<option value="' +
            p.plantaId.replace(/"/g, "") +
            '">' +
            label +
            ped +
            "</option>"
          );
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Nota</label><select id="avNota">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return '<option value="' + n + '">' + n + " — " + stars(n) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div><label class="rot">Comentário</label>' +
      '<textarea id="avTexto" rows="3" placeholder="Como chegou, como está em casa..."></textarea></div>' +
      '<button type="button" class="btn" id="btnEnviarAv">Publicar avaliação (+50 Brotos)</button>' +
      "</div>";

    var btn = document.getElementById("btnEnviarAv");
    if (!btn) return;
    btn.onclick = function () {
      var plantaId = document.getElementById("avPlanta").value;
      var nota = Number(document.getElementById("avNota").value);
      var texto = (document.getElementById("avTexto").value || "").trim();
      if (!plantaId || plantaId === "undefined") {
        toast("Escolha a planta");
        return;
      }
      if (texto.length < 3) {
        toast("Escreva um comentário");
        return;
      }
      btn.disabled = true;
      api("/avaliacoes", {
        method: "POST",
        body: JSON.stringify({ plantaId: plantaId, nota: nota, texto: texto })
      })
        .then(function (j) {
          toast(j.mensagem || "Avaliação enviada");
          if (j.brotos != null) {
            ["saldoBrotos", "saldoBrotosPainel"].forEach(function (id) {
              var el = document.getElementById(id);
              if (el) el.textContent = j.brotos;
            });
          }
          // remove a planta do cache
          lastPendentes = (lastPendentes || []).filter(function (p) {
            return p.plantaId !== plantaId;
          });
          boot(true);
        })
        .catch(function (e) {
          toast(e.message || "Erro");
          btn.disabled = false;
        });
    };
  }

  function carregarPendentes(myGen) {
    if (!token()) {
      renderForm([], myGen);
      return Promise.resolve();
    }
    return api("/avaliacoes/pendentes")
      .then(function (lista) {
        if (myGen !== gen) return;
        var limpa = limparLista(lista);
        if (limpa.length) {
          renderForm(limpa, myGen);
          return;
        }
        // fallback pelos pedidos
        return pendentesDosPedidos().then(function (fb) {
          if (myGen !== gen) return;
          renderForm(fb, myGen);
        });
      })
      .catch(function () {
        if (myGen !== gen) return;
        // em erro: tenta pedidos; se falhar, mantém cache
        return pendentesDosPedidos().then(function (fb) {
          if (myGen !== gen) return;
          if (fb.length) renderForm(fb, myGen);
          else if (lastPendentes && lastPendentes.length) renderForm(lastPendentes, myGen);
          else renderForm([], myGen);
        });
      });
  }

  function boot(force) {
    if (inFlight && !force) return;
    inFlight = true;
    var myGen = ++gen;

    // se já tem formulário bom na tela e não é force, não apaga enquanto carrega
    var box = document.getElementById("formAvaliacao");
    if (force && box) {
      box.innerHTML = '<p class="muted small">Carregando suas compras...</p>';
    }

    var pLista = api("/avaliacoes")
      .then(function (lista) {
        if (myGen !== gen) return;
        renderLista(lista);
      })
      .catch(function () {});

    var pPend = carregarPendentes(myGen);

    Promise.all([pLista, pPend]).then(
      function () {
        if (myGen === gen) inFlight = false;
      },
      function () {
        if (myGen === gen) inFlight = false;
      }
    );
  }

  function onReady() {
    boot(false);
    // um único retry tardio (caso a seção ainda não existisse)
    setTimeout(function () {
      boot(false);
    }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-secao],[data-ir]");
    if (!b) return;
    var s = b.getAttribute("data-secao") || b.getAttribute("data-ir");
    if (s === "avaliacoes") {
      setTimeout(function () {
        boot(true);
      }, 120);
    }
  });
})();

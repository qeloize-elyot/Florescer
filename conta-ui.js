/**
 * Central Minha conta — hub + subáreas (pedidos, endereço, segurança, favoritos…)
 */
(function () {
  "use strict";

  var PAINEL = "hub";

  function token() {
    return localStorage.getItem("rf_token") || "";
  }

  function toast(msg, erro) {
    var box = document.getElementById("toasts");
    if (!box) {
      alert(msg);
      return;
    }
    var el = document.createElement("div");
    el.className = "toast" + (erro ? " erro" : "");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4000);
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    var res = await fetch("/api" + path, Object.assign({}, opts, { headers: headers }));
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.erro || "Erro na requisição");
    return data;
  }

  function favsGet() {
    try {
      return JSON.parse(localStorage.getItem("rf_favoritos") || "[]");
    } catch (_) {
      return [];
    }
  }

  function favsSet(arr) {
    localStorage.setItem("rf_favoritos", JSON.stringify(arr.slice(0, 50)));
  }

  function iniciais(nome) {
    var p = String(nome || "?").trim().split(/\s+/);
    return ((p[0] && p[0][0]) || "?") + ((p[1] && p[1][0]) || "");
  }

  function nivelTxt(brotos) {
    if (typeof window.nivelDe === "function") {
      var n = window.nivelDe(brotos);
      return n ? "Nível " + n.nivel + " · " + n.nome : "";
    }
    return "";
  }

  function ensureRoot() {
    var cont = document.getElementById("conteudoConta");
    if (!cont) return null;
    var root = document.getElementById("mcRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "mcRoot";
      root.className = "mc-hub";
      cont.prepend(root);
    }
    return root;
  }

  function irSecao(id) {
    var btn = document.querySelector('[data-secao="' + id + '"]');
    if (btn) btn.click();
    else if (typeof window.irPara === "function") window.irPara(id);
  }

  async function carregarUsuario() {
    if (!token()) return null;
    try {
      var data = await api("/me");
      return data.usuario;
    } catch (_) {
      return null;
    }
  }

  function renderGuest(root) {
    root.innerHTML =
      '<div class="mc-painel center">' +
      "<h3>Você ainda não entrou</h3>" +
      '<p class="muted">Entre para ver pedidos, endereços, Brotos, favoritos e certificados.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:14px">' +
      '<button type="button" class="btn" id="mcLogin">Entrar</button>' +
      '<button type="button" class="btn btn-ghost" id="mcCadastro">Criar conta</button>' +
      "</div></div>";
    document.getElementById("mcLogin").onclick = function () {
      document.getElementById("btnAuth")?.click();
    };
    document.getElementById("mcCadastro").onclick = function () {
      document.getElementById("btnAuth")?.click();
    };
  }

  function renderHub(root, u) {
    var niv = nivelTxt(u.brotos);
    root.innerHTML =
      '<div class="mc-perfil">' +
      '<div class="mc-avatar">' +
      iniciais(u.nome).toUpperCase() +
      "</div>" +
      "<div>" +
      "<h3>" +
      (u.nome || "") +
      "</h3>" +
      '<div class="mc-meta">' +
      (u.email || "") +
      "</div>" +
      '<div class="mc-badges">' +
      '<span class="mc-badge">' +
      (u.brotos || 0) +
      " Brotos</span>" +
      (niv ? '<span class="mc-badge">' + niv + "</span>" : "") +
      (u.emailVerificado
        ? '<span class="mc-badge">E-mail verificado</span>'
        : '<span class="mc-badge">E-mail pendente</span>') +
      (String(u.role || "") === "admin" ? '<span class="mc-badge">Admin</span>' : "") +
      "</div></div></div>" +
      '<div class="mc-atalhos">' +
      atalho("pedidos", "📦", "Meus pedidos", "Rastrear e cancelar") +
      atalho("endereco", "📍", "Endereços", "Entrega padrão") +
      atalho("brotos", "🌱", "Brotos", "Saldo e resgates") +
      atalho("cupons", "🎟️", "Cupons", "Recompensas ativas") +
      atalho("favoritos", "❤️", "Favoritos", "Plantas salvas") +
      atalho("avaliacoes", "⭐", "Avaliações", "Ganhe 50 Brotos") +
      atalho("cursos", "📜", "Cursos", "Certificados") +
      atalho("seguranca", "🔒", "Segurança", "Senha e conta") +
      atalho("ajuda", "❓", "Ajuda", "FAQ") +
      "</div>" +
      '<div id="mcSub" class="mc-sub"></div>' +
      '<button type="button" class="mc-sair" id="mcSair">Sair da conta</button>';

    root.querySelectorAll("[data-mc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        abrirPainel(btn.getAttribute("data-mc"), u);
      });
    });
    document.getElementById("mcSair").onclick = function () {
      if (!confirm("Sair da sua conta?")) return;
      localStorage.removeItem("rf_token");
      sessionStorage.removeItem("rf_token");
      location.reload();
    };
  }

  function atalho(id, ico, titulo, sub) {
    return (
      '<button type="button" class="mc-atalho" data-mc="' +
      id +
      '">' +
      '<span class="mc-ico">' +
      ico +
      "</span><strong>" +
      titulo +
      "</strong><span>" +
      sub +
      "</span></button>"
    );
  }

  async function abrirPainel(id, u) {
    PAINEL = id;
    if (id === "brotos") return irSecao("brotos");
    if (id === "avaliacoes") return irSecao("avaliacoes");
    if (id === "cursos") return irSecao("cursos");
    if (id === "ajuda") return irSecao("faq");
    if (id === "pedidos") {
      // pedidos-ui já monta em conteudoConta — só rola
      var ped = document.getElementById("pedidosShopee");
      if (ped) ped.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.FlorescerPedidos && window.FlorescerPedidos.carregar) {
        window.FlorescerPedidos.carregar();
      }
      return;
    }

    var sub = document.getElementById("mcSub");
    if (!sub) return;
    sub.classList.add("aberto");

    if (id === "endereco") return renderEndereco(sub, u);
    if (id === "seguranca") return renderSeguranca(sub, u);
    if (id === "favoritos") return renderFavoritos(sub);
    if (id === "cupons") return renderCupons(sub);
  }

  function voltarBtn(sub) {
    return (
      '<button type="button" class="mc-voltar" id="mcVoltar">← Voltar ao menu</button>'
    );
  }

  function bindVoltar(sub) {
    var b = document.getElementById("mcVoltar");
    if (b)
      b.onclick = function () {
        sub.classList.remove("aberto");
        sub.innerHTML = "";
        PAINEL = "hub";
      };
  }

  function renderEndereco(sub, u) {
    var e = u.endereco || {};
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Meus endereços</h3>' +
      '<p class="small muted">Endereço usado automaticamente no carrinho (como na Shopee).</p>' +
      '<div class="mc-campos">' +
      '<div class="campos-2">' +
      '<div><label class="rot">CEP</label><input type="text" id="mcCep" maxlength="9" value="' +
      esc(e.cep) +
      '" placeholder="00000-000" /></div>' +
      '<div><label class="rot">Número</label><input type="text" id="mcNumero" value="" placeholder="123" /></div></div>' +
      '<div><label class="rot">Rua</label><input type="text" id="mcRua" value="' +
      esc(e.rua) +
      '" /></div>' +
      '<div class="campos-2">' +
      '<div><label class="rot">Bairro</label><input type="text" id="mcBairro" value="' +
      esc(e.bairro) +
      '" /></div>' +
      '<div><label class="rot">Cidade</label><input type="text" id="mcCidade" value="' +
      esc(e.cidade) +
      '" /></div></div>' +
      '<div><label class="rot">Complemento</label><input type="text" id="mcComp" value="' +
      esc(e.complemento) +
      '" placeholder="Apto, bloco…" /></div>' +
      '<button type="button" class="btn" id="mcSalvarEnd">Salvar endereço</button>' +
      "</div></div>";
    bindVoltar(sub);
    document.getElementById("mcSalvarEnd").onclick = async function () {
      try {
        var data = await api("/me/endereco", {
          method: "PUT",
          body: JSON.stringify({
            cep: val("mcCep"),
            rua: val("mcRua"),
            bairro: val("mcBairro"),
            cidade: val("mcCidade"),
            complemento: val("mcComp")
          })
        });
        toast("Endereço salvo!");
        // preenche carrinho se campos existirem
        try {
          var end = data.usuario && data.usuario.endereco;
          if (end) {
            setIf("cep", end.cep);
            setIf("rua", end.rua);
            setIf("bairro", end.bairro);
            setIf("cidade", end.cidade);
            setIf("complemento", end.complemento);
          }
        } catch (_) {}
        montar();
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  function renderSeguranca(sub, u) {
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Dados pessoais</h3>' +
      '<div class="mc-campos">' +
      '<div><label class="rot">Nome</label><input type="text" id="mcNome" value="' +
      esc(u.nome) +
      '" /></div>' +
      '<div><label class="rot">E-mail</label><input type="text" value="' +
      esc(u.email) +
      '" disabled /></div>' +
      '<p class="small muted">Membro desde ' +
      (u.criadoEm ? new Date(u.criadoEm).toLocaleDateString("pt-BR") : "—") +
      " · " +
      (u.emailVerificado ? "E-mail verificado ✓" : "Confirme seu e-mail quando possível") +
      "</p>" +
      '<button type="button" class="btn" id="mcSalvarNome">Salvar nome</button>' +
      "</div></div>" +
      '<div class="mc-painel" style="margin-top:12px"><h3>Alterar senha</h3>' +
      '<div class="mc-campos">' +
      '<div><label class="rot">Senha atual</label><input type="password" id="mcSenhaAtual" autocomplete="current-password" /></div>' +
      '<div><label class="rot">Nova senha</label><input type="password" id="mcSenhaNova" autocomplete="new-password" /></div>' +
      '<button type="button" class="btn" id="mcSalvarSenha">Atualizar senha</button>' +
      "</div></div>";
    bindVoltar(sub);
    document.getElementById("mcSalvarNome").onclick = async function () {
      try {
        await api("/me/perfil", {
          method: "PUT",
          body: JSON.stringify({ nome: val("mcNome") })
        });
        toast("Nome atualizado");
        montar();
      } catch (err) {
        toast(err.message, true);
      }
    };
    document.getElementById("mcSalvarSenha").onclick = async function () {
      try {
        var r = await api("/me/senha", {
          method: "PUT",
          body: JSON.stringify({
            senhaAtual: val("mcSenhaAtual"),
            senhaNova: val("mcSenhaNova")
          })
        });
        toast(r.mensagem || "Senha alterada");
        document.getElementById("mcSenhaAtual").value = "";
        document.getElementById("mcSenhaNova").value = "";
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  async function renderFavoritos(sub) {
    var ids = favsGet();
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Favoritos</h3><div id="mcFavLista" class="muted small">Carregando…</div></div>';
    bindVoltar(sub);
    var box = document.getElementById("mcFavLista");
    if (!ids.length) {
      box.innerHTML =
        '<div class="mc-lista-vazia">Nenhuma planta favorita ainda.<br/>No catálogo, use ♥ para salvar.</div>';
      return;
    }
    try {
      var plantas = await api("/plantas");
      if (!Array.isArray(plantas)) plantas = [];
      var items = ids
        .map(function (id) {
          return plantas.find(function (p) {
            return p.id === id;
          });
        })
        .filter(Boolean);
      if (!items.length) {
        box.innerHTML = '<div class="mc-lista-vazia">Favoritos não encontrados no catálogo.</div>';
        return;
      }
      box.innerHTML = items
        .map(function (p) {
          return (
            '<div class="mc-fav-item">' +
            "<div><strong>" +
            (p.nome || p.id) +
            "</strong><br/><span class=\"small muted\">R$ " +
            Number(p.preco).toFixed(2) +
            "</span></div>" +
            '<div style="display:flex;gap:6px">' +
            '<button type="button" class="btn btn-sm btn-ghost" data-ir-cat="' +
            p.id +
            '">Ver</button>' +
            '<button type="button" class="btn btn-sm btn-ghost" data-unfav="' +
            p.id +
            '">Remover</button></div></div>'
          );
        })
        .join("");
      box.querySelectorAll("[data-unfav]").forEach(function (b) {
        b.onclick = function () {
          favsSet(
            favsGet().filter(function (x) {
              return x !== b.getAttribute("data-unfav");
            })
          );
          renderFavoritos(sub);
        };
      });
      box.querySelectorAll("[data-ir-cat]").forEach(function (b) {
        b.onclick = function () {
          irSecao("catalogo");
        };
      });
    } catch (e) {
      box.textContent = e.message;
    }
  }

  async function renderCupons(sub) {
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Meus cupons / recompensas</h3>' +
      '<p class="small muted">Resgates com Brotos que ainda não foram usados no carrinho.</p>' +
      '<div id="mcCupLista">Carregando…</div></div>';
    bindVoltar(sub);
    var box = document.getElementById("mcCupLista");
    try {
      var resgates = await api("/resgates");
      if (!Array.isArray(resgates) || !resgates.length) {
        box.innerHTML =
          '<div class="mc-lista-vazia">Nenhum cupom ativo.<br/>Troque Brotos na área do programa.</div>';
        return;
      }
      box.innerHTML = resgates
        .map(function (r) {
          var nome = r.nome || r.recompensa_id || r.id || "Recompensa";
          var usado = r.usado ? " (já usado)" : " · disponível";
          return (
            '<div class="mc-resgate-item"><strong>' +
            nome +
            "</strong><span class=\"small muted\">" +
            usado +
            "</span></div>"
          );
        })
        .join("");
    } catch (e) {
      box.innerHTML =
        '<div class="mc-lista-vazia">Entre na conta e resgate recompensas na área Brotos.<br/><span class="small">' +
        e.message +
        "</span></div>";
    }
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&")
      .replace(/"/g, """)
      .replace(/</g, "<");
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function setIf(id, v) {
    var el = document.getElementById(id);
    if (el && v != null) el.value = v;
  }

  /** Botão favorito nos cards do catálogo */
  function injectFavButtons() {
    document.querySelectorAll(".card[data-id], article.card, .planta-card").forEach(function () {});
    document.querySelectorAll("[data-planta], .card").forEach(function (card) {
      if (card.dataset.favReady) return;
      var id = card.getAttribute("data-id") || card.dataset.planta;
      if (!id) {
        var btnDet = card.querySelector("[data-detalhe], [data-id]");
        if (btnDet) id = btnDet.getAttribute("data-detalhe") || btnDet.getAttribute("data-id");
      }
      if (!id) return;
      card.dataset.favReady = "1";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-ghost btn-sm mc-fav-btn";
      b.style.cssText = "position:absolute;top:8px;right:8px;z-index:2;border-radius:50%;width:36px;height:36px;padding:0";
      var on = favsGet().indexOf(id) >= 0;
      b.textContent = on ? "♥" : "♡";
      b.title = "Favoritar";
      if (getComputedStyle(card).position === "static") card.style.position = "relative";
      b.onclick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var list = favsGet();
        var i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
        else list.push(id);
        favsSet(list);
        b.textContent = list.indexOf(id) >= 0 ? "♥" : "♡";
        toast(list.indexOf(id) >= 0 ? "Salvo nos favoritos" : "Removido dos favoritos");
      };
      card.appendChild(b);
    });
  }

  async function montar() {
    var root = ensureRoot();
    if (!root) return;
    if (!token()) {
      renderGuest(root);
      return;
    }
    var u = await carregarUsuario();
    if (!u) {
      renderGuest(root);
      return;
    }
    renderHub(root, u);
    // pedidos-ui continua abaixo
    if (window.FlorescerPedidos && window.FlorescerPedidos.carregar) {
      setTimeout(function () {
        window.FlorescerPedidos.carregar();
      }, 400);
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest('[data-secao="conta"], [data-ir="conta"]');
    if (t) setTimeout(montar, 350);
  });

  var mo;
  function watch() {
    var grade = document.getElementById("grade");
    if (grade && !mo) {
      mo = new MutationObserver(function () {
        injectFavButtons();
      });
      mo.observe(grade, { childList: true, subtree: true });
    }
    injectFavButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(montar, 900);
      setTimeout(watch, 1200);
    });
  } else {
    setTimeout(montar, 900);
    setTimeout(watch, 1200);
  }

  window.FlorescerConta = { montar: montar, favsGet: favsGet, favsSet: favsSet };
})();

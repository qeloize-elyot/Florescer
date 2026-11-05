/**
 * Central Minha conta — substitui renderConta quebrado + favoritos (data-planta-id)
 */
(function () {
  "use strict";

  var montando = false;
  var lastMount = 0;

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

  function irSecao(id) {
    if (typeof window.irPara === "function") {
      try {
        window.irPara(id);
        return;
      } catch (_) {}
    }
    var btn = document.querySelector('[data-secao="' + id + '"]');
    if (btn) btn.click();
  }

  function contaAtiva() {
    var sec = document.getElementById("sec-conta");
    return !!(sec && sec.classList.contains("ativa"));
  }

  function ensureRoot() {
    var cont = document.getElementById("conteudoConta");
    if (!cont) return null;
    var root = document.getElementById("mcRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "mcRoot";
      root.className = "mc-hub";
      cont.insertBefore(root, cont.firstChild);
    }
    return root;
  }

  function limparHtmlAntigoConta() {
    var cont = document.getElementById("conteudoConta");
    if (!cont) return;
    Array.prototype.slice.call(cont.children).forEach(function (ch) {
      if (ch.id === "mcRoot" || ch.id === "pedidosShopee") return;
      ch.remove();
    });
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
    var login = document.getElementById("mcLogin");
    var cad = document.getElementById("mcCadastro");
    if (login)
      login.onclick = function () {
        var b = document.getElementById("btnAuth");
        if (b) b.click();
      };
    if (cad)
      cad.onclick = function () {
        var b = document.getElementById("btnAuth");
        if (b) b.click();
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

  function renderHub(root, u) {
    var niv = nivelTxt(u.brotos);
    root.innerHTML =
      '<div class="mc-perfil">' +
      '<div class="mc-avatar">' +
      iniciais(u.nome).toUpperCase() +
      "</div><div>" +
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
    var sair = document.getElementById("mcSair");
    if (sair)
      sair.onclick = function () {
        if (!confirm("Sair da sua conta?")) return;
        localStorage.removeItem("rf_token");
        location.reload();
      };
  }

  async function abrirPainel(id, u) {
    if (id === "brotos") return irSecao("brotos");
    if (id === "avaliacoes") return irSecao("avaliacoes");
    if (id === "cursos") return irSecao("cursos");
    if (id === "ajuda") return irSecao("faq");
    if (id === "pedidos") {
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

  function voltarBtn() {
    return '<button type="button" class="mc-voltar" id="mcVoltar">← Voltar ao menu</button>';
  }

  function bindVoltar(sub) {
    var b = document.getElementById("mcVoltar");
    if (b)
      b.onclick = function () {
        sub.classList.remove("aberto");
        sub.innerHTML = "";
      };
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

  function renderEndereco(sub, u) {
    var e = u.endereco || {};
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Meus endereços</h3>' +
      '<p class="small muted">Endereço usado no carrinho.</p>' +
      '<div class="mc-campos">' +
      '<div class="campos-2">' +
      '<div><label class="rot">CEP</label><input type="text" id="mcCep" maxlength="9" value="' +
      esc(e.cep) +
      '" /></div>' +
      '<div><label class="rot">Cidade</label><input type="text" id="mcCidade" value="' +
      esc(e.cidade) +
      '" /></div></div>' +
      '<div><label class="rot">Rua</label><input type="text" id="mcRua" value="' +
      esc(e.rua) +
      '" /></div>' +
      '<div class="campos-2">' +
      '<div><label class="rot">Bairro</label><input type="text" id="mcBairro" value="' +
      esc(e.bairro) +
      '" /></div>' +
      '<div><label class="rot">Complemento</label><input type="text" id="mcComp" value="' +
      esc(e.complemento) +
      '" /></div></div>' +
      '<button type="button" class="btn" id="mcSalvarEnd">Salvar endereço</button></div></div>';
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
        var end = data.usuario && data.usuario.endereco;
        if (end) {
          setIf("cep", end.cep);
          setIf("rua", end.rua);
          setIf("bairro", end.bairro);
          setIf("cidade", end.cidade);
          setIf("complemento", end.complemento);
        }
        montar(true);
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
      '<button type="button" class="btn" id="mcSalvarNome">Salvar nome</button></div></div>' +
      '<div class="mc-painel" style="margin-top:12px"><h3>Alterar senha</h3>' +
      '<div class="mc-campos">' +
      '<div><label class="rot">Senha atual</label><input type="password" id="mcSenhaAtual" /></div>' +
      '<div><label class="rot">Nova senha</label><input type="password" id="mcSenhaNova" /></div>' +
      '<button type="button" class="btn" id="mcSalvarSenha">Atualizar senha</button></div></div>';
    bindVoltar(sub);
    document.getElementById("mcSalvarNome").onclick = async function () {
      try {
        await api("/me/perfil", { method: "PUT", body: JSON.stringify({ nome: val("mcNome") }) });
        toast("Nome atualizado");
        montar(true);
      } catch (err) {
        toast(err.message, true);
      }
    };
    document.getElementById("mcSalvarSenha").onclick = async function () {
      try {
        var r = await api("/me/senha", {
          method: "PUT",
          body: JSON.stringify({ senhaAtual: val("mcSenhaAtual"), senhaNova: val("mcSenhaNova") })
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
      '<div class="mc-painel"><h3>Favoritos</h3><div id="mcFavLista">Carregando…</div></div>';
    bindVoltar(sub);
    var box = document.getElementById("mcFavLista");
    if (!ids.length) {
      box.innerHTML =
        '<div class="mc-lista-vazia">Nenhuma planta favorita.<br/>No catálogo, toque no ♥.</div>';
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
        box.innerHTML = '<div class="mc-lista-vazia">Favoritos não encontrados.</div>';
        return;
      }
      box.innerHTML = items
        .map(function (p) {
          return (
            '<div class="mc-fav-item"><div><strong>' +
            (p.nome || p.id) +
            '</strong><br/><span class="small muted">R$ ' +
            Number(p.preco).toFixed(2) +
            "</span></div>" +
            '<button type="button" class="btn btn-sm btn-ghost" data-unfav="' +
            p.id +
            '">Remover</button></div>'
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
    } catch (e) {
      box.textContent = e.message;
    }
  }

  async function renderCupons(sub) {
    sub.innerHTML =
      voltarBtn() +
      '<div class="mc-painel"><h3>Meus cupons</h3><div id="mcCupLista">Carregando…</div></div>';
    bindVoltar(sub);
    var box = document.getElementById("mcCupLista");
    try {
      var resgates = await api("/resgates");
      if (!Array.isArray(resgates) || !resgates.length) {
        box.innerHTML =
          '<div class="mc-lista-vazia">Nenhum cupom. Resgate na área Brotos.</div>';
        return;
      }
      box.innerHTML = resgates
        .map(function (r) {
          return (
            '<div class="mc-resgate-item"><strong>' +
            (r.nome || r.recompensa_id || r.id || "Recompensa") +
            '</strong><span class="small muted">' +
            (r.usado ? "usado" : "disponível") +
            "</span></div>"
          );
        })
        .join("");
    } catch (e) {
      box.innerHTML = '<div class="mc-lista-vazia">' + e.message + "</div>";
    }
  }

  function injectFavButtons() {
    document.querySelectorAll("article.card[data-planta-id], .card[data-planta-id]").forEach(function (card) {
      if (card.querySelector(".mc-fav-btn")) return;
      var id = card.getAttribute("data-planta-id");
      if (!id) return;

      var b = document.createElement("button");
      b.type = "button";
      b.className = "mc-fav-btn";
      b.setAttribute("aria-label", "Favoritar");
      b.style.cssText =
        "position:absolute;top:8px;right:8px;z-index:5;border:none;border-radius:50%;" +
        "width:36px;height:36px;padding:0;cursor:pointer;font-size:1.15rem;line-height:1;" +
        "background:rgba(247,244,239,0.92);box-shadow:0 2px 8px rgba(30,58,47,0.15);color:#c45c5c";
      b.textContent = favsGet().indexOf(id) >= 0 ? "♥" : "♡";

      if (getComputedStyle(card).position === "static") card.style.position = "relative";

      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var list = favsGet();
        var i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
        else list.push(id);
        favsSet(list);
        b.textContent = list.indexOf(id) >= 0 ? "♥" : "♡";
        toast(list.indexOf(id) >= 0 ? "Salvo nos favoritos" : "Removido dos favoritos");
      });

      card.appendChild(b);
    });
  }

  async function montar(force) {
    if (montando) return;
    var now = Date.now();
    if (!force && now - lastMount < 300) return;
    montando = true;
    lastMount = now;
    try {
      var cont = document.getElementById("conteudoConta");
      if (!cont) return;

      limparHtmlAntigoConta();
      var root = ensureRoot();
      if (!root) return;

      if (!root.innerHTML.trim()) {
        root.innerHTML = '<p class="muted small" style="padding:12px">Carregando sua conta…</p>';
      }

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

      if (window.FlorescerPedidos && window.FlorescerPedidos.carregar) {
        setTimeout(function () {
          window.FlorescerPedidos.carregar();
        }, 200);
      }
    } catch (e) {
      console.error("[conta-ui] montar:", e);
      var root2 = document.getElementById("mcRoot");
      if (root2) {
        root2.innerHTML =
          '<div class="mc-painel"><p class="muted">Não foi possível carregar a conta. <button type="button" class="btn btn-sm" id="mcRetry">Tentar de novo</button></p></div>';
        var r = document.getElementById("mcRetry");
        if (r)
          r.onclick = function () {
            montar(true);
          };
      }
    } finally {
      montando = false;
    }
  }

  function replaceRenderConta() {
    var replacement = function () {
      return montar(true);
    };
    replacement.__mcPatched = true;
    try {
      window.renderConta = replacement;
    } catch (_) {}
  }

  function patchIrPara() {
    if (typeof window.irPara !== "function" || window.irPara.__mcPatched) return;
    var orig = window.irPara;
    window.irPara = function (secao) {
      var r = orig.apply(this, arguments);
      if (secao === "conta") {
        setTimeout(function () {
          montar(true);
        }, 30);
        setTimeout(function () {
          montar(true);
        }, 200);
      }
      return r;
    };
    window.irPara.__mcPatched = true;
  }

  function observeConta() {
    var cont = document.getElementById("conteudoConta");
    if (cont && !cont.__mcObs) {
      cont.__mcObs = true;
      var t = null;
      new MutationObserver(function () {
        if (!contaAtiva()) return;
        if (
          document.getElementById("mcRoot") &&
          document.getElementById("mcRoot").querySelector(".mc-perfil, .mc-painel")
        )
          return;
        clearTimeout(t);
        t = setTimeout(function () {
          montar(true);
        }, 60);
      }).observe(cont, { childList: true, subtree: true });
    }

    var sec = document.getElementById("sec-conta");
    if (sec && !sec.__mcObs) {
      sec.__mcObs = true;
      new MutationObserver(function () {
        if (contaAtiva()) {
          setTimeout(function () {
            montar(true);
          }, 40);
        }
      }).observe(sec, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function observeCatalogo() {
    ["grade", "destaques"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.__mcFavObs) return;
      el.__mcFavObs = true;
      new MutationObserver(function () {
        injectFavButtons();
      }).observe(el, { childList: true, subtree: true });
    });
    injectFavButtons();
  }

  document.addEventListener("click", function (e) {
    var t =
      e.target.closest &&
      e.target.closest('[data-secao="conta"], [data-ir="conta"], #btnAuth');
    if (t) {
      replaceRenderConta();
      patchIrPara();
      setTimeout(function () {
        if (contaAtiva() || t.id === "btnAuth") montar(true);
      }, 80);
      setTimeout(function () {
        if (contaAtiva()) montar(true);
      }, 350);
    }
  });

  function boot() {
    replaceRenderConta();
    patchIrPara();
    observeConta();
    observeCatalogo();

    var n = 0;
    var iv = setInterval(function () {
      n++;
      replaceRenderConta();
      patchIrPara();
      observeConta();
      observeCatalogo();
      injectFavButtons();
      if (contaAtiva() && !document.querySelector("#mcRoot .mc-perfil, #mcRoot .mc-painel")) {
        montar(true);
      }
      if (n > 40) clearInterval(iv);
    }, 350);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.FlorescerConta = {
    montar: montar,
    favsGet: favsGet,
    favsSet: favsSet,
    injectFavButtons: injectFavButtons
  };
})();

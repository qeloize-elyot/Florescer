/**
 * Painel Admin — só aparece se usuario.role === 'admin'
 */
(function () {
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

  function isAdminUser(u) {
    return u && String(u.role || "").toLowerCase() === "admin";
  }

  function ensureSecaoAdmin() {
    if (document.getElementById("sec-admin")) return;
    var main = document.querySelector("main.container") || document.querySelector("main");
    if (!main) return;

    var sec = document.createElement("section");
    sec.className = "secao";
    sec.id = "sec-admin";
    sec.innerHTML =
      '<div class="cabecalho-secao"><h2>Painel admin</h2>' +
      "<p>Gerencie plantas do catálogo e cursos. Apenas contas com perfil administrador.</p></div>" +
      '<div class="layout-2col">' +
      '<div class="painel"><h3>Nova / editar planta</h3>' +
      '<div class="campos" id="adminFormPlanta">' +
      '<div><label class="rot">Nome</label><input id="admPNome" type="text" /></div>' +
      '<div><label class="rot">Científico</label><input id="admPCient" type="text" /></div>' +
      '<div class="campos campos-2">' +
      '<div><label class="rot">Preço (R$)</label><input id="admPPreco" type="number" step="0.01" min="0" /></div>' +
      '<div><label class="rot">Categoria</label><input id="admPCat" type="text" placeholder="Folhagem" /></div></div>' +
      '<div class="campos campos-2">' +
      '<div><label class="rot">Ambiente</label><input id="admPAmb" type="text" placeholder="Interno" /></div>' +
      '<div><label class="rot">URL da imagem</label><input id="admPImg" type="text" /></div></div>' +
      '<div><label class="rot">Resumo / cuidados</label><textarea id="admPResumo" rows="3"></textarea></div>' +
      '<label class="check"><input type="checkbox" id="admPPet" /> Pet friendly</label>' +
      '<input type="hidden" id="admPId" />' +
      '<button type="button" class="btn" id="admPSalvar">Salvar planta</button>' +
      "</div></div>" +
      '<div class="painel"><h3>Novo / editar curso</h3>' +
      '<div class="campos" id="adminFormCurso">' +
      '<div><label class="rot">Título</label><input id="admCTitulo" type="text" /></div>' +
      '<div class="campos campos-2">' +
      '<div><label class="rot">Nível</label><input id="admCNivel" type="text" placeholder="Iniciante" /></div>' +
      '<div><label class="rot">Duração</label><input id="admCDur" type="text" placeholder="2h" /></div></div>' +
      '<div><label class="rot">Descrição</label><textarea id="admCDesc" rows="3"></textarea></div>' +
      '<div><label class="rot">Link (YouTube etc.)</label><input id="admCLink" type="text" /></div>' +
      '<div><label class="rot">Aulas (uma por linha)</label><textarea id="admCAulas" rows="4" placeholder="Aula 1\nAula 2"></textarea></div>' +
      '<input type="hidden" id="admCId" />' +
      '<button type="button" class="btn" id="admCSalvar">Salvar curso</button>' +
      "</div></div></div>" +
      '<div class="painel" style="margin-top:16px"><h3>Plantas no banco</h3><div id="adminListaPlantas" class="muted small">Carregando…</div></div>' +
      '<div class="painel" style="margin-top:16px"><h3>Cursos no banco</h3><div id="adminListaCursos" class="muted small">Carregando…</div></div>';

    main.appendChild(sec);

    // menu
    var menu = document.getElementById("menu");
    if (menu && !menu.querySelector('[data-secao="admin"]')) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.secao = "admin";
      btn.textContent = "Admin";
      menu.appendChild(btn);
    }
    var mm = document.getElementById("menuMobile");
    if (mm && !mm.querySelector('[data-secao="admin"]')) {
      var b2 = document.createElement("button");
      b2.type = "button";
      b2.dataset.secao = "admin";
      b2.textContent = "Admin";
      mm.appendChild(b2);
    }

    document.getElementById("admPSalvar").onclick = salvarPlanta;
    document.getElementById("admCSalvar").onclick = salvarCurso;
  }

  async function salvarPlanta() {
    try {
      var body = {
        id: document.getElementById("admPId").value || undefined,
        nome: document.getElementById("admPNome").value,
        cientifico: document.getElementById("admPCient").value,
        preco: Number(document.getElementById("admPPreco").value),
        categoria: document.getElementById("admPCat").value,
        ambiente: document.getElementById("admPAmb").value,
        imagem: document.getElementById("admPImg").value,
        resumo: document.getElementById("admPResumo").value,
        petFriendly: document.getElementById("admPPet").checked
      };
      if (body.id) await api("/admin/plantas/" + encodeURIComponent(body.id), { method: "PUT", body: JSON.stringify(body) });
      else await api("/admin/plantas", { method: "POST", body: JSON.stringify(body) });
      toast("Planta salva!");
      document.getElementById("admPId").value = "";
      carregarListas();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function salvarCurso() {
    try {
      var aulas = document
        .getElementById("admCAulas")
        .value.split("\n")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      var body = {
        id: document.getElementById("admCId").value || undefined,
        titulo: document.getElementById("admCTitulo").value,
        nivel: document.getElementById("admCNivel").value,
        duracao: document.getElementById("admCDur").value,
        descricao: document.getElementById("admCDesc").value,
        link: document.getElementById("admCLink").value,
        aulas: aulas,
        brotos: 50
      };
      if (body.id) await api("/admin/cursos/" + encodeURIComponent(body.id), { method: "PUT", body: JSON.stringify(body) });
      else await api("/admin/cursos", { method: "POST", body: JSON.stringify(body) });
      toast("Curso salvo!");
      document.getElementById("admCId").value = "";
      carregarListas();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function carregarListas() {
    var lp = document.getElementById("adminListaPlantas");
    var lc = document.getElementById("adminListaCursos");
    if (!lp) return;
    try {
      var plantas = await api("/admin/plantas");
      lp.innerHTML = (plantas || [])
        .map(function (p) {
          return (
            "<div style=\"margin:6px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap\">" +
            "<strong>" +
            (p.nome || p.id) +
            "</strong> <span class=\"muted\">R$ " +
            Number(p.preco).toFixed(2) +
            "</span> " +
            (p.ativo === 0 ? "<em>(inativa)</em> " : "") +
            '<button type="button" class="btn btn-ghost btn-sm" data-edit-p="' +
            p.id +
            '">Editar</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-del-p="' +
            p.id +
            '">Desativar</button></div>'
          );
        })
        .join("") || "Nenhuma planta.";

      lp.querySelectorAll("[data-edit-p]").forEach(function (btn) {
        btn.onclick = function () {
          var p = plantas.find(function (x) {
            return x.id === btn.getAttribute("data-edit-p");
          });
          if (!p) return;
          document.getElementById("admPId").value = p.id;
          document.getElementById("admPNome").value = p.nome || "";
          document.getElementById("admPCient").value = p.cientifico || "";
          document.getElementById("admPPreco").value = p.preco;
          document.getElementById("admPCat").value = p.categoria || "";
          document.getElementById("admPAmb").value = p.ambiente || "";
          document.getElementById("admPImg").value = p.imagem || "";
          document.getElementById("admPResumo").value = p.resumo || "";
          document.getElementById("admPPet").checked = !!p.pet_friendly;
        };
      });
      lp.querySelectorAll("[data-del-p]").forEach(function (btn) {
        btn.onclick = async function () {
          if (!confirm("Desativar esta planta?")) return;
          try {
            await api("/admin/plantas/" + btn.getAttribute("data-del-p"), { method: "DELETE" });
            toast("Planta desativada");
            carregarListas();
          } catch (e) {
            toast(e.message, true);
          }
        };
      });
    } catch (e) {
      lp.textContent = e.message;
    }

    try {
      var cursos = await api("/admin/cursos");
      lc.innerHTML = (cursos || [])
        .map(function (c) {
          return (
            "<div style=\"margin:6px 0\">" +
            "<strong>" +
            (c.titulo || c.id) +
            "</strong> " +
            '<button type="button" class="btn btn-ghost btn-sm" data-edit-c="' +
            c.id +
            '">Editar</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-del-c="' +
            c.id +
            '">Excluir</button></div>'
          );
        })
        .join("") || "Nenhum curso.";

      lc.querySelectorAll("[data-edit-c]").forEach(function (btn) {
        btn.onclick = function () {
          var c = cursos.find(function (x) {
            return x.id === btn.getAttribute("data-edit-c");
          });
          if (!c) return;
          document.getElementById("admCId").value = c.id;
          document.getElementById("admCTitulo").value = c.titulo || "";
          document.getElementById("admCNivel").value = c.nivel || "";
          document.getElementById("admCDur").value = c.duracao || "";
          document.getElementById("admCDesc").value = c.descricao || "";
          document.getElementById("admCLink").value = c.link || "";
          document.getElementById("admCAulas").value = (c.aulas || []).join("\n");
        };
      });
      lc.querySelectorAll("[data-del-c]").forEach(function (btn) {
        btn.onclick = async function () {
          if (!confirm("Excluir este curso?")) return;
          try {
            await api("/admin/cursos/" + btn.getAttribute("data-del-c"), { method: "DELETE" });
            toast("Curso excluído");
            carregarListas();
          } catch (e) {
            toast(e.message, true);
          }
        };
      });
    } catch (e) {
      if (lc) lc.textContent = e.message;
    }
  }

  async function syncAdmin() {
    if (!token()) {
      var s = document.getElementById("sec-admin");
      if (s) s.style.display = "none";
      return;
    }
    try {
      var data = await api("/me");
      if (isAdminUser(data.usuario)) {
        ensureSecaoAdmin();
        var sec = document.getElementById("sec-admin");
        if (sec) sec.style.display = "";
        carregarListas();
      } else {
        var s2 = document.getElementById("sec-admin");
        if (s2) s2.style.display = "none";
      }
    } catch (_) {}
  }

  // navegação data-secao=admin
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('[data-secao="admin"]');
    if (b) {
      document.querySelectorAll("section.secao").forEach(function (s) {
        s.classList.remove("ativa");
      });
      var sec = document.getElementById("sec-admin");
      if (sec) {
        sec.classList.add("ativa");
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  window.FlorescerAdmin = { syncAdmin: syncAdmin };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncAdmin);
  else setTimeout(syncAdmin, 800);
  setInterval(syncAdmin, 8000);
})();

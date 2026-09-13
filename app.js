/* =========================================================
Florescer — Lógica da aplicação (API + banco de dados)
Persistência: backend SQLite via REST API
========================================================= */

const API = "/api";
const TOKEN_KEY = "rf_token";

/* ---------------- utilidades ---------------- */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uid = () => Math.random().toString(36).slice(2, 10);

function toast(msg, erro = false) {
const el = document.createElement("div");
el.className = "toast" + (erro ? " erro" : "");
el.textContent = msg;
$("#toasts").appendChild(el);
setTimeout(() => el.remove(), 3600);
}

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) {
if (t) localStorage.setItem(TOKEN_KEY, t);
else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, opts = {}) {
const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
const token = getToken();
if (token) headers.Authorization = "Bearer " + token;
const res = await fetch(API + path, { ...opts, headers });
const data = await res.json().catch(() => ({}));
if (!res.ok) {
const err = new Error(data.erro || "Erro na requisição");
err.status = res.status;
err.data = data;
throw err;
}
return data;
}

/** HTML da imagem da planta (fallback limpo, sem emoji) */
function figPlanta(p, className = "") {
if (p.imagem) {
return `<img src="${p.imagem}" alt="${p.nome}" loading="lazy" class="${className}"
onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='grid')" />
<span class="emoji-fallback" style="display:none">${(p.nome||"P").charAt(0)}</span>`;
}
return `<span class="emoji-fallback">${(p.nome||"P").charAt(0)}</span>`;
}

/* ---------------- estado em memória ---------------- */
let usuario = null;
let CATALOGO = [];
let CURSOS = [];
let RECOMPENSAS = [];
let FAQ = [];
let carrinho = [];
let freteCalc = null;
let metodoPagamento = "pix";
let parcelas = 1;
let recompensasAplicadas = [];
let notaSelecionada = 5;
let resgatesUsuario = [];
let avaliacoesCache = [];

const REGIOES_FRETE = [
{ faixa: [1000000, 19999999], nome: "São Paulo", base: 18.9, prazo: [2, 4] },
{ faixa: [20000000, 28999999], nome: "Rio de Janeiro", base: 22.9, prazo: [2, 5] },
{ faixa: [29000000, 29999999], nome: "Espírito Santo", base: 26.9, prazo: [3, 6] },
{ faixa: [30000000, 39999999], nome: "Minas Gerais", base: 24.9, prazo: [3, 6] },
{ faixa: [40000000, 48999999], nome: "Bahia", base: 34.9, prazo: [5, 9] },
{ faixa: [49000000, 56999999], nome: "Nordeste (SE/PE/AL)", base: 37.9, prazo: [5, 10] },
{ faixa: [57000000, 63999999], nome: "Nordeste (AL/CE)", base: 39.9, prazo: [6, 10] },
{ faixa: [64000000, 69999999], nome: "Norte", base: 49.9, prazo: [7, 13] },
{ faixa: [70000000, 76999999], nome: "Centro-Oeste (DF/GO)", base: 29.9, prazo: [4, 7] },
{ faixa: [77000000, 79999999], nome: "Centro-Oeste (TO/MS)", base: 33.9, prazo: [5, 8] },
{ faixa: [80000000, 87999999], nome: "Paraná", base: 23.9, prazo: [3, 6] },
{ faixa: [88000000, 89999999], nome: "Santa Catarina", base: 25.9, prazo: [3, 6] },
{ faixa: [90000000, 99999999], nome: "Rio Grande do Sul", base: 28.9, prazo: [4, 7] }
];

/* ---------------- navegação ---------------- */
function irPara(secao) {
$$(".secao").forEach((s) => s.classList.remove("ativa"));
$("#sec-" + secao)?.classList.add("ativa");
$$("#menu button, #menuMobile button").forEach((b) => {
b.classList.toggle("ativo", b.dataset.secao === secao);
});
$("#menuMobile")?.classList.remove("aberto");
$("#btnMenu")?.classList.remove("aberto");
window.scrollTo({ top: 0, behavior: "smooth" });
if (secao === "carrinho") { renderCarrinho(); preencherEnderecoDoUsuario(); }
if (secao === "conta") renderConta();
if (secao === "brotos") renderBrotos();
if (secao === "avaliacoes") renderAvaliacoes();
if (secao === "cursos") renderCursos();
}

/* ---------------- catálogo ---------------- */
function planta(id) { return CATALOGO.find((p) => p.id === id); }

function cardPlanta(p) {
const tagPet = p.petFriendly
? '<span class="tag pet">Pet friendly</span>'
: '<span class="tag toxica">Tóxica p/ pets</span>';
return `
<article class="card" data-planta-id="${p.id}">
<div class="card-figura">${figPlanta(p)}</div>
<div class="card-corpo">
<div>
<h3>${p.nome}</h3>
<div class="nome-cientifico">${p.cientifico}</div>
</div>
<div class="tags">
<span class="tag">${p.categoria}</span>
<span class="tag">${p.ambiente}</span>
${tagPet}
</div>
<p class="small muted">${(p.resumo || "").slice(0, 92)}…</p>
<div class="preco">${brl(p.preco)}</div>
<div class="card-rodape">
<button class="btn btn-sm" data-add="${p.id}">Adicionar</button>
<button class="btn btn-ghost btn-sm" data-detalhe="${p.id}">Detalhes</button>
</div>
</div>
</article>`;
}

function renderCatalogo() {
const termo = $("#busca").value.trim().toLowerCase();
const cat = $("#filtroCategoria").value;
const amb = $("#filtroAmbiente").value;
const luz = $("#filtroLuz").value;
const pet = $("#filtroPet").checked;
const ordem = $("#filtroOrdem").value;

let lista = CATALOGO.filter((p) => {
if (termo && !(p.nome + p.cientifico + p.categoria).toLowerCase().includes(termo)) return false;
if (cat && p.categoria !== cat) return false;
if (amb && p.ambiente !== amb) return false;
if (pet && !p.petFriendly) return false;
if (luz) {
const l = (p.luz || "").toLowerCase();
if (luz === "sol" && !l.includes("sol direto") && !l.includes("sol pleno")) return false;
if (luz === "indireta" && !l.includes("indireta")) return false;
if (luz === "sombra" && !l.includes("sombra")) return false;
}
return true;
});

if (ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
if (ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
if (ordem === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

$("#grade").innerHTML = lista.map(cardPlanta).join("");
$("#vazioCatalogo").style.display = lista.length ? "none" : "block";
}

async function abrirDetalhe(id) {
const p = planta(id);
if (!p) return;
let avs = [];
try {
const todas = await api("/avaliacoes");
avs = todas.filter((a) => a.plantaId === id);
} catch { /* ignore */ }
const media = avs.length ? (avs.reduce((s, a) => s + a.nota, 0) / avs.length).toFixed(1) : null;

$("#modalDetalhe").innerHTML = `
<button class="fechar" data-fechar>✕</button>
<div class="detalhe-topo">
<div class="detalhe-figura">${figPlanta(p)}</div>
<div>
<h2>${p.nome}</h2>
<div class="nome-cientifico">${p.cientifico}</div>
<div class="tags" style="margin-top:10px">
<span class="tag">${p.categoria}</span><span class="tag">${p.ambiente}</span>
<span class="tag">${p.dificuldade}</span>
${p.petFriendly ? '<span class="tag pet">Seguro para pets</span>' : '<span class="tag toxica">Tóxica para pets</span>'}
</div>
<div class="preco" style="margin-top:12px">${brl(p.preco)}</div>
${media ? `<div class="small"><span class="estrelas">${"★".repeat(Math.round(media))}</span> ${media} · ${avs.length} avaliação(ões)</div>` : '<div class="small muted">Ainda sem avaliações</div>'}
</div>
</div>
<h3 style="font-size:1rem">Do que ela gosta</h3>
<p class="muted" style="margin-top:6px">${p.resumo}</p>
<div class="blocos-info">
<div class="bloco-info"><span>Luz</span><strong>☀️ ${p.luz}</strong></div>
<div class="bloco-info"><span>Água / chuva</span><strong>💧 ${p.agua}</strong></div>
<div class="bloco-info"><span>Umidade</span><strong>🌫️ ${p.umidade}</strong></div>
<div class="bloco-info"><span>Porte adulto</span><strong>📏 ${p.porte}</strong></div>
<div class="bloco-info"><span>Dificuldade</span><strong>🧑‍🌾 ${p.dificuldade}</strong></div>
<div class="bloco-info"><span>Famílias com animais</span><strong>${p.petFriendly ? "Recomendada" : "Não recomendada"}</strong></div>
</div>
<h3 style="font-size:1rem">Um pouco da história</h3>
<div class="historia">${p.historia}</div>
<div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
<button class="btn" data-add="${p.id}">Adicionar ao carrinho</button>
<button class="btn btn-ghost" data-fechar>Continuar navegando</button>
</div>
${avs.length ? `<h3 style="font-size:1rem;margin-top:22px">O que dizem</h3>${avs.map(cardAvaliacao).join("")}` : ""}
`;
$("#overlayDetalhe").classList.add("aberto");
}

/* ---------------- carrinho ---------------- */
async function addCarrinho(id) {
const item = carrinho.find((i) => i.id === id);
if (item) item.qtd++;
else carrinho.push({ id, qtd: 1 });
await salvarCarrinho();
atualizarBadge();
toast(`${planta(id)?.nome || "Planta"} adicionada ao carrinho.`);
}

function atualizarBadge() {
const n = carrinho.reduce((s, i) => s + i.qtd, 0);
const b = $("#badgeCarrinho");
b.textContent = n;
b.classList.toggle("hidden", n === 0);
}

async function salvarCarrinho() {
if (!usuario) {
sessionStorage.setItem("rf_cart_visitante", JSON.stringify(carrinho));
return;
}
try {
await api("/carrinho", { method: "PUT", body: JSON.stringify(carrinho) });
} catch (e) {
console.warn("Falha ao salvar carrinho:", e.message);
}
}

async function carregarCarrinho() {
if (!usuario) {
carrinho = JSON.parse(sessionStorage.getItem("rf_cart_visitante") || "[]");
return;
}
try {
const itens = await api("/carrinho");
carrinho = itens.map((i) => ({ id: i.id, qtd: i.qtd }));
} catch {
carrinho = [];
}
}

function subtotal() {
return carrinho.reduce((s, i) => s + (planta(i.id)?.preco || 0) * i.qtd, 0);
}

function calcularTotais() {
const sub = subtotal();
let frete = freteCalc ? freteCalc.valor : 0;
let desconto = 0;
let embalagem = $("#chkPresente")?.checked ? 12.9 : 0;
const brindes = [];

recompensasAplicadas.forEach((rid) => {
const r = RECOMPENSAS.find((x) => x.id === rid);
if (!r) return;
if (r.tipo === "frete" || r.tipo === "expresso") frete = 0;
if (r.tipo === "desconto") desconto += r.valor;
if (r.tipo === "percentual") desconto += sub * (r.valor / 100);
if (r.tipo === "brinde") {
brindes.push(r.nome);
if (r.id === "r7") embalagem = 0;
}
});

if (sub >= 299 && freteCalc && freteCalc.modalidade === "padrao") frete = 0;
desconto = Math.min(desconto, sub);

let descontoPix = 0;
const baseAntesPix = sub - desconto + frete + embalagem;
if (metodoPagamento === "pix") descontoPix = baseAntesPix * 0.05;

const total = Math.max(0, baseAntesPix - descontoPix);
return { sub, frete, desconto, embalagem, descontoPix, total, brindes };
}

function preencherEnderecoDoUsuario() {
if (!usuario?.endereco) return;
const e = usuario.endereco;
const setIfEmpty = (id, val) => {
const el = $(id);
if (!el || !val) return;
if (!String(el.value || "").trim()) el.value = val;
};
setIfEmpty("#cep", e.cep);
setIfEmpty("#bairro", e.bairro);
setIfEmpty("#cidade", e.cidade);
setIfEmpty("#complemento", e.complemento);
let rua = (e.rua || "").trim();
let numero = (e.numero || "").trim();
if (!numero && rua) {
const m = rua.match(/^(.*?)[,\s]+(\d+[A-Za-z\-\/]*)$/);
if (m) { rua = m[1].trim(); numero = m[2].trim(); }
}
setIfEmpty("#rua", rua);
setIfEmpty("#numero", numero);
}

function renderCarrinho() {
const cont = $("#itensCarrinho");
if (!carrinho.length) {
cont.innerHTML = `<div class="carrinho-vazio">
<div class="vaso-ico" aria-hidden="true">
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 28c0-2 1.5-4 4-5.5C26 20 30 18 32 18s6 2 10 4.5c2.5 1.5 4 3.5 4 5.5v2H18v-2z" fill="currentColor" opacity="0.25"/>
<path d="M20 30h24l-2.5 22a4 4 0 01-4 3.5H26.5a4 4 0 01-4-3.5L20 30z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="currentColor" opacity="0.18"/>
<path d="M20 30h24l-2.5 22a4 4 0 01-4 3.5H26.5a4 4 0 01-4-3.5L20 30z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M24 30v-1.5c0-3 3.5-6 8-6s8 3 8 6V30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<circle cx="32" cy="14" r="2.5" fill="currentColor" opacity="0.35"/>
<path d="M32 16.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
</svg>
</div>
<p>Seu carrinho ainda está vazio — que tal escolher a primeira plantinha?</p>
<button class="btn btn-sm" data-ir="catalogo">Explorar o catálogo</button>
</div>`;
} else {
cont.innerHTML = carrinho.map((i) => {
const p = planta(i.id);
if (!p) return "";
return `<div class="linha-item">
<div class="mini-figura">${figPlanta(p)}</div>
<div>
<strong>${p.nome}</strong>
<div class="nome-cientifico">${p.cientifico}</div>
<div class="qtd" style="margin-top:6px">
<button data-menos="${p.id}">−</button><span>${i.qtd}</span><button data-mais="${p.id}">+</button>
</div>
</div>
<div style="text-align:right">
<div class="preco" style="font-size:1rem">${brl(p.preco * i.qtd)}</div>
<button class="btn btn-ghost btn-sm" data-remover="${p.id}" style="margin-top:6px">Remover</button>
</div>
</div>`;
}).join("");
}
renderRecompensasCarrinho();
renderPagamento();
renderResumo();
preencherEnderecoDoUsuario();
}

function renderResumo() {
const t = calcularTotais();
const linhas = [
`<div class="resumo-linha"><span>Subtotal</span><span>${brl(t.sub)}</span></div>`,
t.embalagem ? `<div class="resumo-linha"><span>Embalagem presente</span><span>${brl(t.embalagem)}</span></div>` : "",
`<div class="resumo-linha"><span>Frete${freteCalc ? " · " + freteCalc.regiao : ""}</span><span>${freteCalc ? (t.frete === 0 ? "Grátis" : brl(t.frete)) : "calcule o CEP"}</span></div>`,
t.desconto ? `<div class="resumo-linha"><span>Recompensas</span><span>− ${brl(t.desconto)}</span></div>` : "",
t.descontoPix ? `<div class="resumo-linha"><span>Desconto Pix (5%)</span><span>− ${brl(t.descontoPix)}</span></div>` : "",
t.brindes.length ? `<div class="resumo-linha"><span>Brindes</span><span>${t.brindes.length} item(ns)</span></div>` : "",
`<div class="resumo-linha total"><span>Total</span><span>${brl(t.total)}</span></div>`,
`<p class="small muted" style="margin-top:8px">Você ganhará <strong>${Math.floor(t.total)} Brotos</strong> nesta compra.</p>`,
t.brindes.length ? `<div class="aviso" style="margin-top:10px">🎁 ${t.brindes.join(" · ")}</div>` : ""
];
$("#resumo").innerHTML = linhas.join("");
}

/* PLACEHOLDER_REST_OF_FILE - will continue */

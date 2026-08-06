/**
 * Popula o banco com catálogo, cursos, recompensas e FAQ
 * Rode: node seed.js
 */
const db = require("./db");
const path = require("path");

// Carrega os dados estáticos do frontend (mesmo arquivo)
const dadosPathFlat = path.join(__dirname, "dados.js");
const dadosPathNested = path.join(__dirname, "..", "frontend", "dados.js");
const dadosPath = require("fs").existsSync(dadosPathFlat) ? dadosPathFlat : dadosPathNested;
const codigo = require("fs").readFileSync(dadosPath, "utf8");

// Avalia de forma segura o módulo dados.js (só declara const)
const sandbox = {};
const vm = require("vm");
vm.createContext(sandbox);
vm.runInContext(codigo + "\n; this.CATALOGO = CATALOGO; this.CURSOS = CURSOS; this.RECOMPENSAS = RECOMPENSAS; this.FAQ = FAQ;", sandbox);

const { CATALOGO, CURSOS, RECOMPENSAS, FAQ } = sandbox;

const insertPlanta = db.prepare(`
  INSERT OR REPLACE INTO plantas
  (id, nome, cientifico, emoji, imagem, preco, categoria, ambiente, luz, agua, umidade, porte, dificuldade, pet_friendly, resumo, historia)
  VALUES (@id, @nome, @cientifico, @emoji, @imagem, @preco, @categoria, @ambiente, @luz, @agua, @umidade, @porte, @dificuldade, @pet_friendly, @resumo, @historia)
`);

const insertCurso = db.prepare(`
  INSERT OR REPLACE INTO cursos (id, titulo, nivel, duracao, emoji, descricao, link, brotos)
  VALUES (@id, @titulo, @nivel, @duracao, @emoji, @descricao, @link, @brotos)
`);

const insertAula = db.prepare(`
  INSERT OR IGNORE INTO curso_aulas (curso_id, ordem, titulo) VALUES (?, ?, ?)
`);

const insertRecompensa = db.prepare(`
  INSERT OR REPLACE INTO recompensas (id, nome, descricao, custo, emoji, tipo, valor)
  VALUES (@id, @nome, @descricao, @custo, @emoji, @tipo, @valor)
`);

const insertFaq = db.prepare(`
  INSERT INTO faq (pergunta, resposta, ordem) VALUES (?, ?, ?)
`);

const run = db.transaction(() => {
  // Limpa dados estáticos para re-seed limpo
  // Recria plantas para garantir coluna imagem em bancos antigos
  db.exec("DELETE FROM curso_aulas; DELETE FROM cursos; DELETE FROM recompensas; DELETE FROM faq;");
  db.exec("DROP TABLE IF EXISTS plantas;");
  db.exec(`CREATE TABLE plantas (
  id TEXT PRIMARY KEY, nome TEXT NOT NULL, cientifico TEXT NOT NULL, emoji TEXT, imagem TEXT,
  preco REAL NOT NULL, categoria TEXT NOT NULL, ambiente TEXT NOT NULL, luz TEXT NOT NULL,
  agua TEXT NOT NULL, umidade TEXT NOT NULL, porte TEXT NOT NULL, dificuldade TEXT NOT NULL,
  pet_friendly INTEGER NOT NULL DEFAULT 0, resumo TEXT, historia TEXT, ativo INTEGER NOT NULL DEFAULT 1
)`);

  for (const p of CATALOGO) {
    insertPlanta.run({
      id: p.id,
      nome: p.nome,
      cientifico: p.cientifico,
      emoji: p.emoji,
      imagem: p.imagem || null,
      preco: p.preco,
      categoria: p.categoria,
      ambiente: p.ambiente,
      luz: p.luz,
      agua: p.agua,
      umidade: p.umidade,
      porte: p.porte,
      dificuldade: p.dificuldade,
      pet_friendly: p.petFriendly ? 1 : 0,
      resumo: p.resumo,
      historia: p.historia
    });
  }

  for (const c of CURSOS) {
    insertCurso.run({
      id: c.id,
      titulo: c.titulo,
      nivel: c.nivel,
      duracao: c.duracao,
      emoji: c.emoji,
      descricao: c.descricao,
      link: c.link,
      brotos: c.brotos
    });
    c.aulas.forEach((titulo, i) => insertAula.run(c.id, i, titulo));
  }

  for (const r of RECOMPENSAS) {
    insertRecompensa.run({
      id: r.id,
      nome: r.nome,
      descricao: r.desc,
      custo: r.custo,
      emoji: r.emoji,
      tipo: r.tipo,
      valor: r.valor ?? null
    });
  }

  FAQ.forEach((f, i) => insertFaq.run(f.q, f.a, i));
});

run();
console.log(`Seed OK: ${CATALOGO.length} plantas, ${CURSOS.length} cursos, ${RECOMPENSAS.length} recompensas, ${FAQ.length} FAQs.`);

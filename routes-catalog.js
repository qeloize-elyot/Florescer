/**
 * Catálogo, cursos, meta, FAQ e recompensas
 * Tenta o banco; se falhar ou estiver vazio, usa dados.js
 */
const { loadStaticData, mapPlantaStatic } = require("./static-data");

module.exports = function registerCatalog(app, { db, optionalAuth }) {
  const staticData = loadStaticData();

  function filtrarPlantas(lista, query) {
    const { busca, categoria, ambiente, luz, pet, ordem } = query || {};
    let out = lista.slice();
    if (busca && typeof busca === "string") {
      const t = busca.toLowerCase().slice(0, 80);
      out = out.filter(
        (p) =>
          (p.nome || "").toLowerCase().includes(t) ||
          (p.cientifico || "").toLowerCase().includes(t) ||
          (p.categoria || "").toLowerCase().includes(t)
      );
    }
    if (categoria) out = out.filter((p) => p.categoria === categoria);
    if (ambiente) out = out.filter((p) => p.ambiente === ambiente);
    if (pet === "1" || pet === "true") out = out.filter((p) => p.petFriendly);
    if (luz) {
      out = out.filter((p) => {
        const l = (p.luz || "").toLowerCase();
        if (luz === "sol") return l.includes("sol direto") || l.includes("sol pleno");
        if (luz === "indireta") return l.includes("indireta");
        if (luz === "sombra") return l.includes("sombra");
        return true;
      });
    }
    if (ordem === "menor") out.sort((a, b) => a.preco - b.preco);
    else if (ordem === "maior") out.sort((a, b) => b.preco - a.preco);
    else if (ordem === "nome") out.sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
    return out;
  }

  app.get("/api/plantas", async (req, res) => {
    try {
      const { rows } = await db.query("SELECT * FROM plantas WHERE COALESCE(ativo, 1) = 1");
      if (rows && rows.length) {
        let lista = rows.map((p) => ({
          id: p.id,
          nome: p.nome,
          cientifico: p.cientifico,
          emoji: p.emoji,
          imagem: p.imagem || null,
          preco: Number(p.preco),
          categoria: p.categoria,
          ambiente: p.ambiente,
          luz: p.luz,
          agua: p.agua,
          umidade: p.umidade,
          porte: p.porte,
          dificuldade: p.dificuldade,
          petFriendly: !!p.pet_friendly,
          resumo: p.resumo,
          historia: p.historia
        }));
        lista = filtrarPlantas(lista, req.query);
        return res.json(lista);
      }
    } catch (e) {
      console.warn("[catalog] plantas DB:", e.message);
    }
    const lista = filtrarPlantas(staticData.CATALOGO.map(mapPlantaStatic), req.query);
    res.json(lista);
  });

  app.get("/api/plantas/:id", async (req, res) => {
    const id = String(req.params.id).slice(0, 20);
    try {
      const { rows } = await db.query("SELECT * FROM plantas WHERE id = $1", [id]);
      if (rows[0]) {
        const p = rows[0];
        return res.json({
          id: p.id,
          nome: p.nome,
          cientifico: p.cientifico,
          emoji: p.emoji,
          imagem: p.imagem || null,
          preco: Number(p.preco),
          categoria: p.categoria,
          ambiente: p.ambiente,
          luz: p.luz,
          agua: p.agua,
          umidade: p.umidade,
          porte: p.porte,
          dificuldade: p.dificuldade,
          petFriendly: !!p.pet_friendly,
          resumo: p.resumo,
          historia: p.historia
        });
      }
    } catch (e) {
      console.warn("[catalog] planta DB:", e.message);
    }
    const p = staticData.CATALOGO.find((x) => x.id === id);
    if (!p) return res.status(404).json({ erro: "Planta não encontrada" });
    res.json(mapPlantaStatic(p));
  });

  app.get("/api/cursos", async (req, res) => {
    try {
      const { rows: cursos } = await db.query("SELECT * FROM cursos ORDER BY id");
      if (cursos && cursos.length) {
        const out = [];
        for (const c of cursos) {
          let aulas = [];
          try {
            const { rows: aulasRows } = await db.query(
              "SELECT titulo, ordem FROM curso_aulas WHERE curso_id = $1 ORDER BY ordem",
              [c.id]
            );
            aulas = aulasRows.map((a) => a.titulo);
          } catch (_) {}
          let progresso = { aulas: [], concluido: false, codigo: null, dataConclusao: null };
          if (req.user) {
            try {
              const { rows: progRows } = await db.query(
                "SELECT * FROM usuario_cursos WHERE usuario_id = $1 AND curso_id = $2",
                [req.user.id, c.id]
              );
              const reg = progRows[0];
              if (reg) {
                progresso = {
                  aulas: JSON.parse(reg.aulas_feitas || "[]"),
                  concluido: !!reg.concluido,
                  codigo: reg.codigo,
                  dataConclusao: reg.data_conclusao
                };
              }
            } catch (_) {}
          }
          out.push({
            id: c.id,
            titulo: c.titulo,
            nivel: c.nivel,
            duracao: c.duracao,
            emoji: c.emoji,
            imagem: c.imagem || null,
            descricao: c.descricao,
            link: c.link,
            brotos: c.brotos,
            aulas,
            progresso
          });
        }
        return res.json(out);
      }
    } catch (e) {
      console.warn("[catalog] cursos DB:", e.message);
    }
    res.json(
      staticData.CURSOS.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        nivel: c.nivel,
        duracao: c.duracao,
        emoji: c.emoji,
        imagem: c.imagem || null,
        descricao: c.descricao,
        link: c.link,
        brotos: c.brotos,
        aulas: c.aulas || [],
        progresso: { aulas: [], concluido: false, codigo: null, dataConclusao: null }
      }))
    );
  });

  app.get("/api/recompensas", async (req, res) => {
    try {
      const { rows } = await db.query("SELECT * FROM recompensas ORDER BY custo ASC");
      if (rows && rows.length) {
        return res.json(
          rows.map((r) => ({
            id: r.id,
            nome: r.nome,
            desc: r.descricao,
            custo: r.custo,
            emoji: r.emoji,
            tipo: r.tipo,
            valor: r.valor
          }))
        );
      }
    } catch (e) {
      console.warn("[catalog] recompensas DB:", e.message);
    }
    res.json(staticData.RECOMPENSAS || []);
  });

  app.get("/api/faq", async (req, res) => {
    try {
      const { rows } = await db.query("SELECT pergunta AS q, resposta AS a FROM faq ORDER BY ordem");
      if (rows && rows.length) return res.json(rows);
    } catch (e) {
      console.warn("[catalog] faq DB:", e.message);
    }
    res.json(staticData.FAQ || []);
  });

  app.get("/api/meta", async (req, res) => {
    try {
      const { rows: catRows } = await db.query("SELECT DISTINCT categoria FROM plantas ORDER BY categoria");
      const { rows: ambRows } = await db.query("SELECT DISTINCT ambiente FROM plantas ORDER BY ambiente");
      if (catRows.length || ambRows.length) {
        return res.json({
          categorias: catRows.map((r) => r.categoria),
          ambientes: ambRows.map((r) => r.ambiente)
        });
      }
    } catch (e) {
      console.warn("[catalog] meta DB:", e.message);
    }
    const cats = [...new Set(staticData.CATALOGO.map((p) => p.categoria).filter(Boolean))].sort();
    const ambs = [...new Set(staticData.CATALOGO.map((p) => p.ambiente).filter(Boolean))].sort();
    res.json({ categorias: cats, ambientes: ambs });
  });

  // optionalAuth para cursos — se existir
  if (typeof optionalAuth === "function") {
    // re-register is fine; first matching stack may still be old.
    // boot.js removes old GET handlers for these paths.
  }
};

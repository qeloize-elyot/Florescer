/**
 * Rotas administrativas (role = admin)
 */
module.exports = function registerAdmin(app, { auth, db, clean }) {
  function requireAdmin(req, res, next) {
    const role = String(req.user?.role || "cliente").toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ erro: "Acesso restrito a administradores." });
    }
    next();
  }

  function novoIdPlanta() {
    return "p" + Date.now().toString(36).slice(-6);
  }
  function novoIdCurso() {
    return "c" + Date.now().toString(36).slice(-5);
  }

  // ---- Plantas ----
  app.get("/api/admin/plantas", auth, requireAdmin, async (req, res, next) => {
    try {
      const { rows } = await db.query("SELECT * FROM plantas ORDER BY id");
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/plantas", auth, requireAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      const id = clean(b.id, 20) || novoIdPlanta();
      const nome = clean(b.nome, 80);
      if (!nome) return res.status(400).json({ erro: "Nome obrigatório." });
      const preco = Number(b.preco);
      if (!(preco >= 0)) return res.status(400).json({ erro: "Preço inválido." });

      await db.query(
        `INSERT INTO plantas (
          id, nome, cientifico, emoji, imagem, preco, categoria, ambiente,
          luz, agua, umidade, porte, dificuldade, pet_friendly, resumo, historia, ativo
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET
          nome=EXCLUDED.nome, cientifico=EXCLUDED.cientifico, emoji=EXCLUDED.emoji,
          imagem=EXCLUDED.imagem, preco=EXCLUDED.preco, categoria=EXCLUDED.categoria,
          ambiente=EXCLUDED.ambiente, luz=EXCLUDED.luz, agua=EXCLUDED.agua,
          umidade=EXCLUDED.umidade, porte=EXCLUDED.porte, dificuldade=EXCLUDED.dificuldade,
          pet_friendly=EXCLUDED.pet_friendly, resumo=EXCLUDED.resumo, historia=EXCLUDED.historia,
          ativo=EXCLUDED.ativo`,
        [
          id,
          nome,
          clean(b.cientifico, 120) || nome,
          clean(b.emoji, 8) || "🌿",
          clean(b.imagem, 500) || null,
          preco,
          clean(b.categoria, 40) || "Folhagem",
          clean(b.ambiente, 40) || "Interno",
          clean(b.luz, 80) || "Luz indireta",
          clean(b.agua, 80) || "Regar quando o solo secar",
          clean(b.umidade, 40) || "Média",
          clean(b.porte, 40) || "Médio",
          clean(b.dificuldade, 40) || "Fácil",
          b.petFriendly || b.pet_friendly ? 1 : 0,
          clean(b.resumo, 800) || "",
          clean(b.historia, 1200) || "",
          b.ativo === false || b.ativo === 0 ? 0 : 1
        ]
      );
      const { rows } = await db.query("SELECT * FROM plantas WHERE id = $1", [id]);
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/admin/plantas/:id", auth, requireAdmin, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 20);
      const b = req.body || {};
      const { rows: exist } = await db.query("SELECT id FROM plantas WHERE id = $1", [id]);
      if (!exist[0]) return res.status(404).json({ erro: "Planta não encontrada." });

      await db.query(
        `UPDATE plantas SET
          nome = COALESCE($2, nome),
          cientifico = COALESCE($3, cientifico),
          emoji = COALESCE($4, emoji),
          imagem = COALESCE($5, imagem),
          preco = COALESCE($6, preco),
          categoria = COALESCE($7, categoria),
          ambiente = COALESCE($8, ambiente),
          luz = COALESCE($9, luz),
          agua = COALESCE($10, agua),
          umidade = COALESCE($11, umidade),
          porte = COALESCE($12, porte),
          dificuldade = COALESCE($13, dificuldade),
          pet_friendly = COALESCE($14, pet_friendly),
          resumo = COALESCE($15, resumo),
          historia = COALESCE($16, historia),
          ativo = COALESCE($17, ativo)
        WHERE id = $1`,
        [
          id,
          b.nome != null ? clean(b.nome, 80) : null,
          b.cientifico != null ? clean(b.cientifico, 120) : null,
          b.emoji != null ? clean(b.emoji, 8) : null,
          b.imagem != null ? clean(b.imagem, 500) : null,
          b.preco != null ? Number(b.preco) : null,
          b.categoria != null ? clean(b.categoria, 40) : null,
          b.ambiente != null ? clean(b.ambiente, 40) : null,
          b.luz != null ? clean(b.luz, 80) : null,
          b.agua != null ? clean(b.agua, 80) : null,
          b.umidade != null ? clean(b.umidade, 40) : null,
          b.porte != null ? clean(b.porte, 40) : null,
          b.dificuldade != null ? clean(b.dificuldade, 40) : null,
          b.petFriendly != null || b.pet_friendly != null
            ? b.petFriendly || b.pet_friendly
              ? 1
              : 0
            : null,
          b.resumo != null ? clean(b.resumo, 800) : null,
          b.historia != null ? clean(b.historia, 1200) : null,
          b.ativo != null ? (b.ativo === false || b.ativo === 0 ? 0 : 1) : null
        ]
      );
      const { rows } = await db.query("SELECT * FROM plantas WHERE id = $1", [id]);
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/plantas/:id", auth, requireAdmin, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 20);
      // soft delete
      await db.query("UPDATE plantas SET ativo = 0 WHERE id = $1", [id]);
      res.json({ ok: true, id, ativo: 0 });
    } catch (err) {
      next(err);
    }
  });

  // ---- Cursos ----
  app.get("/api/admin/cursos", auth, requireAdmin, async (req, res, next) => {
    try {
      const { rows } = await db.query("SELECT * FROM cursos ORDER BY id");
      const out = [];
      for (const c of rows) {
        const { rows: aulas } = await db.query(
          "SELECT titulo, ordem FROM curso_aulas WHERE curso_id = $1 ORDER BY ordem",
          [c.id]
        );
        out.push({ ...c, aulas: aulas.map((a) => a.titulo) });
      }
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/cursos", auth, requireAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      const id = clean(b.id, 20) || novoIdCurso();
      const titulo = clean(b.titulo, 120);
      if (!titulo) return res.status(400).json({ erro: "Título obrigatório." });
      const aulas = Array.isArray(b.aulas) ? b.aulas.map((t) => clean(String(t), 200)).filter(Boolean) : [];

      await db.query(
        `INSERT INTO cursos (id, titulo, nivel, duracao, emoji, imagem, descricao, link, brotos)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           titulo=EXCLUDED.titulo, nivel=EXCLUDED.nivel, duracao=EXCLUDED.duracao,
           emoji=EXCLUDED.emoji, imagem=EXCLUDED.imagem, descricao=EXCLUDED.descricao,
           link=EXCLUDED.link, brotos=EXCLUDED.brotos`,
        [
          id,
          titulo,
          clean(b.nivel, 40) || "Iniciante",
          clean(b.duracao, 40) || "1h",
          clean(b.emoji, 8) || "📚",
          clean(b.imagem, 500) || null,
          clean(b.descricao, 2000) || "",
          clean(b.link, 500) || "",
          Number(b.brotos) || 0
        ]
      );

      await db.query("DELETE FROM curso_aulas WHERE curso_id = $1", [id]);
      for (let i = 0; i < aulas.length; i++) {
        await db.query(
          "INSERT INTO curso_aulas (curso_id, ordem, titulo) VALUES ($1,$2,$3)",
          [id, i, aulas[i]]
        );
      }

      res.status(201).json({ id, titulo, aulas });
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/admin/cursos/:id", auth, requireAdmin, async (req, res, next) => {
    req.body = { ...(req.body || {}), id: req.params.id };
    // reutiliza POST com id fixo
    req.url = "/api/admin/cursos";
    // chama lógica inline
    try {
      const b = req.body || {};
      const id = clean(req.params.id, 20);
      const { rows: exist } = await db.query("SELECT id FROM cursos WHERE id = $1", [id]);
      if (!exist[0]) return res.status(404).json({ erro: "Curso não encontrado." });

      await db.query(
        `UPDATE cursos SET
          titulo = COALESCE($2, titulo),
          nivel = COALESCE($3, nivel),
          duracao = COALESCE($4, duracao),
          emoji = COALESCE($5, emoji),
          imagem = COALESCE($6, imagem),
          descricao = COALESCE($7, descricao),
          link = COALESCE($8, link),
          brotos = COALESCE($9, brotos)
        WHERE id = $1`,
        [
          id,
          b.titulo != null ? clean(b.titulo, 120) : null,
          b.nivel != null ? clean(b.nivel, 40) : null,
          b.duracao != null ? clean(b.duracao, 40) : null,
          b.emoji != null ? clean(b.emoji, 8) : null,
          b.imagem != null ? clean(b.imagem, 500) : null,
          b.descricao != null ? clean(b.descricao, 2000) : null,
          b.link != null ? clean(b.link, 500) : null,
          b.brotos != null ? Number(b.brotos) : null
        ]
      );

      if (Array.isArray(b.aulas)) {
        const aulas = b.aulas.map((t) => clean(String(t), 200)).filter(Boolean);
        await db.query("DELETE FROM curso_aulas WHERE curso_id = $1", [id]);
        for (let i = 0; i < aulas.length; i++) {
          await db.query(
            "INSERT INTO curso_aulas (curso_id, ordem, titulo) VALUES ($1,$2,$3)",
            [id, i, aulas[i]]
          );
        }
      }

      res.json({ ok: true, id });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/cursos/:id", auth, requireAdmin, async (req, res, next) => {
    try {
      const id = clean(req.params.id, 20);
      await db.query("DELETE FROM curso_aulas WHERE curso_id = $1", [id]);
      await db.query("DELETE FROM cursos WHERE id = $1", [id]);
      res.json({ ok: true, id });
    } catch (err) {
      next(err);
    }
  });

  // lista todos os pedidos (admin)
  app.get("/api/admin/pedidos", auth, requireAdmin, async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT p.*, u.nome AS cliente_nome, u.email AS cliente_email
         FROM pedidos p
         LEFT JOIN usuarios u ON u.id = p.usuario_id
         ORDER BY p.data DESC NULLS LAST
         LIMIT 100`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
};

-- =========================================================
-- Florescer — Schema do banco de dados
-- Compatível com SQLite, PostgreSQL e MySQL (ajuste tipos se necessário)
-- =========================================================

-- ---------- Usuários / contas ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  -- ou SERIAL / BIGSERIAL no Postgres
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  senha_hash    TEXT        NOT NULL,               -- bcrypt (nunca armazene senha em texto puro)
  brotos        INTEGER     NOT NULL DEFAULT 100,
  criado_em     TEXT        NOT NULL DEFAULT (datetime('now')),
  -- endereço salvo (opcional)
  cep           TEXT,
  rua           TEXT,
  bairro        TEXT,
  cidade        TEXT,
  complemento   TEXT
);

-- ---------- Catálogo de plantas (dados estáticos + estoque futuro) ----------
CREATE TABLE IF NOT EXISTS plantas (
  id            TEXT        PRIMARY KEY,            -- p01, p02...
  nome          TEXT        NOT NULL,
  cientifico    TEXT        NOT NULL,
  emoji         TEXT,
  imagem        TEXT,                               -- URL da foto da planta
  preco         REAL        NOT NULL,
  categoria     TEXT        NOT NULL,
  ambiente      TEXT        NOT NULL,
  luz           TEXT        NOT NULL,
  agua          TEXT        NOT NULL,
  umidade       TEXT        NOT NULL,
  porte         TEXT        NOT NULL,
  dificuldade   TEXT        NOT NULL,
  pet_friendly  INTEGER     NOT NULL DEFAULT 0,     -- 0 = false, 1 = true
  resumo        TEXT,
  historia      TEXT,
  ativo         INTEGER     NOT NULL DEFAULT 1
);

-- ---------- Cursos ----------
CREATE TABLE IF NOT EXISTS cursos (
  id            TEXT        PRIMARY KEY,            -- c1, c2...
  titulo        TEXT        NOT NULL,
  nivel         TEXT        NOT NULL,
  duracao       TEXT        NOT NULL,
  emoji         TEXT,
  imagem        TEXT,                               -- URL da capa do curso
  descricao     TEXT,
  link          TEXT,
  brotos        INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS curso_aulas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  curso_id      TEXT        NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  ordem         INTEGER     NOT NULL,
  titulo        TEXT        NOT NULL,
  UNIQUE (curso_id, ordem)
);

-- Progresso do usuário em cada curso
CREATE TABLE IF NOT EXISTS usuario_cursos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  curso_id      TEXT        NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  aulas_feitas  TEXT        NOT NULL DEFAULT '[]',  -- JSON array de índices [0,1,2]
  concluido     INTEGER     NOT NULL DEFAULT 0,
  data_conclusao TEXT,
  codigo        TEXT,                               -- FL-C1-XXXX
  UNIQUE (usuario_id, curso_id)
);

-- ---------- Recompensas (catálogo de prêmios) ----------
CREATE TABLE IF NOT EXISTS recompensas (
  id            TEXT        PRIMARY KEY,            -- r1, r2...
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  custo         INTEGER     NOT NULL,
  emoji         TEXT,
  tipo          TEXT        NOT NULL,               -- frete | desconto | percentual | brinde | expresso
  valor         REAL                                -- valor do desconto ou %
);

-- Resgates feitos pelo usuário (ainda não usados ou já usados)
CREATE TABLE IF NOT EXISTS resgates (
  id            TEXT        PRIMARY KEY,            -- uid gerado
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  recompensa_id TEXT        NOT NULL REFERENCES recompensas(id),
  usado         INTEGER     NOT NULL DEFAULT 0,
  data          TEXT        NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Carrinho (persistido no servidor) ----------
CREATE TABLE IF NOT EXISTS carrinho_itens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  planta_id     TEXT        NOT NULL REFERENCES plantas(id),
  quantidade    INTEGER     NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  UNIQUE (usuario_id, planta_id)
);

-- ---------- Pedidos ----------
CREATE TABLE IF NOT EXISTS pedidos (
  id            TEXT        PRIMARY KEY,            -- FL12345678
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios(id),
  data          TEXT        NOT NULL DEFAULT (datetime('now')),
  status        TEXT        NOT NULL DEFAULT 'Em preparo',
  subtotal      REAL        NOT NULL,
  frete         REAL        NOT NULL DEFAULT 0,
  desconto      REAL        NOT NULL DEFAULT 0,
  embalagem     REAL        NOT NULL DEFAULT 0,
  desconto_pix  REAL        NOT NULL DEFAULT 0,
  total         REAL        NOT NULL,
  brotos_ganhos INTEGER     NOT NULL DEFAULT 0,
  -- frete
  frete_regiao  TEXT,
  frete_prazo_min INTEGER,
  frete_prazo_max INTEGER,
  frete_modalidade TEXT,
  -- endereço de entrega
  cep           TEXT,
  rua           TEXT,
  numero        TEXT,
  bairro        TEXT,
  cidade        TEXT,
  complemento   TEXT,
  -- pagamento
  pagamento_metodo TEXT NOT NULL,                   -- pix | cartao | boleto
  pagamento_parcelas INTEGER DEFAULT 1,
  -- presente
  presente_para TEXT,
  presente_de   TEXT,
  presente_msg  TEXT,
  presente_ocultar INTEGER DEFAULT 0,
  avaliado      INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id     TEXT        NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  planta_id     TEXT        NOT NULL,
  nome          TEXT        NOT NULL,
  quantidade    INTEGER     NOT NULL,
  preco_unitario REAL       NOT NULL
);

-- ---------- Avaliações ----------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id            TEXT        PRIMARY KEY,
  usuario_id    INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
  planta_id     TEXT        NOT NULL REFERENCES plantas(id),
  nota          INTEGER     NOT NULL CHECK (nota BETWEEN 1 AND 5),
  texto         TEXT        NOT NULL,
  autor         TEXT        NOT NULL,
  data          TEXT        NOT NULL DEFAULT (datetime('now'))
);

-- ---------- FAQ (opcional no banco; pode continuar no front) ----------
CREATE TABLE IF NOT EXISTS faq (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pergunta      TEXT        NOT NULL,
  resposta      TEXT        NOT NULL,
  ordem         INTEGER     DEFAULT 0
);

-- ---------- Índices úteis ----------
CREATE INDEX IF NOT EXISTS idx_plantas_categoria ON plantas(categoria);
CREATE INDEX IF NOT EXISTS idx_plantas_ambiente  ON plantas(ambiente);
CREATE INDEX IF NOT EXISTS idx_plantas_pet       ON plantas(pet_friendly);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario   ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_planta ON avaliacoes(planta_id);
CREATE INDEX IF NOT EXISTS idx_resgates_usuario  ON resgates(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_usuario  ON carrinho_itens(usuario_id);

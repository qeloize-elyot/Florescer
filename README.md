# Florescer — Loja de plantas com banco de dados

Projeto migrado de **localStorage** para **API REST + SQLite**.

## O que foi corrigido e alterado

### Erro corrigido
- Em `dados.js` faltava uma **vírgula** entre a planta `p18` (Rosa-do-deserto) e a `p19` (Jiboia-prateada). Isso quebrava o JavaScript.

### Arquitetura nova

```
artifacts/
├── schema.sql          ← modelo do banco (SQLite / Postgres / MySQL)
├── backend/
│   ├── db.js           ← conexão SQLite
│   ├── seed.js         ← popula plantas, cursos, recompensas, FAQ
│   ├── server.js       ← API Express (auth, catálogo, pedidos…)
│   └── package.json
└── frontend/
    ├── index.html
    ├── styles.css
    ├── dados.js        ← ainda usado pelo seed
    └── app.js          ← consome a API (não grava mais no localStorage)
```

### Tabelas principais
| Tabela            | Uso                                      |
|-------------------|------------------------------------------|
| `usuarios`        | Contas (senha com **bcrypt**)            |
| `plantas`         | Catálogo                                 |
| `cursos` + `curso_aulas` | Cursos e lista de aulas           |
| `usuario_cursos`  | Progresso e certificado                  |
| `recompensas`     | Catálogo de prêmios em Brotos            |
| `resgates`        | Prêmios resgatados pelo usuário          |
| `carrinho_itens`  | Carrinho persistido no servidor         |
| `pedidos` + `pedido_itens` | Pedidos finalizados              |
| `avaliacoes`      | Reviews (+50 Brotos)                     |
| `faq`             | Perguntas frequentes                     |

Senhas **nunca** são salvas em texto puro (bcrypt). Autenticação via **JWT**.

---

## Como rodar

### 1. Instalar dependências do backend

```bash
cd backend
npm install express better-sqlite3 cors bcryptjs jsonwebtoken
```

### 2. Popular o banco

```bash
node seed.js
```

Isso cria `backend/data/florescer.db` e importa as 30 plantas, 6 cursos, 8 recompensas e o FAQ a partir de `frontend/dados.js`.

### 3. Subir a API (e o frontend)

```bash
node server.js
```

Abra: **http://localhost:3001**

A API serve o frontend estático e as rotas em `/api/*`.

---

## Principais rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Criar conta (+100 Brotos) |
| POST | `/api/auth/login` | — | Login → JWT |
| GET  | `/api/me` | ✓ | Dados do usuário logado |
| GET  | `/api/plantas` | — | Catálogo (filtros por query) |
| GET  | `/api/cursos` | opcional | Cursos + progresso se logado |
| POST | `/api/cursos/:id/aulas` | ✓ | Marcar aula |
| POST | `/api/cursos/:id/concluir` | ✓ | Certificado + Brotos |
| GET  | `/api/recompensas` | — | Lista de prêmios |
| POST | `/api/resgates` | ✓ | Resgatar com Brotos |
| GET/PUT | `/api/carrinho` | ✓ | Carrinho no servidor |
| POST | `/api/pedidos` | ✓ | Finalizar compra |
| GET  | `/api/pedidos` | ✓ | Histórico |
| GET/POST | `/api/avaliacoes` | POST ✓ | Avaliações |
| GET  | `/api/faq` | — | FAQ |

---

## Migrar para PostgreSQL / MySQL

1. Ajuste os tipos em `schema.sql` (`INTEGER` → `SERIAL`, `TEXT` → `VARCHAR`/`TIMESTAMP`, etc.).
2. Troque `better-sqlite3` por `pg` ou `mysql2`.
3. Reescreva as queries em `server.js` (placeholders `$1` no Postgres, `?` no MySQL).
4. O restante da lógica (rotas, JWT, bcrypt) permanece igual.

---

## Segurança (produção)

- Defina `JWT_SECRET` e `PORT` por variável de ambiente.
- Use HTTPS.
- Rate-limit em login/register.
- Não confie no total enviado pelo front: o backend **recalcula** subtotal, descontos e frete no `POST /api/pedidos`.

---

## Frontend (`app.js`)

O `app.js` foi **totalmente reescrito** para consumir a API:

- Guarda **apenas o JWT** no `localStorage`.
- Carrinho de visitante fica em `sessionStorage` até o login.
- Usuários, pedidos, Brotos, cursos e avaliações ficam no **banco**.
- Catálogo usa **fotos reais** (`<img>`) a partir do campo `imagem` de cada planta (URLs Unsplash). Se a imagem falhar, cai no emoji.

### Como rodar

```bash
cd backend
npm install
node seed.js
node server.js
# abra http://localhost:3001
```

Se a API não estiver no ar, a loja mostra um aviso e não carrega o catálogo.

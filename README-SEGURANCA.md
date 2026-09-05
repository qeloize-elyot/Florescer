# Florescer — Melhorias de Segurança

## O que foi reforçado

| Item | Antes | Agora |
|------|-------|-------|
| JWT Secret | Fixo no código | Obrigatório via variável de ambiente em produção |
| Expiração do token | 30 dias | 7 dias |
| Rate limit | Nenhum | Proteção contra brute-force no login/register |
| Headers de segurança | Básicos | Helmet (CSP, XSS, etc.) |
| CORS | Aberto para qualquer origem | Configurável por variável de ambiente |
| Senha mínima | 6 caracteres | 8 caracteres |
| Custo do bcrypt | 10 | 12 |
| Limite de body | 1 MB | 100 KB |
| Sanitização de inputs | Pouca | Limite de tamanho + trim em todos os campos |
| x-powered-by | Visível | Removido |

## Como aplicar no seu projeto

### 1. Substitua os arquivos

- Troque o `server.js` pelo novo
- Troque o `package.json` pelo novo

### 2. Instale as novas dependências

```bash
npm install
```

Isso instala `helmet` e `express-rate-limit`.

### 3. Configure as variáveis de ambiente no Render

No painel do Render → seu serviço → **Environment**:

```
JWT_SECRET=uma-chave-bem-grande-e-aleatoria-aqui-pelo-menos-32-caracteres
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.onrender.com
```

**Como gerar um JWT_SECRET forte:**

No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie o resultado e cole no Render.

### 4. Redeploy

Faça commit + push ou faça upload dos arquivos novos e reinicie o serviço no Render.

## Observações importantes

- O `db.js` e o `schema.sql` **não precisam ser alterados**.
- O frontend (`app.js`, `index.html`, etc.) também continua funcionando.
- Em desenvolvimento local (sem `JWT_SECRET`), o servidor gera um secret temporário e avisa no console.
- Em produção, se não tiver `JWT_SECRET`, o servidor **não inicia** (por segurança).

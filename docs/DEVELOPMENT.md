# Desenvolvimento e testes

## Preparação

Instale as dependências do frontend:

```bash
cd play-frontend
npm ci
```

Compile o backend:

```bash
cd ../play-backend
cargo build --locked
```

Crie um PostgreSQL 17 e uma base vazia. Em seguida, exporte ao menos:

```bash
export DATABASE_URL='postgresql://postgres:senha@127.0.0.1:5432/play_db'
export JWT_SECRET='um-segredo-local-com-pelo-menos-32-caracteres'
export COOKIE_SECURE='false'
```

## Sistema completo local

O caminho mais próximo da produção usa o build Next.js e `server.cjs`, que
aplica migrações e inicia o Rust automaticamente:

```bash
cd play-frontend
npm run build
BACKEND_BINARY=../play-backend/target/debug/play-server \
  node server.cjs
```

Acesse `http://127.0.0.1:3000`.

`npm run dev` é útil para trabalhar apenas na interface e nas APIs HTTP com hot
reload. Ele não inicia o binário Rust nem o proxy WebSocket de `server.cjs`;
portanto, uma partida completa deve ser validada pelo caminho acima ou pela
imagem Docker.

## Comandos de validação

Frontend:

```bash
cd play-frontend
npm run typecheck
npm run build
```

Backend:

```bash
cd play-backend
cargo fmt --check
cargo test --locked
```

Auditoria de dependências:

```bash
cd play-frontend
npm audit
```

## Teste E2E

Com o sistema completo disponível, o PostgreSQL de teste vazio e Google Chrome
instalado:

```bash
cd play-frontend
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

O cenário cobre, entre outros pontos:

- sessão inválida e redirecionamento;
- cadastro, login e alteração da conta;
- criação, imagem, validação e persistência de Play!;
- filtros, categorias, pastas e biblioteca pública;
- sala, entrada, resposta, saída, reconexão, pontuação e ranking;
- administração de usuários e paginação;
- responsividade, overflow e erros de console.

Defina `E2E_AI_ENABLED=true` apenas quando o ambiente de teste também estiver
preparado para validar a configuração e a geração por IA.

Os screenshots e traces de teste são gravados em `/tmp`; não pertencem ao
repositório.

## Migrações

Para aplicar migrações sem iniciar o sistema:

```bash
cd play-frontend
node scripts/migrate.cjs
```

Regras:

- use nomes numerados e ordenáveis, como `010_descricao.sql`;
- torne a migração segura para a base no estado imediatamente anterior;
- não altere arquivos que já chegaram a um ambiente persistente;
- valide a sequência completa em um banco vazio antes do merge.

## Organização do código

- mantenha acesso SQL nos repositórios de `lib` ou no endpoint responsável;
- reutilize as funções de autenticação de `lib/auth.ts`;
- valide toda entrada externa antes de persistir ou enviar ao Rust;
- mantenha os tipos compartilhados do protocolo em `play.d.ts` alinhados a
  `play-backend/src/ws/api.rs`;
- adicione uma nova migração para mudanças de esquema;
- não versione `.next`, `node_modules`, `target`, logs, segredos ou resultados
  de testes.

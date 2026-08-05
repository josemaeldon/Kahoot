# Configuração e implantação

## Variáveis de ambiente

### Aplicação

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `DATABASE_URL` | sim | — | conexão PostgreSQL usada pela API e migrações |
| `JWT_SECRET` | sim | — | assinatura de sessões e derivação da criptografia das configurações; mínimo de 32 caracteres |
| `DATABASE_POOL_SIZE` | não | `10` | máximo de conexões no pool HTTP |
| `COOKIE_SECURE` | não | depende de `NODE_ENV` | força `Secure` no cookie quando vale `true` |
| `PORT` | não | `3000` | porta pública do processo Node |
| `BACKEND_PORT` | não | `8000` | porta interna do servidor Rust |
| `BACKEND_BINARY` | não | `/app/play-server` | caminho do binário iniciado por `server.cjs` |
| `MIGRATIONS_DIR` | não | `../db/migrations` | diretório dos arquivos SQL |
| `PLAYER_RECONNECT_GRACE_SECONDS` | não | `120` | tolerância de reconexão, limitada entre 30 e 3.600 segundos |
| `RUST_LOG` | não | `play-server=trace` | filtro de logs do backend |
| `OPENAI_API_KEY` | não | — | chave alternativa à armazenada pela administração |
| `OPENAI_API_BASE_URL` | não | `https://api.openai.com/v1` | base compatível com a Responses API |
| `APP_URL` | não | origem da requisição | URL pública usada nos retornos do Checkout e Portal Stripe |
| `STRIPE_SECRET_KEY` | não | configuração do `/admin` | chave secreta `sk_*` ou restrita `rk_*` da Stripe; a variável tem prioridade sobre o banco |
| `STRIPE_WEBHOOK_SECRET` | não | configuração do `/admin` | segredo `whsec_` do endpoint `/api/stripe/webhook` |
| `SMTP_HOST` | não | configuração do `/admin` | servidor SMTP; quando definido, a configuração do ambiente tem prioridade |
| `SMTP_PORT` | não | `587` | porta do servidor SMTP |
| `SMTP_SECURE` | não | `false` | usa TLS direto, normalmente na porta 465 |
| `SMTP_USERNAME` | não | — | usuário de autenticação SMTP |
| `SMTP_PASSWORD` | não | — | senha ou token SMTP |
| `SMTP_FROM_NAME` | não | `Play!` | nome exibido no remetente |
| `SMTP_FROM_EMAIL` | não | — | endereço remetente dos links de redefinição |
| `NEXT_PUBLIC_APP_URL` | não | origem do navegador | origem usada no QR Code; qualquer rota informada é descartada e o destino final é sempre `/play?pin=...`; precisa existir no build do frontend |

Mudar `JWT_SECRET` invalida sessões existentes e impede a leitura de uma chave
de IA ou Stripe previamente criptografada. Planeje as duas consequências antes de
rotacioná-lo.

### Stack

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `PLAY_DB_PASSWORD` | sim | — | senha do usuário PostgreSQL |
| `JWT_SECRET` | sim | — | repassado à aplicação |
| `PLAY_IMAGE` | não | `ghcr.io/josemaeldon/play:latest` | imagem implantada |
| `APP_URL` | não | `https://play.cloudbr.app` | origem pública da aplicação |
| `STRIPE_SECRET_KEY` | não | — | chave Stripe fornecida por ambiente |
| `STRIPE_WEBHOOK_SECRET` | não | — | segredo do webhook fornecido por ambiente |

## Banco e migrações

Ao iniciar `server.cjs`, a aplicação:

1. aguarda o PostgreSQL por até 30 tentativas;
2. garante a existência de `schema_migrations`;
3. lê os arquivos `.sql` em ordem lexical;
4. executa cada nova migração em uma transação;
5. grava o nome e o SHA-256 do arquivo.

Nunca edite uma migração aplicada. Crie o próximo arquivo numerado em
`db/migrations`.

## Imagem Docker

O `Dockerfile` possui estágios separados para:

1. compilar e testar o backend Rust;
2. instalar dependências, verificar tipos e compilar o frontend;
3. montar a imagem de runtime como usuário não privilegiado `node`.

A imagem expõe apenas `3000`; a porta Rust permanece interna.

Build local:

```bash
docker build -t play:local .
```

## Docker Swarm

A stack pressupõe:

- Swarm inicializado;
- rede overlay externa `cloudbrnet`;
- Traefik conectado a essa rede;
- domínio `play.cloudbr.app` apontando para o proxy;
- acesso à imagem privada no GHCR, quando aplicável.

Prepare os segredos:

```bash
cp .env.example .env
set -a
. ./.env
set +a
```

Implante:

```bash
docker stack deploy --with-registry-auth -c docker-compose.yml play
```

Confira:

```bash
docker stack services play
docker service logs -f play_play_app
```

Remova os serviços sem apagar automaticamente o volume:

```bash
docker stack rm play
```

O serviço da aplicação tem limite de 2 CPUs, 2 GiB de memória e `nofile`
65.536. O health check HTTP consulta `/api/health`, que também verifica o banco.

## CI e versionamento de imagem

Todo push em `main` dispara `.github/workflows/docker-publish.yml`. O job
executa um build `linux/amd64`, usa cache do GitHub Actions e publica:

- `ghcr.io/josemaeldon/play:latest`;
- `ghcr.io/josemaeldon/play:sha-<commit>`.

Para uma implantação reproduzível, defina `PLAY_IMAGE` com a tag por SHA em
vez de `latest`.

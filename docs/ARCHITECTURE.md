# Arquitetura

## Componentes

### Aplicação Next.js

O diretório `play-frontend` contém:

- páginas React no Pages Router;
- endpoints HTTP em `pages/api`;
- regras de autenticação, validação e acesso ao banco em `lib`;
- componentes e estilos da interface;
- o teste de sistema em `e2e/system.spec.ts`;
- `server.cjs`, responsável pelo processo de produção.

O servidor de produção executa as migrações, inicia o binário Rust como processo
filho, prepara o Next.js e publica um único servidor HTTP na porta `3000`.
Requisições normais seguem para o Next.js; upgrades em `/ws` seguem para o
backend Rust.

### Servidor Rust

O diretório `play-backend` implementa as salas em memória com Axum,
Tokio e WebSockets. Cada conexão assume um papel depois da primeira mensagem:

- `createRoom` cria uma sala e transforma a conexão em anfitrião;
- `joinRoom` entra como jogador;
- `resumeRoom` recupera uma sessão de jogador desconectada.

O servidor embaralha perguntas e alternativas a cada partida. As salas não são
persistidas: reiniciar a aplicação encerra partidas ativas.

### PostgreSQL

O PostgreSQL armazena contas, configurações e o catálogo de Plays! Todas as
consultas da aplicação usam parâmetros. O pool HTTP é criado por processo e tem
tamanho configurável.

## Fluxos principais

### Autenticação

1. O cadastro valida usuário, WhatsApp e senha.
2. A primeira conta, quando ainda não existe superadministrador, recebe esse
   papel.
3. A senha é armazenada com bcrypt.
4. O login emite um JWT HS256 válido por sete dias.
5. O JWT fica no cookie `accessToken`, HTTP-only e `SameSite=Lax`.
6. A cada operação protegida, a API confirma no banco que a conta ainda existe,
   está habilitada e não expirou.

### Criação e publicação

1. O editor monta um Play! com categoria e até 100 perguntas.
2. A validação normaliza os dados antes de gravá-los.
3. O conteúdo do Play!, suas perguntas e alternativas são salvos em uma transação.
4. O proprietário pode organizar o Play! em uma pasta e torná-lo público.
5. Superadministradores também podem administrar conteúdo público e categorias
   padrão.

### Partida

1. O anfitrião carrega um Play! pela API HTTP.
2. O cliente envia as perguntas ao WebSocket com `createRoom`.
3. O servidor valida os dados, embaralha a partida e devolve um PIN de seis
   dígitos.
4. Jogadores entram com PIN e nome únicos.
5. Cada jogador pode responder uma vez por rodada.
6. A rodada termina pelo tempo, pelas respostas de todos ou pelo anfitrião.
7. Acertos recebem pontuação decrescente conforme a ordem de resposta.
8. O servidor encerra a partida com o ranking final.

Jogadores recebem um token privado de retomada. Uma desconexão preserva a
identidade e a pontuação pelo período definido em
`PLAYER_RECONNECT_GRACE_SECONDS`.

## Modelo de dados

| Tabela | Conteúdo |
| --- | --- |
| `users` | credenciais, WhatsApp, papel, estado e validade do acesso |
| `system_settings` | autorização global para novos cadastros |
| `categories` | categorias padrão e personalizadas |
| `game_folders` | pastas privadas por usuário |
| `games` | metadados, autor, categoria, pasta e publicação |
| `questions` | enunciado, imagem, posição, resposta e tempo |
| `choices` | alternativas ordenadas de cada pergunta |
| `ai_settings` | modelo, instruções e chave de IA criptografada |
| `schema_migrations` | versão e checksum das migrações aplicadas |

Chaves estrangeiras removem perguntas e alternativas em cascata. A exclusão de
uma pasta apenas limpa a referência de cada Play! Categorias em uso são
realocadas antes da exclusão, conforme as regras do repositório.

As migrações também criam categorias e Plays! públicos iniciais. Arquivos já
aplicados são imutáveis: o executor compara o SHA-256 do SQL com o checksum
armazenado.

## Limites relevantes

- título do Play!: até 160 caracteres no banco;
- perguntas por sala: de 1 a 100;
- enunciado: de 1 a 500 caracteres no protocolo;
- alternativas: de 2 a 4, com até 300 caracteres cada;
- duração: de 5 a 300 segundos;
- imagem persistida: data URL JPEG, PNG ou WebP com até 750.000 caracteres;
- PIN: seis dígitos;
- token de reconexão: privado e associado ao nome e à sala.

## Disponibilidade e escala

O estado das partidas pertence a uma única réplica. Por isso a stack mantém
`play_app` com uma réplica; escalar horizontalmente exige afinidade de
WebSocket e um estado de salas compartilhado. O banco é persistente, mas salas
e controles de limite da geração por IA são locais ao processo.

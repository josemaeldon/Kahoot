# API HTTP e protocolo WebSocket

## Convenções HTTP

Os endpoints HTTP usam JSON, exceto o download do modelo CSV. Rotas protegidas
leem o cookie `accessToken`; respostas de erro normalmente seguem:

```json
{
  "error": true,
  "errorDescription": "Descrição legível"
}
```

Principais códigos:

- `400`: entrada inválida;
- `401`: sessão ausente, inválida ou expirada;
- `403`: conta ou papel sem permissão;
- `404`: recurso não encontrado;
- `405`: método não permitido;
- `409`: conflito de nome, uso ou estado;
- `429`: limite temporário da geração por IA;
- `500`/`502`/`503`: falha interna, upstream ou serviço indisponível.

## Endpoints HTTP

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/health` | público | saúde da aplicação e do banco |
| `GET` | `/api/registration-status` | público | informa se novos cadastros estão abertos |
| `POST` | `/api/signup` | público | cria conta e inicia sessão |
| `POST` | `/api/login` | público | autentica e inicia sessão |
| `POST` | `/api/signout` | público | encerra a sessão |
| `GET` | `/api/user` | público | informa a sessão atual, se houver |
| `POST` | `/api/account` | autenticado | altera usuário, WhatsApp ou senha |
| `POST` | `/api/getGames` | autenticado | lista quizzes, filtros, pastas, categorias e autores |
| `POST` | `/api/getOneGame` | autenticado | carrega um quiz permitido |
| `POST` | `/api/create` | autenticado | cria ou atualiza um quiz |
| `POST` | `/api/deleteOneGame` | autenticado | exclui um quiz permitido |
| `POST` | `/api/folders` | autenticado | cria, renomeia ou exclui pasta |
| `POST` | `/api/library` | autenticado | move quiz ou altera sua publicação |
| `GET/POST/PUT/DELETE` | `/api/categories` | autenticado | lista e administra categorias conforme a propriedade/papel |
| `POST` | `/api/ai/generate` | autenticado | gera dez perguntas para uma categoria |
| `GET/POST` | `/api/admin/ai-settings` | superadmin | lê ou altera modelo, instruções e chave |
| `GET/POST` | `/api/admin/users` | superadmin | lista e administra usuários e cadastros |

As estruturas detalhadas usadas pela interface estão tipadas nos próprios
endpoints e em `kahoot.d.ts`. Essa tabela documenta a superfície pública sem
duplicar tipos que mudariam em dois lugares.

## WebSocket

Conecte-se a `/ws`. Todas as mensagens de aplicação são objetos JSON com um
campo discriminador `type`. Frames Ping/Pong são usados para manter conexões
ativas.

A primeira mensagem define o papel da conexão e deve ser uma destas:

### Criar sala

```json
{
  "type": "createRoom",
  "questions": [
    {
      "question": "Quanto é 2 + 2?",
      "image": null,
      "choices": ["4", "3", "5", "6"],
      "answer": 0,
      "time": 15
    }
  ]
}
```

Resposta:

```json
{ "type": "roomCreated", "roomId": 123456 }
```

Dados inválidos produzem:

```json
{ "type": "roomCreationFailed", "reason": "Invalid question data" }
```

### Entrar ou retomar

```json
{ "type": "joinRoom", "roomId": 123456, "username": "Jogador" }
```

```json
{
  "type": "resumeRoom",
  "roomId": 123456,
  "username": "Jogador",
  "sessionToken": "token-privado"
}
```

Sucesso:

```json
{
  "type": "joined",
  "sessionToken": "token-privado",
  "resumed": false
}
```

Falha:

```json
{ "type": "joinFailed", "reason": "Room does not exist" }
```

O cliente deve guardar o `sessionToken` apenas para retomar a mesma sala e
identidade. Uma retomada bem-sucedida devolve `resumed: true`.

## Ações do cliente

### Anfitrião

```json
{ "type": "beginRound" }
```

```json
{ "type": "endRound" }
```

`beginRound` inicia a partida no lobby e avança depois de cada rodada.
`endRound` encerra antecipadamente a rodada atual.

### Jogador

```json
{ "type": "answer", "choice": 2 }
```

```json
{ "type": "leaveRoom" }
```

`choice` é o índice da alternativa, começando em zero. Respostas repetidas ou
fora da rodada não pontuam.

## Eventos para o anfitrião

| `type` | Campos | Momento |
| --- | --- | --- |
| `userJoined` | `username` | jogador entrou |
| `userLeft` | `username` | jogador saiu definitivamente |
| `userAnswered` | `username` | primeira resposta da rodada |
| `roundBegin` | `question` | nova pergunta; inclui resposta para a tela do anfitrião |
| `roundEnd` | `pointGains` | mapa de pontos ganhos por usuário |
| `gameEnd` | — | fim da partida |

Exemplo:

```json
{
  "type": "roundEnd",
  "pointGains": {
    "Ana": 1000,
    "Bruno": 950
  }
}
```

## Eventos para o jogador

| `type` | Campos | Momento |
| --- | --- | --- |
| `keepAlive` | — | atividade periódica da sessão |
| `roundBegin` | `choices`, `totalPoints` | alternativas da nova rodada |
| `roundEnd` | `pointGain`, `totalPoints` | resultado individual |
| `gameEnd` | `ranking` | classificação final |

O evento do jogador não expõe a resposta correta durante a rodada:

```json
{
  "type": "roundBegin",
  "choices": ["3", "4", "6", "5"],
  "totalPoints": 0
}
```

No fim:

```json
{
  "type": "gameEnd",
  "ranking": [
    { "username": "Ana", "points": 1950 },
    { "username": "Bruno", "points": 1000 }
  ]
}
```

O arquivo-fonte autoritativo do protocolo é
`kahoot-clone-backend/src/ws/api.rs`. Os tipos TypeScript correspondentes ficam
em `kahoot-clone-frontend/kahoot.d.ts`.

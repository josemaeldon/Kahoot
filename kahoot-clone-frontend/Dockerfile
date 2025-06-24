# Etapa 1: Build da aplicação
FROM node:18 AS builder

WORKDIR /app

# Copia dependências
COPY package.json yarn.lock ./

# Instala as dependências
RUN yarn install --frozen-lockfile

# Copia o restante do projeto
COPY . .

# Gera o build de produção
RUN yarn build

# Etapa 2: Imagem final com Next.js standalone
FROM node:18-slim

WORKDIR /app

# Instala dependências mínimas
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia arquivos necessários do build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Define variável de ambiente (mude conforme necessário)
ENV NODE_ENV=production

# Expõe a porta do Next.js
EXPOSE 3000

# Inicia o servidor Next.js
CMD ["yarn", "start"]

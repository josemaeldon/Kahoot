# Etapa 1: Compilação
FROM rust:1.74 AS builder

WORKDIR /app

# Copia o manifest e resolve dependências primeiro (cache mais eficiente)
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copia o resto do código
COPY . .

# Compila para produção
RUN cargo build --release

# Etapa 2: Imagem final menor
FROM debian:buster-slim

# Instala dependências do sistema mínimas
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Diretório da aplicação
WORKDIR /app

# Copia binário da etapa de build
COPY --from=builder /app/target/release/kahoot-server .

# Expõe a porta usada pela aplicação (mude se usar outra)
EXPOSE 8000

# Comando para iniciar
CMD ["./kahoot-server"]

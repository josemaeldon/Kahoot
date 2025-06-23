FROM rust:1.74

WORKDIR /app

# Copia o código
COPY . .

# Instala as dependências e compila em release
RUN cargo build --release

# Expõe a porta (confirme qual a porta usada no código Rust, ex: 8000)
EXPOSE 8000

# Comando para iniciar
CMD ["./target/release/kahoot-clone-backend"]

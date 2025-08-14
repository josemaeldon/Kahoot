FROM rust:1.79-alpine AS build
RUN apk add --no-cache musl-dev pkgconfig openssl-dev
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && echo "fn main(){}" > src/main.rs
RUN cargo build --release
COPY . .
RUN cargo build --release

FROM alpine:3.20
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/release /app/bin
ENV RUST_LOG=info HOST=0.0.0.0 PORT=8000
USER app
EXPOSE 8000
CMD ["/bin/sh", "-lc", "exec /app/bin/$(ls /app/bin | head -n1)"]

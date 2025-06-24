# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa de produção com nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .   # <--- DIST, não build
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

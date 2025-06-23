FROM node:18

WORKDIR /app

COPY . .

RUN yarn install && yarn build

# Instala um servidor leve para servir o frontend (caso seja app SPA, como Vite ou CRA)
RUN yarn global add serve

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]

FROM node:18-alpine

WORKDIR /app

# Instala dependências de build necessárias
RUN apk add --no-cache python3 make g++ || true

# Copia package.json primeiro para cache das dependências
COPY package*.json ./

# Limpa cache e instala dependências
RUN npm cache clean --force && \
    npm install --include=dev --no-audit --no-fund && \
    npm cache clean --force

COPY . .

EXPOSE 5000

CMD ["npm", "start"]

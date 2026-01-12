FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro para cache das dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
# Limpar cache primeiro para evitar problemas de cache corrompido
RUN npm cache clean --force && \
    npm install --include=dev

# Copiar código fonte
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

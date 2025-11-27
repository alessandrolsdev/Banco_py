# Usa uma imagem leve do Node.js 20
FROM node:20-alpine

# Define a pasta de trabalho
WORKDIR /app

# Copia os arquivos de configuração de dependências
COPY package*.json ./

# Instala as dependências (com a flag legacy por causa daquele erro de versão)
RUN npm install --legacy-peer-deps

# Instala o Angular CLI globalmente dentro do container
RUN npm install -g @angular/cli

# Copia o resto do código
COPY . .

# Expõe a porta 4200
EXPOSE 4200

# Roda o Angular permitindo acesso externo (host 0.0.0.0)
CMD ["ng", "serve", "--host", "0.0.0.0"]
# ==========================================
# Estágio 1: Build do Frontend (Vite/React)
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copia pacotes e instala dependências
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copia o código e realiza o build de produção
COPY frontend/ ./
RUN npm run build

# ==========================================
# Estágio 2: Setup do Backend e Produção
# ==========================================
FROM node:18-alpine
WORKDIR /app/backend

# Copia pacotes e instala dependências do backend
COPY backend/package*.json ./
RUN npm install

# Copia todo o código do backend (incluindo Prisma)
COPY backend/ ./

# Gera o Prisma Client
RUN npx prisma generate

# Copia os arquivos estáticos compilados do frontend para a pasta "public" do backend
RUN mkdir -p public
COPY --from=frontend-builder /app/frontend/dist ./public

# Expõe a porta unificada onde a aplicação rodará
EXPOSE 3001

# Comando padrão (será substituído pelo docker-compose se precisarmos rodar migrations)
CMD ["npm", "start"]

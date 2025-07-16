FROM node:24-alpine

WORKDIR /app

# Copiar solo lo necesario para instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar esquema de Prisma primero
COPY prisma ./prisma
RUN npx prisma generate

# Copiar el resto del código (esto ya no invalida el cache anterior)
COPY . .

# Compilar NestJS
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]

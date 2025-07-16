FROM node:24-alpine

WORKDIR /app

# Copiar package.json y lock
COPY package.json package-lock.json* ./

# Instala todas las dependencias (incluye dev)
RUN npm ci

# Genera el cliente de Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Elimina dependencias de desarrollo después de generar Prisma
RUN npm prune --omit=dev

# Copiar el resto del código
COPY . .

# Compilar NestJS
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]

GNU nano 7.2                     Dockerfile                               FROM node:24-alpine

# Crear carpeta de trabajo
WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY package.json package-lock.json* ./

# Instala dependencias y guarda la capa cacheada
RUN npm ci --omit=dev

# Copiar package.json e instalar dependencias
COPY prisma ./prisma
RUN npx prisma generate

# Copiar el resto del código

COPY . .


# Compilar la app (NestJS usa TypeScript)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la app
CMD ["node", "dist/main.js"]

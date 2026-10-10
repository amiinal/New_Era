# New Era API on Railway (or any container host).
# Migrate runs on every boot, then the server starts.
FROM node:20-slim
# Prisma's engines need OpenSSL, which slim images lack.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /srv
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]

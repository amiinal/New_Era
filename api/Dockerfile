# New Era API on Railway (or any container host).
# Migrate runs on every boot, then the server starts.
FROM node:20-slim
WORKDIR /srv
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]

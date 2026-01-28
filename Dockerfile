FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./

RUN npm install

COPY client/src ./src
COPY client/public ./public

RUN npm run build

FROM node:18-alpine

WORKDIR /app/server

COPY server/package*.json ./

RUN npm install --only=production

COPY server/src ./src

COPY --from=frontend-builder /app/client/build /app/server/public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]

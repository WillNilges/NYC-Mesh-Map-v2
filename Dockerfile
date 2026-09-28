# Build stage
FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Server stage: build dependencies and install tsx
FROM node:26-alpine AS server-builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && \
    npm install -g tsx

COPY . .

# Production stage
FROM nginx:alpine

RUN apk add --no-cache dumb-init libstdc++

WORKDIR /app

# Copy built frontend from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Node.js runtime and server files from server-builder
COPY --from=server-builder /usr/local/bin/node /usr/local/bin/node
COPY --from=server-builder /usr/local/lib /usr/local/lib
COPY --from=server-builder /app/server /app/server
COPY --from=server-builder /app/node_modules /app/node_modules

# Copy nginx config and entrypoint script
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["/entrypoint.sh"]

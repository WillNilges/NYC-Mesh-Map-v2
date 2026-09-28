# Build stage
FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Install tsx globally so the Express server can be run in the final image
FROM node:26-alpine AS server-builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm install -g tsx

# Production stage
FROM nginx:alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built frontend from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy server dependencies and source, then install tsx
COPY --from=server-builder /usr/local/lib/node_modules/tsx /usr/local/lib/node_modules/tsx
COPY --from=server-builder /usr/local/bin/tsx /usr/local/bin/tsx
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

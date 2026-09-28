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

# Copy nginx config and install tsx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create entrypoint script
RUN printf '#!/bin/sh\n\
if [ -z "$MESHDB_API_URL" ] || [ -z "$MESHDB_API_TOKEN" ]; then\n\
  echo "ERROR: MESHDB_API_URL and MESHDB_API_TOKEN environment variables are required";\n\
  exit 1\n\
fi\n\
\n\
# Start the Express API server in the background\n\
dumb-init node --import=tsx /app/server/index.ts &\n\
\n\
# Start nginx in the foreground\n\
nginx -g "daemon off;"\n' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["/entrypoint.sh"]

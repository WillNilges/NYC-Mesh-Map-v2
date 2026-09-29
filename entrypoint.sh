#!/bin/sh
if [ -z "$MESHDB_API_URL" ] || [ -z "$MESHDB_API_TOKEN" ]; then
  echo "ERROR: MESHDB_API_URL and MESHDB_API_TOKEN environment variables are required"
  exit 1
fi

# Start the Express API server in the background
dumb-init node --import=tsx /app/server/index.ts &

# Start nginx in the foreground
nginx -g "daemon off;"

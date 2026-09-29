# NYC Mesh Map v2

NYC Mesh map refactor, still lots to do but this what it is so far!

## Run

This app requires two processes:

1. **Express API server** (proxied by Vite to `/api/*`)
2. **Vite dev server** (serves the frontend)

### Setup

Create a `.env` file in the project root with the following variables:

```env
MESHDB_API_URL=https://<your-meshdb-instance>/api
MESHDB_API_TOKEN=<your-token>
```

### Start the servers

In one terminal, start the Express API server:

```bash
npm run server
```

In a second terminal, start the Vite dev server:

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173/`. API requests to `/api/*` will be proxied to the Express server on port 3001.

## Stack

- React
- Vite
- TypeScript
- Redux
- MapLibre
- DeckGL

## Podman

```
podman build . --tag willnilges:map-v2
podman run --rm -it -p 8080:80 --name map-v2 willnilges:map-v2
```

## Helm (K8s)

To deploy

```
kubectl create ns map-v2
helm --kubeconfig ~/.kube/config-dev3 --namespace map-v2 upgrade --install map-v2 -f map-v2/secrets.yaml map-v2
```

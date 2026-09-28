import 'dotenv/config'
import express from 'express'

const app = express()
const port = 3001

const MESHDB_API_URL = process.env.MESHDB_API_URL
const MESHDB_API_TOKEN = process.env.MESHDB_API_TOKEN

if (!MESHDB_API_URL || !MESHDB_API_TOKEN) {
    throw new Error('Missing MESHDB_API_URL or MESHDB_API_TOKEN')
}

const OSM_BASE_URL = 'https://vector.openstreetmap.org'

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

const cacheMs = 300000 // ms
const cache = new Map<string, { data: unknown; time: number }>()
const pending = new Map<string, Promise<unknown>>()

async function fetchFromMeshDb(endpoint: string) {
    const res = await fetch(
        `${MESHDB_API_URL}/${endpoint}/?format=json&page_size=4000`,
        {
            headers: {
                Authorization: `Token ${MESHDB_API_TOKEN}`,
                Accept: 'application/json',
            },
        },
    )

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`MeshDB returned ${res.status}: ${text}`)
    }

    return res.json()
}

async function getMeshDbData(endpoint: string) {
    const cached = cache.get(endpoint)

    if (cached) {
        const msSinceCache = Date.now() - cached.time
        const isUnderCacheLimit = msSinceCache < cacheMs

        if (isUnderCacheLimit) {
            return cached.data
        }
    }

    if (pending.has(endpoint)) {
        return pending.get(endpoint)
    }

    const promise = fetchFromMeshDb(endpoint).then((data) => {
        cache.set(endpoint, { data, time: Date.now() })
        pending.delete(endpoint)
        return data
    })

    pending.set(endpoint, promise)
    return promise
}

app.get('/api/nodes', async (req, res) => {
    try {
        const { results = [] } = await getMeshDbData('nodes')

        const nodes = results
            .filter((n) => n.longitude != null && n.latitude != null)
            .map((n) => ({
                id: n.id,
                network_number: n.network_number,
                name: n.name,
                status: n.status,
                type: n.type,
                longitude: n.longitude,
                latitude: n.latitude,
            }))

        res.json(nodes)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get nodes from MeshDB' })
    }
})

app.get('/api/devices', async (req, res) => {
    try {
        const { results = [] } = await getMeshDbData('devices')

        const devices = results
            .filter((d) => d.longitude != null && d.latitude != null)
            .map((d) => ({ id: d.id, longitude: d.longitude, latitude: d.latitude }))

        res.json(devices)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get devices from MeshDB' })
    }
})

app.get('/api/links', async (req, res) => {
    try {
        const { results = [] } = await getMeshDbData('links')

        const links = results.map((l) => ({
            id: l.id,
            status: l.status,
            type: l.type,
            from_device: { id: l.from_device.id },
            to_device: { id: l.to_device.id },
        }))

        res.json(links)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get links from MeshDB' })
    }
})

app.get('/api/sectors', async (req, res) => {
    try {
        const { results = [] } = await getMeshDbData('sectors')

        const sectors = results
            .filter((s) => s.longitude != null && s.latitude != null && s.radius != null && s.azimuth != null && s.width != null)
            .map((s) => ({
                id: s.id,
                status: s.status,
                longitude: s.longitude,
                latitude: s.latitude,
                radius: s.radius,
                azimuth: s.azimuth,
                width: s.width,
                node: { id: s.node.id, network_number: s.node.network_number },
            }))

        res.json(sectors)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get sectors from MeshDB' })
    }
})

app.get('/api/buildings', async (req, res) => {
    try {
        const { results = [] } = await getMeshDbData('buildings')

        const buildings = results
            .filter((b) => b.longitude != null && b.latitude != null)
            .map((b) => ({
                id: b.id,
                street_address: b.street_address,
                city: b.city,
                state: b.state,
                zip_code: b.zip_code,
                longitude: b.longitude,
                latitude: b.latitude,
            }))

        res.json(buildings)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get buildings from MeshDB' })
    }
})

app.get('/api/map-style', async (req, res) => {
    try {
        const styleRes = await fetch(`${OSM_BASE_URL}/styles/shortbread/graybeard.json`)

        if (!styleRes.ok) {
            throw new Error(`OSM style fetch returned ${styleRes.status}`)
        }

        const style = await styleRes.text()
        const proxyBase = `${req.protocol}://${req.get('host')}/api/osm`

        res.type('application/json').send(style.replaceAll(OSM_BASE_URL, proxyBase))
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get map style' })
    }
})

app.get('/api/osm/*splat', async (req, res) => {
    try {
        const path = req.originalUrl.replace('/api/osm', '')
        const osmRes = await fetch(`${OSM_BASE_URL}${path}`)

        if (!osmRes.ok) {
            throw new Error(`OSM resource fetch returned ${osmRes.status}`)
        }

        const contentType = osmRes.headers.get('content-type')
        if (contentType) res.type(contentType)

        res.send(Buffer.from(await osmRes.arrayBuffer()))
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Could not get OSM resource' })
    }
})

app.listen(port, () => {
    console.log(`MeshDB API server running on ${port}`)
})
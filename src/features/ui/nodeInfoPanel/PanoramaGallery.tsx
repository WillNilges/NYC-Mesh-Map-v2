import { useEffect, useState } from 'react'
import type { Node } from '../../../types/models'

//type PanoramaMap = Record<string, string[]>

type PanoramaGalleryProps = {
    node: Node
    onSelect: (url: string) => void
}

//const panoramasByNetworkNumber = panoramaManifest as PanoramaMap

const PanoramaGallery = ({
    node,
    onSelect,
}: PanoramaGalleryProps) => {
    const networkNumber = String(node.network_number)

    const [panoramaUrls, setPanoramaUrls] = useState<string[]>([])
    const [error, setError] = useState<Error | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPanoramas = async () => {
            try {
                setLoading(true)
                const response = await fetch(`https://api.devpano.nycmesh.net/api/v1/nn/${networkNumber}?get_related=true`)
                if (!response.ok) {
                    throw new Error(`Failed to fetch panoramas: ${response.status}`)
                }
                const data = await response.json()
                const urls: string[] = []
                if (data?.images && Array.isArray(data.images)) {
                    data.images.forEach((img: { url: string }) => urls.push(img.url))
                }
                if (data?.additional_images && typeof data.additional_images === 'object') {
                    Object.values(data.additional_images).forEach((relatedImages: { url: string }[]) => {
                        if (Array.isArray(relatedImages)) {
                            relatedImages.forEach((img: { url: string }) => urls.push(img.url))
                        }
                    })
                }
                setPanoramaUrls(urls)
            } catch (err) {
                setError(err as Error)
                setPanoramaUrls([])
            } finally {
                setLoading(false)
            }

        }
        fetchPanoramas()
    }, [networkNumber])

    if (loading) {
        return (
            <section className="border-t px-4 py-3">
                <p className="mb-2 text-xs text-gray-400">Panoramas</p>
                <p className="text-xs text-gray-500">Loading...</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="border-t px-4 py-3">
                <p className="mb-2 text-xs text-gray-400">Panoramas</p>
                <p className="text-xs text-red-400">Failed to load panoramas: {error.message}</p>
            </section>
        )
    }

    if (panoramaUrls.length === 0) {
        console.log("No panoramas found")
        return null
    }

    console.log('networkNumber:', networkNumber)
    console.log('panoramaUrls: ', panoramaUrls)

    return (
        <section className="border-t px-4 py-3">
            <p className="mb-2 text-xs text-gray-400">Panoramas</p>

            <div className="flex gap-2 overflow-x-auto">
                {panoramaUrls.map((url, index) => (
                    <button
                        className="shrink-0 overflow-hidden rounded border"
                        key={url}
                        type="button"
                        onClick={() => onSelect(url)}
                        aria-label={`Open panorama ${index + 1}`}
                    >
                        <img className="h-20 w-28 object-cover" src={url} alt={`Panorama ${index + 1} for node ${node.network_number}`} />

                    </button>
                ))}
            </div>
        </section>
    )
}

export default PanoramaGallery

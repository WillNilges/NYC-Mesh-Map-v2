import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { nodeTypeColors } from '../../../types/models'
import { clearSelectedNode, selectSelectedNode } from '../uiSlice'
import NodeDetails from './NodeDetails'
import PanoramaGallery from './PanoramaGallery'
import PanoramaOverlay from './PanoramaOverlay'

const NodeInfoPanel = () => {
    const dispatch = useAppDispatch()
    const node = useAppSelector(selectSelectedNode)
    const [panoramaUrl, setPanoramaUrl] = useState<string | null>(null)

    if (!node) return null

    const color = nodeTypeColors[node.type] ?? '#bcbec0'

    const installNumbers = (node.installs ?? []).map((install) => install.install_number).join(', ') // not every node has installs arr

    function closePanel() {
        dispatch(clearSelectedNode())
        setPanoramaUrl(null)
    }

    return (
        <>
            <div className="absolute inset-x-4 bottom-4 top-20 z-20 overflow-y-auto bg-white shadow-xl sm:left-4 sm:right-auto sm:w-72">
                <header className="flex items-center justify-between border-b p-3">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />

                        <div>
                            <h2 className="font-bold">
                                {node.name ?? `Node ${node.network_number}`}
                            </h2>

                            <p className="text-xs text-gray-500">
                                NN {node.network_number}
                            </p>
                            {installNumbers && (
                                <p className="text-xs text-gray-500">
                                    Installs: {installNumbers}
                                </p>
                            )}
                        </div>
                    </div>

                    <button type="button" onClick={closePanel} aria-label="Close node panel">
                        ✕
                    </button>
                </header>

                <div className="flex gap-2 p-3">
                    <span className="rounded border px-2 py-1 text-xs">
                        {node.status}
                    </span>

                    <span className="rounded border px-2 py-1 text-xs" style={{ color, borderColor: color }}>
                        {node.type}
                    </span>
                </div>

                <NodeDetails node={node} />

                {<PanoramaGallery node={node} onSelect={setPanoramaUrl} />}
            </div>

            {panoramaUrl && (
                <PanoramaOverlay imageUrl={panoramaUrl} onClose={() => setPanoramaUrl(null)} />
            )}
        </>
    )
}

export default NodeInfoPanel

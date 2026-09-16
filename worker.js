import { mapAssetPath } from './route-map.mjs'

const PREFIX = '/proyectos/sistema-reservas'

export default {
  async fetch(request, env) {
    const assetPath = mapAssetPath(new URL(request.url).pathname, PREFIX)
    if (!assetPath) return new Response('Not Found', { status: 404 })

    return env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request))
  },
}

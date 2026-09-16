import { mapAssetPath } from './route-map.mjs'

const PREFIX = '/sistema-reservas'
const LEGACY_PREFIX = '/proyectos/sistema-reservas'

function redirectLegacyPath(pathname, requestUrl) {
  if (pathname !== LEGACY_PREFIX && !pathname.startsWith(`${LEGACY_PREFIX}/`)) return null
  const suffix = pathname.slice(LEGACY_PREFIX.length)
  return Response.redirect(new URL(`${PREFIX}${suffix || '/'}`, requestUrl), 301)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const legacyRedirect = redirectLegacyPath(url.pathname, url)
    if (legacyRedirect) return legacyRedirect
    const assetPath = mapAssetPath(url.pathname, PREFIX)
    if (!assetPath) return new Response('Not Found', { status: 404 })

    return env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request))
  },
}

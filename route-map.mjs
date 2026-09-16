export function mapAssetPath(pathname, prefix) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  if (pathname === normalizedPrefix || pathname === `${normalizedPrefix}/`) return '/index.html'
  if (!pathname.startsWith(`${normalizedPrefix}/`)) return null
  const relativePath = pathname.slice(normalizedPrefix.length)
  if (relativePath === '/api' || relativePath.startsWith('/api/')) return null
  return relativePath.endsWith('/') ? `${relativePath}index.html` : relativePath
}

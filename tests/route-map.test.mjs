import assert from 'node:assert/strict'
import test from 'node:test'
import { mapAssetPath } from '../route-map.mjs'

test('maps the reservations route and relative assets to the asset root', () => {
  assert.equal(mapAssetPath('/sistema-reservas/', '/sistema-reservas'), '/')
  assert.equal(mapAssetPath('/sistema-reservas/app.js', '/sistema-reservas'), '/app.js')
})

test('does not claim paths outside the reservations prefix', () => {
  assert.equal(mapAssetPath('/bingo/', '/proyectos/sistema-reservas'), null)
})

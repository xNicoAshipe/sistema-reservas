import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

for (const file of ['public/index.html', 'public/app.js', 'public/styles.css']) {
  await access(file)
}

const html = await readFile('public/index.html', 'utf8')
assert.match(html, /<title>[^<]+<\/title>/i)
assert.match(html, /app\.js/i)

console.log('Artefacto Sistema de Reservas validado.')

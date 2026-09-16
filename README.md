# Sistema de Reservas

Prototipo de reservas de espacios con calendario, solicitudes y panel local.

- Repositorio existente reutilizado: `xNicoAshipe/sistema-reservas`.
- URL pública: `https://nicosys.cl/sistema-reservas/`.
- Validación: `npm test`, `npm run lint` y `npm run build`.
- Publicación: `npx wrangler deploy` usando `wrangler.jsonc`.

La aplicación mantiene su persistencia local en el navegador. El backend y la
autenticación real siguen fuera de alcance porque el prototipo no los contiene.

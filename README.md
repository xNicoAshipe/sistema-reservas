# Sistema de Reservas

Prototipo de reservas de salas y auditorios con calendario, solicitudes y administración local.

Dirección configurada del sitio: https://nicosys.cl/sistema-reservas/. Esta referencia no constituye una comprobación de disponibilidad en producción.

## Dónde editar

| Archivo o carpeta | Uso |
|---|---|
| [`public/index.html`](public/index.html) | Pantallas de consulta y reserva. |
| [`public/app.js`](public/app.js) | Reglas de reservas y almacenamiento local. |
| [`public/styles.css`](public/styles.css) | Estilos. |
| [`public/README.md`](public/README.md) | Detalle funcional del prototipo. |
| [`worker.js`](worker.js) | Entrega del sitio y redirecciones. |
| [`features/copilot/plans/reservas.html`](features/copilot/plans/reservas.html) | Prototipo previo; no es la entrada publicada del sitio. |

## Trabajar en local

Usa Node.js 22 y npm. Ejecuta los comandos desde la raíz de este repositorio.

```sh
npm ci
python -m http.server 8080 --directory public
```

El servidor de ejemplo requiere Python y muestra únicamente el frontend. Las reservas se guardan en el navegador, no en una base de datos central. La contraseña del panel no equivale a autenticación de servidor. Para uso compartido real hace falta implementar y validar un backend.

La carpeta `features/copilot/plans/` conserva una referencia anterior; no debe confundirse con la aplicación de `public/`.

## Comprobar los cambios

```sh
npm test
npm run lint
npm run build
```

Estos son los comandos disponibles para validar el proyecto; esta guía no afirma que se hayan ejecutado en cada instalación.

Resultado de la compilación: `public/`. El build valida los archivos estáticos.

## Publicación

Cloudflare Workers usa `wrangler.jsonc` para servir los archivos y resolver las rutas históricas. Publicar este prototipo no cambia sus límites de almacenamiento y autenticación.

Revisa la configuración y el resultado de las pruebas antes de publicar. Los valores de secretos y credenciales se configuran fuera de Git.

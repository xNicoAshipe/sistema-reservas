# Sistema de Reservas de Espacios

Sistema web compacto para salas y auditorios, con identidad visual inspirada en la Universidad de Concepción.

## Funciones principales

- Calendario semanal de **lunes a viernes** como pantalla inicial.
- Vista general de **todas las salas** o filtro por una sala/auditorio específico.
- Agenda organizada por **bloques horarios configurables**.
- Solicitud de reservas usando exclusivamente bloques activos.
- Validación de conflictos y capacidad.
- Panel de Administración protegido por contraseña durante la sesión actual.
- Subpestañas de Administración:
  - Solicitudes
  - Espacios
  - Bloques horarios
  - Reservas
- Gestión de salas: nombre, tipo, capacidad, ubicación, descripción, características y estado.
- Gestión de bloques: nombre, hora de inicio, hora de término, activar/desactivar, agregar y eliminar.
- Aprobación o rechazo de solicitudes.
- Persistencia local mediante `localStorage`.

## Archivos

- `index.html`
- `styles.css`
- `app.js`

No requiere instalación ni dependencias para funcionar como prototipo local.

> Nota: la autenticación se ejecuta en el navegador porque este prototipo es estático. Para un uso productivo se necesita un backend con autenticación real.

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const RESERVATIONS_KEY = 'sistema_reservas_confirmadas_v3';
const SUGGESTIONS_KEY = 'sistema_reservas_solicitudes_v3';
const SPACES_KEY = 'sistema_reservas_espacios_v1';
const BLOCKS_KEY = 'sistema_reservas_bloques_v1';
const ADMIN_PASSWORD = '1991';
const ADMIN_SESSION_KEY = 'sistema_reservas_admin_autorizado_v1';

const defaultSpaces = [
  {
    id: 'sala-a',
    name: 'Sala de Reuniones A',
    type: 'Sala',
    capacity: 8,
    location: 'Edificio principal',
    description: 'Espacio compacto para reuniones de equipo y trabajo colaborativo.',
    features: ['Pantalla', 'HDMI', 'Pizarra'],
    color: '#2f6fed',
    active: true
  },
  {
    id: 'sala-b',
    name: 'Sala de Reuniones B',
    type: 'Sala',
    capacity: 12,
    location: 'Segundo nivel',
    description: 'Sala amplia para reuniones de coordinación, docencia o proyectos.',
    features: ['Proyector', 'Pizarra', 'Videollamada'],
    color: '#8b5cf6',
    active: true
  },
  {
    id: 'auditorio',
    name: 'Auditorio Principal',
    type: 'Auditorio',
    capacity: 60,
    location: 'Primer nivel',
    description: 'Auditorio para charlas, seminarios, defensas y actividades de mayor convocatoria.',
    features: ['Proyector', 'Audio', 'Micrófono'],
    color: '#f59e0b',
    active: true
  },
  {
    id: 'videoconferencia',
    name: 'Sala de Videoconferencia',
    type: 'Sala',
    capacity: 10,
    location: 'Área académica',
    description: 'Pensada para reuniones híbridas y sesiones remotas.',
    features: ['Cámara', 'Pantalla', 'Audio'],
    color: '#10b981',
    active: true
  }
];

const SPACE_COLORS = ['#2f6fed', '#8b5cf6', '#f59e0b', '#10b981', '#ef5da8', '#06b6d4', '#f97316', '#64748b'];

function hashString(value = '') {
  return [...String(value)].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

function spaceColor(spaceOrId) {
  const space = typeof spaceOrId === 'string' ? getSpace(spaceOrId) : spaceOrId;
  if (space?.color && /^#[0-9a-f]{6}$/i.test(space.color)) return space.color;
  const id = typeof spaceOrId === 'string' ? spaceOrId : (space?.id || 'space');
  return SPACE_COLORS[Math.abs(hashString(id)) % SPACE_COLORS.length];
}

const defaultBlocks = [
  { id: 'bloque-1', label: 'Bloque 1', start: '08:30', end: '10:00', active: true },
  { id: 'bloque-2', label: 'Bloque 2', start: '10:15', end: '11:45', active: true },
  { id: 'bloque-3', label: 'Bloque 3', start: '12:00', end: '13:30', active: true },
  { id: 'bloque-4', label: 'Bloque 4', start: '14:30', end: '16:00', active: true },
  { id: 'bloque-5', label: 'Bloque 5', start: '16:15', end: '17:45', active: true }
];

const defaultReservations = [
  {
    id: 'seed-1',
    space: 'sala-b',
    date: isoToday(),
    start: '11:00',
    end: '12:00',
    title: 'Reunión de coordinación',
    name: 'Equipo académico',
    email: 'equipo@udec.cl',
    attendees: '6',
    notes: '',
    createdAt: new Date().toISOString()
  }
];

let calendarWeekStart = getMondayISO(isoToday());

function isoToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

function getMondayISO(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function addDaysISO(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWeekday(dateString) {
  const day = new Date(`${dateString}T12:00:00`).getDay();
  return day >= 1 && day <= 5;
}

function formatWeekRange(startDate) {
  const endDate = addDaysISO(startDate, 4);
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(end)}`;
  }
  const short = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
  return `${short.format(start)} – ${short.format(end)} ${end.getFullYear()}`;
}

function getBlocks() {
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    if (!raw) {
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(defaultBlocks));
      return structuredCloneSafe(defaultBlocks);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : structuredCloneSafe(defaultBlocks);
  } catch {
    return structuredCloneSafe(defaultBlocks);
  }
}

function saveBlocks(items) {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(items));
}

function getActiveBlocks() {
  return getBlocks().filter(block => block.active !== false).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function getBlock(id) {
  return getBlocks().find(block => block.id === id);
}

function getSpaces() {
  try {
    const raw = localStorage.getItem(SPACES_KEY);
    if (!raw) {
      localStorage.setItem(SPACES_KEY, JSON.stringify(defaultSpaces));
      return structuredCloneSafe(defaultSpaces);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : structuredCloneSafe(defaultSpaces);
  } catch {
    return structuredCloneSafe(defaultSpaces);
  }
}

function saveSpaces(items) {
  localStorage.setItem(SPACES_KEY, JSON.stringify(items));
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSpace(id) {
  return getSpaces().find(space => space.id === id);
}

function getActiveSpaces() {
  return getSpaces().filter(space => space.active !== false);
}

function getReservations() {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    if (!raw) {
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(defaultReservations));
      return [...defaultReservations];
    }
    return JSON.parse(raw) || [];
  } catch {
    return [...defaultReservations];
  }
}

function saveReservations(items) {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(items));
}

function getSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSuggestions(items) {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(items));
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '');
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function hasReservationConflict(data, excludeId = null) {
  return getReservations().some(item =>
    item.id !== excludeId &&
    item.space === data.space &&
    item.date === data.date &&
    toMinutes(data.start) < toMinutes(item.end) &&
    toMinutes(data.end) > toMinutes(item.start)
  );
}

function isBusyNow(spaceId) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return getReservations().some(item =>
    item.space === spaceId &&
    item.date === isoToday() &&
    minutes >= toMinutes(item.start) &&
    minutes < toMinutes(item.end)
  );
}

function isAdminAuthorized() {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function requestAdminAccess() {
  if (isAdminAuthorized()) return true;

  const password = window.prompt('Ingresa la contraseña de Administración:');
  if (password !== ADMIN_PASSWORD) {
    toast('Contraseña incorrecta.');
    return false;
  }

  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } catch {
    // El acceso continúa durante esta carga si el navegador bloquea sessionStorage.
  }
  return true;
}

function switchView(name) {
  if (name === 'admin' && !requestAdminAccess()) return;

  $$('.view').forEach(view => view.classList.remove('active'));
  const target = $(`#${name}View`);
  if (target) target.classList.add('active');
  $$('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  $('.main-nav').classList.remove('open');

  if (name === 'home') {
    renderCalendar();
    renderSchedule();
  }
  if (name === 'spaces') renderSpaces();
  if (name === 'admin') renderAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillSpaceSelect() {
  const select = $('#suggestSpace');
  const previous = select.value;
  const activeSpaces = getActiveSpaces();
  select.innerHTML = '<option value="">Selecciona un espacio</option>' + activeSpaces.map(space =>
    `<option value="${esc(space.id)}">${esc(space.name)} · ${space.capacity} personas</option>`
  ).join('');
  if (activeSpaces.some(space => space.id === previous)) select.value = previous;
}

function fillBlockSelect() {
  const select = $('#suggestBlock');
  if (!select) return;
  const previous = select.value;
  const blocks = getActiveBlocks();
  select.innerHTML = '<option value="">Selecciona un bloque</option>' + blocks.map(block =>
    `<option value="${esc(block.id)}">${esc(block.label)} · ${esc(block.start)}–${esc(block.end)}</option>`
  ).join('');
  if (blocks.some(block => block.id === previous)) select.value = previous;
}

function fillCalendarRoomSelect() {
  const select = $('#calendarRoomSelect');
  if (!select) return;
  const previous = select.value;
  const spaces = getActiveSpaces();
  select.innerHTML = '<option value="all">Todas las salas</option>' + spaces.map(space => `<option value="${esc(space.id)}">${esc(space.name)}</option>`).join('');
  if (previous === 'all' || spaces.some(space => space.id === previous)) select.value = previous;
  else select.value = 'all';
}

function renderHeaderAndStats() {
  const reservations = getReservations();
  const suggestions = getSuggestions();
  const pending = suggestions.filter(item => item.status === 'pending').length;
  const weekEnd = addDaysISO(calendarWeekStart, 4);
  const selectedRoom = $('#calendarRoomSelect')?.value;

  $('#todayBookingsCount').textContent = reservations.filter(item =>
    item.date >= calendarWeekStart && item.date <= weekEnd && (!selectedRoom || selectedRoom === 'all' || item.space === selectedRoom)
  ).length;
  $('#availableSpacesCount').textContent = getActiveSpaces().length;
  $('#pendingSuggestionsCount').textContent = pending;
  $('#adminPendingBadge').textContent = pending;
  $('#adminTabPendingBadge').textContent = pending;
}

function renderCalendar() {
  const spaces = getActiveSpaces();
  const blocks = getActiveBlocks();
  const board = $('#calendarBoard');
  fillCalendarRoomSelect();
  const selectedRoom = $('#calendarRoomSelect')?.value;
  const space = selectedRoom === 'all' ? null : getSpace(selectedRoom);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDaysISO(calendarWeekStart, i));
  const reservations = getReservations().filter(item => (selectedRoom === 'all' || item.space === selectedRoom) && weekDays.includes(item.date));

  $('#calendarDayLabel').textContent = `${formatWeekRange(calendarWeekStart)} · ${space ? space.name : 'Todas las salas'}`;

  if (!spaces.length) {
    board.innerHTML = '<div class="empty-state"><div><strong>No hay espacios activos</strong>Activa o crea una sala desde Administración → Espacios.</div></div>';
    return;
  }
  if (!blocks.length) {
    board.innerHTML = '<div class="empty-state"><div><strong>No hay bloques horarios activos</strong>Créales desde Administración → Bloques horarios.</div></div>';
    return;
  }

  const dayFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  const headers = weekDays.map(date => {
    const isToday = date === isoToday();
    return `<div class="week-day-head ${isToday ? 'today' : ''}">${esc(dayFormatter.format(new Date(`${date}T12:00:00`)).replace('.', ''))}</div>`;
  }).join('');

  const rows = blocks.map(block => {
    const cells = weekDays.map(date => {
      const events = reservations.filter(item =>
        item.date === date &&
        toMinutes(item.start) < toMinutes(block.end) &&
        toMinutes(item.end) > toMinutes(block.start)
      );
      const content = events.length ? events.map(item => `
        <article class="week-event" style="--space-color:${spaceColor(item.space)}" title="${esc(item.title)} · ${esc(item.start)}–${esc(item.end)}">
          <strong>${esc(item.title)}</strong>
          <span>${esc(item.start)}–${esc(item.end)}</span>
          <small><i class="space-color-dot"></i>${esc(getSpace(item.space)?.name || item.space)} · ${esc(item.name)}</small>
        </article>`).join('') : '<span class="week-free">Disponible</span>';
      return `<div class="week-cell ${date === isoToday() ? 'today-column' : ''}">${content}</div>`;
    }).join('');
    return `<div class="week-row">
      <div class="week-block-label"><strong>${esc(block.label)}</strong><span>${esc(block.start)}–${esc(block.end)}</span></div>
      ${cells}
    </div>`;
  }).join('');

  board.innerHTML = `
    <div class="week-calendar">
      <div class="week-header-row"><div class="week-block-head">Bloque</div>${headers}</div>
      ${rows}
    </div>`;
}

function renderSchedule() {
  const weekEnd = addDaysISO(calendarWeekStart, 4);
  const selectedRoom = $('#calendarRoomSelect')?.value;
  const items = getReservations()
    .filter(item => item.date >= calendarWeekStart && item.date <= weekEnd && (!selectedRoom || selectedRoom === 'all' || item.space === selectedRoom))
    .sort((a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start));

  $('#scheduleList').innerHTML = items.length ? items.map(item => {
    const space = getSpace(item.space);
    return `<div class="schedule-item">
      <div class="schedule-time">${esc(formatDate(item.date))}<br>${esc(item.start)}</div>
      <div class="schedule-line" style="--space-color:${spaceColor(item.space)}"></div>
      <div class="schedule-info">
        <strong>${esc(item.title)}</strong>
        <p>${esc(space?.name || item.space)} · ${esc(item.start)}–${esc(item.end)} · ${esc(item.name)}</p>
      </div>
    </div>`;
  }).join('') : `<div class="empty-state compact-empty"><div><strong>Sin reservas confirmadas</strong>No hay actividades para esta semana en el espacio seleccionado.</div></div>`;
}

function renderSpaces() {
  const query = $('#spaceSearch').value.trim().toLowerCase();
  const capacity = Number($('#capacityFilter').value || 0);
  const activeSpaces = getActiveSpaces();
  const filtered = activeSpaces.filter(space =>
    space.capacity >= capacity &&
    [space.name, space.type, space.location, space.description, ...(space.features || [])].join(' ').toLowerCase().includes(query)
  );

  $('#spacesGrid').innerHTML = filtered.length ? filtered.map(space => {
    const busy = isBusyNow(space.id);
    return `<article class="space-card" style="--space-color:${spaceColor(space)}">
      <div class="space-card-top">
        <div><span class="space-type">${esc(space.type)}</span><h3>${esc(space.name)}</h3></div>
        <span class="status-badge ${busy ? 'busy' : ''}">${busy ? 'Ocupado ahora' : 'Disponible ahora'}</span>
      </div>
      <p>${esc(space.description || 'Sin descripción.')}</p>
      <div class="space-meta"><span>${space.capacity} personas</span><span>${esc(space.location || 'Sin ubicación')}</span></div>
      <div class="feature-list">${(space.features || []).map(feature => `<span class="feature-tag">${esc(feature)}</span>`).join('')}</div>
      <div class="space-card-footer"><button class="primary-button suggest-for-space" data-space="${esc(space.id)}">Sugerir horario</button></div>
    </article>`;
  }).join('') : `<div class="empty-state" style="grid-column:1/-1"><div><strong>No encontramos espacios</strong>Prueba con otro filtro.</div></div>`;

  $$('.suggest-for-space').forEach(button => button.addEventListener('click', () => {
    switchView('suggest');
    $('#suggestSpace').value = button.dataset.space;
    updateAvailabilityPreview();
  }));
}

function updateAvailabilityPreview() {
  const block = getBlock($('#suggestBlock')?.value);
  const data = {
    space: $('#suggestSpace').value,
    date: $('#suggestDate').value,
    start: block?.start,
    end: block?.end
  };
  const target = $('#requestAvailability');
  target.className = 'request-availability';

  if (!data.space || !data.date || !block) {
    target.textContent = 'Selecciona fecha y bloque horario.';
    return;
  }
  if (!isWeekday(data.date)) {
    target.textContent = 'Las reservas se gestionan de lunes a viernes.';
    target.classList.add('conflict');
    return;
  }

  const space = getSpace(data.space);
  if (hasReservationConflict(data)) {
    target.textContent = `${space?.name || 'El espacio'} ya tiene una reserva confirmada en ${block.label} (${block.start}–${block.end}).`;
    target.classList.add('conflict');
  } else {
    target.textContent = `${block.label} · ${block.start}–${block.end}: disponible para solicitar en ${space?.name || 'el espacio'}.`;
    target.classList.add('available');
  }
}

function renderAdmin() {
  renderAdminRequests();
  renderAdminSpaces();
  renderAdminBlocks();
  renderAdminBookings();
  renderHeaderAndStats();
}

function renderAdminRequests() {
  const suggestions = getSuggestions();
  const filter = $('#adminFilter .active')?.dataset.status || 'pending';
  const filtered = filter === 'all' ? suggestions : suggestions.filter(item => item.status === filter);

  $('#adminPendingCount').textContent = suggestions.filter(item => item.status === 'pending').length;
  $('#adminApprovedCount').textContent = suggestions.filter(item => item.status === 'approved').length;
  $('#adminRejectedCount').textContent = suggestions.filter(item => item.status === 'rejected').length;

  $('#adminRequests').innerHTML = filtered.length ? filtered
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(item => {
      const space = getSpace(item.space);
      const statusLabel = item.status === 'approved' ? 'Aprobada' : item.status === 'rejected' ? 'Rechazada' : 'Pendiente';
      return `<article class="request-row">
        <div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.name)} · ${esc(item.email)}${item.notes ? `<br>${esc(item.notes)}` : ''}</p>
        </div>
        <div class="request-slot"><strong>${esc(space?.name || item.space)}</strong><span>${esc(item.date)} · ${esc(item.start)}–${esc(item.end)}</span></div>
        <div class="request-slot"><strong>${esc(item.attendees)} personas</strong><span>Solicitada ${formatDate(item.date)}</span></div>
        ${item.status === 'pending'
          ? `<div class="request-actions"><button class="approve-button" data-approve="${esc(item.id)}">Aprobar</button><button class="reject-button" data-reject="${esc(item.id)}">Rechazar</button></div>`
          : `<span class="status-badge request-status ${item.status === 'rejected' ? 'busy' : ''}">${statusLabel}</span>`}
      </article>`;
    }).join('') : `<div class="empty-state"><div><strong>No hay solicitudes en esta vista</strong>Cambia el filtro o espera nuevas solicitudes.</div></div>`;

  $$('[data-approve]').forEach(button => button.addEventListener('click', () => approveSuggestion(button.dataset.approve)));
  $$('[data-reject]').forEach(button => button.addEventListener('click', () => updateSuggestionStatus(button.dataset.reject, 'rejected')));
}

function renderAdminSpaces() {
  const spaces = getSpaces();
  $('#adminSpacesList').innerHTML = spaces.length ? spaces.map(space => `
    <form class="admin-space-editor" style="--space-color:${spaceColor(space)}" data-space-form="${esc(space.id)}">
      <div class="space-editor-title">
        <div class="space-initial">${esc(space.type === 'Auditorio' ? 'AU' : (space.name || 'S').slice(0,2).toUpperCase())}</div>
        <div><strong>${esc(space.name)}</strong><span>ID: ${esc(space.id)}</span></div>
        <label class="active-switch"><input type="checkbox" name="active" ${space.active !== false ? 'checked' : ''}><span>Activo</span></label>
      </div>
      <div class="space-editor-grid">
        <label>Nombre<input name="name" type="text" value="${esc(space.name)}" required></label>
        <label>Color<input name="color" type="color" value="${esc(spaceColor(space))}" aria-label="Color identificador de ${esc(space.name)}"></label>
        <label>Tipo
          <select name="type">
            ${['Sala','Auditorio','Laboratorio','Otro'].map(type => `<option value="${type}" ${space.type === type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </label>
        <label>Capacidad<input name="capacity" type="number" min="1" value="${Number(space.capacity) || 1}" required></label>
        <label>Ubicación<input name="location" type="text" value="${esc(space.location || '')}"></label>
        <label class="editor-wide">Descripción<textarea name="description" rows="2">${esc(space.description || '')}</textarea></label>
        <label class="editor-wide">Características<input name="features" type="text" value="${esc((space.features || []).join(', '))}" placeholder="Proyector, HDMI, Pizarra"></label>
      </div>
      <div class="space-editor-actions">
        <span class="editor-hint">Los cambios se reflejan en calendario, formularios y solicitudes.</span>
        <button class="secondary-button" type="button" data-remove-space="${esc(space.id)}">Eliminar</button>
        <button class="primary-button" type="submit">Guardar cambios</button>
      </div>
    </form>`).join('') : '<div class="empty-state"><div><strong>No hay espacios creados</strong>Agrega una sala o auditorio para comenzar.</div></div>';

  $$('[data-space-form]').forEach(form => form.addEventListener('submit', saveSpaceEditor));
  $$('[data-remove-space]').forEach(button => button.addEventListener('click', () => removeSpace(button.dataset.removeSpace)));
}

function saveSpaceEditor(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.spaceForm;
  const data = Object.fromEntries(new FormData(form).entries());
  const spaces = getSpaces();
  const space = spaces.find(item => item.id === id);
  if (!space) return;

  const name = String(data.name || '').trim();
  const capacity = Number(data.capacity || 0);
  if (!name || capacity < 1) {
    toast('Revisa el nombre y la capacidad del espacio.');
    return;
  }

  space.name = name;
  space.color = /^#[0-9a-f]{6}$/i.test(data.color || '') ? data.color : spaceColor(space);
  space.type = data.type || 'Sala';
  space.capacity = capacity;
  space.location = String(data.location || '').trim();
  space.description = String(data.description || '').trim();
  space.features = String(data.features || '').split(',').map(value => value.trim()).filter(Boolean);
  space.active = form.elements.active.checked;
  saveSpaces(spaces);
  refreshAll();
  toast('Espacio actualizado.');
}

function addSpace() {
  const spaces = getSpaces();
  const base = `espacio-${Date.now()}`;
  spaces.push({
    id: base,
    name: 'Nuevo espacio',
    type: 'Sala',
    capacity: 8,
    location: '',
    description: '',
    features: [],
    color: SPACE_COLORS[spaces.length % SPACE_COLORS.length],
    active: true
  });
  saveSpaces(spaces);
  renderAdminSpaces();
  fillSpaceSelect();
  toast('Nuevo espacio creado. Edita sus datos y guarda.');
}

function removeSpace(id) {
  const reservations = getReservations();
  const suggestions = getSuggestions();
  const hasRelatedData = reservations.some(item => item.space === id) || suggestions.some(item => item.space === id);
  if (hasRelatedData) {
    toast('No se puede eliminar: tiene reservas o solicitudes asociadas. Puedes desactivarlo.');
    return;
  }
  if (!window.confirm('¿Eliminar este espacio?')) return;
  saveSpaces(getSpaces().filter(space => space.id !== id));
  refreshAll();
  toast('Espacio eliminado.');
}

function renderAdminBlocks() {
  const blocks = getBlocks().sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  $('#adminBlocksList').innerHTML = blocks.length ? blocks.map(block => `
    <form class="admin-block-editor" data-block-form="${esc(block.id)}">
      <div class="block-editor-main">
        <label>Nombre del bloque<input name="label" type="text" value="${esc(block.label)}" required></label>
        <label>Desde<input name="start" type="time" value="${esc(block.start)}" required></label>
        <label>Hasta<input name="end" type="time" value="${esc(block.end)}" required></label>
        <label class="active-switch block-active"><input type="checkbox" name="active" ${block.active !== false ? 'checked' : ''}><span>Activo</span></label>
      </div>
      <div class="space-editor-actions">
        <span class="editor-hint">Este tramo aparecerá como una fila del calendario semanal.</span>
        <button class="secondary-button" type="button" data-remove-block="${esc(block.id)}">Eliminar</button>
        <button class="primary-button" type="submit">Guardar</button>
      </div>
    </form>`).join('') : '<div class="empty-state"><div><strong>No hay bloques horarios</strong>Agrega al menos uno para usar el calendario y las solicitudes.</div></div>';

  $$('[data-block-form]').forEach(form => form.addEventListener('submit', saveBlockEditor));
  $$('[data-remove-block]').forEach(button => button.addEventListener('click', () => removeBlock(button.dataset.removeBlock)));
}

function saveBlockEditor(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.blockForm;
  const data = Object.fromEntries(new FormData(form).entries());
  const blocks = getBlocks();
  const block = blocks.find(item => item.id === id);
  if (!block) return;

  const label = String(data.label || '').trim();
  if (!label || toMinutes(data.end) <= toMinutes(data.start)) {
    toast('Revisa el nombre y las horas del bloque.');
    return;
  }
  const overlaps = blocks.some(item => item.id !== id &&
    toMinutes(data.start) < toMinutes(item.end) && toMinutes(data.end) > toMinutes(item.start));
  if (overlaps) {
    toast('Ese bloque se cruza con otro bloque horario existente.');
    return;
  }

  block.label = label;
  block.start = data.start;
  block.end = data.end;
  block.active = form.elements.active.checked;
  saveBlocks(blocks);
  refreshAll();
  toast('Bloque horario actualizado.');
}

function addBlock() {
  const blocks = getBlocks();
  let start = '18:00';
  let end = '19:00';
  if (blocks.length) {
    const last = [...blocks].sort((a,b) => toMinutes(a.end) - toMinutes(b.end)).at(-1);
    const nextStart = Math.min(toMinutes(last.end) + 15, 22 * 60);
    const nextEnd = Math.min(nextStart + 60, 23 * 60);
    start = `${String(Math.floor(nextStart / 60)).padStart(2,'0')}:${String(nextStart % 60).padStart(2,'0')}`;
    end = `${String(Math.floor(nextEnd / 60)).padStart(2,'0')}:${String(nextEnd % 60).padStart(2,'0')}`;
  }
  blocks.push({ id: `bloque-${Date.now()}`, label: `Bloque ${blocks.length + 1}`, start, end, active: true });
  saveBlocks(blocks);
  renderAdminBlocks();
  fillBlockSelect();
  renderCalendar();
  toast('Nuevo bloque creado. Ajusta sus horas y guarda.');
}

function removeBlock(id) {
  const inUse = getReservations().some(item => item.blockId === id) || getSuggestions().some(item => item.blockId === id);
  if (inUse) {
    toast('No se puede eliminar: hay reservas o solicitudes asociadas. Puedes desactivarlo.');
    return;
  }
  if (!window.confirm('¿Eliminar este bloque horario?')) return;
  saveBlocks(getBlocks().filter(block => block.id !== id));
  refreshAll();
  toast('Bloque eliminado.');
}

function renderAdminBookings() {
  const date = $('#adminBookingsDate').value || isoToday();
  const items = getReservations()
    .filter(item => item.date === date)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  $('#adminBookingsList').innerHTML = items.length ? items.map(item => {
    const space = getSpace(item.space);
    return `<article class="request-row admin-booking-row">
      <div><h3>${esc(item.title)}</h3><p>${esc(item.name)} · ${esc(item.email || '')}</p></div>
      <div class="request-slot"><strong>${esc(space?.name || item.space)}</strong><span>${esc(item.date)}</span></div>
      <div class="request-slot"><strong>${esc(item.start)}–${esc(item.end)}</strong><span>${esc(item.attendees || '')} personas</span></div>
      <div class="request-actions"><button class="reject-button" data-delete-booking="${esc(item.id)}">Eliminar</button></div>
    </article>`;
  }).join('') : `<div class="empty-state"><div><strong>Sin reservas confirmadas</strong>No hay reservas para ${esc(formatLongDate(date))}.</div></div>`;

  $$('[data-delete-booking]').forEach(button => button.addEventListener('click', () => deleteBooking(button.dataset.deleteBooking)));
}

function deleteBooking(id) {
  if (!window.confirm('¿Eliminar esta reserva confirmada?')) return;
  saveReservations(getReservations().filter(item => item.id !== id));
  refreshAll();
  toast('Reserva eliminada.');
}

function approveSuggestion(id) {
  const suggestions = getSuggestions();
  const request = suggestions.find(item => item.id === id);
  if (!request || request.status !== 'pending') return;

  const space = getSpace(request.space);
  if (!space || space.active === false) {
    toast('No se puede aprobar: el espacio ya no está activo.');
    return;
  }
  if (hasReservationConflict(request)) {
    toast('No se puede aprobar: el horario ahora tiene un conflicto.');
    return;
  }

  const reservation = {
    id: `approved-${request.id}`,
    space: request.space,
    date: request.date,
    start: request.start,
    end: request.end,
    title: request.title,
    name: request.name,
    email: request.email,
    attendees: request.attendees,
    notes: request.notes,
    blockId: request.blockId || '',
    createdAt: new Date().toISOString()
  };

  const reservations = getReservations();
  reservations.push(reservation);
  saveReservations(reservations);

  request.status = 'approved';
  request.reviewedAt = new Date().toISOString();
  saveSuggestions(suggestions);
  refreshAll();
  toast('Solicitud aprobada y reserva confirmada.');
}

function updateSuggestionStatus(id, status) {
  const suggestions = getSuggestions();
  const request = suggestions.find(item => item.id === id);
  if (!request) return;
  request.status = status;
  request.reviewedAt = new Date().toISOString();
  saveSuggestions(suggestions);
  refreshAll();
  toast(status === 'rejected' ? 'Solicitud rechazada.' : 'Solicitud actualizada.');
}

function resetSuggestionFormDefaults() {
  $('#suggestDate').min = isoToday();
  if (!$('#suggestDate').value) $('#suggestDate').value = isoToday();
  if (!isWeekday($('#suggestDate').value)) {
    let next = $('#suggestDate').value;
    while (!isWeekday(next)) next = addDaysISO(next, 1);
    $('#suggestDate').value = next;
  }
  if (!$('#suggestAttendees').value) $('#suggestAttendees').value = '2';
  fillBlockSelect();
  updateAvailabilityPreview();
}

function refreshAll() {
  fillSpaceSelect();
  fillBlockSelect();
  fillCalendarRoomSelect();
  renderHeaderAndStats();
  renderCalendar();
  renderSchedule();
  renderSpaces();
  renderAdminRequests();
  renderAdminSpaces();
  renderAdminBlocks();
  renderAdminBookings();
  updateAvailabilityPreview();
}

function switchAdminTab(name) {
  $$('.admin-tab').forEach(button => button.classList.toggle('active', button.dataset.adminTab === name));
  $$('.admin-subview').forEach(view => view.classList.remove('active'));
  const target = $(`#admin${name[0].toUpperCase()}${name.slice(1)}Tab`);
  if (target) target.classList.add('active');
  if (name === 'spaces') renderAdminSpaces();
  if (name === 'blocks') renderAdminBlocks();
  if (name === 'bookings') renderAdminBookings();
  if (name === 'requests') renderAdminRequests();
}

$('#suggestionForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const message = $('#suggestionMessage');
  message.className = 'form-message';
  message.textContent = '';

  const space = getSpace(data.space);
  const block = getBlock(data.blockId);
  if (!space || space.active === false) {
    message.textContent = 'Selecciona un espacio válido y activo.';
    message.classList.add('error');
    return;
  }
  if (!block || block.active === false) {
    message.textContent = 'Selecciona un bloque horario válido y activo.';
    message.classList.add('error');
    return;
  }
  if (data.date < isoToday()) {
    message.textContent = 'La fecha no puede estar en el pasado.';
    message.classList.add('error');
    return;
  }
  if (!isWeekday(data.date)) {
    message.textContent = 'Solo se pueden solicitar reservas de lunes a viernes.';
    message.classList.add('error');
    return;
  }
  data.start = block.start;
  data.end = block.end;
  if (Number(data.attendees) > space.capacity) {
    message.textContent = `${space.name} admite hasta ${space.capacity} personas.`;
    message.classList.add('error');
    return;
  }
  if (hasReservationConflict(data)) {
    message.textContent = 'Ese bloque ya está ocupado por una reserva confirmada.';
    message.classList.add('error');
    return;
  }

  const suggestions = getSuggestions();
  suggestions.push({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  saveSuggestions(suggestions);

  event.currentTarget.reset();
  resetSuggestionFormDefaults();
  message.textContent = 'Solicitud enviada. Quedó pendiente de aprobación.';
  message.classList.add('success');
  refreshAll();
  toast('Solicitud enviada a administración.');
});

$('#suggestionForm').addEventListener('reset', () => setTimeout(() => {
  $('#suggestDate').value = isoToday();
  resetSuggestionFormDefaults();
  $('#suggestionMessage').textContent = '';
}, 0));

$$('.nav-button').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
$$('[data-go-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.goView)));
$('#mobileNavButton').addEventListener('click', () => $('.main-nav').classList.toggle('open'));
$('#spaceSearch').addEventListener('input', renderSpaces);
$('#capacityFilter').addEventListener('change', renderSpaces);
['#suggestSpace', '#suggestDate', '#suggestBlock'].forEach(selector => $(selector).addEventListener('change', updateAvailabilityPreview));
$('#suggestAttendees').addEventListener('input', updateAvailabilityPreview);

$('#calendarRoomSelect').addEventListener('change', () => {
  renderCalendar();
  renderSchedule();
  renderHeaderAndStats();
});
$('#calendarPrevWeek').addEventListener('click', () => {
  calendarWeekStart = addDaysISO(calendarWeekStart, -7);
  renderCalendar();
  renderSchedule();
  renderHeaderAndStats();
});
$('#calendarNextWeek').addEventListener('click', () => {
  calendarWeekStart = addDaysISO(calendarWeekStart, 7);
  renderCalendar();
  renderSchedule();
  renderHeaderAndStats();
});
$('#calendarTodayButton').addEventListener('click', () => {
  calendarWeekStart = getMondayISO(isoToday());
  renderCalendar();
  renderSchedule();
  renderHeaderAndStats();
});

$$('#adminFilter button').forEach(button => button.addEventListener('click', () => {
  $$('#adminFilter button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderAdminRequests();
}));

$$('.admin-tab').forEach(button => button.addEventListener('click', () => switchAdminTab(button.dataset.adminTab)));
$('#addSpaceButton').addEventListener('click', addSpace);
$('#addBlockButton').addEventListener('click', addBlock);
$('#adminBookingsDate').addEventListener('change', renderAdminBookings);

$('#adminBookingsDate').value = isoToday();
fillSpaceSelect();
resetSuggestionFormDefaults();
refreshAll();

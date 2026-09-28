const COURSES = ['Cálculo 2', 'Química', 'Historia', 'Ética', 'Compiladores', 'Física', 'Programación', 'Inglés'];
const state = {all: [], filtered: [], filter: '', course: null, selected: null};
const dialog = document.querySelector('#task-dialog');

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.detail || 'No se pudo completar la solicitud.');
  return data;
}

function notify(text, error = false) {
  const node = document.querySelector('#notice');
  node.textContent = text;
  node.classList.toggle('error', error);
  node.hidden = false;
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function cell(row, text) {
  const td = document.createElement('td');
  if (text !== undefined) td.textContent = text;
  row.append(td);
  return td;
}

function localDate(iso) {
  return new Date(`${iso}T12:00:00`);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-GT', {day:'2-digit', month:'short', year:'numeric'}).format(localDate(iso));
}

function overdue(task) {
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return task.estado === 'pendiente' && localDate(task.fechaEntrega) < localToday;
}

function taskRow(task, actions = false) {
  const row = document.createElement('tr');
  const title = cell(row);
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'task-link';
  link.textContent = task.titulo;
  link.addEventListener('click', () => openTask(task.id));
  title.append(link);
  cell(row, task.curso);
  cell(row, formatDate(task.fechaEntrega));
  const statusCell = cell(row);
  const status = document.createElement('span');
  const late = overdue(task);
  status.className = `status${late ? ' overdue' : task.estado === 'completada' ? ' done' : ''}`;
  status.textContent = late ? '⚠ Vencida' : task.estado === 'completada' ? 'Completada' : 'Pendiente';
  statusCell.append(status);
  if (late) row.classList.add('overdue-row');
  if (actions) {
    const action = cell(row);
    if (task.estado === 'pendiente') {
      const button = document.createElement('button');
      button.className = 'complete-button';
      button.textContent = 'Completar';
      button.addEventListener('click', () => completeTask(task.id));
      action.append(button);
    } else action.textContent = '—';
  }
  return row;
}

function populateTable(selector, tasks, actions) {
  const body = document.querySelector(selector);
  body.replaceChildren();
  if (!tasks.length) {
    const row = document.createElement('tr');
    const td = cell(row, 'No hay tareas para esta selección.');
    td.colSpan = actions ? 5 : 4;
    td.className = 'empty-cell';
    body.append(row);
    return;
  }
  tasks.forEach(task => body.append(taskRow(task, actions)));
}

function courseCard(course) {
  const card = document.createElement('article');
  card.className = 'course-card';
  const title = document.createElement('h3');
  title.textContent = course;
  const count = state.all.filter(task => task.curso === course && task.estado === 'pendiente').length;
  const sub = document.createElement('p');
  sub.textContent = `${count} ${count === 1 ? 'tarea pendiente' : 'tareas pendientes'}`;
  const footer = document.createElement('div');
  footer.className = 'course-footer';
  const button = document.createElement('button');
  button.textContent = 'Entrar';
  button.type = 'button';
  button.setAttribute('aria-label', `Ver tareas de ${course}`);
  button.addEventListener('click', () => {
    state.course = course;
    state.filter = '';
    syncFilters();
    showView('tareas');
    refresh();
  });
  footer.append(button, icon('arrow'));
  card.append(title, sub, footer);
  return card;
}

function renderCourses() {
  for (const selector of ['#home-courses', '#all-courses']) {
    const container = document.querySelector(selector);
    container.replaceChildren(...COURSES.map(courseCard));
  }
}

function render() {
  const pending = state.all.filter(task => task.estado === 'pendiente');
  document.querySelector('#pending-count').textContent = pending.length;
  document.querySelector('#task-total').textContent = `${state.all.length} tareas`;
  populateTable('#home-task-body', pending.slice(0, 5), false);
  const visible = state.course ? state.filtered.filter(task => task.curso === state.course) : state.filtered;
  populateTable('#all-task-body', visible, true);
  const note = document.querySelector('#course-filter-note');
  note.replaceChildren();
  note.hidden = !state.course;
  if (state.course) {
    note.append(document.createTextNode(`Curso: ${state.course} · `));
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Ver todos los cursos';
    clear.addEventListener('click', () => {state.course = null; render();});
    note.append(clear);
  }
  renderCourses();
}

async function refresh() {
  try {
    const all = await api('/api/tareas/');
    state.all = all;
    state.filtered = state.filter ? await api(`/api/tareas/?estado=${encodeURIComponent(state.filter)}`) : all;
    render();
  } catch (e) { notify(e.message, true); }
}

function showView(name) {
  document.querySelectorAll('.page-view').forEach(view => {view.hidden = view.id !== `view-${name}`;});
  document.querySelectorAll('.nav-item').forEach(item => {
    const active = item.dataset.view === name;
    item.classList.toggle('selected', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

function syncFilters() {
  document.querySelectorAll('.filter').forEach(button => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

async function openTask(id) {
  try {
    const task = await api(`/api/tareas/${id}/`);
    state.selected = task;
    document.querySelector('#dialog-title').textContent = task.titulo;
    document.querySelector('#dialog-course').textContent = task.curso;
    document.querySelector('#dialog-date').textContent = formatDate(task.fechaEntrega);
    document.querySelector('#dialog-state').textContent = task.estado === 'completada' ? 'Completada' : 'Pendiente';
    document.querySelector('#complete-dialog').hidden = task.estado === 'completada';
    dialog.showModal();
  } catch (e) { notify(e.message, true); }
}

async function completeTask(id) {
  try {
    await api(`/api/tareas/${id}/`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({estado:'completada'}),
    });
    if (dialog.open) dialog.close();
    notify(`Tarea #${id} marcada como completada.`);
    await refresh();
  } catch (e) { notify(e.message, true); }
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.view === 'tareas') state.course = null;
  showView(button.dataset.view);
  if (button.dataset.view === 'tareas') refresh();
}));
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  syncFilters();
  refresh();
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#complete-dialog').addEventListener('click', () => {
  if (state.selected) completeTask(state.selected.id);
});
refresh();

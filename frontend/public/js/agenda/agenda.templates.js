// /public/js/agenda/agenda.templates.js
// -----------------------------------------------------------------------------
// Capa de PRESENTACIÓN de Agenda. Todo el HTML vive acá; la lógica (agenda.js /
// calendar.js) lo consume. Se preservan ids, data-* y clases de estado que el
// JS usa como hooks (.day, .hidden, .today, .selected, .day-modal-body, etc.).
//
// A11y Fase 1: los días son operables por teclado (role="button" + tabindex),
// hoy lleva aria-current="date", y los modales tienen role="dialog".
// -----------------------------------------------------------------------------

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const WEEKDAYS_LONG = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MONTHS_LONG = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/** Etiqueta accesible legible para un día (ej: "martes 4 de marzo de 2026"). */
function dayAriaLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Celda de día del calendario (reemplaza buildDayCell de calendar.js). */
export function dayCellTemplate({ dayNumber, dateStr, isOtherMonth, isToday }) {
  const classes = ["day"];
  if (isOtherMonth) classes.push("is-outside-month");
  if (isToday) classes.push("today");

  // Días del mes: botón enfocable. Fuera de mes: no interactivo.
  const a11y = isOtherMonth
    ? `tabindex="-1" aria-hidden="true"`
    : `role="button" tabindex="0" aria-label="${dayAriaLabel(dateStr)}"${isToday ? ' aria-current="date"' : ""}`;

  return `
    <div class="${classes.join(" ")}" data-date="${dateStr}" data-other="${isOtherMonth ? "1" : "0"}" ${a11y}>
      <div class="day-number">${dayNumber}</div>
      <div class="day-content"></div>
    </div>
  `;
}

/** Contenido interno de un chip de turno pintado en el calendario. */
export function appointmentChipInner(a) {
  return `<strong>${escapeHtml(a.time)}</strong> ${escapeHtml(a.name)}`;
}

/** Un ítem de turno dentro del modal del día. */
export function appointmentItemTemplate(a) {
  return `
    <div class="item">
      <div><strong>${escapeHtml(a.time)}</strong> — ${escapeHtml(a.name)}</div>
      <div class="app-buttons">
        <button class="delete-appointment" data-id="${a.id}" type="button" title="Eliminar" aria-label="Eliminar turno de ${escapeHtml(a.name)} a las ${escapeHtml(a.time)}">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Cuerpo del modal del día (lista de turnos o vacío).
 * Unifica las 3 copias que había en calendar.js y agenda.js.
 */
export function dayModalBodyTemplate(dayApps = []) {
  const apps = Array.isArray(dayApps) ? dayApps : [];
  if (apps.length === 0) {
    return `<p class="empty-day">No hay turnos para este día.</p>`;
  }
  const items = apps
    .slice()
    .sort((a, b) => String(a.time).localeCompare(String(b.time)))
    .map(appointmentItemTemplate)
    .join("");
  return `<div class="appointments-list">${items}</div>`;
}

/** Ítem de recordatorio del panel lateral. */
export function reminderItemTemplate(r) {
  return `
    <span>${escapeHtml(r.text)}</span>
    <button class="delete-reminder" data-id="${r.id}" type="button" title="Borrar" aria-label="Borrar recordatorio">
      <i class="fa-solid fa-trash" aria-hidden="true"></i>
    </button>
  `;
}

/** Estado vacío de recordatorios. */
export function remindersEmptyTemplate() {
  return `<li class="reminder-empty">Sin recordatorios</li>`;
}

/**
 * Shell completo de la página de Agenda (lo que devuelve Agenda() en agenda.js).
 * Incluye top-bar, drawer, calendario, panel de recordatorios y los dos modales,
 * ya con los atributos ARIA. No se tocó ningún id/clase/data-*.
 */
export function agendaPageTemplate() {
  return `
    <div class="agenda-page">

      <!-- Top bar -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn" type="button" aria-label="Abrir menú" aria-controls="drawer" aria-expanded="false">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer reutilizado -->
      <aside id="drawer" class="drawer" role="navigation" aria-label="Menú principal">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn" type="button" aria-label="Cerrar menú">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="/dashboard" data-link><i class="fa-solid fa-house" aria-hidden="true"></i> Dashboard</a>
          <a href="/agenda" data-link><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> Agenda</a>
          <a href="/patients" data-link><i class="fa-solid fa-users" aria-hidden="true"></i> Pacientes</a>
          <a href="/treatments" data-link><i class="fa-solid fa-spa" aria-hidden="true"></i> Tratamientos</a>
          <a href="/profile" data-link><i class="fa-solid fa-user" aria-hidden="true"></i> Perfil</a>
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Guías y tutoriales</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- CONTENIDO AGENDA -->
      <main>
        <div class="calendar-container">
          <div class="calendar-header">
            <button id="prevMonth" type="button" aria-label="Mes anterior"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
            <h2 id="monthYear" aria-live="polite"></h2>
            <button id="nextMonth" type="button" aria-label="Mes siguiente"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
          </div>

          <div class="weekdays" aria-hidden="true">
            <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div>
            <div>Vie</div><div>Sáb</div><div>Dom</div>
          </div>

          <div class="calendar" id="calendar" aria-label="Calendario de turnos"></div>
        </div>

        <div class="side-panel" id="sidePanel">
          <h3>Recordatorios</h3>
          <ul class="reminder-list" id="reminderList"></ul>
            <div class="add-reminder">
              <div class="reminder-input-wrapper" style="display:flex; flex-direction:column; width:100%;">
                <input
                  type="text"
                  id="reminderInput"
                  placeholder="Nuevo recordatorio..."
                  maxlength="100"
                  aria-describedby="charCounter"
                  style="width:100%;"
                />

                <div style="display:flex; justify-content:space-between; margin-top:3px;">
                  <small id="charCounter" style="font-size:12px; color:var(--color-muted);" aria-live="polite">0 / 100</small>
                </div>

                <small id="charLimitMsg" style="display:none; color:var(--color-danger); font-size:12px;" role="alert">
                  Límite de caracteres alcanzado
                </small>
              </div>

              <button id="addReminderBtn" type="button" aria-label="Agregar recordatorio"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
            </div>
        </div>
      </main>

      <!-- MODAL DÍA -->
      <div id="dayModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="dayModalTitle">
        <div class="day-modal-content">
          <div class="day-modal-header">
            <h3 id="dayModalTitle">Día</h3>
            <button id="closeDayModal" class="close-btn" type="button" aria-label="Cerrar">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <p id="totalAppointments" class="total-appointments"></p>

          <div class="day-modal-body">
          </div>

          <div class="day-modal-actions">
            <button id="openNewSimpleBtn" class="primary-btn" type="button">Agregar turno</button>
          </div>
        </div>
      </div>

      <!-- SUBMODAL: NUEVO TURNO -->
      <div class="modal hidden" id="newSimpleModal" role="dialog" aria-modal="true" aria-labelledby="newSimpleTitle">
        <div class="new-simple-content">

          <h3 class="modal-title" id="newSimpleTitle">Nuevo turno</h3>

          <div class="field">
            <label for="simplePatientInput">Nombre del paciente</label>
            <div class="patient-row">
              <div class="patient-input-wrapper">
                <input
                  type="text"
                  id="simplePatientInput"
                  placeholder="Buscar paciente..."
                  autocomplete="off"
                  role="combobox"
                  aria-expanded="false"
                  aria-controls="simplePatientDropdown"
                  aria-autocomplete="list"
                />
                <div id="simplePatientDropdown" class="dropdown-list" role="listbox"></div>
              </div>

              <button id="createNewPatientBtn" class="small-btn" type="button">Nuevo</button>
            </div>
          </div>

          <div class="field">
            <label for="simpleTimeInput">Hora</label>
            <input type="time" id="simpleTimeInput" />
          </div>

          <div class="modal-buttons">
            <button id="createSimpleBtn" class="primary-btn" type="button">Guardar</button>
            <button id="cancelSimpleBtn" class="secondary-btn" type="button">Cancelar</button>
          </div>

        </div>
      </div>
    </div>
  `;
}

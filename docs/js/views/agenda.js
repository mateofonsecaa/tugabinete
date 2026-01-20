import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";
import { fetchAppointmentsSimple } from "../agenda/appointments.js";
import { initCalendar, renderCalendar } from "../agenda/calendar.js";

export function Agenda() {
  return `
    <div class="agenda-page">

      <!-- Top bar -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer reutilizado -->
      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="/dashboard" data-link><i class="fa-solid fa-house"></i> Dashboard</a>
          <a href="/agenda" data-link><i class="fa-solid fa-calendar-days"></i> Agenda</a>
          <a href="/patients" data-link><i class="fa-solid fa-users"></i> Pacientes</a>
          <a href="/treatments" data-link><i class="fa-solid fa-spa"></i> Tratamientos</a>
          <a href="/profile" data-link><i class="fa-solid fa-user"></i> Perfil</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- CONTENIDO AGENDA -->
      <main>
        <div class="calendar-container">
          <div class="calendar-header">
            <button id="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
            <h2 id="monthYear"></h2>
            <button id="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
          </div>

          <div class="weekdays">
            <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div>
            <div>Vie</div><div>Sáb</div><div>Dom</div>
          </div>

          <div class="calendar" id="calendar"></div>
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
                  style="width:100%;"
                />

                <div style="display:flex; justify-content:space-between; margin-top:3px;">
                  <small id="charCounter" style="font-size:12px; color:#666;">0 / 100</small>
                </div>

                <small id="charLimitMsg" style="display:none; color:#c44; font-size:12px;">
                  Límite de caracteres alcanzado
                </small>
              </div>

              <button id="addReminderBtn" type="button"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
      </main>
    <!-- MODAL DÍA -->
    <div id="dayModal" class="modal hidden">
      <div class="day-modal-content">
        <div class="day-modal-header">
          <h3 id="dayModalTitle">Día</h3>
          <button id="closeDayModal" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p id="totalAppointments" class="total-appointments"></p>

        <div class="day-modal-body">
        </div>

        <div class="day-modal-actions">
          <button id="openNewSimpleBtn" class="primary-btn">Agregar turno</button>
        </div>
      </div>
      </div>

          <!-- SUBMODAL: NUEVO TURNO -->
      <div class="modal hidden" id="newSimpleModal">
        <div class="new-simple-content">

          <h3 class="modal-title">Nuevo turno</h3>

          <div class="field">
            <label>Nombre del paciente</label>
            <div class="patient-row">
              <div class="patient-input-wrapper">
                <input
                  type="text"
                  id="simplePatientInput"
                  placeholder="Buscar paciente..."
                  autocomplete="off"
                />
                <div id="simplePatientDropdown" class="dropdown-list"></div>
              </div>

              <button id="createNewPatientBtn" class="small-btn" type="button">Nuevo</button>
            </div>
          </div>

          <div class="field">
            <label>Hora</label>
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

export function initAgenda() {
  const modal = document.getElementById("dayModal");
  modal?.classList.add("hidden"); // 🔒 asegura que arranque cerrado

  initDrawer();
  initCalendar();

  (async () => {
    try {
      const apps = await fetchAppointmentsSimple();
      window.__agendaAppointments = apps;   // simple para avanzar rápido
      renderCalendar();                      // re-render + pinta turnos
    } catch (e) {
      console.warn(e);
    }
  })();

  const closeBtn = document.getElementById("closeDayModal");

  closeBtn?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

    // ✅ SUBMODAL NUEVO TURNO (abrir/cerrar)
  const newModal = document.getElementById("newSimpleModal");
  const openNewBtn = document.getElementById("openNewSimpleBtn");
  const cancelNewBtn = document.getElementById("cancelSimpleBtn");
  // ✅ (por ahora) probar botón Guardar: cierra el submodal
  const saveBtn = document.getElementById("createSimpleBtn");
  saveBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
  const patientName = document.getElementById("simplePatientInput")?.value?.trim();
  const dropdown = document.getElementById("simplePatientDropdown");
  const patientId = Number(dropdown?.dataset?.selectedId);

  const time = document.getElementById("simpleTimeInput")?.value;
  const date = window.__selectedAgendaDate; // la seteamos cuando abrís el día

  if (!patientId) return console.warn("Selecciona un paciente válido");
  if (!date) return console.warn("No hay fecha seleccionada");
  if (!time) return console.warn("Selecciona una hora");

  // Combinar fecha + hora en UTC (igual que antes)
  // Si ya tenés combineToUTC en dateUtils, la usamos:
  // si no, lo hacemos simple acá.
  const datetimeUTC = new Date(`${date}T${time}:00`).toISOString();

  const payload = {
    name: patientName,
    patientId,
    date,
    time,
    datetimeUTC,
  };

  try {
    const res = await authFetch(`${API_URL}/simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Error creando turno:", t);
      return;
    }

    // cerrar submodal
    document.getElementById("newSimpleModal")?.classList.add("hidden");

    // refrescar turnos
        // ✅ Mostrar el turno instantáneamente (sin esperar el GET)
    let created = null;
    try { created = await res.json(); } catch {}

    const newApp = {
      id: created?.id ?? Date.now(),
      date,                 // YYYY-MM-DD (la fecha seleccionada)
      time: time.slice(0,5),
      name: patientName || "Sin nombre",
    };

    if (!Array.isArray(window.__agendaAppointments)) window.__agendaAppointments = [];
    window.__agendaAppointments.push(newApp);

    // Re-render para que se pinte en el calendario
    renderCalendar();

    // ✅ refrescar el contenido del modal del día (sin cerrarlo)
const dateStr = window.__selectedAgendaDate;
if (dateStr) {
  const apps = Array.isArray(window.__agendaAppointments) ? window.__agendaAppointments : [];
  const dayApps = apps.filter(a => a.date === dateStr);

  const totalEl = document.getElementById("totalAppointments");
  if (totalEl) totalEl.textContent = `Turnos del día: ${dayApps.length}`;

  const dayModal = document.getElementById("dayModal");
  const body = dayModal?.querySelector(".day-modal-body");

  if (body) {
    if (dayApps.length === 0) {
      body.innerHTML = `<p class="empty-day">No hay turnos para este día.</p>`;
    } else {
      body.innerHTML = `
        <div class="appointments-list">
          ${dayApps
            .slice()
            .sort((a, b) => String(a.time).localeCompare(String(b.time)))
            .map(a => `
              <div class="item">
                <div><strong>${a.time}</strong> — ${a.name}</div>
                <div class="app-buttons">
                  <button class="delete-appointment" data-id="${a.id}" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `)
            .join("")}
        </div>
      `;
    }
  }
}

    // opcional: limpiar inputs
    document.getElementById("simplePatientInput").value = "";
    document.getElementById("simplePatientDropdown").dataset.selectedId = "";
    document.getElementById("simpleTimeInput").value = "";

    console.log("Turno creado OK");
  } catch (err) {
    console.error("Error de conexión:", err);
  }
});

  openNewBtn?.addEventListener("click", () => {
    newModal?.classList.remove("hidden");
  });

  cancelNewBtn?.addEventListener("click", () => {
    newModal?.classList.add("hidden");
  });

  newModal?.addEventListener("click", (e) => {
    if (e.target === newModal) newModal.classList.add("hidden");
  });

    // ✅ PACIENTES: cargar + autocomplete
  let allPatients = [];

  async function loadPatients() {
    try {
      const res = await authFetch(`${API_URL}/patients`);
      if (!res.ok) throw new Error("No se pudieron cargar pacientes");
      allPatients = await res.json();
    } catch (err) {
      console.error(err);
      allPatients = [];
    }
  }

  function updatePatientDropdown(filter = "") {
    const dropdown = document.getElementById("simplePatientDropdown");
    const input = document.getElementById("simplePatientInput");
    if (!dropdown || !input) return;

    dropdown.innerHTML = "";

    const filtered = allPatients.filter(p => {
      const name = (p.fullName || `${p.name ?? ""} ${p.lastName ?? ""}`).trim();
      return name.toLowerCase().includes(filter.toLowerCase());
    });

    filtered.slice(0, 15).forEach(p => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.textContent = (p.fullName || `${p.name ?? ""} ${p.lastName ?? ""}`).trim();

      item.addEventListener("click", () => {
        input.value = item.textContent;
        dropdown.dataset.selectedId = String(p.id);
        dropdown.style.display = "none";
      });

      dropdown.appendChild(item);
    });

    dropdown.style.display = filtered.length ? "block" : "none";
  }

  // cuando escribís en el input
  document.addEventListener("input", (e) => {
    if (e.target?.id === "simplePatientInput") {
      updatePatientDropdown(e.target.value);
    }
  });

  // cerrar dropdown si clic afuera
  document.addEventListener("click", (e) => {
    const input = document.getElementById("simplePatientInput");
    const dropdown = document.getElementById("simplePatientDropdown");
    if (!input || !dropdown) return;

    if (!e.target.closest(".patient-input-wrapper")) {
      dropdown.style.display = "none";
    }
  });

  // cargar pacientes al entrar a agenda
  loadPatients().then(() => {
    updatePatientDropdown("");
  });

    // 🗑️ Borrar turno desde el modal del día
  modal?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-appointment");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!id) return;

    const result = await Swal.fire({
      title: "Confirmar acción",
      text: "¿Seguro que quieres eliminar este turno?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ffadad",
      cancelButtonColor: "#ccc",
      background: "#fffdf9",
      color: "#333",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`${API_URL}/simple/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text();
        console.error("Error al eliminar:", t);
        return;
      }

      // ✅ sacar de memoria
      window.__agendaAppointments = (window.__agendaAppointments || []).filter(a => a.id !== id);

      // ✅ refrescar calendario
      renderCalendar();

      // ✅ refrescar contenido del modal (sin cerrarlo)
      const dateStr = window.__selectedAgendaDate;
      const apps = Array.isArray(window.__agendaAppointments) ? window.__agendaAppointments : [];
      const dayApps = apps.filter(a => a.date === dateStr);

      const totalEl = document.getElementById("totalAppointments");
      if (totalEl) totalEl.textContent = `Turnos del día: ${dayApps.length}`;

      const body = modal.querySelector(".day-modal-body");
      if (body) {
        if (dayApps.length === 0) {
          body.innerHTML = ``;
        } else {
          body.innerHTML = `
            <div class="appointments-list">
              ${dayApps
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(a => `
                  <div class="item">
                    <div><strong>${a.time}</strong> — ${a.name}</div>
                    <div class="app-buttons">
                      <button class="delete-appointment" data-id="${a.id}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                `)
                .join("")}
            </div>
          `;
        }
      }
    } catch (err) {
      console.error("Error de conexión al eliminar:", err);
    }
  });

  // ===========================
// 📝 RECORDATORIOS (POR USUARIO EN DB)
// ===========================
const reminderList = document.getElementById("reminderList");
const reminderInput = document.getElementById("reminderInput");
const addReminderBtn = document.getElementById("addReminderBtn");
const charCounter = document.getElementById("charCounter");
const charLimitMsg = document.getElementById("charLimitMsg");

const MAX_LEN = 100;
const MAX_REMINDERS = 30;

function applyRemindersLimitUI() {
  const count = Array.isArray(window.__reminders) ? window.__reminders.length : 0;
  const disabled = count >= MAX_REMINDERS;

  if (addReminderBtn) addReminderBtn.disabled = disabled;
  if (reminderInput) reminderInput.disabled = disabled;

  // opcional: cambia placeholder cuando llega al límite
  if (reminderInput) {
    reminderInput.placeholder = disabled
      ? `Máximo ${MAX_REMINDERS} recordatorios`
      : "Nuevo recordatorio...";
  }
}

function updateCounter() {
  if (!reminderInput || !charCounter || !charLimitMsg) return;
  const len = reminderInput.value.length;
  charCounter.textContent = `${len} / ${MAX_LEN}`;
  charLimitMsg.style.display = len >= MAX_LEN ? "block" : "none";
}

function renderReminders(reminders = []) {
  if (!reminderList) return;

  reminderList.innerHTML = "";

  if (!reminders.length) {
    reminderList.innerHTML = `<li style="text-align:center; color:#777;">Sin recordatorios</li>`;
    applyRemindersLimitUI();
    return;
  }

  reminders.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(r.text)}</span>

      <button class="delete-reminder" data-id="${r.id}" title="Borrar">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    reminderList.appendChild(li);
  });

  applyRemindersLimitUI();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadRemindersFromDB() {
  try {
    const res = await authFetch(`${API_URL}/reminders`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    window.__reminders = Array.isArray(data) ? data : [];
    renderReminders(window.__reminders);
  } catch (err) {
    console.error("Error cargando recordatorios:", err);
    renderReminders([]); // fallback visual
  }
}

async function addReminderToDB() {
  if (!reminderInput) return;

  const text = reminderInput.value.trim();
  if (!text) return;

  // ✅ ACÁ VA EL LÍMITE (PASO 3.2.3)
  const currentCount = Array.isArray(window.__reminders) ? window.__reminders.length : 0;
  if (currentCount >= MAX_REMINDERS) {
    await Swal.fire({
      title: "Límite alcanzado",
      text: `Máximo ${MAX_REMINDERS} recordatorios.`,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#333",
    });
    applyRemindersLimitUI();
    return;
  }
  try {
    const res = await authFetch(`${API_URL}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, MAX_LEN) }),
    });


    if (!res.ok) {
      console.error("Error creando recordatorio:", await res.text());
      return;
    }

    const created = await res.json().catch(() => null);

    // ✅ actualizar lista en memoria + re-render
    if (!Array.isArray(window.__reminders)) window.__reminders = [];
    if (created) window.__reminders.unshift(created);
    else await loadRemindersFromDB();

    renderReminders(window.__reminders);
    applyRemindersLimitUI();

    // limpiar input
    reminderInput.value = "";
    updateCounter();
  } catch (err) {
    console.error("Error de conexión creando recordatorio:", err);
  }
}

// init recordatorios
updateCounter();
loadRemindersFromDB();

// eventos UI
reminderInput?.addEventListener("input", updateCounter);

reminderInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addReminderToDB();
  }
});

addReminderBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  addReminderToDB();
});

// borrar recordatorio
reminderList?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-reminder");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (!id) return;

  const result = await Swal.fire({
    title: "Confirmar acción",
    text: "¿Seguro que quieres eliminar este recordatorio?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
    cancelButtonColor: "#ccc",
    background: "#fffdf9",
    color: "#333",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await authFetch(`${API_URL}/reminders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Error eliminando recordatorio:", await res.text());
      return;
    }

    window.__reminders = (window.__reminders || []).filter(r => r.id !== id);
    renderReminders(window.__reminders);
  } catch (err) {
    console.error("Error de conexión eliminando recordatorio:", err);
  }
});

  console.log("Agenda SPA inicializada");
}



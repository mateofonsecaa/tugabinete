import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";
import { fetchAppointmentsSimple } from "../agenda/appointments.js";
import { initCalendar, renderCalendar } from "../agenda/calendar.js";
import {
  agendaPageTemplate,
  dayModalBodyTemplate,
  reminderItemTemplate,
  remindersEmptyTemplate,
} from "../agenda/agenda.templates.js";

export function Agenda() {
  return agendaPageTemplate();
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

  if (body) body.innerHTML = dayModalBodyTemplate(dayApps);
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

    dropdown.style.display = filtered.length > 0 ? "block" : "none";
  }

  // cuando escribís en el input
 // cuando escribís en el input
document.addEventListener("input", (e) => {
  if (e.target?.id === "simplePatientInput") {
    const dropdown = document.getElementById("simplePatientDropdown");
    if (dropdown) dropdown.dataset.selectedId = "";
    updatePatientDropdown(e.target.value);
  }
});

// mostrar lista completa apenas hacés foco o click en el campo
document.addEventListener("focusin", (e) => {
  if (e.target?.id === "simplePatientInput") {
    updatePatientDropdown(e.target.value.trim());
  }
});

document.addEventListener("click", (e) => {
  if (e.target?.id === "simplePatientInput") {
    updatePatientDropdown(e.target.value.trim());
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
      if (body) body.innerHTML = dayModalBodyTemplate(dayApps);
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
    reminderList.innerHTML = remindersEmptyTemplate();
    applyRemindersLimitUI();
    return;
  }

  reminders.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = reminderItemTemplate(r);
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



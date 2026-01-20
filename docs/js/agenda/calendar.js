// /public/js/agenda/calendar.js

let currentDate = new Date(); // mes que se está mostrando
let selectedDayEl = null;

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Lunes = 0, ... Domingo = 6
function mondayIndex(jsDayIndex) {
  return (jsDayIndex + 6) % 7; // JS: Dom=0 -> 6, Lun=1 -> 0, ...
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDayCell({ dayNumber, dateStr, isOtherMonth, isToday }) {
  const classes = ["day"];
  if (isOtherMonth) classes.push("other-month");
  if (isToday) classes.push("today");

  return `
    <div class="${classes.join(" ")}" data-date="${dateStr}" data-other="${isOtherMonth ? "1" : "0"}">
      <div class="day-number">${dayNumber}</div>
      <div class="day-content"></div>
    </div>
  `;
}

export function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");

  if (!calendarEl || !monthYearEl) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYearEl.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const firstDayIndex = mondayIndex(firstDay.getDay()); // 0..6 (Lun..Dom)
  const totalDays = daysInMonth(year, month);

  // Para rellenar el grid: días del mes anterior al inicio
  const prevMonthLastDay = daysInMonth(year, month - 1);

  // Construcción de 42 celdas (6 semanas) para que se vea “pro” siempre igual
  let html = "";

  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const dayOfMonth = i - firstDayIndex + 1;

    // ✅ Esto funciona incluso si dayOfMonth está fuera de rango (JS ajusta mes automáticamente)
    const cellDate = new Date(year, month, dayOfMonth);
    const dateStr = toDateStrLocal(cellDate);

    const isOtherMonth = cellDate.getMonth() !== month;
    const isToday = isSameDay(cellDate, today);

    html += buildDayCell({
      dayNumber: cellDate.getDate(),
      dateStr,
      isOtherMonth,
      isToday,
    });
  }

  calendarEl.innerHTML = html;
  selectedDayEl = null;

  calendarEl.removeEventListener("click", onDayClick);
  calendarEl.addEventListener("click", onDayClick);
  
  if (window.__agendaAppointments) {
    paintAppointments(window.__agendaAppointments);
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateStrLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function goPrevMonth() {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
}

export function goNextMonth() {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
}

export function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  // ✅ Evita re-inicializar si ya lo hiciste
  if (calendarEl.dataset.inited === "1") {
    renderCalendar();
    return;
  }
  calendarEl.dataset.inited = "1";

  // Render inicial
  renderCalendar();

  // Navegación (sin duplicar)
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");

  prevBtn?.addEventListener("click", goPrevMonth);
  nextBtn?.addEventListener("click", goNextMonth);
}

function onDayClick(e) {
  const dayEl = e.target.closest(".day");
  if (!dayEl) return;

  // quitar selección previa
  if (selectedDayEl) {
    selectedDayEl.classList.remove("selected");
  }

  // marcar actual
  selectedDayEl = dayEl;
  dayEl.classList.add("selected");

  const dateStr = dayEl.dataset.date;
  const isOtherMonth = dayEl.dataset.other === "1";

  openDayModal(dateStr, isOtherMonth);
}

function openDayModal(dateStr, isOtherMonth) {
  const modal = document.getElementById("dayModal");
  const title = document.getElementById("dayModalTitle");
  const body = modal?.querySelector(".day-modal-body");
  window.__selectedAgendaDate = dateStr;
  if (!modal || !title || !body) return;

  const d = new Date(dateStr + "T00:00:00");
  const pretty = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  title.textContent = isOtherMonth ? `${pretty} (otro mes)` : pretty;

  // ✅ Turnos del día
  const apps = Array.isArray(window.__agendaAppointments) ? window.__agendaAppointments : [];
  const dayApps = apps.filter(a => a.date === dateStr);

  const totalEl = document.getElementById("totalAppointments");
  if (totalEl) totalEl.textContent = `Turnos del día: ${dayApps.length}`;

  // Render
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

  modal.classList.remove("hidden");
}

export function paintAppointments(appointments = []) {
  appointments.forEach(a => {
    const cell = document.querySelector(`.agenda-page .day[data-date="${a.date}"] .day-content`);
    if (!cell) return;

    const div = document.createElement("div");
    div.className = "appointment";
    div.innerHTML = `<strong>${a.time}</strong> ${a.name}`;
    cell.appendChild(div);
  });
}

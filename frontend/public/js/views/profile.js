// views/profile.js
import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";

let incomeChartInstance = null;

export function Profile() {
  return `
    <div class="profile-page">

      <!-- Top bar (MISMO que Agenda) -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer (MISMO que Agenda) -->
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
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question"></i> Guías y tutoriales</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- CONTENIDO PERFIL -->
      <main class="profile-main">
        <div class="profile-container">

          <div class="profile-grid">

            <!-- IZQUIERDA -->
            <section class="profile-col profile-left">

              <div class="profile-card profile-header-card">
                <div class="profile-header">
                  <img src="" alt="Foto de perfil" class="profile-pic">

                  <div class="profile-info">
                    <h2 id="userName">—</h2>
                    <p class="subtitle" id="professionLabel">—</p>

                    <div class="profile-contact">
                      <p><i class="fa-solid fa-envelope"></i><span id="userEmail">—</span></p>
                      <p><i class="fa-solid fa-phone"></i><span id="userPhone">—</span></p>
                    </div>
                  </div>

                  <button class="btn-edit" id="editProfileBtn">
                    <i class="fa-solid fa-pen"></i> Editar perfil
                  </button>
                </div>
              </div>

              <div class="profile-card profile-stats-card">
                <!-- IMPORTANTE: mantener .stat + span (orden) para loadStats() -->
                <section class="stats">
                  <div class="stat" data-go="/treatments">
                    <div class="stat-top">
                      <i class="fa-solid fa-spa"></i>
                      <span>0</span>
                    </div>
                    <small>Tratamientos realizados</small>
                  </div>

                  <div class="stat clickable" data-go="/patients">
                    <div class="stat-top">
                      <i class="fa-solid fa-user-check"></i>
                      <span>0</span>
                    </div>
                    <small>Pacientes activos</small>
                  </div>

                  <div class="stat clickable" data-go="/treatments">
                    <div class="stat-top">
                      <i class="fa-solid fa-bag-shopping"></i>
                      <span>0</span>
                    </div>
                    <small>Ventas realizadas</small>
                  </div>
                </section>
              </div>

              <section class="profile-card income-card">
                <div class="income-head">
                  <div>
                    <h3>Ingresos</h3>
                    <p class="muted" id="incomeSubtitle">Resumen de ingresos por tratamientos y ventas</p>
                  </div>

                  <div class="income-controls">
                    <select id="incomeSource">
                      <option value="both" selected>Ambos</option>
                      <option value="treatments">Tratamientos</option>
                      <option value="sales">Ventas</option>
                    </select>

                    <select id="incomeRange">
                      <option value="6m" selected>Últimos 6 meses</option>
                      <option value="12m">Últimos 12 meses</option>
                    </select>
                  </div>
                </div>

                <div class="income-kpis">
                  <div class="income-kpi">
                    <span class="lbl">Total</span>
                    <span class="val" id="incomeTotal">$—</span>
                  </div>
                  <div class="income-kpi">
                    <span class="lbl">Promedio/mes</span>
                    <span class="val" id="incomeAvg">$—</span>
                  </div>
                </div>

                <div class="income-chart-wrap">
                  <canvas id="incomeChart" height="140"></canvas>
                  <div id="incomeChartFallback" class="tg-empty" style="display:none; text-align:center;">
                    No se pudo cargar el gráfico.
                  </div>
                </div>
              </section>


            </section>

            <!-- DERECHA -->
            <section class="profile-col profile-right">
              <div class="profile-card turnos">
                <h3>Próximos turnos</h3>
                <p class="muted">Cargando...</p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  `;
}

export function initProfile() {

  initDrawer();

  // 1) Render instantáneo con cache (si existe)
  const cachedUser = getCachedUser();
  if (cachedUser) renderUser(cachedUser);

  // 2) Traer datos reales
  fetchUserFromServer().then((freshUser) => {
    if (freshUser) renderUser(freshUser);
  });

  // 3) Cargar datos secundarios
  loadStats();
  loadAppointments();
  initIncome();

  // 4) Bind navegación SPA (evita window.location.href)
  bindNav();

  // 5) Bind editar perfil (ruta futura)
  const editBtn = document.getElementById("editProfileBtn");
  if (editBtn && !editBtn.dataset.bound) {
    editBtn.dataset.bound = "1";
    editBtn.addEventListener("click", () => {
      // cuando migres el edit: /profile/edit
      history.pushState(null, "", "/profile/edit");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
}

// =====================================================
// 🧠 Manejo local de usuario
// =====================================================

function saveUserLocally(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// =====================================================
// 👤 Obtener usuario desde backend
// =====================================================

async function fetchUserFromServer() {
  try {
    const res = await authFetch(`${API_URL}/auth/me`);
    const user = await res.json();
    if (!res.ok) throw new Error(user.error || "Error al obtener usuario");
    saveUserLocally(user);
    return user;
  } catch (err) {
    console.warn("No se pudo obtener usuario desde backend", err);
    return null;
  }
}

// =====================================================
// 🖼️ Render de datos
// =====================================================

function renderUser(user) {
  const $ = (id) => document.getElementById(id);

  const du = document.getElementById("drawer-username");
  if (du) du.textContent = user.name || "Profesional";
  if ($("userName")) $("userName").textContent = user.name || "Sin nombre";
  if ($("professionLabel")) $("professionLabel").textContent = user.profession || "Sin profesión";
  if ($("userEmail")) $("userEmail").textContent = user.email || "Sin correo";
  if ($("userPhone")) $("userPhone").textContent = user.phone || "—";

  const img = document.querySelector(".profile-pic");
  if (img) {
    img.loading = "lazy";
    img.src = user.profileImage || "../../images/personaejemplo.png";
  }
}

// =====================================================
// 📊 Estadísticas
// =====================================================

async function loadStats() {
  try {
    const res = await authFetch(`${API_URL}/stats`);
    if (!res.ok) return;

    const stats = await res.json();
    const spans = document.querySelectorAll(".stat span");

    // 0: Tratamientos realizados (en tu backend hoy es totalAppointments)
    if (spans[0]) spans[0].textContent = stats.totalAppointments ?? "0";

    // 1: Pacientes activos
    if (spans[1]) spans[1].textContent = stats.totalPatients ?? "0";

    // 2: Ventas realizadas
    if (spans[2]) spans[2].textContent = stats.totalSales ?? "0";
  } catch {
    console.warn("Error cargando stats");
  }
}

// =====================================================
// 📅 Próximos turnos
// =====================================================

async function loadAppointments() {
  try {
    const res = await authFetch(`${API_URL}/simple`);
    if (!res.ok) return;

    const data = await res.json();
    const now = Date.now();

    const upcoming = data
      .filter(a => new Date(a.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    const container = document.querySelector(".turnos");
    if (!container) return;

    container.innerHTML = `<h3>Próximos turnos</h3>`;

    if (!upcoming.length) {
      container.innerHTML += `<p class="muted">No hay turnos próximos registrados.</p>`;
      return;
    }

    let html = `<div class="turnos-list">`;

    upcoming.forEach(a => {
      const d = new Date(a.date);
      const fecha = d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const hora = a.time || d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      html += `
        <div class="turno-card clickable" data-go="/agenda">
          <div class="turno-main">
            <div class="turno-name">${a.name || "-"}</div>
            <div class="turno-meta">
              <span class="turno-time">${hora}</span>
              <span class="turno-dot">•</span>
              <span class="turno-date">${fecha}</span>
            </div>
          </div>
          <div class="turno-icon" aria-hidden="true">
            <i class="fa-regular fa-calendar"></i>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML += html;
    bindNav();

  } catch (err) {
    console.error("Error turnos:", err);
  }
}

// =====================================================
// 🧭 Helpers de navegación SPA
// =====================================================

function bindNav() {
  document.querySelectorAll("[data-go]").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", () => {
      history.pushState(null, "", el.dataset.go);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
}

// =====================================================
// 🔐 Logout (si el botón existe en layout global)
// =====================================================

function loadSweetAlert() {
  if (!window.Swal) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    document.head.appendChild(s);
  }
}

/* =====================================================
   💰 Ingresos (solo Pagado) por mes
===================================================== */

function formatARS(n) {
  const value = Number(n) || 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildLastNMonths(n) {
  // genera lista de meses (keys) desde el más viejo al más nuevo
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);

  const months = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), // ej: "ene 26"
      start: d,
    });
  }
  return months;
}

async function fetchAppointmentsForIncome(fromDate, neededMonths) {
  // Paginado defensivo: trae hasta que ya no haya data o ya cubrimos los meses requeridos
  const limit = 200;
  let offset = 0;
  let all = [];

  while (true) {
    const res = await authFetch(`${API_URL}/appointments?offset=${offset}&limit=${limit}`);
    if (!res.ok) break;

    const json = await res.json().catch(() => null);
    const items = Array.isArray(json) ? json : (json?.appointments || json?.items || []);
    if (!items.length) break;

    all.push(...items);

    // si el último item es más viejo que fromDate, podemos cortar (para no traer todo)
    const last = items[items.length - 1];
    const lastDate = last?.date ? new Date(last.date) : null;
    if (lastDate && lastDate < fromDate) break;

    if (items.length < limit) break;
    offset += limit;

    // pequeño guard: no iterar infinito si el backend no pagina bien
    if (offset > 2000) break;
  }

  // Filtramos por fecha >= fromDate
  return all.filter((t) => {
    if (!t?.date) return false;
    const d = new Date(t.date);
    return d >= fromDate;
  });
}

async function fetchSalesForIncome(fromDate) {
  const limit = 200;
  let offset = 0;
  let all = [];

  while (true) {
    const res = await authFetch(`${API_URL}/sales?offset=${offset}&limit=${limit}`);
    if (!res.ok) break;

    const items = await res.json().catch(() => []);
    if (!Array.isArray(items) || !items.length) break;

    all.push(...items);

    const last = items[items.length - 1];
    const lastDate = last?.date ? new Date(last.date) : null;
    if (lastDate && lastDate < fromDate) break;

    if (items.length < limit) break;
    offset += limit;

    if (offset > 2000) break;
  }

  return all.filter((s) => {
    if (!s?.date) return false;
    const d = new Date(s.date);
    return d >= fromDate;
  });
}

function destroyIncomeChart() {
  if (incomeChartInstance) {
    incomeChartInstance.destroy();
    incomeChartInstance = null;
  }
}

function renderIncomeChart(labels, datasets) {
  const canvas = document.getElementById("incomeChart");
  const fallback = document.getElementById("incomeChartFallback");
  if (!canvas) return;

  if (!window.Chart) {
    if (fallback) fallback.style.display = "block";
    canvas.style.display = "none";
    return;
  }

  if (fallback) fallback.style.display = "none";
  canvas.style.display = "block";

  const ctx = canvas.getContext("2d");
  destroyIncomeChart();

  incomeChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
        axis: "x",
      },
      hover: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatARS(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true },
        },
        y: {
          ticks: {
            callback: (v) => formatARS(v),
          },
        },
      },
    },
  });
}

async function loadIncome(range = "6m", source = "both") {
  const monthsCount = range === "12m" ? 12 : 6;
  const months = buildLastNMonths(monthsCount);
  const fromDate = months[0].start;

  const [appointmentRows, salesRows] = await Promise.all([
    fetchAppointmentsForIncome(fromDate, monthsCount),
    fetchSalesForIncome(fromDate),
  ]);

  const treatmentSums = new Map();
  appointmentRows.forEach((t) => {
    if ((t.status || "").toLowerCase() !== "pagado") return;

    const amount = Number(t.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const d = new Date(t.date);
    const key = monthKey(d);
    treatmentSums.set(key, (treatmentSums.get(key) || 0) + amount);
  });

  const salesSums = new Map();
  salesRows.forEach((s) => {
    const amount = Number(s.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const d = new Date(s.date);
    const key = monthKey(d);
    salesSums.set(key, (salesSums.get(key) || 0) + amount);
  });

  const labels = months.map((m) => m.label);
  const treatmentValues = months.map((m) => Math.round(treatmentSums.get(m.key) || 0));
  const salesValues = months.map((m) => Math.round(salesSums.get(m.key) || 0));
  const combinedValues = months.map((_, i) => treatmentValues[i] + salesValues[i]);

  let datasets = [];
  let valuesForKpis = [];
  const subtitle = document.getElementById("incomeSubtitle");

  if (source === "treatments") {
    datasets = [
      {
        label: "Tratamientos",
        data: treatmentValues,
        tension: 0.35,
        fill: true,
        borderWidth: 2,
        borderColor: "#ffadad",
        backgroundColor: "rgba(255, 173, 173, 0.22)",
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ];
    valuesForKpis = treatmentValues;
    if (subtitle) subtitle.textContent = "Resumen de ingresos por tratamientos";
  } else if (source === "sales") {
    datasets = [
      {
        label: "Ventas",
        data: salesValues,
        tension: 0.35,
        fill: true,
        borderWidth: 2,
        borderColor: "#cdb4db",
        backgroundColor: "rgba(205, 180, 219, 0.20)",
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ];
    valuesForKpis = salesValues;
    if (subtitle) subtitle.textContent = "Resumen de ingresos por ventas";
  } else {
    datasets = [
      {
        label: "Tratamientos",
        data: treatmentValues,
        tension: 0.35,
        fill: false,
        borderWidth: 2,
        borderColor: "#ffadad",
        backgroundColor: "rgba(255, 173, 173, 0.10)",
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: "Ventas",
        data: salesValues,
        tension: 0.35,
        fill: false,
        borderWidth: 2,
        borderColor: "#cdb4db",
        backgroundColor: "rgba(205, 180, 219, 0.10)",
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ];
    valuesForKpis = combinedValues;
    if (subtitle) subtitle.textContent = "Resumen de ingresos por tratamientos y ventas";
  }

  const total = valuesForKpis.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(total / monthsCount);

  const totalEl = document.getElementById("incomeTotal");
  const avgEl = document.getElementById("incomeAvg");

  if (totalEl) totalEl.textContent = formatARS(total);
  if (avgEl) avgEl.textContent = formatARS(avg);

  renderIncomeChart(labels, datasets);
}

function initIncome() {
  const rangeSelect = document.getElementById("incomeRange");
  const sourceSelect = document.getElementById("incomeSource");

  const reload = () => {
    loadIncome(
      rangeSelect?.value || "6m",
      sourceSelect?.value || "both"
    );
  };

  if (rangeSelect && !rangeSelect.dataset.bound) {
    rangeSelect.dataset.bound = "1";
    rangeSelect.addEventListener("change", reload);
  }

  if (sourceSelect && !sourceSelect.dataset.bound) {
    sourceSelect.dataset.bound = "1";
    sourceSelect.addEventListener("change", reload);
  }

  reload();
}

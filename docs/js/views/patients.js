import { initDrawer } from "../components/drawer.js";
import { initPatientsPage } from "../patients/patients.page.js";

export function Patients() {
    return `
    <div class="patients-page">
        <!-- Top bar -->
        <div class="top-bar">
        <button id="open-menu" class="menu-btn">
            <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
        </div>

        <!-- Drawer (reutilizado del dashboard) -->
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

        <!-- CONTENIDO REAL -->
        <main>
        <div class="main-top-actions">
            <button id="back-btn" class="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Volver
            </button>
        </div>

        <h1>Mis Pacientes</h1>

        <div class="search-bar">
            <input type="text" id="search" placeholder="Buscar paciente..." />
            <button id="add-patient" class="btn-add">
            <i class="fa-solid fa-user-plus"></i> Nuevo Paciente
            </button>
        </div>

        <div class="table-container">
            <table id="patientsTable">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Edad</th>
                    <th>Último tratamiento</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody></tbody>
                </table>
            </div>
        </main>
    </div>
    `;
}

export function initPatients() {
  initDrawer();
  initPatientsEvents();
  initPatientsPage();
}

function initPatientsEvents() {
  // Volver al dashboard
  document.getElementById("back-btn").addEventListener("click", () => {
    history.pushState(null, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  // Buscar paciente (placeholder)
  document.getElementById("search").addEventListener("input", (e) => {
    console.log("Buscar:", e.target.value);
  });
}

// /public/js/views/patient-details.js
import { initDrawer } from "../components/drawer.js";
import { initPatientDetailsPage } from "../patients/patientDetails.page.js";

export function PatientDetails() {
  return `
    <div class="patient-details-page">
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>

        <span class="app-title">TuGabinete</span>
      </div>

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

      <main>
        <!-- LOADER: se ve al inicio -->
        <div id="pd-loading" class="pd-loading">
          <div class="pd-loading-card">
            <div class="pd-spinner"></div>
            <div class="pd-loading-text">Cargando...</div>
          </div>
        </div>

        <!-- CONTENIDO REAL: arranca oculto -->
        <div id="pd-content" class="pd-content" hidden>
          <div class="main-top-actions">
            <button id="back-btn" class="btn-back">
              <i class="fa-solid fa-arrow-left"></i> Volver
            </button>

            <div class="right-actions">
              <button id="view-interview-btn" class="btn-add">
                <i class="fa-solid fa-clipboard-list"></i> Ver entrevista
              </button>

              <button id="edit-btn" class="btn-add">
                <i class="fa-solid fa-pen"></i> Editar paciente
              </button>
            </div>
          </div>

          <h1 id="patient-name">Cargando...</h1>

          <div class="table-container" style="margin-top:12px;">
            <table>
              <tbody id="patient-info"></tbody>
            </table>
          </div>

          <h2 style="margin-top:18px;">Últimos turnos</h2>
          <div class="table-container table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tratamiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="patient-appointments"></tbody>
            </table>
          </div>
        </div>
      </main>

    </div>
  `;
}

export function initPatientDetails() {
  document.body.className = "is-patient-details"; // importante

  initDrawer();
  initPatientDetailsPage();
}

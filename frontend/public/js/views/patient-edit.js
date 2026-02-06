// /public/js/views/patient-edit.js
import { initDrawer } from "../components/drawer.js";
import { initPatientEditPage } from "../patients/patientEdit.page.js";

export function PatientEdit() {
  return `
    <div class="patients-page patient-edit-page">
      <div class="top-bar">
        <button id="open-menu" class="menu-btn"><i class="fa-solid fa-bars"></i></button>
        <span class="app-title">TuGabinete</span>
      </div>

      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn"><i class="fa-solid fa-xmark"></i></button>
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

      <main>
        <div class="main-top-actions">
            <button id="back-btn" class="btn-back">
                <i class="fa-solid fa-arrow-left"></i> Volver
            </button>

            <div class="right-actions">
                <button id="to-details-btn" class="btn-add">
                <i class="fa-solid fa-id-card"></i> Ver ficha
                </button>
            </div>
        </div>

        <h1 id="patient-title">Cargando...</h1>

        <form id="patient-form" class="patient-form">
          <label>Nombre completo
            <input id="fullName" type="text" required maxlength="20"
              title="Solo letras y espacios (máx 20)" />
          </label>

          <label>Fecha de nacimiento
            <input id="birthDate" type="date" required />
          </label>

          <label>Teléfono
            <input id="phone" type="text" required maxlength="20"
              inputmode="numeric"
              title="Solo números (máx 20)" />
          </label>

          <label>Dirección
            <input id="address" type="text" maxlength="30"
              title="Solo letras, números y espacios (máx 30)" />
          </label>

          <label>Profesión
            <input id="profession" type="text" maxlength="25"
              title="Máx 25 caracteres" />
          </label>

          <button class="btn-add btn-save-edit" type="submit">
            <i class="fa-solid fa-check"></i> Guardar
          </button>
        </form>
      </main>
    </div>
  `;
}

export function initPatientEdit() {
    document.body.className = "is-patient-edit";
    initDrawer();
    initPatientEditPage();
}

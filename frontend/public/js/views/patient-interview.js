import { initDrawer } from "../components/drawer.js";
import { initPatientInterviewPage } from "../interview/patientInterview.page.js";

export function PatientInterview() {
  return `
    <div class="patients-page">
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
        <div class="main-top-actions" style="display:flex; gap:10px; align-items:center;">
          <button id="back-btn" class="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>

          <button id="save-btn" class="btn-add" style="margin-left:auto;">
            <i class="fa-solid fa-check"></i> Guardar
          </button>
        </div>

        <h1 id="title">Entrevista</h1>

        <form id="interview-form" class="patient-form">
          <h2>Salud</h2>
          <label>Alergia <input name="allergy" type="text" /></label>
          <label>Detalle alergia <input name="allergyExtra" type="text" /></label>
          <label>Medicación <input name="medication" type="text" /></label>
          <label>Detalle medicación <input name="medicationExtra" type="text" /></label>
          <label>Enfermedad <input name="illness" type="text" /></label>
          <label>Detalle enfermedad <input name="illnessExtra" type="text" /></label>

          <h2>Hábitos</h2>
          <label>Fuma <input name="smoke" type="text" /></label>
          <label>Alcohol <input name="alcohol" type="text" /></label>
          <label>Deporte <input name="sport" type="text" /></label>
          <label>Detalle deporte <input name="sportExtra" type="text" /></label>
          <label>Sueño <input name="sleep" type="text" /></label>
          <label>Estrés <input name="stress" type="text" /></label>
          <label>Agua <input name="water" type="text" /></label>
          <label>Sol <input name="sun" type="text" /></label>

          <h2>Piel & Rutina</h2>
          <label>Tipo de piel <input name="skinType" type="text" /></label>
          <label>Piel (detalle) <input name="skin" type="text" /></label>
          <label>Preocupaciones <input name="concerns" type="text" /></label>
          <label>Resultados esperados <input name="expectedResults" type="text" /></label>

          <h2>Rutina actual</h2>
          <label>Limpiador <input name="cleanser" type="text" /></label>
          <label>Tónico <input name="toner" type="text" /></label>
          <label>Serum <input name="serum" type="text" /></label>
          <label>Crema de ojos <input name="eyeCream" type="text" /></label>
          <label>Hidratante día <input name="moisturizerDay" type="text" /></label>
          <label>Hidratante noche <input name="moisturizerNight" type="text" /></label>
          <label>Protector solar <input name="sunscreen" type="text" /></label>

          <h2>Otros</h2>
          <label>Biotipo <input name="biotipo" type="text" /></label>
          <label>Fototipo <input name="fototipo" type="text" /></label>
        </form>
      </main>
    </div>
  `;
}

export function initPatientInterview() {
  initDrawer();
  initPatientInterviewPage();
}

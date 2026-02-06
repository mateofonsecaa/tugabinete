import { initDrawer } from "../components/drawer.js";
import { initInterviewViewPage } from "../interview/interviewView.page.js";

export function InterviewView() {
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
      <div class="main-top-actions">
        <button id="back-btn" class="btn-back">
          <i class="fa-solid fa-arrow-left"></i> Volver
        </button>

        <div class="right-actions">
          <button id="edit-btn" class="btn-add">
            <i class="fa-solid fa-pen-to-square"></i> Editar Entrevista
          </button>
        </div>
      </div>

      <h1>Ficha Completa de Entrevista</h1>

      <section class="section" id="sectionHealth">
        <h2><i class="fa-solid fa-heart-pulse"></i> Historial de Salud y Hábitos</h2>
        <div id="healthData"></div>
      </section>

      <section class="section" id="sectionObservations">
        <h2><i class="fa-solid fa-user-doctor"></i> Observaciones del Profesional</h2>
        <div id="observationsData"></div>
      </section>

      <section class="section" id="sectionFacial">
        <h2><i class="fa-solid fa-spa"></i> Cuidado Facial Actual y Preocupaciones</h2>
        <div id="facialData"></div>
      </section>
    </main>
  </div>
  `;
}

export function initInterviewView() {
  initDrawer();
  initInterviewViewPage();
}

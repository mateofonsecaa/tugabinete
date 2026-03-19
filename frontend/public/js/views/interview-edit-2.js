import { initDrawer } from "../components/drawer.js";
import { initInterviewEdit2Page } from "../interview/interviewEdit2.page.js";

export function InterviewEdit2() {
  return `
  <div class="patients-page interview-edit-page">
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

    <main class="interview-edit-main">
      <section class="interview-edit-card">
        <div class="interview-edit-toolbar">
          <button id="back-btn" type="button" class="interview-edit-back-btn">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>
        </div>

        <div class="interview-edit-header">
          <p class="interview-edit-step">Paso 2 de 2</p>
          <h1 class="interview-edit-title">Cuidado Facial Actual y Preocupaciones</h1>
          <p class="interview-edit-subtitle">
            Registrá el tipo de piel, hábitos de cuidado actual y objetivos del tratamiento.
          </p>
        </div>

        <form id="formFacial2" class="interview-edit-form">
          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-spa"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Diagnóstico inicial</span>
              <h2 class="interview-edit-divider-title">Tipo de piel y preocupaciones principales</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Qué tipo de piel cree que tiene?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="skinType" value="Normal"> Normal</label>
              <label class="interview-edit-choice"><input type="radio" name="skinType" value="Seca"> Seca</label>
              <label class="interview-edit-choice"><input type="radio" name="skinType" value="Grasa"> Grasa</label>
              <label class="interview-edit-choice"><input type="radio" name="skinType" value="Mixta"> Mixta</label>
              <label class="interview-edit-choice"><input type="radio" name="skinType" value="Sensible"> Sensible</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Cuáles son sus principales preocupaciones estéticas faciales?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Acné/Granitos"> Acné / Granitos</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Poros dilatados"> Poros dilatados</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Manchas/Hipergmentación"> Manchas / Hipergmentación</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Arrugas/Finas líneas"> Arrugas / Finas líneas</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Flacidez"> Flacidez</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Deshidratación/Piel seca"> Deshidratación / Piel seca</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Ojeras/Bolsas"> Ojeras / Bolsas</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Piel apagada"> Piel apagada / Sin luminosidad</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Sensibilidad"> Sensibilidad</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Cicatrices/Acné"> Cicatrices de acné</label>
              <label class="interview-edit-choice"><input type="checkbox" name="concerns" value="Otros"> Otros</label>
            </div>
          </div>

          <div class="interview-edit-grid">
            <div class="interview-edit-block">
              <label class="interview-edit-label">Biotipo Cutáneo (Clasificación según observación profesional)</label>
              <div class="interview-edit-options">
                <label class="interview-edit-choice"><input type="radio" name="biotipo" value="Eudérmica/Normal"> Eudérmica / Normal</label>
                <label class="interview-edit-choice"><input type="radio" name="biotipo" value="Alípica/Seca"> Alípica / Seca</label>
                <label class="interview-edit-choice"><input type="radio" name="biotipo" value="Grasa/Oleosa"> Grasa / Oleosa</label>
                <label class="interview-edit-choice"><input type="radio" name="biotipo" value="Mixta"> Mixta</label>
                <label class="interview-edit-choice"><input type="radio" name="biotipo" value="Sensible"> Sensible</label>
              </div>
            </div>

            <div class="interview-edit-block">
              <label class="interview-edit-label">Fototipo de Fitzpatrick</label>
              <div class="interview-edit-options">
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="I: Siempre se quema, nunca se broncea"> I: Siempre se quema, nunca se broncea</label>
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="II: Se quema fácilmente, se broncea mínimamente"> II: Se quema fácilmente, se broncea mínimamente</label>
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="III: Se quema ocasionalmente, se broncea gradualmente"> III: Se quema ocasionalmente, se broncea gradualmente</label>
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="IV: Rara vez se quema, se broncea con facilidad"> IV: Rara vez se quema, se broncea con facilidad</label>
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="V: Casi nunca se quema, se broncea intensamente"> V: Casi nunca se quema, se broncea intensamente</label>
                <label class="interview-edit-choice"><input type="radio" name="fototipo" value="VI: Nunca se quema"> VI: Nunca se quema</label>
              </div>
            </div>
          </div>

          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-pump-soap"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Rutina actual</span>
              <h2 class="interview-edit-divider-title">Productos y frecuencia de uso</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">Describa su rutina facial actual</label>
            <div class="interview-edit-subinputs">
              <div class="interview-edit-subfield">
                <label>Limpiador</label>
                <input type="text" id="cleanser" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Tónico</label>
                <input type="text" id="toner" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Sérum</label>
                <input type="text" id="serum" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Crema hidratante (día)</label>
                <input type="text" id="moisturizerDay" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Crema hidratante (noche)</label>
                <input type="text" id="moisturizerNight" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Contorno de ojos</label>
                <input type="text" id="eyeCream" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Protector solar (marca y FPS)</label>
                <input type="text" id="sunscreen" class="interview-edit-input">
              </div>
              <div class="interview-edit-subfield">
                <label>Frecuencia (mañana/noche)</label>
                <input type="text" id="routineFrequency" class="interview-edit-input">
              </div>
            </div>
          </div>

          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-bullseye"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Objetivos</span>
              <h2 class="interview-edit-divider-title">Tolerancia, expectativas y disponibilidad</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Ha tenido alguna reacción adversa a productos cosméticos?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="adverseReaction" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="adverseReaction" value="No"> No</label>
            </div>
            <textarea id="adverseDetails" class="interview-edit-textarea" placeholder="Describa el producto y la reacción" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Qué resultados espera obtener con los tratamientos faciales?</label>
            <textarea id="expectedResults" class="interview-edit-textarea"></textarea>
          </div>

          <div class="interview-edit-grid">
            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Con qué frecuencia estaría dispuesto/a a realizar tratamientos faciales?</label>
              <input type="text" id="treatmentFrequency" class="interview-edit-input">
            </div>

            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Cuánto tiempo puede dedicar a su rutina facial en casa diariamente?</label>
              <input type="text" id="routineTime" class="interview-edit-input">
            </div>
          </div>

          <div class="interview-edit-actions">
            <button type="button" id="save-btn" class="interview-edit-secondary-btn">Guardar</button>
            <button type="button" id="finish-btn" class="interview-edit-primary-btn">Finalizar</button>
          </div>
        </form>
      </section>
    </main>
  </div>
  `;
}

export function initInterviewEdit2() {
  initDrawer();
  initInterviewEdit2Page();
}
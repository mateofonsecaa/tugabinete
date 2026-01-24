import { initDrawer } from "../components/drawer.js";
import { initInterviewEdit2Page } from "../interview/interviewEdit2.page.js";

export function InterviewEdit2() {
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
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
      </nav>
    </aside>

    <div id="drawer-overlay" class="drawer-overlay"></div>

    <main>
      <section class="form-card">
        <div class="top-bar">
          <button id="back-btn" class="btn btn-back">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>
        </div>

        <h2>Cuidado Facial Actual y Preocupaciones</h2>
        <form id="formFacial2">
          <!-- Tipo de piel -->
          <div class="question">
            <label>¿Qué tipo de piel cree que tiene?</label>
            <div class="options">
              <label><input type="radio" name="skinType" value="Normal"> Normal</label>
              <label><input type="radio" name="skinType" value="Seca"> Seca</label>
              <label><input type="radio" name="skinType" value="Grasa"> Grasa</label>
              <label><input type="radio" name="skinType" value="Mixta"> Mixta</label>
              <label><input type="radio" name="skinType" value="Sensible"> Sensible</label>
            </div>
          </div>

          <!-- Preocupaciones -->
          <div class="question">
            <label>¿Cuáles son sus principales preocupaciones estéticas faciales?</label>
            <div class="options">
              <label><input type="checkbox" name="concerns" value="Acné/Granitos"> Acné / Granitos</label>
              <label><input type="checkbox" name="concerns" value="Poros dilatados"> Poros dilatados</label>
              <label><input type="checkbox" name="concerns" value="Manchas/Hipergmentación"> Manchas / Hipergmentación</label>
              <label><input type="checkbox" name="concerns" value="Arrugas/Finas líneas"> Arrugas / Finas líneas</label>
              <label><input type="checkbox" name="concerns" value="Flacidez"> Flacidez</label>
              <label><input type="checkbox" name="concerns" value="Deshidratación/Piel seca"> Deshidratación / Piel seca</label>
              <label><input type="checkbox" name="concerns" value="Ojeras/Bolsas"> Ojeras / Bolsas</label>
              <label><input type="checkbox" name="concerns" value="Piel apagada"> Piel apagada / Sin luminosidad</label>
              <label><input type="checkbox" name="concerns" value="Sensibilidad"> Sensibilidad</label>
              <label><input type="checkbox" name="concerns" value="Cicatrices/Acné"> Cicatrices de acné</label>
              <label><input type="checkbox" name="concerns" value="Otros"> Otros</label>
            </div>
          </div>

          <!-- Biotipo -->
          <div class="question">
            <label>Biotipo Cutáneo (Clasificación según observación profesional):</label>
            <div class="options">
              <label><input type="radio" name="biotipo" value="Eudérmica/Normal"> Eudérmica / Normal</label>
              <label><input type="radio" name="biotipo" value="Alípica/Seca"> Alípica / Seca</label>
              <label><input type="radio" name="biotipo" value="Grasa/Oleosa"> Grasa / Oleosa</label>
              <label><input type="radio" name="biotipo" value="Mixta"> Mixta</label>
              <label><input type="radio" name="biotipo" value="Sensible"> Sensible</label>
            </div>
          </div>

          <!-- Fototipo -->
          <div class="question">
            <label>Fototipo de Fitzpatrick:</label>
            <div class="options">
              <label><input type="radio" name="fototipo" value="I: Siempre se quema, nunca se broncea"> I: Siempre se quema, nunca se broncea</label>
              <label><input type="radio" name="fototipo" value="II: Se quema fácilmente, se broncea mínimamente"> II: Se quema fácilmente, se broncea mínimamente</label>
              <label><input type="radio" name="fototipo" value="III: Se quema ocasionalmente, se broncea gradualmente"> III: Se quema ocasionalmente, se broncea gradualmente</label>
              <label><input type="radio" name="fototipo" value="IV: Rara vez se quema, se broncea con facilidad"> IV: Rara vez se quema, se broncea con facilidad</label>
              <label><input type="radio" name="fototipo" value="V: Casi nunca se quema, se broncea intensamente"> V: Casi nunca se quema, se broncea intensamente</label>
              <label><input type="radio" name="fototipo" value="VI: Nunca se quema"> VI: Nunca se quema</label>
            </div>
          </div>

          <!-- Rutina -->
          <div class="question">
            <label>Describa su rutina facial actual (productos y frecuencia):</label>
            <div class="subinputs">
              <label>Limpiador:</label> <input type="text" id="cleanser">
              <label>Tónico:</label> <input type="text" id="toner">
              <label>Sérum:</label> <input type="text" id="serum">
              <label>Crema hidratante (día):</label> <input type="text" id="moisturizerDay">
              <label>Crema hidratante (noche):</label> <input type="text" id="moisturizerNight">
              <label>Contorno de ojos:</label> <input type="text" id="eyeCream">
              <label>Protector solar (marca y FPS):</label> <input type="text" id="sunscreen">
              <label>Frecuencia (mañana/noche):</label> <input type="text" id="routineFrequency">
            </div>
          </div>

          <!-- Reacción adversa -->
          <div class="question">
            <label>¿Ha tenido alguna reacción adversa a productos cosméticos?</label>
            <div class="options">
              <label><input type="radio" name="adverseReaction" value="Sí"> Sí</label>
              <label><input type="radio" name="adverseReaction" value="No"> No</label>
            </div>
            <textarea id="adverseDetails" placeholder="Describa el producto y la reacción" style="display:none;"></textarea>
          </div>

          <div class="question">
            <label>¿Qué resultados espera obtener con los tratamientos faciales?</label>
            <textarea id="expectedResults"></textarea>
          </div>

          <div class="question">
            <label>¿Con qué frecuencia estaría dispuesto/a a realizar tratamientos faciales?</label>
            <input type="text" id="treatmentFrequency">
          </div>

          <div class="question">
            <label>¿Cuánto tiempo puede dedicar a su rutina facial en casa diariamente?</label>
            <input type="text" id="routineTime">
          </div>

          <div class="actions">
            <button type="button" id="save-btn" class="btn btn-save">Guardar</button>
            <button type="button" id="finish-btn" class="btn btn-next">Finalizar</button>
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

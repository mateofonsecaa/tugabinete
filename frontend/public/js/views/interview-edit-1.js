import { initDrawer } from "../components/drawer.js";
import { initInterviewEdit1Page } from "../interview/interviewEdit1.page.js";

export function InterviewEdit1() {
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
        <div id="interview-loading" class="interview-edit-loading" aria-live="polite">
          <div class="interview-edit-spinner" aria-hidden="true"></div>
          <p class="interview-edit-loading-text">Cargando entrevista...</p>
        </div>

        <div class="interview-edit-toolbar">
          <button id="back-btn" type="button" class="interview-edit-back-btn">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>
        </div>

        <div class="interview-edit-header">
          <p class="interview-edit-step">Paso 1 de 2</p>
          <h1 class="interview-edit-title">Historial de Salud y Hábitos</h1>
          <p class="interview-edit-subtitle">
            Completá esta ficha de forma clara y rápida para registrar antecedentes, hábitos y factores relevantes.
          </p>
        </div>

        <form id="formFacial1" class="interview-edit-form">
          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-heart-pulse"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Salud general</span>
              <h2 class="interview-edit-divider-title">Antecedentes y condiciones médicas</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Padece alguna enfermedad o condición médica?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="illness" value="Sí" data-extra="illnessExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="illness" value="No" data-extra="illnessExtra"> No</label>
            </div>
            <textarea id="illnessExtra" class="interview-edit-textarea" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Ha tenido o tiene algún problema oncológico?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="oncology" value="Sí" data-extra="oncologyExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="oncology" value="No" data-extra="oncologyExtra"> No</label>
            </div>
            <textarea id="oncologyExtra" class="interview-edit-textarea" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Utiliza marcapasos u otro dispositivo electrónico implantado?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="device" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="device" value="No"> No</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Está tomando alguna medicación actualmente?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="medication" value="Sí" data-extra="medicationExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="medication" value="No" data-extra="medicationExtra"> No</label>
            </div>
            <textarea id="medicationExtra" class="interview-edit-textarea" placeholder="Indique medicación y dosis" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Toma anticonceptivos o medicación hormonal?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="hormones" value="Sí" data-extra="hormonesExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="hormones" value="No" data-extra="hormonesExtra"> No</label>
            </div>
            <textarea id="hormonesExtra" class="interview-edit-textarea" placeholder="Especifique tipo y duración" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Tiene alguna alergia conocida?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="allergy" value="Sí" data-extra="allergyExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="allergy" value="No" data-extra="allergyExtra"> No</label>
            </div>
            <textarea id="allergyExtra" class="interview-edit-textarea" placeholder="Indique tipo de alergia" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Es celíaca o tiene intolerancia alimentaria?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="celiac" value="Sí" data-extra="celiacExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="celiac" value="No" data-extra="celiacExtra"> No</label>
            </div>
            <textarea id="celiacExtra" class="interview-edit-textarea" placeholder="Especifique tipo de intolerancia" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Ha sido sometida a cirugía facial o estética?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="surgery" value="Sí" data-extra="surgeryExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="surgery" value="No" data-extra="surgeryExtra"> No</label>
            </div>
            <textarea id="surgeryExtra" class="interview-edit-textarea" placeholder="Describa el procedimiento y la fecha" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Está embarazada o en lactancia?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="pregnancy" value="Sí" data-extra="pregnancyExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="pregnancy" value="No" data-extra="pregnancyExtra"> No</label>
            </div>
            <textarea id="pregnancyExtra" class="interview-edit-textarea" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Hábitos</span>
              <h2 class="interview-edit-divider-title">Estilo de vida y rutina diaria</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Fuma?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="smoke" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="smoke" value="No"> No</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Consume alcohol regularmente?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="alcohol" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="alcohol" value="No"> No</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Con qué frecuencia realiza actividad física?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="sport" value="1-2 veces por semana"> 1-2 veces</label>
              <label class="interview-edit-choice"><input type="radio" name="sport" value="3-4 veces por semana"> 3-4 veces</label>
              <label class="interview-edit-choice"><input type="radio" name="sport" value="5-7 veces por semana"> 5-7 veces</label>
            </div>
            <textarea id="sportExtra" class="interview-edit-textarea" placeholder="Tipo de actividad o comentarios"></textarea>
          </div>

          <div class="interview-edit-grid">
            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Cuánta agua consume por día (aprox)?</label>
              <input type="text" id="water" class="interview-edit-input" placeholder="Ej: 2 litros">
            </div>

            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Cuántas horas pasa frente a pantallas diariamente?</label>
              <input
                type="text"
                id="screenTime"
                class="interview-edit-input"
                placeholder="Ej: 6"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="off"
              />
            </div>

            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Cuántas horas de sueño tiene por noche?</label>
              <input
                type="text"
                id="sleep"
                class="interview-edit-input"
                placeholder="Ej: 8"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="off"
              />
            </div>

            <div class="interview-edit-block">
              <label class="interview-edit-label">¿Usa lentes de contacto?</label>
              <div class="interview-edit-options">
                <label class="interview-edit-choice"><input type="radio" name="lenses" value="Sí"> Sí</label>
                <label class="interview-edit-choice"><input type="radio" name="lenses" value="No"> No</label>
              </div>
            </div>
          </div>

          <div class="interview-edit-divider">
            <div class="interview-edit-divider-icon">
              <i class="fa-solid fa-sun"></i>
            </div>
            <div class="interview-edit-divider-content">
              <span class="interview-edit-divider-kicker">Piel y antecedentes</span>
              <h2 class="interview-edit-divider-title">Factores dermatológicos relevantes</h2>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Tuvo mucha exposición solar en la infancia/adolescencia?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="sun" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="sun" value="No"> No</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">Cuando se expone al sol, su piel tiende a:</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="skin" value="broncearse"> Broncearse</label>
              <label class="interview-edit-choice"><input type="radio" name="skin" value="quemarse"> Quemarse</label>
              <label class="interview-edit-choice"><input type="radio" name="skin" value="ambas"> Enrojecer y luego broncearse</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Existe antecedente familiar de rosácea, acné o vitiligo?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="family" value="Sí" data-extra="familyExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="family" value="No" data-extra="familyExtra"> No</label>
            </div>
            <textarea id="familyExtra" class="interview-edit-textarea" placeholder="Especifique tipo de antecedente" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">Nivel de estrés percibido:</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="stress" value="Alto"> Alto</label>
              <label class="interview-edit-choice"><input type="radio" name="stress" value="Moderado"> Moderado</label>
              <label class="interview-edit-choice"><input type="radio" name="stress" value="Bajo"> Bajo</label>
            </div>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Ha experimentado cambios hormonales recientes?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="hormonal" value="Sí" data-extra="hormonalExtra"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="hormonal" value="No" data-extra="hormonalExtra"> No</label>
            </div>
            <textarea id="hormonalExtra" class="interview-edit-textarea" placeholder="Especifique (menopausia, SOP, embarazo, etc.)" style="display:none;"></textarea>
          </div>

          <div class="interview-edit-block">
            <label class="interview-edit-label">¿Tiene tendencia a cicatrizar con queloides?</label>
            <div class="interview-edit-options">
              <label class="interview-edit-choice"><input type="radio" name="keloid" value="Sí"> Sí</label>
              <label class="interview-edit-choice"><input type="radio" name="keloid" value="No"> No</label>
            </div>
          </div>

          <div class="interview-edit-actions">
            <button type="button" id="save-btn" class="interview-edit-secondary-btn">Guardar</button>
            <button type="button" id="next-btn" class="interview-edit-primary-btn">Continuar</button>
          </div>
        </form>
      </section>
    </main>
  </div>
  `;
}

export function initInterviewEdit1() {
  initDrawer();
  initInterviewEdit1Page();
}
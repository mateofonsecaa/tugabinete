import { initDrawer } from "../components/drawer.js";
import { initInterviewEdit1Page } from "../interview/interviewEdit1.page.js";

export function InterviewEdit1() {
  return `
  <div class="patients-page">
    <div class="top-bar">
      <button id="open-menu" class="menu-btn"><i class="fa-solid fa-bars"></i></button>
      <span class="app-title">Entrevista (1/2)</span>
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

        <h2>Historial de Salud y Hábitos</h2>
        <form id="formFacial1">
          <!-- 1. Enfermedades -->
          <div class="question">
            <label>¿Padece alguna enfermedad o condición médica?</label>
            <div class="options">
              <label><input type="radio" name="illness" value="Sí" data-extra="illnessExtra"> Sí</label>
              <label><input type="radio" name="illness" value="No" data-extra="illnessExtra"> No</label>
            </div>
            <textarea id="illnessExtra" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <!-- 2. Oncológico -->
          <div class="question">
            <label>¿Ha tenido o tiene algún problema oncológico?</label>
            <div class="options">
              <label><input type="radio" name="oncology" value="Sí" data-extra="oncologyExtra"> Sí</label>
              <label><input type="radio" name="oncology" value="No" data-extra="oncologyExtra"> No</label>
            </div>
            <textarea id="oncologyExtra" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <!-- 3. Dispositivo -->
          <div class="question">
            <label>¿Utiliza marcapasos u otro dispositivo electrónico implantado?</label>
            <div class="options">
              <label><input type="radio" name="device" value="Sí"> Sí</label>
              <label><input type="radio" name="device" value="No"> No</label>
            </div>
          </div>

          <!-- 4. Medicación -->
          <div class="question">
            <label>¿Está tomando alguna medicación actualmente?</label>
            <div class="options">
              <label><input type="radio" name="medication" value="Sí" data-extra="medicationExtra"> Sí</label>
              <label><input type="radio" name="medication" value="No" data-extra="medicationExtra"> No</label>
            </div>
            <textarea id="medicationExtra" placeholder="Indique medicación y dosis" style="display:none;"></textarea>
          </div>

          <!-- 5. Hormonas -->
          <div class="question">
            <label>¿Toma anticonceptivos o medicación hormonal?</label>
            <div class="options">
              <label><input type="radio" name="hormones" value="Sí" data-extra="hormonesExtra"> Sí</label>
              <label><input type="radio" name="hormones" value="No" data-extra="hormonesExtra"> No</label>
            </div>
            <textarea id="hormonesExtra" placeholder="Especifique tipo y duración" style="display:none;"></textarea>
          </div>

          <!-- 6. Alergias -->
          <div class="question">
            <label>¿Tiene alguna alergia conocida?</label>
            <div class="options">
              <label><input type="radio" name="allergy" value="Sí" data-extra="allergyExtra"> Sí</label>
              <label><input type="radio" name="allergy" value="No" data-extra="allergyExtra"> No</label>
            </div>
            <textarea id="allergyExtra" placeholder="Indique tipo de alergia" style="display:none;"></textarea>
          </div>

          <!-- 7. Celiaquía -->
          <div class="question">
            <label>¿Es celíaca o tiene intolerancia alimentaria?</label>
            <div class="options">
              <label><input type="radio" name="celiac" value="Sí" data-extra="celiacExtra"> Sí</label>
              <label><input type="radio" name="celiac" value="No" data-extra="celiacExtra"> No</label>
            </div>
            <textarea id="celiacExtra" placeholder="Especifique tipo de intolerancia" style="display:none;"></textarea>
          </div>

          <!-- 8. Cirugías -->
          <div class="question">
            <label>¿Ha sido sometida a cirugía facial o estética?</label>
            <div class="options">
              <label><input type="radio" name="surgery" value="Sí" data-extra="surgeryExtra"> Sí</label>
              <label><input type="radio" name="surgery" value="No" data-extra="surgeryExtra"> No</label>
            </div>
            <textarea id="surgeryExtra" placeholder="Describa el procedimiento y la fecha" style="display:none;"></textarea>
          </div>

          <!-- 9. Embarazo -->
          <div class="question">
            <label>¿Está embarazada o en lactancia?</label>
            <div class="options">
              <label><input type="radio" name="pregnancy" value="Sí" data-extra="pregnancyExtra"> Sí</label>
              <label><input type="radio" name="pregnancy" value="No" data-extra="pregnancyExtra"> No</label>
            </div>
            <textarea id="pregnancyExtra" placeholder="Especifique si corresponde" style="display:none;"></textarea>
          </div>

          <!-- 10. Fuma -->
          <div class="question">
            <label>¿Fuma?</label>
            <div class="options">
              <label><input type="radio" name="smoke" value="Sí"> Sí</label>
              <label><input type="radio" name="smoke" value="No"> No</label>
            </div>
          </div>

          <!-- 11. Alcohol -->
          <div class="question">
            <label>¿Consume alcohol regularmente?</label>
            <div class="options">
              <label><input type="radio" name="alcohol" value="Sí"> Sí</label>
              <label><input type="radio" name="alcohol" value="No"> No</label>
            </div>
          </div>

          <!-- 12. Actividad física -->
          <div class="question">
            <label>¿Con qué frecuencia realiza actividad física?</label>
            <div class="options">
              <label><input type="radio" name="sport" value="1-2 veces por semana"> 1-2 veces</label>
              <label><input type="radio" name="sport" value="3-4 veces por semana"> 3-4 veces</label>
              <label><input type="radio" name="sport" value="5-7 veces por semana"> 5-7 veces</label>
            </div>
            <textarea id="sportExtra" placeholder="Tipo de actividad o comentarios"></textarea>
          </div>

          <!-- 13. Agua -->
          <div class="question">
            <label>¿Cuánta agua consume por día (aprox)?</label>
            <input type="text" id="water" placeholder="Ej: 2 litros">
          </div>

          <!-- 14. Pantallas -->
          <div class="question">
            <label>¿Cuántas horas pasa frente a pantallas diariamente?</label>
            <input type="number" id="screenTime" placeholder="Ej: 6">
          </div>

          <!-- 15. Sueño -->
          <div class="question">
            <label>¿Cuántas horas de sueño tiene por noche?</label>
            <input type="number" id="sleep" placeholder="Ej: 8">
          </div>

          <!-- 16. Lentes -->
          <div class="question">
            <label>¿Usa lentes de contacto?</label>
            <div class="options">
              <label><input type="radio" name="lenses" value="Sí"> Sí</label>
              <label><input type="radio" name="lenses" value="No"> No</label>
            </div>
          </div>

          <!-- 17. Sol -->
          <div class="question">
            <label>¿Tuvo mucha exposición solar en la infancia/adolescencia?</label>
            <div class="options">
              <label><input type="radio" name="sun" value="Sí"> Sí</label>
              <label><input type="radio" name="sun" value="No"> No</label>
            </div>
          </div>

          <!-- 18. Piel al sol -->
          <div class="question">
            <label>Cuando se expone al sol, su piel tiende a:</label>
            <div class="options">
              <label><input type="radio" name="skin" value="broncearse"> Broncearse</label>
              <label><input type="radio" name="skin" value="quemarse"> Quemarse</label>
              <label><input type="radio" name="skin" value="ambas"> Enrojecer y luego broncearse</label>
            </div>
          </div>

          <!-- 19. Antecedentes familiares -->
          <div class="question">
            <label>¿Existe antecedente familiar de rosácea, acné o vitiligo?</label>
            <div class="options">
              <label><input type="radio" name="family" value="Sí" data-extra="familyExtra"> Sí</label>
              <label><input type="radio" name="family" value="No" data-extra="familyExtra"> No</label>
            </div>
            <textarea id="familyExtra" placeholder="Especifique tipo de antecedente" style="display:none;"></textarea>
          </div>

          <!-- 20. Estrés -->
          <div class="question">
            <label>Nivel de estrés percibido:</label>
            <div class="options">
              <label><input type="radio" name="stress" value="Alto"> Alto</label>
              <label><input type="radio" name="stress" value="Moderado"> Moderado</label>
              <label><input type="radio" name="stress" value="Bajo"> Bajo</label>
            </div>
          </div>

          <!-- 21. Cambios hormonales -->
          <div class="question">
            <label>¿Ha experimentado cambios hormonales recientes?</label>
            <div class="options">
              <label><input type="radio" name="hormonal" value="Sí" data-extra="hormonalExtra"> Sí</label>
              <label><input type="radio" name="hormonal" value="No" data-extra="hormonalExtra"> No</label>
            </div>
            <textarea id="hormonalExtra" placeholder="Especifique (menopausia, SOP, embarazo, etc.)" style="display:none;"></textarea>
          </div>

          <!-- 22. Queloides -->
          <div class="question">
            <label>¿Tiene tendencia a cicatrizar con queloides?</label>
            <div class="options">
              <label><input type="radio" name="keloid" value="Sí"> Sí</label>
              <label><input type="radio" name="keloid" value="No"> No</label>
            </div>
          </div>

          <div class="actions">
            <button type="button" id="save-btn" class="btn btn-save">Guardar</button>
            <button type="button" id="next-btn" class="btn btn-next">Continuar</button>
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

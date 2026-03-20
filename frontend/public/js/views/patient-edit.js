// /public/js/views/patient-edit.js
import { initDrawer } from "../components/drawer.js";
import { initPatientEditPage } from "../patients/patientEdit.page.js";

function getTodayYYYYMMDD() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function PatientEdit() {
  const today = getTodayYYYYMMDD();

  return `
    <div class="patients-page patient-edit-page">
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
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question"></i> Guías y tutoriales</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <main>
        <div class="main-top-actions">
          <button id="back-btn" class="btn-back" type="button">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>

          <div class="right-actions">
            <button id="to-details-btn" class="btn-add" type="button">
              <i class="fa-solid fa-id-card"></i> Ver ficha
            </button>
          </div>
        </div>

        <section class="patient-edit-view">
          <div class="patient-edit-header">
            <h1 id="patient-title" class="patient-edit-title">Editar paciente</h1>
            <p class="patient-edit-subtitle">
              Modificá los datos básicos del paciente. Solo <strong>Nombre completo</strong> es obligatorio.
            </p>
          </div>

          <section class="patient-edit-card">
            <form id="patient-form" class="patient-form patient-edit-form" novalidate>
              <div class="patient-field" data-field="fullName">
                <div class="patient-field-head">
                  <label for="fullName" class="patient-label">Nombre completo</label>
                  <span class="patient-field-status patient-field-status--required">Obligatorio</span>
                </div>

                <input
                  id="fullName"
                  type="text"
                  required
                  maxlength="60"
                  autocomplete="name"
                  placeholder="Ej.: María Fernández"
                />

                <p class="patient-field-help">Ingresá nombre y apellido del paciente.</p>
                <p class="patient-field-error" id="fullName-error" aria-live="polite"></p>
              </div>

              <div class="patient-field" data-field="birthDate">
                <div class="patient-field-head">
                  <label for="birthDate" class="patient-label">Fecha de nacimiento</label>
                  <span class="patient-field-status">Opcional</span>
                </div>

                <div class="patient-input-wrap patient-input-wrap--date">
                  <input
                    id="birthDate"
                    type="date"
                    max="${today}"
                    autocomplete="bday"
                    placeholder="Seleccionar fecha"
                  />
                  <i class="fa-regular fa-calendar patient-input-icon" aria-hidden="true"></i>
                </div>

                <p class="patient-field-help">Hacé clic en cualquier parte del campo para abrir el calendario.</p>
                <p class="patient-field-error" id="birthDate-error" aria-live="polite"></p>
              </div>

              <div class="patient-field" data-field="phone">
                <div class="patient-field-head">
                  <label for="phone" class="patient-label">Teléfono</label>
                  <span class="patient-field-status">Opcional</span>
                </div>

                <input
                  id="phone"
                  type="text"
                  maxlength="25"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="Ej.: +54 351 123 4567"
                />

                <p class="patient-field-help">Podés escribirlo con espacios, guiones o código de país.</p>
                <p class="patient-field-error" id="phone-error" aria-live="polite"></p>
              </div>

              <div class="patient-field" data-field="address">
                <div class="patient-field-head">
                  <label for="address" class="patient-label">Dirección</label>
                  <span class="patient-field-status">Opcional</span>
                </div>

                <input
                  id="address"
                  type="text"
                  maxlength="80"
                  autocomplete="street-address"
                  placeholder="Ej.: Av. Colón 1234"
                />

                <p class="patient-field-help">Usá una referencia breve y clara.</p>
                <p class="patient-field-error" id="address-error" aria-live="polite"></p>
              </div>

              <div class="patient-field" data-field="profession">
                <div class="patient-field-head">
                  <label for="profession" class="patient-label">Profesión</label>
                  <span class="patient-field-status">Opcional</span>
                </div>

                <input
                  id="profession"
                  type="text"
                  maxlength="50"
                  autocomplete="organization-title"
                  placeholder="Ej.: Cosmetóloga"
                />

                <p class="patient-field-help">Campo libre para registrar ocupación o profesión.</p>
                <p class="patient-field-error" id="profession-error" aria-live="polite"></p>
              </div>

              <div class="patient-form-actions">
                <button class="btn-save btn-save-edit" type="submit">
                  <i class="fa-solid fa-check"></i> Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  `;
}

export function initPatientEdit() {
  document.body.className = "is-patient-edit";
  initDrawer();
  initPatientEditPage();

  const birthInput = document.querySelector("#birthDate");
  if (birthInput) {
    birthInput.max = getTodayYYYYMMDD();
  }
}
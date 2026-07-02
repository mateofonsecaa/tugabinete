// /public/js/features/patients/patients.templates.js
//
// Templates HTML del dominio Pacientes. Funciones puras: datos -> string.
// Sin DOM, sin estado, sin API. Todo dato dinamico interpolado pasa por
// escapeHtml desde el dia cero (politica XSS del proyecto).
//
// Este archivo crece con cada fusion de pantalla (pasos 3-6 del plan):
// create (aca), edit, lista y detalles iran sumando sus templates.

import { escapeHtml } from "../../core/utils/security.js";

/**
 * Pantalla completa de "Nuevo paciente" (shell + formulario).
 * @param {Object} params
 * @param {string} params.today - fecha maxima YYYY-MM-DD para birthDate
 */
export function patientCreatePageTemplate({ today }) {
  return `
    <div class="patients-page patient-new-page">
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
        </div>

        <section class="patient-new-view">
          <div class="patient-new-header">
            <h1 class="patient-new-title">Nuevo paciente</h1>
            <p class="patient-new-subtitle">
              Completá los datos básicos del paciente. Solo <strong>Nombre completo</strong> es obligatorio.
            </p>
          </div>

          <section class="patient-new-card">
            <form id="patient-form" class="patient-form patient-new-form" novalidate>
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
                    max="${escapeHtml(today)}"
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
                <button class="btn-save" id="submit-patient-btn" type="submit">
                  <i class="fa-solid fa-check"></i> Crear paciente
                </button>

                <button class="btn-cancel" id="cancel-create-patient" type="button">
                  <i class="fa-solid fa-xmark"></i> Cancelar
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  `;
}

/**
 * Pantalla completa de "Editar paciente" (shell + formulario).
 * Los valores del paciente NO se interpolan aca: la vista los asigna
 * via propiedades DOM (.value / .textContent), que no parsean HTML.
 * @param {Object} params
 * @param {string} params.today - fecha maxima YYYY-MM-DD para birthDate
 */
export function patientEditPageTemplate({ today }) {
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
            <h1 id="patient-title" class="patient-edit-title">Cargando paciente...</h1>
            <p class="patient-edit-subtitle">
              Modificá los datos básicos del paciente. Solo <strong>Nombre completo</strong> es obligatorio.
            </p>
          </div>

          <section class="patient-edit-card">
            <form id="patient-form" class="patient-form patient-edit-form is-loading" novalidate>
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
                  disabled
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
                    max="${escapeHtml(today)}"
                    autocomplete="bday"
                    placeholder="Seleccionar fecha"
                    disabled
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
                  disabled
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
                  disabled
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
                  disabled
                />

                <p class="patient-field-help">Campo libre para registrar ocupación o profesión.</p>
                <p class="patient-field-error" id="profession-error" aria-live="polite"></p>
              </div>

              <div class="patient-form-actions">
                <button class="btn-save btn-save-edit" id="submit-edit-patient-btn" type="submit" disabled>
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

/**
 * Pantalla completa de "Mis Pacientes" (shell + busqueda + tabla vacia).
 * Sin interpolaciones: las filas se renderizan aparte con patientRowTemplate.
 */
export function patientsListPageTemplate() {
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
                    <th>Última sesión</th>
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

/** Fila de la tabla de pacientes. Datos de usuario escapados. */
export function patientRowTemplate(p) {
  return `
    <tr>
      <td data-label="Nombre">${escapeHtml(p.fullName || "-")}</td>
      <td data-label="Teléfono">${escapeHtml(p.phone || "-")}</td>
      <td data-label="Edad">${escapeHtml(p.age ?? "-")}</td>
      <td data-label="Último trat.">${escapeHtml(p.lastTreatment ?? "-")}</td>
      <td class="actions" data-id="${escapeHtml(p.id)}">
        <button class="btn-view" title="Ver Ficha"><i class="fa-solid fa-clipboard-list"></i></button>
        <button class="btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-delete" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `;
}

/** Fila unica de estado vacio de la tabla. */
export function patientsEmptyRowTemplate() {
  return `
      <tr>
        <td colspan="5" style="text-align:center; color:#999;">
          No hay pacientes registrados.
        </td>
      </tr>
    `;
}

/* ==================== Detalles de paciente ==================== */

/** Formatea fecha a es-AR o "-". Compartido entre templates y vista. */
export function fmtDate(isoOrDate) {
  if (!isoOrDate) return "-";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR");
}

/** String recortado o "-". Compartido entre templates y vista. */
export function textOrDash(value) {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  return str ? str : "-";
}

/** Pantalla completa de detalles (ficha + rutina + turnos + modal). Estatica. */
export function patientDetailsPageTemplate() {
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
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question"></i> Guia y tutoriales</a>
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

            </div>
          </div>

          <h1 id="patient-name">Cargando...</h1>

                    <div class="table-container" style="margin-top:12px;">
            <table>
              <tbody id="patient-info"></tbody>
            </table>
          </div>

          <!-- RUTINA EN CASA -->
          <section class="homecare-section" style="margin-top:18px;">
            <div class="section-header homecare-header">
              <h2 style="margin:0;">Rutina en casa</h2>

              <div class="homecare-actions">
                <button id="homecare-add-btn" class="btn-add" type="button">
                  <i class="fa-solid fa-plus"></i> Crear rutina
                </button>

                <button id="homecare-edit-btn" class="btn-add" type="button" hidden>
                  <i class="fa-solid fa-pen"></i> Editar rutina
                </button>
              </div>
            </div>

            <!-- Estado vacío -->
            <div id="homecare-empty" class="table-container" style="margin-top:12px;">
              <div style="padding:16px;">
                <p style="margin:0 0 8px 0;"><strong>Sin rutina cargada</strong></p>
                <p style="margin:0; color:#666;">
                  Este paciente no tiene una rutina domiciliaria registrada.
                </p>
              </div>
            </div>

            <!-- Resumen de rutina -->
            <div id="homecare-content" hidden>
              <div class="table-container" style="margin-top:12px;">
                <table>
                  <tbody>
                    <tr>
                      <th>Nombre</th>
                      <td id="homecare-title">-</td>
                    </tr>
                    <tr>
                      <th>Objetivo</th>
                      <td id="homecare-objective">-</td>
                    </tr>
                    <tr>
                      <th>Fecha de inicio</th>
                      <td id="homecare-start-date">-</td>
                    </tr>
                    <tr>
                      <th>Fecha de fin</th>
                      <td id="homecare-end-date">-</td>
                    </tr>
                    <tr>
                      <th>Estado</th>
                      <td id="homecare-status">-</td>
                    </tr>
                    <tr>
                      <th>Observaciones</th>
                      <td id="homecare-notes">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="table-container table-scroll" style="margin-top:12px;">
                <table>
                  <thead>
                    <tr>
                      <th>Paso</th>
                      <th>Momento</th>
                      <th>Acción</th>
                      <th>Producto</th>
                      <th>Frecuencia</th>
                    </tr>
                  </thead>
                  <tbody id="homecare-items"></tbody>
                </table>
              </div>
            </div>
          </section>

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

      <!-- MODAL RUTINA EN CASA -->
      <div id="homecare-modal" class="modal-overlay">
        <div class="modal-box modal-edit-pro">
          <button class="close-btn" id="close-homecare-modal-btn">&times;</button>

          <h2>
            <i class="fa-solid fa-house-medical"></i>
            Rutina en casa
          </h2>

          <form id="homecare-form" class="homecare-form-stack">
            <section class="edit-column homecare-main-card">
              <h3 class="homecare-card-title">
                <i class="fa-solid fa-clipboard-list"></i>
                Información de la rutina
              </h3>

              <label for="homecare-form-title">Nombre de la rutina</label>
              <input
                type="text"
                id="homecare-form-title"
                maxlength="80"
                placeholder="Ej: Rutina antiacné"
                required
              />

              <label for="homecare-form-objective">Objetivo</label>
              <input
                type="text"
                id="homecare-form-objective"
                maxlength="120"
                placeholder="Ej: Control de sebo"
              />

              <label for="homecare-form-start-date">Fecha de inicio</label>
              <input type="date" id="homecare-form-start-date" min="2000-01-01" max="2100-12-31" />

              <label for="homecare-form-end-date">Fecha de fin</label>
              <input type="date" id="homecare-form-end-date" min="2000-01-01" max="2100-12-31" />

              <label for="homecare-form-status">Estado</label>
              <select id="homecare-form-status" required>
                <option value="Activa">Activa</option>
                <option value="Pausada">Pausada</option>
                <option value="Finalizada">Finalizada</option>
              </select>

              <label for="homecare-form-notes">Observaciones generales</label>
              <textarea
                id="homecare-form-notes"
                maxlength="400"
                placeholder="Indicaciones generales de la rutina..."
              ></textarea>
            </section>

            <section class="edit-column homecare-steps-card">
              <div class="homecare-steps-header">
                <h3 class="homecare-card-title">
                  <i class="fa-solid fa-list-check"></i>
                  Pasos de la rutina
                </h3>

                <button type="button" class="btn-add" id="homecare-add-item-btn">
                  <i class="fa-solid fa-plus"></i> Agregar paso
                </button>
              </div>

              <div id="homecare-form-items" class="homecare-form-items"></div>
            </section>
          </form>

          <div class="modal-actions edit-treatment-actions">
            <button type="submit" form="homecare-form" class="btn-edit-treatment-save" id="save-homecare-btn">
              <i class="fa-solid fa-floppy-disk"></i> Guardar rutina
            </button>

            <button type="button" class="btn-edit-treatment-cancel" id="cancel-homecare-btn">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

/** Fila de la ficha del paciente (label + valor). Datos escapados. */
export function patientInfoRowTemplate(label, value) {
  return `<tr><td style="font-weight:600;">${escapeHtml(label)}</td><td>${escapeHtml(value ?? "-")}</td></tr>`;
}

/** Fila de paso de rutina (lectura). Datos escapados. */
export function homecareItemRowTemplate(item) {
  return `
      <tr>
        <td>${escapeHtml(textOrDash(item.stepOrder))}</td>
        <td>${escapeHtml(textOrDash(item.moment))}</td>
        <td>${escapeHtml(textOrDash(item.action))}</td>
        <td>${escapeHtml(textOrDash(item.product))}</td>
        <td>${escapeHtml(textOrDash(item.frequency))}</td>
      </tr>
    `;
}

/** Estado vacio de pasos de rutina (lectura). */
export function homecareItemsEmptyRowTemplate() {
  return `
      <tr>
        <td colspan="5" style="text-align:center; color:#999;">
          Esta rutina no tiene pasos cargados.
        </td>
      </tr>
    `;
}

/**
 * Card editable de paso de rutina (draft del modal). Los value= llevan
 * escapeHtml porque interpolan input del usuario DENTRO de atributos
 * via innerHTML; sin escape, un paso con comillas rompe/inyecta el DOM.
 */
export function homecareDraftItemTemplate(item, index) {
  return `
      <div class="homecare-step-card" data-index="${index}">
        <div class="homecare-step-card-header">
          <strong>Paso ${index + 1}</strong>
          <button type="button" class="btn-edit-treatment-cancel homecare-remove-item-btn" data-index="${index}">
            Quitar
          </button>
        </div>

        <label>Momento</label>
        <input
          type="text"
          class="homecare-item-moment"
          data-index="${index}"
          value="${escapeHtml(item.moment ?? "")}"
          placeholder="Ej: Mañana"
          maxlength="40"
        />

        <label>Acción</label>
        <input
          type="text"
          class="homecare-item-action"
          data-index="${index}"
          value="${escapeHtml(item.action ?? "")}"
          placeholder="Ej: Limpiar rostro"
          maxlength="80"
        />

        <label>Producto</label>
        <input
          type="text"
          class="homecare-item-product"
          data-index="${index}"
          value="${escapeHtml(item.product ?? "")}"
          placeholder="Ej: Gel limpiador"
          maxlength="80"
        />

        <label>Frecuencia</label>
        <input
          type="text"
          class="homecare-item-frequency"
          data-index="${index}"
          value="${escapeHtml(item.frequency ?? "")}"
          placeholder="Ej: Todos los días"
          maxlength="60"
        />
      </div>
    `;
}

/** Estado vacio del editor de pasos (draft). */
export function homecareDraftEmptyTemplate() {
  return `
      <div class="homecare-steps-empty">
        No hay pasos para mostrar.
      </div>
    `;
}

/** Fila de turno del paciente. Datos escapados. */
export function patientAppointmentRowTemplate(a) {
  return `
        <tr>
          <td>${escapeHtml(fmtDate(a.date))} ${a.time ? `- ${escapeHtml(a.time)}` : ""}</td>
          <td>${escapeHtml(a.treatment || "-")}</td>
          <td>${escapeHtml(a.status || (a.completed ? "Completado" : "Pendiente"))}</td>
        </tr>
      `;
}

/** Estado vacio de turnos. */
export function patientAppointmentsEmptyRowTemplate() {
  return `<tr><td colspan="3" style="text-align:center; color:#999;">Sin turnos</td></tr>`;
}

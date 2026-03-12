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

export function initPatientDetails() {
  document.body.className = "is-patient-details"; // importante

  initDrawer();
  initPatientDetailsPage();
}

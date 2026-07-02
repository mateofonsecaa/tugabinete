// /public/js/views/treatments.templates.js
//
// Templates HTML de la vista de tratamientos. Funciones puras:
// datos -> string. Aca NO hay DOM (ni getElementById, ni listeners),
// ni estado, ni llamadas a la API. El HTML es verbatim al original:
// mismas clases CSS, mismos data-attributes, mismo markup.
//
// treatments.js decide CUANDO renderizar y sobre QUE nodo;
// este modulo decide QUE HTML se genera.

import { TREATMENTS_LIST } from "./treatments.config.js";
import {
  MAX_TREATMENT_PHOTOS,
  TREATMENT_PHOTO_LABELS,
} from "./treatments.gallery.js";

const TREATMENTS_OPTIONS_HTML = TREATMENTS_LIST.map((t) => `<div>${t}</div>`).join("");

/* ====================== Página (shell de la SPA) ====================== */

export function treatmentsPageTemplate() {
  return `
    <div class="treatments-page">

      <!-- Top bar -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer -->
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

      <main class="treatments-main">
        <div class="treatments-container">

          <div class="treatments-head">
            <div>
              <h1>Planilla de Tratamientos</h1>
              <p class="treatments-subtitle">Registrá, filtrá y gestioná tratamientos de forma rápida.</p>
            </div>
          </div>

          <div class="treatments-grid">

            <!-- COLUMNA IZQUIERDA (REGISTRO) -->
            <div class="treatments-left">
            <section id="registerSection" class="tg-card tg-collapsible">
              <div class="tg-card-head">
                <h2>Registrar tratamiento</h2>
              </div>

              <div class="tg-collapse-body" id="registerBody">

                <div id="registerOptions" class="register-options">
                  <button class="btn-patient" id="btnExistingPatient" type="button">Paciente existente</button>
                  <button class="btn-patient" id="btnNewPatient" type="button">Nuevo paciente</button>
                </div>

                <form id="treatmentForm" class="tg-form-grid" style="display:none;">

                  <!-- Columna 1 -->
                  <div class="tg-form-col">
                    <label for="patientInput">Paciente</label>
                    <div class="searchable-select">
                      <div style="position:relative;">
                        <input
                          type="text"
                          id="patientInput"
                          placeholder="Buscá un paciente..."
                          autocomplete="off"
                          required
                        />
                        <i id="patientValidator" class="input-validator-icon"></i>
                      </div>
                      <div class="options" id="patientOptions"></div>
                    </div>
                    <input type="hidden" id="patientSelect" required />

                    <label for="treatmentInput">Tratamiento</label>
                    <div class="searchable-select">
                      <div style="position:relative;">
                        <input
                          type="text"
                          id="treatmentInput"
                          placeholder="Seleccioná un tratamiento..."
                          autocomplete="off"
                          required
                        />
                        <i id="treatmentValidator" class="input-validator-icon"></i>
                      </div>
                      <div class="options" id="treatmentOptions">
                        ${TREATMENTS_OPTIONS_HTML}
                      </div>
                    </div>

                    <div class="tg-inline-2">
                      <div>
                        <label for="date">Fecha</label>
                        <input type="date" id="date" />
                      </div>
                      <div>
                        <label for="time">Hora</label>
                        <input type="time" id="time" />
                      </div>
                    </div>
                  </div>

                  <!-- Columna 2 -->
                  <div class="tg-form-col">
                    <label for="amount">Monto ($)</label>
                    <input type="text" id="amount" placeholder="Ej: 2500" maxlength="10" />

                    <div class="tg-inline-2">
                      <div>
                        <label for="paymentStatus">Estado</label>
                        <select id="paymentStatus" required>
                          <option value="" disabled selected hidden>Seleccionar</option>
                          <option value="Pagado">Pagado</option>
                          <option value="Pendiente">Pendiente</option>
                        </select>
                      </div>
                      <div>
                        <label for="paymentMethod">Método</label>
                        <select id="paymentMethod" required>
                          <option value="" disabled selected hidden>Seleccionar</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Mercado Pago">Mercado Pago</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="No Especificado">No especificado</option>
                        </select>
                      </div>
                    </div>

                    <label for="notes">Notas u observaciones</label>
                    <textarea id="notes" placeholder="Detalles del tratamiento..." maxlength="420"></textarea>
                  </div>

                  <!-- Fotos -->
                  <div class="tg-photos-row tg-photos-row--gallery">
                    <div class="gallery-field">
                      <label>Registro fotográfico</label>

                      <div class="gallery-toolbar">
                        <label for="treatmentGalleryInput" class="file-btn">
                          <i class="fa-regular fa-images"></i>
                          <span>Agregar fotos</span>
                        </label>

                        <input
                          type="file"
                          id="treatmentGalleryInput"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                        />

                        <span class="gallery-counter" id="treatmentGalleryCounter">0/${MAX_TREATMENT_PHOTOS} fotos</span>
                      </div>

                      <p class="gallery-help">
                        Podés cargar hasta ${MAX_TREATMENT_PHOTOS} fotos por tratamiento.
                      </p>

                      <div id="treatmentGalleryList" class="gallery-grid">
                        <div class="gallery-empty" id="treatmentGalleryEmpty">
                          Todavía no agregaste fotos.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="action-buttons">
                    <button type="button" class="btn-cancel-treatment" id="btnCancelTreatmentForm">Cerrar</button>
                    <button type="submit" class="btn-save-treatment" id="btnSaveTreatment">Guardar</button>
                  </div>
                </form>

              </div>
            </section>

            <!-- REGISTRAR VENTA -->
            <section id="registerSaleSection" class="tg-card tg-collapsible is-collapsed">
            <div class="tg-card-head">
              <h2>Registrar venta de producto</h2>
            </div>

            <div class="sale-head-actions">
              <button class="btn-patient" id="btnOpenSaleForm" type="button">Registrar venta</button>
              <button class="btn-patient" id="btnNewPatientFromSale" type="button">Nuevo paciente</button>
            </div>

            <div class="tg-collapse-body">

                <form id="saleForm" class="tg-form-grid" style="display:none;">

                  <!-- Columna 1 -->
                  <div class="tg-form-col">
                    <label>Paciente</label>
                    <div class="searchable-select">
                      <div style="position:relative;">
                        <input
                          type="text"
                          id="salePatientInput"
                          placeholder="Buscá un paciente..."
                          autocomplete="off"
                          required
                        />
                      </div>
                      <div class="options" id="salePatientOptions"></div>
                    </div>
                    <input type="hidden" id="salePatientId" required />

                    <label>Producto vendido</label>
                    <input type="text" id="saleProduct" placeholder="Ej: Serum vitamina C" required />

                    <div class="tg-inline-2">
                      <div>
                        <label>Fecha</label>
                        <input type="date" id="saleDate" />
                      </div>
                      <div>
                        <label>Cantidad</label>
                        <input type="number" id="saleQuantity" min="1" max="2147483647" step="1" inputmode="numeric" required/>
                      </div>
                    </div>
                  </div>

                  <!-- Columna 2 -->
                  <div class="tg-form-col">
                    <label>Monto ($)</label>
                    <input type="number" id="saleAmount" min="0" step="1" inputmode="numeric" />

                    <div class="tg-inline-2">
                      <div>
                        <label>Estado</label>
                        <select id="saleStatus" required>
                          <option value="" disabled selected hidden>Seleccionar</option>
                          <option>Pagado</option>
                          <option>Pendiente</option>
                        </select>
                      </div>
                      <div>
                        <label>Método</label>
                        <select id="saleMethod" required>
                          <option value="" disabled selected hidden>Seleccionar</option>
                          <option>Efectivo</option>
                          <option>Transferencia</option>
                          <option>Mercado Pago</option>
                          <option>Tarjeta</option>
                          <option>No especificado</option>
                        </select>
                      </div>
                    </div>

                    <label>Notas</label>
                    <textarea id="saleNotes" maxlength="300"></textarea>
                  </div>

                  <div class="action-buttons">
                    <button type="button" class="btn-cancel-treatment" id="btnCancelSaleForm">Cerrar</button>

                    <button type="submit" class="btn-save-treatment" id="btnSaveSale">
                      Guardar
                    </button>
                  </div>

                </form>

              </div>
            </section>
            </div>

            <!-- COLUMNA DERECHA (FILTROS + TABLA) -->
            <div class="treatments-right">

              <section class="tg-card tg-collapsible is-collapsed filter-section">
                <div class="tg-card-head">
                  <h2>Filtros de búsqueda</h2>

                  <button class="tg-icon-btn" id="btnCollapseFilters" type="button" aria-label="Desplegar filtros">
                    <i class="fa-solid fa-sliders"></i>
                  </button>
                </div>

                <div class="active-filters active-filters--sticky" id="activeFilters"></div>

                <div class="tg-collapse-body" id="filtersBody">
                  <div class="filters">
                    <select id="filterRecordType">
                      <option value="">Todos los resultados</option>
                      <option value="treatment">Solo tratamientos</option>
                      <option value="sale">Solo ventas</option>
                    </select>

                    <input type="text" id="filterPatient" placeholder="Buscar paciente..." />
                    <input type="date" id="filterDate" placeholder="Seleccionar fecha" />

                    <select id="filterDatePresence">
                      <option value="">Fecha: todas</option>
                      <option value="with">Con fecha</option>
                      <option value="without">Sin fecha</option>
                    </select>

                    <select id="filterTimePresence">
                      <option value="">Hora: todas</option>
                      <option value="with">Con hora</option>
                      <option value="without">Sin hora</option>
                    </select>

                    <div class="searchable-select">
                      <input
                        type="text"
                        id="filterTypeInput"
                        placeholder="Buscar tratamiento o producto..."
                        autocomplete="off"
                      />
                      <div class="options" id="filterTypeOptions">
                        ${TREATMENTS_OPTIONS_HTML}
                      </div>
                    </div>

                    <select id="filterStatus">
                      <option value="" disabled selected hidden>Estado de pago</option>
                      <option>Pagado</option>
                      <option>Pendiente</option>
                    </select>
                  </div>

                  <div class="clear-all-wrapper">
                    <button id="clearAllFilters" type="button">Limpiar filtros</button>
                  </div>
                </div>
              </section>

              <section class="tg-card table-card">
                <div class="table-head">
                  <div class="table-title">
                    <h2>Resultados</h2>
                    <span class="muted" id="resultsCount">—</span>
                  </div>
                </div>

                <div class="table-scroll">
                  <div id="treatmentsList" class="tg-results-list">
                    <div class="tg-empty" style="text-align:center;color:#777;">Cargando tratamientos...</div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>


      <!-- MODAL NUEVO PACIENTE -->
      <div id="newPatientModal" class="modal-overlay">
        <div class="modal-box">
          <h2>Registrar nuevo paciente</h2>

          <form id="newPatientForm" class="modal-grid">
            <div class="form-column">
              <label>Nombre completo</label>
              <input type="text" id="newFullName" placeholder="Ej: Ana López" required>

              <label>Fecha de nacimiento</label>
              <input type="date" id="newBirthDate">

              <label>Profesión</label>
              <input type="text" id="newProfession" placeholder="Ej: Diseñadora">
            </div>

            <div class="form-column">
              <label>Domicilio</label>
              <input type="text" id="newAddress" placeholder="Ej: Av. Siempre Viva 123">

              <label>Teléfono</label>
              <input type="text" id="newPhone" placeholder="Ej: 351-1234567">
            </div>
          </form>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" id="cancelNewPatientBtn">Cancelar</button>
            <button type="button" class="btn-save" id="confirmNewPatientBtn">Guardar</button>
          </div>
        </div>
      </div>

      <!-- MODAL EDITAR -->
      <div id="editTreatmentModal" class="modal-overlay">
        <div class="modal-box modal-edit-pro">
          <button class="close-btn" id="closeEditTreatmentBtn">&times;</button>
          <h2><i class="fa-solid fa-pen-to-square"></i> Editar Tratamiento</h2>

          <form id="editTreatmentForm" class="edit-grid">
            <div class="edit-column">
              <label>Tratamiento</label>
              <div class="searchable-select">
                <div style="position:relative;">
                  <input
                    type="text"
                    id="editTreatmentInput"
                    placeholder="Seleccioná un tratamiento..."
                    autocomplete="off"
                    required
                  />
                  <i id="editValidator" class="input-validator-icon"></i>
                </div>

                <div class="options" id="editTreatmentOptions">
                  ${TREATMENTS_OPTIONS_HTML}
                </div>
              </div>

              <label>Fecha</label>
              <input type="date" id="editTreatmentDate" />

              <label>Hora</label>
              <input type="time" id="editTreatmentTime" />

              <label>Monto ($)</label>
              <input
                type="number"
                id="editTreatmentAmount"
                min="0"
                step="1"
                inputmode="numeric"
                max="9999999999"
              />
            </div>

            <div class="edit-column">
              <label>Estado del pago</label>
              <select id="editTreatmentStatus" required>
                <option value="" disabled selected hidden>Seleccionar...</option>
                <option>Pagado</option>
                <option>Pendiente</option>
              </select>

              <label>Método de pago</label>
              <select id="editTreatmentMethod" required>
                <option value="" disabled selected hidden>Seleccionar...</option>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Mercado Pago</option>
                <option>Tarjeta</option>
                <option>No especificado</option>
              </select>

              <label>Notas</label>
              <textarea id="editTreatmentNotes" maxlength="420"></textarea>
            </div>
          </form>

          <div class="edit-photo-section edit-photo-section--gallery">
            <div class="gallery-field">
              <label>Registro fotográfico</label>

              <div class="gallery-toolbar">
                <label for="editTreatmentGalleryInput" class="file-btn">
                  <i class="fa-regular fa-images"></i>
                  <span>Agregar fotos</span>
                </label>

                <input
                  type="file"
                  id="editTreatmentGalleryInput"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                />

                <span class="gallery-counter" id="editTreatmentGalleryCounter">0/${MAX_TREATMENT_PHOTOS} fotos</span>
              </div>

              <p class="gallery-help">
                Podés cargar hasta ${MAX_TREATMENT_PHOTOS} fotos por tratamiento.
              </p>

              <div id="editTreatmentGalleryList" class="gallery-grid">
                <div class="gallery-empty" id="editTreatmentGalleryEmpty">
                  Todavía no hay fotos cargadas.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions edit-treatment-actions">
            <button type="submit" form="editTreatmentForm" class="btn-edit-treatment-save">
              <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
            </button>
            <button type="button" class="btn-edit-treatment-cancel" id="cancelEditTreatmentBtn">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL EDITAR VENTA -->
      <div id="editSaleModal" class="modal-overlay">
        <div class="modal-box modal-edit-pro">
          <button class="close-btn" id="closeEditSaleBtn">&times;</button>
          <h2><i class="fa-solid fa-pen-to-square"></i> Editar Venta</h2>

          <form id="editSaleForm" class="edit-grid">
            <div class="edit-column">
              <label>Producto vendido</label>
              <input
                type="text"
                id="editSaleProduct"
                placeholder="Ej: Serum vitamina C"
                maxlength="40"
                required
              />

              <label>Cantidad</label>
              <input
                type="number"
                id="editSaleQuantity"
                min="1"
                step="1"
                inputmode="numeric"
                required
              />

              <label>Monto total ($)</label>
              <input
                type="number"
                id="editSaleAmount"
                min="0"
                step="1"
                inputmode="numeric"
              />

              <label>Notas</label>
              <textarea
                id="editSaleNotes"
                maxlength="300"
                placeholder="Notas de la venta..."
              ></textarea>
            </div>
          </form>

          <div class="modal-actions edit-sale-actions">
            <button type="submit" form="editSaleForm" class="btn-edit-sale-save">
              <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
            </button>
            <button type="button" class="btn-edit-sale-cancel" id="cancelEditSaleBtn">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL VER -->
      <div id="viewTreatmentModal" class="modal-overlay">
        <div class="modal-box modal-detail-pro">
          <button class="close-btn" id="closeViewTreatmentBtn">&times;</button>
          <h2><i class="fa-solid fa-file-medical"></i> Detalle del Tratamiento</h2>

          <div class="detail-grid">
            <div class="detail-card">
              <h3><i class="fa-solid fa-user"></i> Paciente</h3>
              <p><strong>Nombre:</strong> <span id="viewName">—</span></p>
              <p><strong>Teléfono:</strong> <span id="viewPhone">—</span></p>
              <p><strong>Dirección:</strong> <span id="viewAddress">—</span></p>
            </div>

            <div class="detail-card">
              <h3><i class="fa-solid fa-spa"></i> Tratamiento</h3>
              <p><strong>Tipo:</strong> <span id="viewType">—</span></p>
              <p><strong>Fecha:</strong> <span id="viewDate">—</span></p>
              <p><strong>Monto:</strong> <span id="viewAmount">—</span></p>
              <p><strong>Estado:</strong> <span id="viewStatus">—</span></p>
              <p><strong>Método:</strong> <span id="viewMethod">—</span></p>
            </div>
          </div>

          <div class="detail-notes">
            <h3><i class="fa-solid fa-pen"></i> Notas</h3>
            <p id="viewNotes">—</p>
          </div>

          <div class="detail-photos detail-photos--gallery">
            <div class="detail-photos-head">
              <p><strong>Registro fotográfico</strong></p>
              <span class="gallery-counter" id="viewTreatmentGalleryCounter">0/${MAX_TREATMENT_PHOTOS} fotos</span>
            </div>

            <div id="viewTreatmentGalleryList" class="gallery-grid">
              <div class="gallery-empty" id="viewTreatmentGalleryEmpty">
                Sin fotos cargadas.
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-save" id="downloadPdfBtn">
              <i class="fa-solid fa-file-arrow-down"></i> Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL VER VENTA -->
      <div id="viewSaleModal" class="modal-overlay">
        <div class="modal-box modal-detail-pro">
          <button class="close-btn" id="closeViewSaleBtn">&times;</button>
          <h2><i class="fa-solid fa-receipt"></i> Detalle de la Venta</h2>

          <div class="detail-grid">
            <div class="detail-card">
              <h3><i class="fa-solid fa-user"></i> Paciente</h3>
              <p><strong>Nombre:</strong> <span id="viewSaleName">—</span></p>
              <p><strong>Teléfono:</strong> <span id="viewSalePhone">—</span></p>
              <p><strong>Dirección:</strong> <span id="viewSaleAddress">—</span></p>
            </div>

            <div class="detail-card">
              <h3><i class="fa-solid fa-bag-shopping"></i> Venta</h3>
              <p><strong>Producto:</strong> <span id="viewSaleProduct">—</span></p>
              <p><strong>Cantidad:</strong> <span id="viewSaleQuantity">—</span></p>
              <p><strong>Precio:</strong> <span id="viewSaleAmount">—</span></p>
            </div>
          </div>

          <div class="detail-notes">
            <h3><i class="fa-solid fa-pen"></i> Nota</h3>
            <p id="viewSaleNotes">—</p>
          </div>
        </div>
      </div>

      <!-- MODAL IMAGEN AMPLIADA -->
      <div id="imagePreviewModal"
        style="display:none; position:fixed; inset:0; background:rgba(255,245,245,0.85);
              backdrop-filter:blur(10px); z-index:7000; justify-content:center; align-items:center; overflow:hidden;">
        <div id="imagePreviewContainer"
          style="position:relative; display:flex; justify-content:center; align-items:center; max-width:95vw; max-height:95vh;">
          <button id="closeImageBtn"
            style="position:absolute; top:-20px; right:-20px; background:#ffadad; color:#fff; border:none;
                  border-radius:50%; width:42px; height:42px; font-size:26px; font-weight:bold; cursor:pointer;
                  box-shadow:0 4px 14px rgba(0,0,0,0.25); transition:all .2s ease; z-index:9999;">
            &times;
          </button>

          <img id="previewImage"
            src=""
            alt="Vista ampliada"
            style="max-width:90vw; max-height:90vh; object-fit:contain; border-radius:18px;
                  box-shadow:0 8px 40px rgba(0,0,0,0.5); transition:transform 0.25s ease;">
        </div>
      </div>

    </div>
  `;
}

/* ====================== Cards de resultados ====================== */

export function treatmentCardTemplate(t) {
  const iso = (t.date ? String(t.date).slice(0, 10) : "");
  const dateStr = iso ? iso.split("-").reverse().join("/") : "—";
  const timeStr = t.time || "—";
  const amount = Number(t.amount ?? 0);
  const amountStr = `$${amount.toFixed(2)}`;

  return `
    <div class="treat-card" data-id="${t.id}" data-kind="treatment">
      <div class="treat-card-main">
        <div class="treat-left">
          <div class="treat-patient-pill">${t.patient?.fullName || "Sin paciente"}</div>

          <div class="treat-sub treat-sub--stack">
            <div class="treat-sub-line"><span class="lbl">Fecha:</span> <span class="val">${dateStr}</span></div>
            <div class="treat-sub-line"><span class="lbl">Hora:</span> <span class="val">${timeStr}</span></div>
            <div class="treat-sub-line"><span class="lbl">Tratamiento:</span> <span class="val">${t.treatment || "-"}</span></div>
          </div>
        </div>

        <div class="treat-right">
          <div class="treat-amount">${amountStr}</div>
          <div class="treat-badges">
            <span class="${t.status === "Pagado" ? "status-paid" : "status-pending"}">${t.status || "-"}</span>
            <span class="treat-method">${t.method || "-"}</span>
          </div>
        </div>
      </div>

      <div class="treat-card-actions actions">
        <button class="btn-view" data-id="${t.id}" title="Ver"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-edit" data-id="${t.id}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn-delete" data-id="${t.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `;
}

export function saleCardTemplate(s) {
  const iso = s.date ? String(s.date).slice(0, 10) : "";
  const dateStr = iso ? iso.split("-").reverse().join("/") : "—";
  const amount = Number(s.amount ?? 0);
  const amountStr = `$${amount.toFixed(2)}`;
  const qty = Number(s.quantity ?? 0);

  return `
    <div class="treat-card" data-id="${s.id}" data-kind="sale">
      <div class="treat-card-main">
        <div class="treat-left">
          <div class="treat-patient-pill">${s.patient?.fullName || "Sin paciente"}</div>

          <div class="treat-sub treat-sub--stack">
            <div class="treat-sub-line"><span class="lbl">Fecha:</span> <span class="val">${dateStr}</span></div>
            <div class="treat-sub-line"><span class="lbl">Venta:</span> <span class="val">${s.product || "-"}</span></div>
            <div class="treat-sub-line"><span class="lbl">Cantidad:</span> <span class="val">${qty || "-"}</span></div>
          </div>
        </div>

        <div class="treat-right">
          <div class="treat-amount">${amountStr}</div>
          <div class="treat-badges">
            <span class="${s.status === "Pagado" ? "status-paid" : "status-pending"}">${s.status || "-"}</span>
            <span class="treat-method">${s.method || "-"}</span>
          </div>
        </div>
      </div>

      <div class="treat-card-actions actions">
        <button class="btn-view" data-id="${s.id}" title="Ver">
          <i class="fa-solid fa-eye"></i>
        </button>

        <button class="btn-edit" data-id="${s.id}" title="Editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <button class="btn-delete" data-id="${s.id}" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

/* ====================== Filtros y modales ====================== */

export function filterChipTemplate(c) {
  return `
        <button class="tg-chip" type="button" data-chip="${c.key}">
          ${c.label} <i class="fa-solid fa-xmark"></i>
        </button>
      `;
}

export function modalLoadingTemplate(message) {
  return `
    <div class="modal-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>${message}</p>
    </div>
  `;
}

/* ====================== Galerías de fotos ====================== */

function getGalleryLabelOptions(selectedLabel = "Sin etiqueta") {
  return TREATMENT_PHOTO_LABELS.map((label) => {
    const selected = label === selectedLabel ? "selected" : "";
    return `<option value="${label}" ${selected}>${label}</option>`;
  }).join("");
}

export function galleryEmptyTemplate(id, message) {
  return `<div class="gallery-empty" id="${id}">${message}</div>`;
}

export function galleryLoadingTemplate() {
  return `
    <div class="gallery-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando fotos...</span>
    </div>
  `;
}

export function createGalleryCardTemplate(photo, index) {
  return `
        <div class="gallery-card" data-gallery-index="${index}">
          <button
            type="button"
            class="gallery-remove-btn"
            data-gallery-remove="${index}"
            aria-label="Eliminar foto"
            title="Eliminar foto"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <div class="gallery-image-wrap">
            <img
              src="${photo.url || ""}"
              alt="Foto ${index + 1}"
              class="gallery-image"
              data-gallery-preview="${index}"
            />
          </div>

          <div class="gallery-meta">
            <label class="gallery-meta-label">Etiqueta</label>
            <select class="gallery-label-select" data-gallery-label="${index}">
              ${getGalleryLabelOptions(photo.label || "Sin etiqueta")}
            </select>
          </div>
        </div>
      `;
}

export function editGalleryCardTemplate(photo, index) {
  return `
        <div class="gallery-card" data-edit-gallery-index="${index}">
          <button
            type="button"
            class="gallery-remove-btn"
            data-edit-gallery-remove="${index}"
            aria-label="Eliminar foto"
            title="Eliminar foto"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <div class="gallery-image-wrap">
            <img
              src="${photo.url || ""}"
              alt="Foto ${index + 1}"
              class="gallery-image"
              data-edit-gallery-preview="${index}"
            />
          </div>

          <div class="gallery-meta">
            <label class="gallery-meta-label">Etiqueta</label>
            <select class="gallery-label-select" data-edit-gallery-label="${index}">
              ${getGalleryLabelOptions(photo.label || "Sin etiqueta")}
            </select>
          </div>
        </div>
      `;
}

export function viewGalleryCardTemplate(photo, index) {
  return `
        <div class="gallery-card">
          <div class="gallery-image-wrap">
            <img
              src="${photo.url || ""}"
              alt="Foto ${index + 1}"
              class="gallery-image"
              data-view-gallery-preview="${index}"
            />
          </div>

          <div class="gallery-meta">
            <label class="gallery-meta-label">Etiqueta</label>
            <div class="gallery-label-readonly">${photo.label || "Sin etiqueta"}</div>
          </div>
        </div>
      `;
}

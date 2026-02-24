// /public/js/views/treatments.js
import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";

/* ======================
   Template helpers
====================== */

const TREATMENTS_LIST = [
  "Peeling químico",
  "Peeling enzimático",
  "Limpieza facial profunda",
  "Limpieza facial express",
  "Higiene facial profesional",
  "Microdermoabrasión",
  "Punta de diamante",
  "Dermaplaning",
  "BB Glow",
  "Radiofrecuencia facial",
  "Máscara hidratante",
  "Máscara calmante",
  "Tratamiento antiacné",
  "Rejuvenecimiento facial",
  "Tratamiento para manchas",
  "Tratamiento despigmentante",
  "Masajes descontracturantes",
  "Masajes relajantes",
  "Drenaje linfático",
  "Electrodos",
  "Radiofrecuencia corporal",
  "Cavitación",
  "Ultracavitación",
  "Velaslim",
  "Presoterapia",
  "Reducción de medidas",
  "Tratamiento anticelulitis",
  "Tratamiento reafirmante",
  "Tratamiento capilar nutritivo",
  "Shock de keratina",
  "Botox capilar",
  "Reparación del cabello",
  "Depilación cera",
  "Depilación roll-on",
  "Depilación definitiva (láser)",
];

const TREATMENTS_OPTIONS_HTML = TREATMENTS_LIST.map((t) => `<div>${t}</div>`).join("");

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const allowedTreatments = TREATMENTS_LIST.map((t) => normalizeText(t));

/* ======================
   SPA View
====================== */

export function Treatments() {
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
                        <input type="date" id="date" required />
                      </div>
                      <div>
                        <label for="time">Hora</label>
                        <input type="time" id="time" required />
                      </div>
                    </div>
                  </div>

                  <!-- Columna 2 -->
                  <div class="tg-form-col">
                    <label for="amount">Monto ($)</label>
                    <input type="text" id="amount" placeholder="Ej: 2500" maxlength="10" required />

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
                  <div class="tg-photos-row">
                    <div class="file-field">
                      <label>Foto ANTES</label>
                      <div class="file-input-wrapper">
                        <input type="file" id="beforePhoto" accept="image/*" />
                        <img id="beforePreview" class="photo-mini-preview">
                        <label for="beforePhoto" class="file-btn">
                          <i class="fa-regular fa-image"></i>
                          <span>Seleccionar</span>
                        </label>
                        <span class="file-name" id="beforeFileName">Ningún archivo seleccionado</span>
                      </div>
                    </div>

                    <div class="file-field">
                      <label>Foto DESPUÉS</label>
                      <div class="file-input-wrapper">
                        <input type="file" id="afterPhoto" accept="image/*" />
                        <img id="afterPreview" class="photo-mini-preview">
                        <label for="afterPhoto" class="file-btn">
                          <i class="fa-regular fa-image"></i>
                          <span>Seleccionar</span>
                        </label>
                        <span class="file-name" id="afterFileName">Ningún archivo seleccionado</span>
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
                        <input type="date" id="saleDate" required />
                      </div>
                      <div>
                        <label>Cantidad</label>
                        <input type="number" id="saleQuantity" min="1" step="1" required/>
                      </div>
                    </div>
                  </div>

                  <!-- Columna 2 -->
                  <div class="tg-form-col">
                    <label>Monto total ($)</label>
                    <input type="number" id="saleAmount" min="0" step="1" inputmode="numeric" required/>

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

                    <button type="submit" class="btn-save-treatment">
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
                  <h2>Buscar tratamientos</h2>

                  <button class="tg-icon-btn" id="btnCollapseFilters" type="button" aria-label="Desplegar filtros">
                    <i class="fa-solid fa-sliders"></i>
                  </button>
                </div>

                <div class="active-filters active-filters--sticky" id="activeFilters"></div>

                <div class="tg-collapse-body" id="filtersBody">
                  <div class="filters">
                    <input type="text" id="filterPatient" placeholder="Buscar paciente..." />
                    <input type="date" id="filterDate" placeholder="Seleccionar fecha" />

                    <div class="searchable-select">
                      <input
                        type="text"
                        id="filterTypeInput"
                        placeholder="Tipo de tratamiento..."
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
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>


      <!-- MODAL NUEVO PACIENTE -->
      <div id="newPatientModal" class="modal-overlay">
        <div class="modal-box">
          <button class="close-btn" id="closeNewPatientModalBtn">&times;</button>
          <h2>Registrar nuevo paciente</h2>

          <form id="newPatientForm" class="modal-grid">
            <div class="form-column">
              <label>Nombre completo</label>
              <input type="text" id="newFullName" placeholder="Ej: Ana López" required>

              <label>Fecha de nacimiento</label>
              <input type="date" id="newBirthDate" required>

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
              <input type="date" id="editTreatmentDate" required />

              <label>Hora</label>
              <input type="time" id="editTreatmentTime" required />

              <label>Monto ($)</label>
              <input type="text" id="editTreatmentAmount" maxlength="10" required />
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

          <div class="edit-photo-section">
            <div class="photo-block">
              <label>Foto ANTES</label>
              <div class="photo-preview">
                <img id="editBeforePreview" src="" alt="Foto antes" />
              </div>
              <input type="file" id="editBeforePhoto" accept="image/*" />
            </div>

            <div class="photo-block">
              <label>Foto DESPUÉS</label>
              <div class="photo-preview">
                <img id="editAfterPreview" src="" alt="Foto después" />
              </div>
              <input type="file" id="editAfterPhoto" accept="image/*" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" form="editTreatmentForm" class="btn-save">
              <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
            </button>
            <button type="button" class="btn-cancel" id="cancelEditTreatmentBtn">
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

          <div class="detail-photos">
            <div>
              <p><strong>Antes</strong></p>
              <img id="viewBeforePhoto" src="" alt="Foto antes">
            </div>
            <div>
              <p><strong>Después</strong></p>
              <img id="viewAfterPhoto" src="" alt="Foto después">
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-save" id="downloadPdfBtn">
              <i class="fa-solid fa-file-arrow-down"></i> Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL IMAGEN AMPLIADA -->
      <div id="imagePreviewModal"
        style="display:none; position:fixed; inset:0; background:rgba(255,245,245,0.85);
              backdrop-filter:blur(10px); z-index:3000; justify-content:center; align-items:center; overflow:hidden;">
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

/* ======================
   SPA init
====================== */

let currentUser = null;
let allTreatments = [];
let allSales = [];
let allowedPatients = []; // normalizados
let isSavingTreatment = false;
let beforePhotoData = "";
let afterPhotoData = "";
let editingTreatment = null;
let treatmentViewCache = null;

export async function initTreatments() {
  initDrawer();

  // Si no existe la vista, salimos
  const page = document.querySelector(".treatments-page");
  if (!page) return;

  // Cargar user para PDF + drawer username
  await loadCurrentUser();

  // Bind UI (una sola vez por render)
  bindUI();

  // Inicialización data
await loadPatients();
await Promise.all([loadTreatments(), loadSales()]);
applyFilters(); 

  // Selects (treatment, edit, filter)
  initSearchableSelect({
    input: "#treatmentInput",
    options: "#treatmentOptions",
    validator: "#treatmentValidator",
    allowed: allowedTreatments,
  });

  initSearchableSelect({
    input: "#editTreatmentInput",
    options: "#editTreatmentOptions",
    validator: "#editValidator",
    allowed: allowedTreatments,
  });

  initSearchableSelect({
    input: "#filterTypeInput",
    options: "#filterTypeOptions",
    onSelect: () => applyFilters(),
  });

  // Picker time (nice)
  const timeInput = document.getElementById("time");
  if (timeInput && !timeInput.dataset.bound) {
    timeInput.dataset.bound = "1";
    timeInput.addEventListener("click", () => timeInput.showPicker?.());
  }

  console.log("Treatments SPA inicializado");
}

function setCollapsible(sectionSelector, isOpen) {
  const section = document.querySelector(sectionSelector);
  if (!section) return;
  section.classList.toggle("is-collapsed", !isOpen);
}

function toggleCollapsible(sectionSelector) {
  const section = document.querySelector(sectionSelector);
  if (!section) return;
  section.classList.toggle("is-collapsed");
}

function openRegisterCard() {
  setCollapsible("#registerSection", true);
  // asegurar que se vea el cuerpo y opciones
  const body = document.getElementById("registerBody");
  if (body) body.style.display = "block";
}

function closeRegisterCard() {
  setCollapsible("#registerSection", false);
}

function openFiltersCard() {
  setCollapsible(".filter-section", true);
}

function closeFiltersCard() {
  setCollapsible(".filter-section", false);
}

function updateResultsCount(n) {
  const el = document.getElementById("resultsCount");
  if (!el) return;
  el.textContent = `${n} resultado${n === 1 ? "" : "s"}`;
}

function renderActiveFilterChips() {
  const wrap = document.getElementById("activeFilters");
  if (!wrap) return;

  const patient = (document.getElementById("filterPatient")?.value || "").trim();
  const date = (document.getElementById("filterDate")?.value || "").trim();
  const type = (document.getElementById("filterTypeInput")?.value || "").trim();
  const status = (document.getElementById("filterStatus")?.value || "").trim();

  const chips = [];

  if (patient) chips.push({ key: "patient", label: `Paciente: ${patient}` });
  if (date) chips.push({ key: "date", label: `Fecha: ${date}` });
  if (type) chips.push({ key: "type", label: `Tipo: ${type}` });
  if (status) chips.push({ key: "status", label: `Pago: ${status}` });

  if (!chips.length) {
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = chips
    .map(
      (c) => `
        <button class="tg-chip" type="button" data-chip="${c.key}">
          ${c.label} <i class="fa-solid fa-xmark"></i>
        </button>
      `
    )
    .join("");

  // remover chip
  wrap.querySelectorAll(".tg-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.chip;
      if (key === "patient") document.getElementById("filterPatient").value = "";
      if (key === "date") document.getElementById("filterDate").value = "";
      if (key === "type") document.getElementById("filterTypeInput").value = "";
      if (key === "status") document.getElementById("filterStatus").selectedIndex = 0;

      applyFilters();
    });
  });
}

/* ======================
   UI bindings
====================== */

function bindUI() {
  // Botones register
  bindOnce("#btnExistingPatient", "click", () => showExistingPatientForm());
  bindOnce("#btnNewPatient", "click", () => openNewPatientModal());
  bindOnce("#btnCancelTreatmentForm", "click", () => cancelTreatmentForm());
  bindOnce("#btnOpenSaleForm", "click", () => openSaleForm());

  bindOnce("#btnNewPatientFromSale", "click", () => {
    openNewPatientModal();
    // marca para saber que el modal se abrió desde "venta"
    window.__newPatientContext = "sale";
  });

  bindOnce("#btnCancelSaleForm", "click", () => closeSaleForm());

  bindOnce("#btnCollapseFilters", "click", () => toggleCollapsible(".filter-section"));

  // Limitar amount solo números
  bindOnce("#amount", "input", (e) => {
    e.target.value = String(e.target.value || "").replace(/[^0-9]/g, "").slice(0, 10);
  });

  // ✅ Fecha (Registrar tratamiento): abrir calendario al click
  bindOnce("#date", "click", () => {
    const el = document.getElementById("date");
    el?.showPicker?.();
  });

  // (opcional) también al focus
  bindOnce("#date", "focus", () => {
    const el = document.getElementById("date");
    el?.showPicker?.();
  });

  // Filtros
  bindOnce("#filterPatient", "input", () => applyFilters());
  bindOnce("#filterDate", "change", () => applyFilters());
  bindOnce("#filterStatus", "change", () => applyFilters());
  bindOnce("#clearAllFilters", "click", () => clearAllFilters());

  // Form submit (nuevo)
  bindOnce("#treatmentForm", "submit", (e) => onCreateTreatment(e));

  // Tabla botones (ver/editar/eliminar)
  // delegación en body (pero la hacemos una sola vez)
  if (!window.__treatmentsDelegationBound) {
    window.__treatmentsDelegationBound = true;
    document.body.addEventListener("click", (e) => {
    if (!document.querySelector(".treatments-page")) return;

    // ✅ Click en fila -> abrir ver (si NO clickeó un botón)
    const row = e.target.closest(".treat-card[data-id]");
    if (row && !e.target.closest("button")) {
      const id = row.dataset.id;
      const kind = row.dataset.kind || "treatment";

      if (kind === "sale") {
        // opcional: abrir un modal de venta (si no tenés, no hagas nada)
        return;
      }
      const t = allTreatments.find((x) => String(x.id) === String(id));
      if (t) openViewModal(t);
      return;
    }

    const btn = e.target.closest("button");
    if (!btn) return;

      // acciones de tabla
      if (btn.classList.contains("btn-view") || btn.classList.contains("btn-edit") || btn.classList.contains("btn-delete")) {
        const id = btn.dataset.id;
        if (!id) return;
        const t = allTreatments.find((x) => String(x.id) === String(id));
        if (!t) return;

        if (btn.classList.contains("btn-view")) openViewModal(t);
        if (btn.classList.contains("btn-edit")) openEditModal(t);
        if (btn.classList.contains("btn-delete")) deleteTreatment(id);
        return;
      }

      // modales close/cancel
      if (btn.id === "closeNewPatientModalBtn" || btn.id === "cancelNewPatientBtn") closeNewPatientModal();
      if (btn.id === "confirmNewPatientBtn") confirmNewPatient();

      if (btn.id === "closeEditTreatmentBtn" || btn.id === "cancelEditTreatmentBtn") closeEditModal();
      if (btn.id === "closeViewTreatmentBtn") closeViewModal();
      if (btn.id === "downloadPdfBtn") downloadTreatmentPDF();

      if (btn.id === "closeImageBtn") closeImagePreview();
    });
  }

  // Edit form submit
  bindOnce("#editTreatmentForm", "submit", (e) => onSaveEditTreatment(e));

  // Modal image click-out + ESC (una vez global)
  if (!window.__treatmentsEscBound) {
    window.__treatmentsEscBound = true;
    document.addEventListener("keydown", (e) => {
      if (!document.querySelector(".treatments-page")) return;
      if (e.key === "Escape") closeImagePreview();
    });
  }

  // File names + previews (nuevo)
  bindOnce("#beforePhoto", "change", () => {
    const input = document.getElementById("beforePhoto");
    const name = document.getElementById("beforeFileName");
    if (name) name.textContent = input?.files?.length ? input.files[0].name : "Ningún archivo seleccionado";

    loadImageFile(input, "beforePreview", (img) => {
      beforePhotoData = img;
      const preview = document.getElementById("beforePreview");
      if (preview) preview.style.display = "block";
    });
  });

  bindOnce("#afterPhoto", "change", () => {
    const input = document.getElementById("afterPhoto");
    const name = document.getElementById("afterFileName");
    if (name) name.textContent = input?.files?.length ? input.files[0].name : "Ningún archivo seleccionado";

    loadImageFile(input, "afterPreview", (img) => {
      afterPhotoData = img;
      const preview = document.getElementById("afterPreview");
      if (preview) preview.style.display = "block";
    });
  });

  // Edit modal file inputs (una vez)
  bindOnce("#editBeforePhoto", "change", () => {
    if (!editingTreatment) return;
    loadImageFile(document.getElementById("editBeforePhoto"), "editBeforePreview", (img) => {
      editingTreatment.beforePhoto = img;
    });
  });

  bindOnce("#editAfterPhoto", "change", () => {
    if (!editingTreatment) return;
    loadImageFile(document.getElementById("editAfterPhoto"), "editAfterPreview", (img) => {
      editingTreatment.afterPhoto = img;
    });
  });

  // Click en fotos del modal ver -> ampliar
  bindOnce("#viewBeforePhoto", "click", () => {
    const src = document.getElementById("viewBeforePhoto")?.src;
    if (src) openImagePreview(src);
  });
  bindOnce("#viewAfterPhoto", "click", () => {
    const src = document.getElementById("viewAfterPhoto")?.src;
    if (src) openImagePreview(src);
  });

  // Cerrar modal ampliada clickeando fondo
  if (!window.__treatmentsImageModalBound) {
    window.__treatmentsImageModalBound = true;
    document.addEventListener("click", (e) => {
      if (!document.querySelector(".treatments-page")) return;
      const modal = document.getElementById("imagePreviewModal");
      if (!modal) return;
      if (modal.style.display === "flex" && e.target === modal) closeImagePreview();
    });
  }

  /* ======================
  Sale bindings
====================== */

/* ======================
  Sale bindings
====================== */

bindOnce("#saleForm", "submit", (e) => onCreateSale(e));

/* ✅ Fecha: no permitir futuro (max = hoy) + abrir calendario */
bindOnce("#saleDate", "focus", () => {
  const el = document.getElementById("saleDate");
  if (!el) return;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  el.max = `${y}-${m}-${d}`; // bloquea fechas futuras
  el.showPicker?.();         // abre el calendario
});

// ✅ también al click
bindOnce("#saleDate", "click", () => {
  const el = document.getElementById("saleDate");
  el?.showPicker?.();
});

/* ✅ Cantidad: entero y mínimo 1 */
bindOnce("#saleQuantity", "input", (e) => {
  let v = String(e.target.value || "").replace(/[^0-9]/g, "");
  if (v === "") return;

  let n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 1) n = 1;

  e.target.value = String(n);
});

/* ✅ Monto: numérico y >= 0 (solo números) */
bindOnce("#saleAmount", "input", (e) => {
  let v = String(e.target.value || "").replace(/[^0-9]/g, "").slice(0, 10);
  if (v === "") { e.target.value = ""; return; }

  let n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0) n = 0;

  e.target.value = String(n);
});

/* ✅ Notas: máximo 300 (refuerzo del maxlength) */
bindOnce("#saleNotes", "input", (e) => {
  const max = 300;
  if (e.target.value.length > max) {
    e.target.value = e.target.value.slice(0, max);
  }
});

}

function bindOnce(selector, event, handler) {
  const el = document.querySelector(selector);
  if (!el) return;
  const key = `bound_${event}`;
  if (el.dataset[key]) return;
  el.dataset[key] = "1";
  el.addEventListener(event, handler);
}

/* ======================
   Data loading
====================== */

async function loadCurrentUser() {
  try {
    const res = await authFetch(`${API_URL}/auth/me`);
    const user = await res.json();
    if (res.ok) currentUser = user;

    const du = document.getElementById("drawer-username");
    if (du) du.textContent = currentUser?.name || "Profesional";
  } catch {
    // no-op
  }
}

async function loadPatients() {
  let data = []; 
  try {
    const res = await authFetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error("Error al obtener pacientes");

    const result = await res.json();
    data = Array.isArray(result) ? result : (result.patients || []);

    data.sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || "")));

    const list = document.getElementById("patientOptions");
    const hiddenId = document.getElementById("patientSelect");
    if (!list || !hiddenId) return;

    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = `<div>No hay pacientes registrados</div>`;
      allowedPatients = [];
      return;
    }

    data.forEach((p) => {
      const div = document.createElement("div");
      div.textContent = p.fullName;
      div.dataset.id = p.id;

      div.addEventListener("click", () => {
        document.getElementById("patientInput").value = p.fullName;
        hiddenId.value = p.id;
        list.style.display = "none";
      });

      list.appendChild(div);
    });

    allowedPatients = data.map((p) => normalizeText(p.fullName));

    // Ahora sí inicializamos el searchable select del paciente con allowedPatients
    initSearchableSelect({
      input: "#patientInput",
      options: "#patientOptions",
      validator: "#patientValidator",
      allowed: allowedPatients,
      onSelect: (value) => {
        const valueNorm = normalizeText(value);
        const opt = [...document.querySelectorAll("#patientOptions div")].find((d) => normalizeText(d.textContent) === valueNorm);
        if (opt) document.getElementById("patientSelect").value = opt.dataset.id;
      },
    });

  } catch (err) {
    console.error("❌ Error al cargar pacientes:", err);
    const list = document.getElementById("patientOptions");
    if (list) list.innerHTML = `<div>Error al cargar</div>`;
    allowedPatients = [];
  }

  /* ======================
   Pacientes para ventas
====================== */

const saleList = document.getElementById("salePatientOptions");

if (saleList) {
  saleList.innerHTML = "";

  data.forEach((p) => {
    const div = document.createElement("div");
    div.textContent = p.fullName;
    div.dataset.id = p.id;

    div.addEventListener("click", () => {
      document.getElementById("salePatientInput").value = p.fullName;
      document.getElementById("salePatientId").value = p.id;
      saleList.style.display = "none";
    });

    saleList.appendChild(div);
  });

  initSearchableSelect({
    input: "#salePatientInput",
    options: "#salePatientOptions",
  });
}

}

async function loadTreatments() {
  try {
    const res = await authFetch(`${API_URL}/appointments?offset=0&limit=50`);
    if (!res.ok) throw new Error("Error al obtener tratamientos");

    const data = await res.json();
    allTreatments = Array.isArray(data) ? data : (data.appointments || data.items || []);
  } catch (err) {
    console.error("❌ Error al cargar tratamientos:", err);
    allTreatments = [];
    const list = document.getElementById("treatmentsList");
    if (list) {
      list.innerHTML = `<div class="tg-empty" style="text-align:center;color:#777;">
        Error al cargar tratamientos
      </div>`;
    }
  }
}

async function loadSales() {
  try {
    const res = await authFetch(`${API_URL}/sales?offset=0&limit=50`);
    if (!res.ok) throw new Error("Error al obtener ventas");

    const data = await res.json();
    allSales = Array.isArray(data) ? data : (data.sales || data.items || []);
    console.log("✅ SALES:", allSales.length, allSales[0]); // <-- ESTE
  } catch (err) {
    console.error("❌ Error al cargar ventas:", err);
    allSales = [];
  }
}

/* ======================
   Searchable select
====================== */

function initSearchableSelect({ input, options, validator = null, allowed = null, onSelect = null }) {
  const $input = document.querySelector(input);
  const $options = document.querySelector(options);
  if (!$input || !$options) return;

  // Evitar volver a bindear todo si ya se hizo
  if ($input.dataset.boundSelect) return;
  $input.dataset.boundSelect = "1";

  if (validator && allowed) {
    const $validator = document.querySelector(validator);
    $input.addEventListener("input", () => {
      const value = normalizeText($input.value);
      const exists = Array.isArray(allowed) && allowed.includes(value);

      if (!$validator) return;

      if (!value.length) {
        $validator.className = "input-validator-icon";
      } else if (exists) {
        $validator.className = "input-validator-icon ok fa-solid fa-check-circle";
      } else {
        $validator.className = "input-validator-icon error fa-solid fa-circle-xmark";
      }
    });
  }

  $input.addEventListener("focus", () => {
    $options.style.display = "block";
  });

  $input.addEventListener("input", () => {
    const userValue = normalizeText($input.value);
    [...$options.children].forEach((opt) => {
      const value = normalizeText(opt.textContent);
      opt.style.display = value.includes(userValue) ? "block" : "none";
    });
  });

  $options.addEventListener("click", (e) => {
    if (e.target.tagName === "DIV") {
      $input.value = e.target.textContent;
      $options.style.display = "none";
      if (onSelect) onSelect($input.value);
      $input.dispatchEvent(new Event("input"));
    }
  });

  // cerrar si clic afuera (una sola vez global)
  if (!window.__treatmentsOutsideClickBound) {
    window.__treatmentsOutsideClickBound = true;
    document.addEventListener("click", (e) => {
      if (!document.querySelector(".treatments-page")) return;
      document.querySelectorAll(".searchable-select .options").forEach((opt) => {
        const parent = opt.closest(".searchable-select");
        if (!parent) return;
        if (!parent.contains(e.target)) opt.style.display = "none";
      });
    });
  }
}

/* ======================
   Rendering + filters
====================== */

function renderTreatmentCard(t) {
  const date = t.date ? new Date(t.date) : null;
  const dateStr = date ? date.toLocaleDateString("es-AR") : "—";
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

function renderSaleCard(s) {
  const date = s.date ? new Date(s.date) : null;
  const dateStr = date ? date.toLocaleDateString("es-AR") : "—";
  const amount = Number(s.amount ?? 0);
  const amountStr = `$${amount.toFixed(2)}`;
  const qty = Number(s.quantity ?? 0);

  // badge tipo "Venta"
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
    </div>
  `;
}

function getAllResultsCombined() {
  const t = (allTreatments || []).map((x) => ({ ...x, __type: "treatment" }));
  const s = (allSales || []).map((x) => ({ ...x, __type: "sale" }));

  // ordenar por fecha (y hora en tratamientos) DESC
  const toTime = (item) => {
    if (item.__type === "treatment") {
      const d = item.date ? String(item.date).split("T")[0] : "";
      const time = item.time || "00:00";
      return new Date(`${d}T${time}:00`).getTime() || 0;
    }
    // sale
    const d = item.date ? String(item.date).split("T")[0] : "";
    return new Date(`${d}T00:00:00`).getTime() || 0;
  };

  return [...t, ...s].sort((a, b) => toTime(b) - toTime(a));
}

function renderResults(items) {
  const list = document.getElementById("treatmentsList");
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `<div class="tg-empty" style="text-align:center;">No hay resultados</div>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      if (item.__type === "sale") return renderSaleCard(item);
      return renderTreatmentCard(item);
    })
    .join("");
}

function applyFilters() {
  const patientFilter = (document.getElementById("filterPatient")?.value || "").toLowerCase();
  const dateFilter = document.getElementById("filterDate")?.value || "";
  const typeFilter = (document.getElementById("filterTypeInput")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("filterStatus")?.value || "";

  // 1) Filtrar tratamientos
  const filteredTreatments = (allTreatments || []).filter((t) => {
    const matchesPatient = !patientFilter || (t.patient?.fullName || "").toLowerCase().includes(patientFilter);

    const matchesDate = !dateFilter || (() => {
      if (!t.date) return false;
      const d = new Date(t.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const localISO = `${y}-${m}-${day}`;
      return localISO === dateFilter;
    })();

    const matchesType = !typeFilter || (t.treatment || "").toLowerCase().includes(typeFilter);
    const matchesStatus = !statusFilter || (t.status === statusFilter);

    return matchesPatient && matchesDate && matchesType && matchesStatus;
  });

  // 2) Filtrar ventas (typeFilter lo aplico al "product")
  const filteredSales = (allSales || []).filter((s) => {
    const matchesPatient = !patientFilter || (s.patient?.fullName || "").toLowerCase().includes(patientFilter);

    const matchesDate = !dateFilter || (() => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const localISO = `${y}-${m}-${day}`;
      return localISO === dateFilter;
    })();

    const matchesType = !typeFilter || (s.product || "").toLowerCase().includes(typeFilter);
    const matchesStatus = !statusFilter || (s.status === statusFilter);

    return matchesPatient && matchesDate && matchesType && matchesStatus;
  });

  // 3) Combinar + ordenar por fecha
  const t = filteredTreatments.map((x) => ({ ...x, __type: "treatment" }));
  const s = filteredSales.map((x) => ({ ...x, __type: "sale" }));

  const toTime = (item) => {
    if (item.__type === "treatment") {
      const d = item.date ? String(item.date).split("T")[0] : "";
      const time = item.time || "00:00";
      return new Date(`${d}T${time}:00`).getTime() || 0;
    }
    const d = item.date ? String(item.date).split("T")[0] : "";
    return new Date(`${d}T00:00:00`).getTime() || 0;
  };

  const combined = [...t, ...s].sort((a, b) => toTime(b) - toTime(a));

  // 4) Pintar todo
  updateResultsCount(combined.length);
  renderActiveFilterChips();
  renderResults(combined);
}

function clearAllFilters() {
  const fp = document.getElementById("filterPatient");
  if (fp) fp.value = "";

  const fd = document.getElementById("filterDate");
  if (fd) fd.value = "";

  const ft = document.getElementById("filterTypeInput");
  if (ft) ft.value = "";
  const fto = document.getElementById("filterTypeOptions");
  if (fto) fto.style.display = "none";

  const fs = document.getElementById("filterStatus");
  if (fs) fs.selectedIndex = 0;

  applyFilters();
}

/* ======================
   Create new treatment
====================== */

async function onCreateTreatment(e) {
  e.preventDefault();

  const btnSave = document.getElementById("btnSaveTreatment");
  if (isSavingTreatment) return;

  isSavingTreatment = true;
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    btnSave.style.opacity = "0.6";
  }

  try {
    const patientNameNorm = normalizeText(document.getElementById("patientInput")?.value || "");
    if (!allowedPatients.includes(patientNameNorm)) {
      await Swal.fire({
        icon: "error",
        title: "Paciente no encontrado",
        text: "Debés seleccionar un paciente existente de la lista.",
        confirmButtonColor: "#ffadad",
      });
      document.getElementById("patientInput").value = "";
      document.getElementById("patientSelect").value = "";
      return;
    }

    const treatmentNorm = normalizeText(document.getElementById("treatmentInput")?.value || "");
    if (!allowedTreatments.includes(treatmentNorm)) {
      await Swal.fire({
        icon: "error",
        title: "Tratamiento inválido",
        text: "Debés seleccionar un tratamiento de la lista.",
        confirmButtonColor: "#ffadad",
      });
      document.getElementById("treatmentInput").value = "";
      return;
    }

    const newTreatment = {
      patientId: parseInt(document.getElementById("patientSelect").value, 10),
      treatment: document.getElementById("treatmentInput").value,
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      amount: parseFloat(document.getElementById("amount").value) || 0,
      notes: document.getElementById("notes").value,
      status: document.getElementById("paymentStatus").value,
      method: document.getElementById("paymentMethod").value,
      beforePhoto: beforePhotoData || null,
      afterPhoto: afterPhotoData || null,
    };

    const res = await authFetch(`${API_URL}/appointments`, {
      method: "POST",
      body: JSON.stringify(newTreatment),
    });

    const saved = await res.json().catch(() => null);
    if (!res.ok) throw new Error(saved?.error || "Error al registrar");

    allTreatments.unshift(saved);
    applyFilters(); // respeta filtros si están activos

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Tratamiento registrado correctamente",
      timer: 1800,
      showConfirmButton: false,
    });

    // limpiar + cerrar
    resetTreatmentForm();
    cancelTreatmentForm();

  } catch (err) {
    await Swal.fire("Error", err.message || "No se pudo guardar el tratamiento", "error");
  } finally {
    isSavingTreatment = false;
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = "Guardar";
      btnSave.style.opacity = "1";
    }
  }
}

function resetTreatmentForm() {
  document.getElementById("patientInput").value = "";
  document.getElementById("patientSelect").value = "";
  document.getElementById("treatmentInput").value = "";
  document.getElementById("date").value = "";
  document.getElementById("time").value = "";
  document.getElementById("paymentStatus").selectedIndex = 0;
  document.getElementById("paymentMethod").selectedIndex = 0;
  document.getElementById("amount").value = "";
  document.getElementById("notes").value = "";

  beforePhotoData = "";
  afterPhotoData = "";

  const beforeName = document.getElementById("beforeFileName");
  const afterName = document.getElementById("afterFileName");
  if (beforeName) beforeName.textContent = "Ningún archivo seleccionado";
  if (afterName) afterName.textContent = "Ningún archivo seleccionado";

  const bp = document.getElementById("beforePreview");
  const ap = document.getElementById("afterPreview");
  if (bp) {
    bp.src = "";
    bp.style.display = "none";
  }
  if (ap) {
    ap.src = "";
    ap.style.display = "none";
  }

  const beforeInput = document.getElementById("beforePhoto");
  const afterInput = document.getElementById("afterPhoto");
  if (beforeInput) beforeInput.value = "";
  if (afterInput) afterInput.value = "";
}

/* ======================
   Create Sale
====================== */

async function onCreateSale(e) {
  e.preventDefault();

  const patientId = document.getElementById("salePatientId").value;

  if (!patientId) {
    Swal.fire("Error", "Debés seleccionar un paciente válido.", "error");
    return;
  }

    const dateStr = document.getElementById("saleDate").value;
    const qty = parseInt(document.getElementById("saleQuantity").value, 10);

    const amountStr = document.getElementById("saleAmount").value;
    const amount = parseFloat(amountStr);

    const notes = document.getElementById("saleNotes").value || "";

    // ✅ Fecha obligatoria y no futura
    if (!dateStr) {
      Swal.fire("Error", "La fecha es obligatoria.", "error");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(dateStr + "T00:00:00");
    if (chosen > today) {
      Swal.fire("Error", "La fecha no puede ser futura.", "error");
      return;
    }

    // ✅ Cantidad >= 1
    if (Number.isNaN(qty) || qty < 1) {
      Swal.fire("Error", "La cantidad debe ser 1 o más.", "error");
      return;
    }

    // ✅ Monto numérico y >= 0
    if (Number.isNaN(amount) || amount < 0) {
      Swal.fire("Error", "El monto total debe ser un número mayor o igual a 0.", "error");
      return;
    }

    // ✅ Notas <= 300
    if (notes.length > 300) {
      Swal.fire("Error", "Las notas no pueden superar los 300 caracteres.", "error");
      return;
    }

  const newSale = {
    patientId: parseInt(patientId, 10),
    product: document.getElementById("saleProduct").value,
    date: dateStr,
    quantity: qty,
    amount: amount,
    status: document.getElementById("saleStatus").value,
    method: document.getElementById("saleMethod").value,
    notes: notes,
  };

  try {
    const res = await authFetch(`${API_URL}/sales`, {
      method: "POST",
      body: JSON.stringify(newSale),
    });

    const saved = await res.json();
    if (!res.ok) throw new Error(saved?.error || "Error al registrar venta");

    allSales.unshift(saved);
    applyFilters();

    await Swal.fire({
      icon: "success",
      title: "Venta registrada",
      timer: 1500,
      showConfirmButton: false,
    });

    document.getElementById("saleForm").reset();
    document.getElementById("salePatientId").value = "";

  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }

  closeSaleForm();
}

/* ======================
   Delete
====================== */

async function deleteTreatment(id) {
  const confirm = await Swal.fire({
    title: "¿Eliminar tratamiento?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
    cancelButtonColor: "#d1d1d1",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await authFetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || "No se pudo eliminar");
    }

    allTreatments = allTreatments.filter((t) => String(t.id) !== String(id));
    applyFilters();

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Tratamiento eliminado correctamente",
      timer: 1600,
      showConfirmButton: false,
    });
  } catch {
    Swal.fire("Error", "No se pudo eliminar el tratamiento", "error");
  }
}

/* ======================
   Edit modal
====================== */

function openEditModal(treatment) {
  editingTreatment = { ...treatment };

  const modal = document.getElementById("editTreatmentModal");
  modal.classList.add("active");
  modal.style.display = "flex";

    // ✅ FIX FORZADO: evitar botón largo en modal editar (aunque haya CSS global con !important)
    const actions = modal.querySelector(".modal-actions");
    const btnSave = modal.querySelector(".btn-save");
    const btnCancel = modal.querySelector(".btn-cancel");

    if (actions) {
      actions.style.display = "flex";
      actions.style.justifyContent = "center";
      actions.style.gap = "12px";
      actions.style.flexWrap = "wrap";
    }

    [btnSave, btnCancel].forEach((b) => {
      if (!b) return;
      b.style.width = "auto";
      b.style.flex = "0 0 auto";
      b.style.minWidth = "180px";
      b.style.maxWidth = "260px";
      b.style.display = "inline-flex";
    });

  document.getElementById("editTreatmentInput").value = treatment.treatment || "";

  let rawDate = treatment.date || "";
  if (String(rawDate).includes("T")) rawDate = rawDate.split("T")[0];
  document.getElementById("editTreatmentDate").value = rawDate || "";

  document.getElementById("editTreatmentTime").value = treatment.time || "";
  document.getElementById("editTreatmentAmount").value = (treatment.amount ?? "").toString().replace(/[^0-9.]/g, "");
  document.getElementById("editTreatmentStatus").value = treatment.status || "";
  document.getElementById("editTreatmentMethod").value = treatment.method || "";
  document.getElementById("editTreatmentNotes").value = treatment.notes || "";

  // reset previews
  const beforeImg = document.getElementById("editBeforePreview");
  const afterImg = document.getElementById("editAfterPreview");
  if (beforeImg) beforeImg.src = "";
  if (afterImg) afterImg.src = "";

  // cargar fotos diferidas
  (async () => {
    try {
      const resp = await authFetch(`${API_URL}/appointments/${treatment.id}/photos`);
      if (!resp.ok) return;
      const photos = await resp.json();

      if (photos.beforePhoto && beforeImg) {
        beforeImg.src = photos.beforePhoto;
        editingTreatment.beforePhoto = photos.beforePhoto;
      }
      if (photos.afterPhoto && afterImg) {
        afterImg.src = photos.afterPhoto;
        editingTreatment.afterPhoto = photos.afterPhoto;
      }
    } catch {
      // no-op
    }
  })();
}

function closeEditModal() {
  const modal = document.getElementById("editTreatmentModal");
  modal.classList.remove("active");
  modal.style.display = "none";
  editingTreatment = null;

  const bf = document.getElementById("editBeforePhoto");
  const af = document.getElementById("editAfterPhoto");
  if (bf) bf.value = "";
  if (af) af.value = "";
}

async function onSaveEditTreatment(e) {
  e.preventDefault();

  if (!editingTreatment) return;

  const editValue = normalizeText(document.getElementById("editTreatmentInput").value);
  if (!allowedTreatments.includes(editValue)) {
    await Swal.fire({
      icon: "error",
      title: "Tratamiento inválido",
      text: "Debés seleccionar un tratamiento de la lista.",
      confirmButtonColor: "#ffadad",
    });
    document.getElementById("editTreatmentInput").value = "";
    return;
  }

  const updated = {
    ...editingTreatment,
    treatment: document.getElementById("editTreatmentInput").value,
    date: document.getElementById("editTreatmentDate").value,
    time: document.getElementById("editTreatmentTime").value,
    amount: parseFloat(document.getElementById("editTreatmentAmount").value) || 0,
    status: document.getElementById("editTreatmentStatus").value,
    method: document.getElementById("editTreatmentMethod").value,
    notes: document.getElementById("editTreatmentNotes").value,
  };

  // normalizar imágenes inválidas
  if (!updated.beforePhoto || updated.beforePhoto === "null" || updated.beforePhoto === "undefined" || (String(updated.beforePhoto).length < 100)) {
    updated.beforePhoto = null;
  }
  if (!updated.afterPhoto || updated.afterPhoto === "null" || updated.afterPhoto === "undefined" || (String(updated.afterPhoto).length < 100)) {
    updated.afterPhoto = null;
  }

  try {
    const res = await authFetch(`${API_URL}/appointments/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
    });

    const saved = await res.json().catch(() => null);
    if (!res.ok) throw new Error(saved?.error || "No se pudo actualizar");

    const i = allTreatments.findIndex((t) => String(t.id) === String(updated.id));
    if (i !== -1) allTreatments[i] = saved;

    applyFilters();
    closeEditModal();

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Cambios aplicados correctamente",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo actualizar el tratamiento", "error");
  }
}

/* ======================
   View modal + image
====================== */

async function openViewModal(treatment) {
  treatmentViewCache = { ...treatment };

  const modal = document.getElementById("viewTreatmentModal");
  if (!treatment) return;

  const dateFormatted = treatment.date ? new Date(treatment.date).toLocaleDateString("es-AR") : "—";

  document.getElementById("viewName").textContent = treatment.patient?.fullName || "Sin paciente";
  document.getElementById("viewPhone").textContent = treatment.patient?.phone || "—";
  document.getElementById("viewAddress").textContent = treatment.patient?.address || "—";

  document.getElementById("viewType").textContent = treatment.treatment || "—";
  document.getElementById("viewDate").textContent = dateFormatted;
  const amountView = Number(treatment.amount ?? 0);
  document.getElementById("viewAmount").textContent = `$${amountView.toFixed(2)}`;
  document.getElementById("viewStatus").textContent = treatment.status || "—";
  document.getElementById("viewMethod").textContent = treatment.method || "—";
  document.getElementById("viewNotes").textContent = treatment.notes || "—";

  const beforeImg = document.getElementById("viewBeforePhoto");
  const afterImg = document.getElementById("viewAfterPhoto");
  if (beforeImg) beforeImg.style.display = "none";
  if (afterImg) afterImg.style.display = "none";

  try {
    const resp = await authFetch(`${API_URL}/appointments/${treatment.id}/photos`);
    if (resp.ok) {
      const photos = await resp.json();
      if (photos.beforePhoto && beforeImg) {
        beforeImg.src = photos.beforePhoto;
        beforeImg.style.display = "block";
        treatmentViewCache.beforePhoto = photos.beforePhoto;
      }
      if (photos.afterPhoto && afterImg) {
        afterImg.src = photos.afterPhoto;
        afterImg.style.display = "block";
        treatmentViewCache.afterPhoto = photos.afterPhoto;
      }
    }
  } catch {
    // no-op
  }

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeViewModal() {
  const modal = document.getElementById("viewTreatmentModal");
  modal.classList.remove("active");
  modal.style.display = "none";
}

function openImagePreview(src) {
  const modal = document.getElementById("imagePreviewModal");
  const img = document.getElementById("previewImage");
  if (!src || src.includes("placeholder")) return;

  img.src = src;
  modal.style.display = "flex";

  img.style.transform = "scale(0.9)";
  setTimeout(() => { img.style.transform = "scale(1)"; }, 50);
}

function closeImagePreview() {
  const modal = document.getElementById("imagePreviewModal");
  const img = document.getElementById("previewImage");

  if (!modal || !img) return;

  img.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
    img.src = "";
  }, 150);
}

/* ======================
   New patient modal
====================== */

function openNewPatientModal() {
  document.getElementById("newPatientModal")?.classList.add("active");
}
function closeNewPatientModal() {
  document.getElementById("newPatientModal")?.classList.remove("active");
}

async function confirmNewPatient() {
  const fullName = document.getElementById("newFullName").value.trim();
  const birthDate = document.getElementById("newBirthDate").value;
  const address = document.getElementById("newAddress").value.trim();
  const phone = document.getElementById("newPhone").value.trim();
  const profession = document.getElementById("newProfession").value.trim();

  if (!fullName || !birthDate) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "El nombre y la fecha de nacimiento son obligatorios.",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#333",
    });
    return;
  }

  const newPatient = { fullName, birthDate, address, phone, profession };

  try {
    const res = await authFetch(`${API_URL}/patients`, {
      method: "POST",
      body: JSON.stringify(newPatient),
    });

    const patient = await res.json().catch(() => null);
    if (!res.ok) throw new Error(patient?.error || "Error al registrar el paciente");

    await Swal.fire({
      icon: "success",
      title: "Paciente agregado",
      text: "El paciente se registró correctamente.",
      timer: 1500,
      showConfirmButton: false,
      background: "#fffdf9",
      color: "#333",
    });

    await loadPatients();

    // seleccionar nuevo paciente
    const ctx = window.__newPatientContext || "treatment";

    if (ctx === "sale") {
      const saleId = document.getElementById("salePatientId");
      const saleInput = document.getElementById("salePatientInput");
      if (saleId && patient?.id) saleId.value = patient.id;
      if (saleInput && patient?.fullName) saleInput.value = patient.fullName;

      // abrir form de venta si querés
      openSaleForm();
    } else {
      const select = document.getElementById("patientSelect");
      const input = document.getElementById("patientInput");
      if (select && patient?.id) select.value = patient.id;
      if (input && patient?.fullName) input.value = patient.fullName;

      // abrir form de tratamiento
      openRegisterCard();
      document.getElementById("registerOptions").style.display = "none";
      document.getElementById("treatmentForm").style.display = "block";
    }

    window.__newPatientContext = null;

  } catch (err) {
    console.error("❌ Error al crear paciente:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo registrar el paciente.",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#333",
    });
  }
  
}

/* ======================
   Register form show/hide
====================== */

function cancelTreatmentForm() {
  const form = document.getElementById("treatmentForm");
  const opts = document.getElementById("registerOptions");
  if (form) form.style.display = "none";
  if (opts) opts.style.display = "flex";
  // no cerramos la card (solo cerramos el form)
}

function showExistingPatientForm() {
  openRegisterCard();
  const opts = document.getElementById("registerOptions");
  const form = document.getElementById("treatmentForm");
  if (opts) opts.style.display = "none";
  if (form) form.style.display = "block";
}

function openSaleForm() {
  setCollapsible("#registerSaleSection", true);

  const form = document.getElementById("saleForm");
  if (form) form.style.display = "block";
}

function closeSaleForm() {
  const form = document.getElementById("saleForm");
  if (form) form.style.display = "none";

  setCollapsible("#registerSaleSection", false);
}

/* ======================
   Images utils
====================== */

function loadImageFile(input, previewId, callback = null) {
  const file = input?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;

    if (previewId) {
      const img = document.getElementById(previewId);
      if (img) img.src = dataUrl;
    }
    if (callback) callback(dataUrl);
  };
  reader.readAsDataURL(file);
}

/* ======================
   PDF
====================== */

async function toBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function guessFormat(dataUrl) {
  const m = /^data:image\/(png|jpeg|jpg)/i.exec(String(dataUrl || ""));
  if (!m) return "JPEG";
  const ext = m[1].toLowerCase();
  return ext === "png" ? "PNG" : "JPEG";
}

async function downloadTreatmentPDF() {
  const t = treatmentViewCache;
  if (!t) {
    Swal.fire("Atención", "No hay tratamiento seleccionado", "warning");
    return;
  }
  if (!window.jspdf?.jsPDF) {
    Swal.fire("Falta librería", "No está cargado jsPDF en tu SPA.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const colorHeader = [204, 173, 173];
  const colorBloque = [248, 246, 246];
  const colorTexto = [50, 50, 50];
  const colorLinea = [150, 140, 140];

  doc.setFont("helvetica", "normal");

  doc.setFillColor(...colorHeader);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);

  const usuario = currentUser?.name || "TuGabinete";
  doc.text(`${usuario} — Informe de Tratamiento`, 14, 20);

  // Foto perfil (si existe)
  if (currentUser?.profileImage) {
    try {
      const imgURL = currentUser.profileImage;
      const base64Img = await toBase64(imgURL);
      const fmt = guessFormat(base64Img);

      const imgSize = 20;
      const x = 210 - imgSize - 10;
      const y = 5;
      doc.addImage(base64Img, fmt, x, y, imgSize, imgSize, undefined, "FAST");

      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.rect(x - 1, y - 1, imgSize + 2, imgSize + 2);
    } catch (err) {
      console.warn("⚠️ No se pudo agregar la imagen de perfil", err);
    }
  }

  doc.setFontSize(12);
  doc.setTextColor(...colorTexto);
  doc.text("Datos del Paciente", 14, 45);
  doc.setDrawColor(...colorLinea);
  doc.line(14, 47, 80, 47);

  doc.setFontSize(11);
  const startY = 54;
  doc.text(`Nombre: ${t.patient?.fullName || "—"}`, 14, startY);
  doc.text(`Teléfono: ${t.patient?.phone || "—"}`, 14, startY + 7);
  doc.text(`Dirección: ${t.patient?.address || "—"}`, 14, startY + 14);

  doc.text("Detalles del Tratamiento", 14, startY + 28);
  doc.line(14, startY + 30, 80, startY + 30);

  const tratamientoY = startY + 37;
  doc.text(`Tratamiento: ${t.treatment || "—"}`, 14, tratamientoY);
  doc.text(`Fecha: ${t.date ? new Date(t.date).toLocaleDateString("es-AR") : "—"}`, 14, tratamientoY + 7);
  doc.text(`Hora: ${t.time || "—"}`, 14, tratamientoY + 14);
  const amountPdf = Number(t.amount ?? 0);
  doc.text(`Monto: $${amountPdf.toFixed(2)}`, 14, tratamientoY + 21);
  doc.text(`Estado del pago: ${t.status || "—"}`, 14, tratamientoY + 28);
  doc.text(`Método de pago: ${t.method || "—"}`, 14, tratamientoY + 35);

  const notesY = tratamientoY + 47;
  doc.setFillColor(...colorBloque);
  doc.roundedRect(14, notesY - 6, 182, 30, 3, 3, "F");
  doc.setTextColor(...colorTexto);
  doc.setFontSize(11);
  doc.text("Notas / Observaciones:", 18, notesY);
  doc.setFontSize(10);
  doc.text(t.notes || "—", 18, notesY + 8, { maxWidth: 175, lineHeightFactor: 1.4 });

  const imgY = notesY + 45;
  doc.setFontSize(12);
  doc.text("Registro Fotográfico", 14, imgY);
  doc.setDrawColor(...colorLinea);
  doc.line(14, imgY + 2, 80, imgY + 2);

  const imgWidth = 70;
  const imgHeight = 70;
  const yStartImg = imgY + 10;

  if (t.beforePhoto) {
    try {
      doc.addImage(t.beforePhoto, guessFormat(t.beforePhoto), 14, yStartImg, imgWidth, imgHeight, undefined, "FAST");
      doc.setFontSize(10);
      doc.text("Antes", 14, yStartImg + imgHeight + 6);
    } catch {
      // no-op
    }
  }

  if (t.afterPhoto) {
    try {
      doc.addImage(t.afterPhoto, guessFormat(t.afterPhoto), 110, yStartImg, imgWidth, imgHeight, undefined, "FAST");
      doc.setFontSize(10);
      doc.text("Después", 110, yStartImg + imgHeight + 6);
    } catch {
      // no-op
    }
  }

  doc.setFontSize(11);
  doc.setTextColor(...colorTexto);
  doc.text(`Firma profesional:`, 85, 287);

  const filename = `Informe_${(t.patient?.fullName || "Paciente").replace(/\s+/g, "_")}_${(t.date ? new Date(t.date).toLocaleDateString("es-AR") : "Fecha")}.pdf`;
  doc.save(filename);
}

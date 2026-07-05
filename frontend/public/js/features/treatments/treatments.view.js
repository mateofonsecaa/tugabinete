// /public/js/views/treatments.js
import * as api from "./treatments.api.js";
import { initDrawer } from "../../components/drawer.js";
import {
  MAX_TREATMENT_PHOTOS,
  buildDraftGalleryPhotosFromFiles,
  buildGalleryPhotosFromApiResponse,
  appendGalleryPhotosToFormData,
  reindexGalleryPhotos,
  canAddMorePhotos,
} from "./treatments.gallery.js";
import {
  normalizeText,
  allowedTreatments,
} from "./treatments.config.js";
import {
  treatmentsPageTemplate,
  treatmentCardTemplate,
  saleCardTemplate,
  filterChipTemplate,
  modalLoadingTemplate,
  galleryEmptyTemplate,
  galleryLoadingTemplate,
  createGalleryCardTemplate,
  editGalleryCardTemplate,
  viewGalleryCardTemplate,
} from "./treatments.templates.js";

/* ======================
   SPA View
====================== */

export function Treatments() {
  return treatmentsPageTemplate();
}

/* ======================
   SPA init
====================== */

let currentUser = null;
let allTreatments = [];
let allSales = [];
let allowedPatients = []; // normalizados
let isSavingTreatment = false;
let isSavingSale = false;
let editingTreatment = null;
let editingSale = null;
let treatmentViewCache = null;
let patientsCache = [];
let createTreatmentGallery = [];
let editTreatmentGallery = [];

export async function initTreatments() {
  initDrawer();

  // Si no existe la vista, salimos
  const page = document.querySelector(".treatments-page");
  if (!page) return;

  // Cargar user para PDF + drawer username
  await loadCurrentUser();

  // Bind UI (una sola vez por render)
  bindUI();
  initManualDateFields();

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

  const recordType = (document.getElementById("filterRecordType")?.value || "").trim();
  const patient = (document.getElementById("filterPatient")?.value || "").trim();
  const date = (document.getElementById("filterDate")?.value || "").trim();
  const datePresence = (document.getElementById("filterDatePresence")?.value || "").trim();
  const timePresence = (document.getElementById("filterTimePresence")?.value || "").trim();
  const type = (document.getElementById("filterTypeInput")?.value || "").trim();
  const status = (document.getElementById("filterStatus")?.value || "").trim();

  const chips = [];

  if (recordType) {
    chips.push({
      key: "recordType",
      label: `Resultado: ${recordType === "treatment" ? "Tratamientos" : "Ventas"}`
    });
  }

  if (patient) chips.push({ key: "patient", label: `Paciente: ${patient}` });
  if (date) chips.push({ key: "date", label: `Fecha exacta: ${date}` });

  if (datePresence) {
    chips.push({
      key: "datePresence",
      label: `Fecha: ${datePresence === "with" ? "Con fecha" : "Sin fecha"}`
    });
  }

  if (timePresence) {
    chips.push({
      key: "timePresence",
      label: `Hora: ${timePresence === "with" ? "Con hora" : "Sin hora"}`
    });
  }

  if (type) chips.push({ key: "type", label: `Tipo: ${type}` });
  if (status) chips.push({ key: "status", label: `Pago: ${status}` });

  if (!chips.length) {
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = chips.map(filterChipTemplate).join("");

  // remover chip
  wrap.querySelectorAll(".tg-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.chip;

      if (key === "recordType") document.getElementById("filterRecordType").selectedIndex = 0;
      if (key === "patient") document.getElementById("filterPatient").value = "";
      if (key === "date") setDateInputISO("filterDate", "");
      if (key === "datePresence") document.getElementById("filterDatePresence").selectedIndex = 0;
      if (key === "timePresence") document.getElementById("filterTimePresence").selectedIndex = 0;
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

  // Filtros
  bindOnce("#filterRecordType", "change", () => applyFilters());
  bindOnce("#filterPatient", "input", () => applyFilters());
  bindOnce("#filterDate", "change", () => applyFilters());
  bindOnce("#filterDate", "input", () => applyFilters());
  bindOnce("#filterDatePresence", "change", () => applyFilters());
  bindOnce("#filterTimePresence", "change", () => applyFilters());
  bindOnce("#filterStatus", "change", () => applyFilters());
  bindOnce("#clearAllFilters", "click", () => clearAllFilters());

  bindOnce("#treatmentGalleryInput", "change", async (e) => {
    try {
      const files = e.target?.files;
      if (!files || !files.length) return;

      if (!canAddMorePhotos(createTreatmentGallery.length)) {
        await Swal.fire({
          icon: "warning",
          title: "Límite alcanzado",
          text: `Solo se permiten ${MAX_TREATMENT_PHOTOS} fotos por tratamiento.`,
          confirmButtonColor: "#ffadad",
        });
        e.target.value = "";
        return;
      }

      await addFilesToCreateGallery(files);
      e.target.value = "";
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "No se pudieron agregar las fotos",
        text: err.message || "Ocurrió un error al procesar las imágenes.",
        confirmButtonColor: "#ffadad",
      });
      e.target.value = "";
    }
  });

  bindOnce("#editTreatmentGalleryInput", "change", async (e) => {
    try {
      const files = e.target?.files;
      if (!files || !files.length) return;

      if (!canAddMorePhotos(editTreatmentGallery.length)) {
        await Swal.fire({
          icon: "warning",
          title: "Límite alcanzado",
          text: `Solo se permiten ${MAX_TREATMENT_PHOTOS} fotos por tratamiento.`,
          confirmButtonColor: "#ffadad",
        });
        e.target.value = "";
        return;
      }

      await addFilesToEditGallery(files);
      e.target.value = "";
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "No se pudieron agregar las fotos",
        text: err.message || "Ocurrió un error al procesar las imágenes.",
        confirmButtonColor: "#ffadad",
      });
      e.target.value = "";
    }
  });

  // Form submit (nuevo)
  bindOnce("#treatmentForm", "submit", (e) => onCreateTreatment(e));

  // Tabla botones (ver/editar/eliminar)
  // delegación en body (pero la hacemos una sola vez)
  if (!window.__treatmentsDelegationBound) {
    window.__treatmentsDelegationBound = true;
    document.body.addEventListener("click", (e) => {
    if (!document.querySelector(".treatments-page")) return;
        const removeGalleryBtn = e.target.closest("[data-gallery-remove]");
    if (removeGalleryBtn) {
      const index = Number(removeGalleryBtn.dataset.galleryRemove);
      if (Number.isInteger(index)) {
        removePhotoFromCreateGallery(index);
      }
      return;
    }

    const previewGalleryImg = e.target.closest("[data-gallery-preview]");
    if (previewGalleryImg) {
      const index = Number(previewGalleryImg.dataset.galleryPreview);
      const photo = createTreatmentGallery[index];
      if (photo?.url) {
        openImagePreview(photo.url);
      }
      return;
    }

    const removeEditGalleryBtn = e.target.closest("[data-edit-gallery-remove]");
    if (removeEditGalleryBtn) {
      const index = Number(removeEditGalleryBtn.dataset.editGalleryRemove);
      if (Number.isInteger(index)) {
        removePhotoFromEditGallery(index);
      }
      return;
    }

    const previewEditGalleryImg = e.target.closest("[data-edit-gallery-preview]");
    if (previewEditGalleryImg) {
      const index = Number(previewEditGalleryImg.dataset.editGalleryPreview);
      const photo = editTreatmentGallery[index];
      if (photo?.url) {
        openImagePreview(photo.url);
      }
      return;
    }

    const previewViewGalleryImg = e.target.closest("[data-view-gallery-preview]");
    if (previewViewGalleryImg) {
      const index = Number(previewViewGalleryImg.dataset.viewGalleryPreview);
      const photo = buildGalleryPhotosFromApiResponse(treatmentViewCache || {})[index];
      if (photo?.url) {
        openImagePreview(photo.url);
      }
      return;
    }

    // ✅ Click en fila -> abrir ver (si NO clickeó un botón)
    const row = e.target.closest(".treat-card[data-id]");
    if (row && !e.target.closest("button")) {
      const id = row.dataset.id;
      const kind = row.dataset.kind || "treatment";

      if (kind === "sale") {
        const s = allSales.find((x) => String(x.id) === String(id));
        if (s) openSaleViewModal(s);
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

        const card = btn.closest(".treat-card");
        const kind = card?.dataset.kind || "treatment";

        // ✅ Acciones para ventas
        if (kind === "sale") {
          const s = allSales.find((x) => String(x.id) === String(id));
          if (btn.classList.contains("btn-view")) {
            if (s) openSaleViewModal(s);
          }
          if (btn.classList.contains("btn-edit")) {
            if (s) openEditSaleModal(s);
          }
          if (btn.classList.contains("btn-delete")) deleteSale(id);
          return;
        }

        // ✅ Acciones para tratamientos
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
      if (btn.id === "closeEditSaleBtn" || btn.id === "cancelEditSaleBtn") closeEditSaleModal();
      if (btn.id === "closeViewTreatmentBtn") closeViewModal();
      if (btn.id === "closeViewSaleBtn") closeSaleViewModal();
      if (btn.id === "downloadPdfBtn") downloadTreatmentPDF();

      if (btn.id === "closeImageBtn") closeImagePreview();
    });
      if (!window.__treatmentsGalleryLabelChangeBound) {
        window.__treatmentsGalleryLabelChangeBound = true;

        document.body.addEventListener("change", (e) => {
          if (!document.querySelector(".treatments-page")) return;

            const createLabelSelect = e.target.closest("[data-gallery-label]");
            if (createLabelSelect) {
              const index = Number(createLabelSelect.dataset.galleryLabel);
              if (Number.isInteger(index)) {
                updateCreateGalleryPhotoLabel(index, createLabelSelect.value || "Sin etiqueta");
              }
              return;
            }

            const editLabelSelect = e.target.closest("[data-edit-gallery-label]");
            if (editLabelSelect) {
              const index = Number(editLabelSelect.dataset.editGalleryLabel);
              if (Number.isInteger(index)) {
                updateEditGalleryPhotoLabel(index, editLabelSelect.value || "Sin etiqueta");
              }
            }
        });
      }
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

    // preview solamente
    loadImageFile(input, "beforePreview", () => {
      const preview = document.getElementById("beforePreview");
      if (preview) preview.style.display = "block";
    });
  });

  bindOnce("#afterPhoto", "change", () => {
    const input = document.getElementById("afterPhoto");
    const name = document.getElementById("afterFileName");
    if (name) name.textContent = input?.files?.length ? input.files[0].name : "Ningún archivo seleccionado";

    // preview solamente
    loadImageFile(input, "afterPreview", () => {
      const preview = document.getElementById("afterPreview");
      if (preview) preview.style.display = "block";
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

bindOnce("#saleForm", "submit", (e) => onCreateSale(e));

/* ✅ Cantidad: entero y mínimo 1 */
bindOnce("#saleQuantity", "input", (e) => {
  let v = String(e.target.value || "").replace(/[^0-9]/g, "").slice(0, 10);

  if (v === "") {
    e.target.value = "";
    return;
  }

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

bindOnce("#editSaleForm", "submit", (e) => onSaveEditSale(e));

/* ✅ Producto: máximo 40 chars (refuerzo por si pega texto largo) */
bindOnce("#editSaleProduct", "input", (e) => {
  const max = 40;
  if (e.target.value.length > max) e.target.value = e.target.value.slice(0, max);
});

/* ✅ Cantidad: solo dígitos, máximo 10 dígitos, entero y mínimo 1 */
bindOnce("#editSaleQuantity", "input", (e) => {
  let v = String(e.target.value || "").replace(/[^0-9]/g, "").slice(0, 10);
  if (v === "") { e.target.value = ""; return; }

  let n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 1) n = 1;

  e.target.value = String(n);
});

/* ✅ Monto: numérico y >= 0 (solo números) */
bindOnce("#editSaleAmount", "input", (e) => {
  let v = String(e.target.value || "").replace(/[^0-9]/g, "").slice(0, 10);
  if (v === "") { e.target.value = ""; return; }

  let n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0) n = 0;

  e.target.value = String(n);
});

/* ✅ Notas: máximo 300 */
bindOnce("#editSaleNotes", "input", (e) => {
  const max = 300;
  if (e.target.value.length > max) e.target.value = e.target.value.slice(0, max);
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

const MANUAL_DATE_IDS = ["date", "saleDate", "filterDate", "newBirthDate", "editTreatmentDate"];

function getTodayISO() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function maskDisplayDate(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatISOToDisplay(iso) {
  const raw = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";

  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}

function parseDisplayDateToISO(value) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // si por algún motivo ya viene ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";

  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const test = new Date(`${iso}T00:00:00`);

  if (Number.isNaN(test.getTime())) return "";
  if (test.getFullYear() !== yyyy) return "";
  if (test.getMonth() + 1 !== mm) return "";
  if (test.getDate() !== dd) return "";

  return iso;
}

function setDateFieldErrorState(input, invalid) {
  const wrap = input?.closest(".tg-date-control");
  if (!wrap) return;
  wrap.classList.toggle("is-invalid", Boolean(invalid));
}

function setDateInputISO(id, isoValue) {
  const input = document.getElementById(id);
  if (!input) return;

  const picker = document.getElementById(`${id}__picker`);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(isoValue || "").slice(0, 10))
    ? String(isoValue).slice(0, 10)
    : "";

  input.value = iso ? formatISOToDisplay(iso) : "";

  if (picker) {
    picker.value = iso;
    if (id === "saleDate") {
      picker.max = getTodayISO();
    }
  }

  setDateFieldErrorState(input, false);
}

function getDateInputISO(id) {
  const input = document.getElementById(id);
  return parseDisplayDateToISO(input?.value || "");
}

function initManualDateFields() {
  MANUAL_DATE_IDS.forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.manualDateReady === "1") return;

    input.dataset.manualDateReady = "1";

    const initialValue = input.value || "";

    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.placeholder = "dd/mm/aaaa";
    input.maxLength = 10;
    input.spellcheck = false;

    const wrap = document.createElement("div");
    wrap.className = "tg-date-control";

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const picker = document.createElement("input");
    picker.type = "date";
    picker.id = `${id}__picker`;
    picker.className = "tg-date-native";
    picker.tabIndex = -1;
    picker.setAttribute("aria-hidden", "true");

    if (id === "saleDate") {
      picker.max = getTodayISO();
    }

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tg-date-trigger";
    trigger.setAttribute("aria-label", "Abrir calendario");
    trigger.innerHTML = `<i class="fa-solid fa-calendar-days"></i>`;

    wrap.appendChild(picker);
    wrap.appendChild(trigger);

    if (initialValue) {
      setDateInputISO(id, initialValue);
    }

    input.addEventListener("input", () => {
      input.value = maskDisplayDate(input.value);

      const iso = parseDisplayDateToISO(input.value);

      if (!input.value.trim()) {
        picker.value = "";
        setDateFieldErrorState(input, false);
        return;
      }

      if (iso) {
        picker.value = iso;
        setDateFieldErrorState(input, false);
        return;
      }

      if (input.value.length === 10) {
        picker.value = "";
        setDateFieldErrorState(input, true);
      } else {
        picker.value = "";
        setDateFieldErrorState(input, false);
      }
    });

    input.addEventListener("blur", () => {
      if (!input.value.trim()) {
        picker.value = "";
        setDateFieldErrorState(input, false);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      const iso = parseDisplayDateToISO(input.value);

      if (!iso) {
        setDateFieldErrorState(input, true);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      setDateInputISO(id, iso);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    trigger.addEventListener("click", () => {
      if (id === "saleDate") {
        picker.max = getTodayISO();
      }

      const iso = parseDisplayDateToISO(input.value);
      picker.value = iso || picker.value || "";

      picker.focus({ preventScroll: true });

      if (typeof picker.showPicker === "function") {
        picker.showPicker();
      } else {
        picker.click();
      }
    });

    picker.addEventListener("change", () => {
      setDateInputISO(id, picker.value || "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

/* ======================
   Data loading
====================== */

async function loadCurrentUser() {
  try {
    const user = await api.fetchCurrentUser();
    if (user) currentUser = user;

    const du = document.getElementById("drawer-username");
    if (du) du.textContent = currentUser?.name || "Profesional";
  } catch {
    // no-op
  }
}

async function loadPatients() {
  let data = []; 
  try {
    data = await api.fetchPatients();

    patientsCache = data;

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
    patientsCache = [];
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
    allTreatments = await api.fetchTreatments({ offset: 0, limit: 50 });
  } catch (err) {
    console.error("❌ Error al cargar tratamientos:", err);
    allTreatments = [];
    const list = document.getElementById("treatmentsList");
    if (list) {
      list.innerHTML = `<div class="tg-empty">
        Error al cargar tratamientos
      </div>`;
    }
  }
}

async function loadSales() {
  try {
    allSales = await api.fetchSales({ offset: 0, limit: 50 });
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

    const v = normalizeText($input.value);
    if (!v) {
      [...$options.children].forEach((opt) => {
        opt.style.display = "block";
      });
    }
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
    list.innerHTML = `<div class="tg-empty">No hay resultados</div>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      if (item.__type === "sale") return saleCardTemplate(item);
      return treatmentCardTemplate(item);
    })
    .join("");
}

function applyFilters() {
  const recordTypeFilter = document.getElementById("filterRecordType")?.value || "";
  const patientFilter = (document.getElementById("filterPatient")?.value || "").toLowerCase();
  const dateFilter = getDateInputISO("filterDate");
  const datePresenceFilter = document.getElementById("filterDatePresence")?.value || "";
  const timePresenceFilter = document.getElementById("filterTimePresence")?.value || "";
  const typeFilter = (document.getElementById("filterTypeInput")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("filterStatus")?.value || "";

  const filteredTreatments =
    recordTypeFilter === "sale"
      ? []
      : (allTreatments || []).filter((t) => {
          const matchesPatient =
            !patientFilter || (t.patient?.fullName || "").toLowerCase().includes(patientFilter);

          const hasDate = !!(t.date && String(t.date).trim());
          const hasTime = !!(t.time && String(t.time).trim());

          const matchesDate =
            !dateFilter || (t.date && String(t.date).slice(0, 10) === dateFilter);

          const matchesDatePresence =
            !datePresenceFilter ||
            (datePresenceFilter === "with" && hasDate) ||
            (datePresenceFilter === "without" && !hasDate);

          const matchesTimePresence =
            !timePresenceFilter ||
            (timePresenceFilter === "with" && hasTime) ||
            (timePresenceFilter === "without" && !hasTime);

          const matchesType =
            !typeFilter || (t.treatment || "").toLowerCase().includes(typeFilter);

          const matchesStatus =
            !statusFilter || t.status === statusFilter;

          return (
            matchesPatient &&
            matchesDate &&
            matchesDatePresence &&
            matchesTimePresence &&
            matchesType &&
            matchesStatus
          );
        });

  const filteredSales =
    recordTypeFilter === "treatment"
      ? []
      : (allSales || []).filter((s) => {
          const matchesPatient =
            !patientFilter || (s.patient?.fullName || "").toLowerCase().includes(patientFilter);

          const hasDate = !!(s.date && String(s.date).trim());
          const hasTime = false; // las ventas no manejan hora

          const matchesDate =
            !dateFilter || (s.date && String(s.date).slice(0, 10) === dateFilter);

          const matchesDatePresence =
            !datePresenceFilter ||
            (datePresenceFilter === "with" && hasDate) ||
            (datePresenceFilter === "without" && !hasDate);

          const matchesTimePresence =
            !timePresenceFilter ||
            (timePresenceFilter === "with" && hasTime) ||
            (timePresenceFilter === "without" && !hasTime);

          const matchesType =
            !typeFilter || (s.product || "").toLowerCase().includes(typeFilter);

          const matchesStatus =
            !statusFilter || s.status === statusFilter;

          return (
            matchesPatient &&
            matchesDate &&
            matchesDatePresence &&
            matchesTimePresence &&
            matchesType &&
            matchesStatus
          );
        });

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

  updateResultsCount(combined.length);
  renderActiveFilterChips();
  renderResults(combined);
}

function clearAllFilters() {
  const frt = document.getElementById("filterRecordType");
  if (frt) frt.selectedIndex = 0;

  const fp = document.getElementById("filterPatient");
  if (fp) fp.value = "";

  setDateInputISO("filterDate", "");

  const fdp = document.getElementById("filterDatePresence");
  if (fdp) fdp.selectedIndex = 0;

  const ftp = document.getElementById("filterTimePresence");
  if (ftp) ftp.selectedIndex = 0;

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
    const patientId = document.getElementById("patientSelect")?.value;
    if (!patientId) {
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

    const treatmentNorm = normalizeText(
      document.getElementById("treatmentInput")?.value || ""
    );

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

    const dateInputValue = document.getElementById("date")?.value?.trim() || "";
    const treatmentDate = getDateInputISO("date");

    if (dateInputValue && !treatmentDate) {
      await Swal.fire({
        icon: "error",
        title: "Fecha inválida",
        text: "Ingresá una fecha válida en formato dd/mm/aaaa.",
        confirmButtonColor: "#ffadad",
      });
      return;
    }

    const treatmentTime = document.getElementById("time")?.value || "";

    const amountRaw = String(document.getElementById("amount")?.value || "").trim();
    const amountValue = amountRaw === "" ? undefined : parseFloat(amountRaw);

    if (amountRaw !== "" && (Number.isNaN(amountValue) || amountValue < 0)) {
      await Swal.fire({
        icon: "error",
        title: "Monto inválido",
        text: "El monto debe ser un número mayor o igual a 0.",
        confirmButtonColor: "#ffadad",
      });
      return;
    }

    const formData = new FormData();

    appendFormValue(formData, "patientId", patientId);
    appendFormValue(
      formData,
      "treatment",
      document.getElementById("treatmentInput")?.value || ""
    );
    appendFormValue(formData, "date", treatmentDate || undefined);
    appendFormValue(formData, "time", treatmentTime || undefined);
    appendFormValue(formData, "amount", amountValue);
    appendFormValue(
      formData,
      "notes",
      document.getElementById("notes")?.value || ""
    );
    appendFormValue(
      formData,
      "status",
      document.getElementById("paymentStatus")?.value || ""
    );
    appendFormValue(
      formData,
      "method",
      document.getElementById("paymentMethod")?.value || ""
    );

    appendGalleryPhotosToFormData(formData, createTreatmentGallery);

    const saved = await api.createTreatment(formData);

    allTreatments.unshift(saved);
    applyFilters();

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Tratamiento registrado correctamente",
      timer: 1800,
      showConfirmButton: false,
    });

    resetTreatmentForm();
    cancelTreatmentForm();
  } catch (err) {
    await Swal.fire(
      "Error",
      err.message || "No se pudo guardar el tratamiento",
      "error"
    );
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
  setDateInputISO("date", "");
  document.getElementById("time").value = "";
  document.getElementById("paymentStatus").selectedIndex = 0;
  document.getElementById("paymentMethod").selectedIndex = 0;
  document.getElementById("amount").value = "";
  document.getElementById("notes").value = "";

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

  const pi = document.getElementById("patientInput");
  const ti = document.getElementById("treatmentInput");

  if (pi) pi.dispatchEvent(new Event("input", { bubbles: true }));
  if (ti) ti.dispatchEvent(new Event("input", { bubbles: true }));

  // opcional: esconder los dropdowns al reset
  const po = document.getElementById("patientOptions");
  const to = document.getElementById("treatmentOptions");
  if (po) po.style.display = "none";
  if (to) to.style.display = "none";

  createTreatmentGallery = [];
  renderCreateTreatmentGallery();
}

/* ======================
   Create Sale
====================== */

async function onCreateSale(e) {
  e.preventDefault();

  const btnSave = document.getElementById("btnSaveSale") ||
                  document.querySelector('#saleForm button[type="submit"]');

  if (isSavingSale) return;
  isSavingSale = true;

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cargando...`;
    btnSave.style.opacity = "0.6";
  }

  try {
    const patientId = document.getElementById("salePatientId")?.value;

    if (!patientId) {
      await Swal.fire("Error", "Debés seleccionar un paciente válido.", "error");
      throw new Error("__VALIDATION__");
    }

    const saleDateInputValue = document.getElementById("saleDate")?.value?.trim() || "";
    const dateStr = getDateInputISO("saleDate");
    const qty = parseInt(document.getElementById("saleQuantity")?.value || "", 10);

    const amountStr = String(document.getElementById("saleAmount")?.value || "").trim();
    const amount = amountStr === "" ? undefined : parseFloat(amountStr);

    const notes = document.getElementById("saleNotes")?.value || "";

    if (saleDateInputValue && !dateStr) {
      await Swal.fire("Error", "La fecha ingresada no es válida.", "error");
      throw new Error("__VALIDATION__");
    }

    if (dateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(dateStr + "T00:00:00");

      if (chosen > today) {
        await Swal.fire("Error", "La fecha no puede ser futura.", "error");
        throw new Error("__VALIDATION__");
      }
    }

    if (Number.isNaN(qty) || qty < 1) {
      await Swal.fire("Error", "La cantidad debe ser 1 o más.", "error");
      throw new Error("__VALIDATION__");
    }

    if (amountStr !== "" && (Number.isNaN(amount) || amount < 0)) {
      await Swal.fire("Error", "El monto total debe ser un número mayor o igual a 0.", "error");
      throw new Error("__VALIDATION__");
    }

    const newSale = {
      patientId: parseInt(patientId, 10),
      product: document.getElementById("saleProduct")?.value || "",
      date: dateStr || undefined,
      quantity: qty,
      amount: amount,
      status: document.getElementById("saleStatus")?.value || "",
      method: document.getElementById("saleMethod")?.value || "",
      notes: notes,
    };

    Object.keys(newSale).forEach((k) => {
      if (newSale[k] === undefined) delete newSale[k];
    });

    const saved = await api.createSale(newSale);

    allSales.unshift(saved);
    applyFilters();

    await Swal.fire({
      icon: "success",
      title: "Venta registrada",
      timer: 1500,
      showConfirmButton: false,
    });

    document.getElementById("saleForm")?.reset();
    const salePatientId = document.getElementById("salePatientId");
    if (salePatientId) salePatientId.value = "";

    const spi = document.getElementById("salePatientInput");
    const spo = document.getElementById("salePatientOptions");
    if (spi) {
      spi.value = "";
      spi.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (spo) spo.style.display = "none";

    closeSaleForm(); // SOLO si guardó bien

  } catch (err) {
    if (err?.message === "__VALIDATION__") return;
    Swal.fire("Error", err?.message || "No se pudo guardar la venta", "error");
  } finally {
    isSavingSale = false;
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = "Guardar";
      btnSave.style.opacity = "1";
    }
  }
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
    await api.deleteTreatment(id);

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

async function deleteSale(id) {
  const confirm = await Swal.fire({
    title: "¿Eliminar venta?",
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
    await api.deleteSale(id);

    allSales = allSales.filter((s) => String(s.id) !== String(id));
    applyFilters();

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Venta eliminada correctamente",
      timer: 1600,
      showConfirmButton: false,
    });
  } catch {
    Swal.fire("Error", "No se pudo eliminar la venta", "error");
  }
}

/* ======================
   Edit modal
====================== */

function openEditModal(treatment) {
  editingTreatment = { ...treatment };

  const modal = document.getElementById("editTreatmentModal");
  if (!modal) return;

  modal.classList.add("active");
  modal.style.display = "flex";

  const editTreatmentInput = document.getElementById("editTreatmentInput");
  const editTreatmentTime = document.getElementById("editTreatmentTime");
  const editTreatmentAmount = document.getElementById("editTreatmentAmount");
  const editTreatmentStatus = document.getElementById("editTreatmentStatus");
  const editTreatmentMethod = document.getElementById("editTreatmentMethod");
  const editTreatmentNotes = document.getElementById("editTreatmentNotes");
  const editGalleryInput = document.getElementById("editTreatmentGalleryInput");

  if (editTreatmentInput) editTreatmentInput.value = treatment.treatment || "";

  let rawDate = treatment.date || "";
  if (String(rawDate).includes("T")) rawDate = rawDate.split("T")[0];
  setDateInputISO("editTreatmentDate", rawDate || "");

  if (editTreatmentTime) editTreatmentTime.value = treatment.time || "";
  if (editTreatmentAmount) editTreatmentAmount.value = String(treatment.amount ?? "").replace(/[^0-9.]/g, "");
  if (editTreatmentStatus) editTreatmentStatus.value = treatment.status || "";
  if (editTreatmentMethod) editTreatmentMethod.value = treatment.method || "";
  if (editTreatmentNotes) editTreatmentNotes.value = treatment.notes || "";

  if (editGalleryInput) editGalleryInput.value = "";

  editTreatmentGallery = [];
  renderEditTreatmentGalleryLoading();

  (async () => {
    try {
      const currentId = treatment.id;
      const photosPayload = await api.fetchTreatmentPhotos(currentId);

      if (!photosPayload) {
        editTreatmentGallery = [];
        renderEditTreatmentGallery();
        return;
      }

      if (!editingTreatment || String(editingTreatment.id) !== String(currentId)) return;

      editTreatmentGallery = buildGalleryPhotosFromApiResponse(photosPayload);
      renderEditTreatmentGallery();
    } catch (err) {
      console.error("Error cargando fotos del tratamiento:", err);
      editTreatmentGallery = [];
      renderEditTreatmentGallery();
    }
  })();
}

function closeEditModal() {
  const modal = document.getElementById("editTreatmentModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";

  const form = document.getElementById("editTreatmentForm");
  if (form) form.reset();

  setDateInputISO("editTreatmentDate", "");

  const editGalleryInput = document.getElementById("editTreatmentGalleryInput");
  if (editGalleryInput) editGalleryInput.value = "";

  editingTreatment = null;
  editTreatmentGallery = [];
  renderEditTreatmentGallery();
}

async function onSaveEditTreatment(e) {
  e.preventDefault();

  if (!editingTreatment) return;

  const btnSave = document.querySelector(
    'button[type="submit"][form="editTreatmentForm"]'
  );

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    btnSave.style.opacity = "0.6";
  }

  try {
    const editValue = normalizeText(
      document.getElementById("editTreatmentInput")?.value || ""
    );

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

    const editDateInputValue = document.getElementById("editTreatmentDate")?.value?.trim() || "";
    const editTreatmentDateIso = getDateInputISO("editTreatmentDate");

    if (editDateInputValue && !editTreatmentDateIso) {
      await Swal.fire({
        icon: "error",
        title: "Fecha inválida",
        text: "Ingresá una fecha válida en formato dd/mm/aaaa.",
        confirmButtonColor: "#ffadad",
      });
      return;
    }

    const editTreatmentTime = document.getElementById("editTreatmentTime")?.value || "";

    const editAmountRaw = String(document.getElementById("editTreatmentAmount")?.value || "").trim();
    const editAmountValue = editAmountRaw === "" ? undefined : parseFloat(editAmountRaw);

    if (editAmountRaw !== "" && (Number.isNaN(editAmountValue) || editAmountValue < 0)) {
      await Swal.fire({
        icon: "error",
        title: "Monto inválido",
        text: "El monto debe ser un número mayor o igual a 0.",
        confirmButtonColor: "#ffadad",
      });
      return;
    }

    const formData = new FormData();

    appendFormValue(
      formData,
      "patientId",
      editingTreatment.patientId ?? editingTreatment.patient?.id ?? ""
    );
    appendFormValue(
      formData,
      "treatment",
      document.getElementById("editTreatmentInput")?.value || ""
    );
    appendFormValue(formData, "date", editTreatmentDateIso || undefined);
    appendFormValue(formData, "time", editTreatmentTime || undefined);
    appendFormValue(formData, "amount", editAmountValue);
    appendFormValue(
      formData,
      "status",
      document.getElementById("editTreatmentStatus")?.value || ""
    );
    appendFormValue(
      formData,
      "method",
      document.getElementById("editTreatmentMethod")?.value || ""
    );
    appendFormValue(
      formData,
      "notes",
      document.getElementById("editTreatmentNotes")?.value || ""
    );

    appendGalleryPhotosToFormData(formData, editTreatmentGallery);

    const saved = await api.updateTreatment(editingTreatment.id, formData);

    const i = allTreatments.findIndex(
      (t) => String(t.id) === String(editingTreatment.id)
    );
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
    await Swal.fire(
      "Error",
      err.message || "No se pudo actualizar el tratamiento",
      "error"
    );
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
      btnSave.style.opacity = "1";
    }
  }
}

function openEditSaleModal(sale) {
  editingSale = { ...sale };

  const modal = document.getElementById("editSaleModal");
  if (!modal) return;

  modal.classList.add("active");
  modal.style.display = "flex";

  const product = document.getElementById("editSaleProduct");
  const qty = document.getElementById("editSaleQuantity");
  const amount = document.getElementById("editSaleAmount");
  const notes = document.getElementById("editSaleNotes");

  if (product) product.value = sale.product || "";
  if (qty) qty.value = String(sale.quantity ?? 1);
  if (amount) amount.value = String(sale.amount ?? 0);
  if (notes) notes.value = sale.notes || "";
}

function closeEditSaleModal() {
  const modal = document.getElementById("editSaleModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";
  editingSale = null;
}

async function onSaveEditSale(e) {
  e.preventDefault();

  if (!editingSale) return;

  const btnSave = document.querySelector('button[type="submit"][form="editSaleForm"]');

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    btnSave.style.opacity = "0.6";
  }

  try {
    const product = (document.getElementById("editSaleProduct")?.value || "").trim();
    const qtyRaw = String(document.getElementById("editSaleQuantity")?.value || "");
    const qtyStr = qtyRaw.replace(/[^0-9]/g, "").slice(0, 10);
    const qty = parseInt(qtyStr, 10);

    const amountRaw = String(document.getElementById("editSaleAmount")?.value || "").trim();
    const amount = amountRaw === "" ? undefined : parseFloat(amountRaw);
    const notes = document.getElementById("editSaleNotes")?.value || "";

    if (!product) {
      await Swal.fire("Error", "El nombre del producto es obligatorio.", "error");
      return;
    }

    if (product.length > 40) {
      await Swal.fire("Error", "El nombre del producto no puede superar 40 caracteres.", "error");
      return;
    }

    if (Number.isNaN(qty) || qty < 1) {
      await Swal.fire("Error", "La cantidad debe ser 1 o más.", "error");
      return;
    }

    if (amountRaw !== "" && (Number.isNaN(amount) || amount < 0)) {
      await Swal.fire("Error", "El monto total debe ser un número >= 0.", "error");
      return;
    }

    if (notes.length > 300) {
      await Swal.fire("Error", "Las notas no pueden superar 300 caracteres.", "error");
      return;
    }

    const patientId = editingSale.patientId ?? editingSale.patient?.id;
    let date = editingSale.date || null;
    if (date && String(date).includes("T")) date = String(date).split("T")[0];

    const payload = {
      patientId: patientId ? parseInt(patientId, 10) : undefined,
      product,
      date,
      quantity: qty,
      amount,
      status: editingSale.status || "Pagado",
      method: editingSale.method || "No especificado",
      notes: notes.trim() ? notes : null,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const saved = await api.updateSale(editingSale.id, payload);

    const merged = { ...editingSale, ...(saved || {}) };
    if (!merged.patient && editingSale.patient) merged.patient = editingSale.patient;

    const i = allSales.findIndex((x) => String(x.id) === String(editingSale.id));
    if (i !== -1) allSales[i] = merged;

    applyFilters();
    closeEditSaleModal();

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Venta actualizada correctamente",
      timer: 1600,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    await Swal.fire("Error", err.message || "No se pudo actualizar la venta", "error");
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
      btnSave.style.opacity = "1";
    }
  }
}

/* ======================
   View modal + image
====================== */

function showModalLoading(modalId, message = "Cargando detalle...") {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const box = modal.querySelector(".modal-box");
  if (!box) return;

  box.innerHTML = modalLoadingTemplate(message);

  modal.classList.add("active");
  modal.style.display = "flex";
}

function isValidPhotoSrc(v) {
  if (!v) return false;
  const s = String(v);
  if (s === "null" || s === "undefined") return false;

  // soporta dataURL o url normal
  if (s.startsWith("data:image/")) return true;
  if (s.startsWith("http://") || s.startsWith("https://")) return true;

  // fallback por si viene raro pero largo
  return s.length > 50;
}

function setPhotoSlot(imgEl, emptyEl, src) {
  if (!imgEl || !emptyEl) return;

  if (isValidPhotoSrc(src)) {
    imgEl.src = src;
    imgEl.style.display = "block";
    emptyEl.style.display = "none";
  } else {
    imgEl.src = "";
    imgEl.style.display = "none";
    emptyEl.style.display = "grid";
  }
}

function setEditPhotoLoading(imgEl, wrapEl) {
  if (!imgEl || !wrapEl) return;

  imgEl.src = "";
  imgEl.style.display = "none";
  wrapEl.classList.remove("is-empty");
  wrapEl.classList.add("is-loading");
}

function setEditPhotoEmpty(imgEl, wrapEl) {
  if (!imgEl || !wrapEl) return;

  imgEl.src = "";
  imgEl.style.display = "none";
  wrapEl.classList.remove("is-loading");
  wrapEl.classList.add("is-empty");
}

function setEditPhotoPreview(imgEl, wrapEl, src) {
  if (!imgEl || !wrapEl) return;

  if (isValidPhotoSrc(src)) {
    imgEl.src = src;
    imgEl.style.display = "block";
    wrapEl.classList.remove("is-loading", "is-empty");
  } else {
    setEditPhotoEmpty(imgEl, wrapEl);
  }
}

async function openViewModal(treatment) {
  if (!treatment) return;

  const modal = document.getElementById("viewTreatmentModal");
  if (!modal) return;

  treatmentViewCache = { ...treatment, photos: [] };

  modal.classList.add("active");
  modal.style.display = "flex";

  const notesEl = document.getElementById("viewNotes");
  if (notesEl) {
    notesEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cargando...`;
  }

  renderViewTreatmentGalleryLoading();

  try {
    const pid = treatment.patientId ?? treatment.patient?.id;
    const cached = (patientsCache || []).find((x) => String(x.id) === String(pid));
    const p = { ...(cached || {}), ...(treatment.patient || {}) };

    document.getElementById("viewName").textContent = p.fullName || "Sin paciente";
    document.getElementById("viewPhone").textContent = p.phone || "—";
    document.getElementById("viewAddress").textContent = p.address || "—";

    document.getElementById("viewType").textContent = treatment.treatment || "—";

    const iso = treatment.date ? String(treatment.date).slice(0, 10) : "";
    const dateFormatted = iso ? iso.split("-").reverse().join("/") : "—";
    document.getElementById("viewDate").textContent = dateFormatted;

    const amountView = Number(treatment.amount ?? 0);
    document.getElementById("viewAmount").textContent = `$${amountView.toFixed(2)}`;

    document.getElementById("viewStatus").textContent = treatment.status || "—";
    document.getElementById("viewMethod").textContent = treatment.method || "—";
    document.getElementById("viewNotes").textContent = treatment.notes || "—";

    const photosPayload = await api.fetchTreatmentPhotos(treatment.id);
    if (photosPayload) {
      renderViewTreatmentGallery(photosPayload);

      treatmentViewCache = {
        ...treatment,
        ...photosPayload,
      };
    }
  } catch (err) {
    console.error(err);
  }
}

function closeViewModal() {
  const modal = document.getElementById("viewTreatmentModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";

  renderViewTreatmentGallery({ photos: [] });

  treatmentViewCache = null;
}

function openSaleViewModal(sale) {
  if (!sale) return;

  const modal = document.getElementById("viewSaleModal");
  if (!modal) return;

  modal.classList.add("active");
  modal.style.display = "flex";

  // Paciente
  document.getElementById("viewSaleName").textContent =
    sale.patient?.fullName || "Sin paciente";

  document.getElementById("viewSalePhone").textContent =
    sale.patient?.phone || "—";

  document.getElementById("viewSaleAddress").textContent =
    sale.patient?.address || "—";

  // Venta
  document.getElementById("viewSaleProduct").textContent =
    sale.product || "—";

  document.getElementById("viewSaleQuantity").textContent =
    sale.quantity || "—";

  document.getElementById("viewSaleAmount").textContent =
    `$${Number(sale.amount ?? 0).toFixed(2)}`;

  document.getElementById("viewSaleNotes").textContent =
    sale.notes || "—";
}

function closeSaleViewModal() {
  const modal = document.getElementById("viewSaleModal");
  if (!modal) return;
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
    const birthDateInputValue = document.getElementById("newBirthDate")?.value?.trim() || "";
    const birthDate = getDateInputISO("newBirthDate");
    const address = document.getElementById("newAddress").value.trim();
    const phone = document.getElementById("newPhone").value.trim();
    const profession = document.getElementById("newProfession").value.trim();

    if (!fullName) {
      Swal.fire({
        icon: "warning",
        title: "Campo incompleto",
        text: "El nombre es obligatorio.",
        confirmButtonColor: "#ffadad",
        background: "#fffdf9",
        color: "#333",
      });
      return;
    }

    if (birthDateInputValue && !birthDate) {
      Swal.fire({
        icon: "warning",
        title: "Fecha inválida",
        text: "Ingresá una fecha válida en formato dd/mm/aaaa.",
        confirmButtonColor: "#ffadad",
        background: "#fffdf9",
        color: "#333",
      });
      return;
    }

    const newPatient = {
      fullName,
      birthDate: birthDate || undefined,
      address,
      phone,
      profession,
    };

    Object.keys(newPatient).forEach((k) => {
      if (newPatient[k] === undefined) delete newPatient[k];
    });

  try {
    const patient = await api.createPatient(newPatient);

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

  // ✅ limpieza dura de fotos al cerrar
  const beforeInput = document.getElementById("beforePhoto");
  const afterInput = document.getElementById("afterPhoto");
  if (beforeInput) beforeInput.value = "";
  if (afterInput) afterInput.value = "";

  const bp = document.getElementById("beforePreview");
  const ap = document.getElementById("afterPreview");
  if (bp) { bp.src = ""; bp.style.display = "none"; }
  if (ap) { ap.src = ""; ap.style.display = "none"; }

  const beforeName = document.getElementById("beforeFileName");
  const afterName = document.getElementById("afterFileName");
  if (beforeName) beforeName.textContent = "Ningún archivo seleccionado";
  if (afterName) afterName.textContent = "Ningún archivo seleccionado";

  createTreatmentGallery = [];
  renderCreateTreatmentGallery();
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

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
}

function updateCreateGalleryCounter() {
  const counter = document.getElementById("treatmentGalleryCounter");
  if (!counter) return;
  counter.textContent = `${createTreatmentGallery.length}/${MAX_TREATMENT_PHOTOS} fotos`;
}

function renderCreateTreatmentGallery() {
  const list = document.getElementById("treatmentGalleryList");
  const empty = document.getElementById("treatmentGalleryEmpty");

  if (!list) return;

  if (!Array.isArray(createTreatmentGallery) || createTreatmentGallery.length === 0) {
    list.innerHTML = galleryEmptyTemplate("treatmentGalleryEmpty", "Todavía no agregaste fotos.");
    updateCreateGalleryCounter();
    return;
  }

  list.innerHTML = createTreatmentGallery.map(createGalleryCardTemplate).join("");

  updateCreateGalleryCounter();

  if (empty) empty.remove();
}

async function addFilesToCreateGallery(fileList) {
  const nextPhotos = await buildDraftGalleryPhotosFromFiles(
    fileList,
    createTreatmentGallery.length
  );

  createTreatmentGallery = reindexGalleryPhotos([
    ...createTreatmentGallery,
    ...nextPhotos,
  ]);

  renderCreateTreatmentGallery();
}

function removePhotoFromCreateGallery(index) {
  createTreatmentGallery = reindexGalleryPhotos(
    createTreatmentGallery.filter((_, i) => i !== index)
  );
  renderCreateTreatmentGallery();
}

function updateCreateGalleryPhotoLabel(index, label) {
  createTreatmentGallery = reindexGalleryPhotos(
    createTreatmentGallery.map((photo, i) =>
      i === index ? { ...photo, label } : photo
    )
  );
  renderCreateTreatmentGallery();
}

function updateEditGalleryCounter() {
  const counter = document.getElementById("editTreatmentGalleryCounter");
  if (!counter) return;
  counter.textContent = `${editTreatmentGallery.length}/${MAX_TREATMENT_PHOTOS} fotos`;
}

function renderEditTreatmentGalleryLoading() {
  const list = document.getElementById("editTreatmentGalleryList");
  const counter = document.getElementById("editTreatmentGalleryCounter");

  if (!list) return;

  list.innerHTML = galleryLoadingTemplate();

  if (counter) {
    counter.textContent = "Cargando...";
  }
}

function renderEditTreatmentGallery() {
  const list = document.getElementById("editTreatmentGalleryList");
  if (!list) return;

  if (!Array.isArray(editTreatmentGallery) || editTreatmentGallery.length === 0) {
    list.innerHTML = galleryEmptyTemplate("editTreatmentGalleryEmpty", "Todavía no hay fotos cargadas.");
    updateEditGalleryCounter();
    return;
  }

  list.innerHTML = editTreatmentGallery.map(editGalleryCardTemplate).join("");

  updateEditGalleryCounter();
}

function updateViewGalleryCounter(count = 0) {
  const counter = document.getElementById("viewTreatmentGalleryCounter");
  if (!counter) return;
  counter.textContent = `${count}/${MAX_TREATMENT_PHOTOS} fotos`;
}

function renderViewTreatmentGalleryLoading() {
  const list = document.getElementById("viewTreatmentGalleryList");
  const counter = document.getElementById("viewTreatmentGalleryCounter");

  if (!list) return;

  list.innerHTML = galleryLoadingTemplate();

  if (counter) {
    counter.textContent = "Cargando...";
  }
}

function renderViewTreatmentGallery(photosPayload = {}) {
  const list = document.getElementById("viewTreatmentGalleryList");
  if (!list) return;

  const galleryPhotos = buildGalleryPhotosFromApiResponse(photosPayload);

  if (!galleryPhotos.length) {
    list.innerHTML = galleryEmptyTemplate("viewTreatmentGalleryEmpty", "Sin fotos cargadas.");
    updateViewGalleryCounter(0);
    return;
  }

  list.innerHTML = galleryPhotos.map(viewGalleryCardTemplate).join("");

  updateViewGalleryCounter(galleryPhotos.length);
}

async function addFilesToEditGallery(fileList) {
  const nextPhotos = await buildDraftGalleryPhotosFromFiles(
    fileList,
    editTreatmentGallery.length
  );

  editTreatmentGallery = reindexGalleryPhotos([
    ...editTreatmentGallery,
    ...nextPhotos,
  ]);

  renderEditTreatmentGallery();
}

function removePhotoFromEditGallery(index) {
  editTreatmentGallery = reindexGalleryPhotos(
    editTreatmentGallery.filter((_, i) => i !== index)
  );
  renderEditTreatmentGallery();
}

function updateEditGalleryPhotoLabel(index, label) {
  editTreatmentGallery = reindexGalleryPhotos(
    editTreatmentGallery.map((photo, i) =>
      i === index ? { ...photo, label } : photo
    )
  );
  renderEditTreatmentGallery();
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

  const jsPDF = window?.jspdf?.jsPDF;
  if (!jsPDF) {
    Swal.fire("Falta librería", "No está cargado jsPDF en tu SPA.", "error");
    return;
  }
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
  doc.text(`${usuario} — Informe de Sesión`, 14, 20);

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
  const isoDate = t.date ? String(t.date).slice(0, 10) : "";
  const pdfDate = isoDate ? isoDate.split("-").reverse().join("/") : "—";
  doc.text(`Fecha: ${pdfDate}`, 14, tratamientoY + 7);
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

  const fileDate = t.date ? String(t.date).slice(0, 10) : "Fecha";
  const filename = `Informe_${(t.patient?.fullName || "Paciente").replace(/\s+/g, "_")}_${fileDate}.pdf`;
  doc.save(filename);
}

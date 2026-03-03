// ======================================
// 🌸 BEAUTYCARE PRO / MIGABINETE
// treatments.js — Versión completa con previsualización de imágenes
// ======================================
import { API_URL } from "./core/config.js";
import { authFetch } from "./core/authFetch.js";

let currentUser = null;

(async function loadCurrentUser() {
  try {
    const res = await authFetch(`${API_URL}/auth/me`);
    const user = await res.json();
    if (res.ok) currentUser = user;
  } catch (err) {
    console.warn("No se pudo cargar el usuario actual");
  }
})()

async function toBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

let allTreatments = [];
let beforePhotoData = "";
let afterPhotoData = "";
let isSavingTreatment = false;
let editingTreatment = null;
let treatmentViewCache = null;

// =========================
// 🌸 CARGA INICIAL
// =========================
window.addEventListener("load", () => {
    loadPatients();
    loadTreatments();

    // Inicializa Flatpickr (si existe)
    if (window.flatpickr) {
        flatpickr.localize(flatpickr.l10ns.es);

        // Formularios principales

// Filtro de fecha
          window.filterDateFP = flatpickr("#filterDate", {
              dateFormat: "Y-m-d",
              locale: "es",
              allowInput: false,
              altInput: true,
              altFormat: "d/m/Y",
              maxDate: "today"
          });

          // Fecha del formulario (registrar tratamiento)
          flatpickr("#date", {
              dateFormat: "Y-m-d",
              locale: "es",
              allowInput: false,
              altInput: true,
              altFormat: "d/m/Y",
              maxDate: "today"
          });

        
        // El campo de fecha de nacimiento (newBirthDate) DEBE poder seleccionar fechas pasadas, 
        // pero no futuras, así que también le aplicamos la restricción:
        flatpickr("input#newBirthDate", {
            dateFormat: "Y-m-d",
            locale: "es",
            allowInput: false,
            altInput: true,
            altFormat: "d/m/Y",
            // 🛑 AÑADIDO: Impide seleccionar fechas posteriores a hoy
            maxDate: "today", 
        });

    }

    // Delegación de eventos de botones dinámicos
    document.body.addEventListener("click", handleButtonClick);

    // Filtro
    document.getElementById("filterPatient").addEventListener("input", applyFilters);
    document.getElementById("filterDate").addEventListener("change", applyFilters);
    document.getElementById("filterStatus").addEventListener("change", applyFilters);
    document.getElementById("amount").addEventListener("input", function() {
    if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
        }
    });

    // Previsualización de fotos
    initImagePreviews();
});

document.getElementById("clearAllFilters").addEventListener("click", () => {

  document.getElementById("filterPatient").value = "";

  if (window.filterDateFP) {
    window.filterDateFP.clear();
  }

  document.getElementById("filterTypeInput").value = "";
  document.getElementById("filterTypeOptions").style.display = "none";
  document.getElementById("filterStatus").selectedIndex = 0;

  applyFilters();
});




// =========================
// 🧍 CARGAR PACIENTES
// =========================
async function loadPatients() {
  try {
    const res = await authFetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error("Error al obtener pacientes");

    const result = await res.json();
    const data = Array.isArray(result) ? result : result.patients || [];

    // ORDENAR A–Z
    data.sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Contenedores del buscador
    const list = document.getElementById("patientOptions");
    const hiddenId = document.getElementById("patientSelect");

    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = `<div>No hay pacientes registrados</div>`;
      return;
    }

    // Crear opciones
    data.forEach(p => {
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

    // Lista para validar nombre de paciente
    window.allowedPatients = data.map(p =>
      normalizeText(p.fullName)
    );

  } catch (err) {
    console.error("❌ Error al cargar pacientes:", err);
    document.getElementById("patientOptions").innerHTML =
      `<div>Error al cargar</div>`;
  }
}



// =========================
// 💆 CARGAR TRATAMIENTOS
// =========================
async function loadTreatments() {
  try {
    const res = await authFetch(`${API_URL}/appointments?offset=0&limit=50`);
    if (!res.ok) throw new Error("Error al obtener tratamientos");

    const data = await res.json();
    allTreatments = data;
    renderTreatments(data);
  } catch (err) {
    console.error("❌ Error al cargar tratamientos:", err);
  }
}

function normalizeText(text) {
  return text
    .normalize("NFD")                // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .toLowerCase();                  // pasa a minúsculas
}

const defaultDatePicker = {
    dateFormat: "Y-m-d",
    locale: "es",
    allowInput: false,
    altInput: true,
    altFormat: "d/m/Y",
    maxDate: "today"
};

function initSearchableSelect({ input, options, validator = null, allowed = null, onSelect = null }) {
    const $input = document.querySelector(input);
    const $options = document.querySelector(options);

    if (!$input || !$options) return;

    // Validación con lista permitida
    if (validator && allowed) {
        const $validator = document.querySelector(validator);
        $input.addEventListener("input", () => {
            const value = normalizeText($input.value);
            const exists = allowed.includes(value);

            if (!value.length) {
                $validator.className = "input-validator-icon";
            } else if (exists) {
                $validator.className = "input-validator-icon ok fa-solid fa-check-circle";
            } else {
                $validator.className = "input-validator-icon error fa-solid fa-circle-xmark";
            }
        });
    }

    // Mostrar menú
    $input.addEventListener("focus", () => {
        $options.style.display = "block";
    });

    // Filtrar mientras escribe
    $input.addEventListener("input", () => {
        const userValue = normalizeText($input.value);
        [...$options.children].forEach(opt => {
            const value = normalizeText(opt.textContent);
            opt.style.display = value.includes(userValue) ? "block" : "none";
        });
    });

    // Click en opción
    $options.addEventListener("click", (e) => {
        if (e.target.tagName === "DIV") {
            $input.value = e.target.textContent;
            $options.style.display = "none";
            if (onSelect) onSelect($input.value);
            $input.dispatchEvent(new Event("input"));
        }
    });

    // Cerrar si clickea afuera
    document.addEventListener("click", (e) => {
        if (!$input.contains(e.target) && !$options.contains(e.target)) {
            $options.style.display = "none";
        }
    });
}

initSearchableSelect({
    input: "#patientInput",
    options: "#patientOptions",
    validator: "#patientValidator",
    allowed: window.allowedPatients,
    onSelect: (value) => {
        const opt = [...document.querySelectorAll("#patientOptions div")]
            .find(d => d.textContent === value);

        if (opt) {
            document.getElementById("patientSelect").value = opt.dataset.id;
        }
    }
});

function loadImageFile(input, previewId, callback = null) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;

        // poner imagen en el preview si corresponde
        if (previewId) {
            const img = document.getElementById(previewId);
            if (img) img.src = dataUrl;
        }

        if (callback) callback(dataUrl);
    };
    reader.readAsDataURL(file);
}

function cleanImage(img) {
    if (!img) return null;
    if (img === "null" || img === "undefined") return null;
    if (img.length < 100) return null;
    return img;
}

const allowedTreatments = [
  "peeling quimico",
  "peeling enzimatico",
  "limpieza facial profunda",
  "limpieza facial express",
  "higiene facial profesional",
  "microdermoabrasion",
  "punta de diamante",
  "dermaplaning",
  "bb glow",
  "radiofrecuencia facial",
  "mascara hidratante",
  "mascara calmante",
  "tratamiento antiacne",
  "rejuvenecimiento facial",
  "tratamiento para manchas",
  "tratamiento despigmentante",
  "masajes descontracturantes",
  "masajes relajantes",
  "drenaje linfatico",
  "electrodos",
  "radiofrecuencia corporal",
  "cavitacion",
  "ultracavitacion",
  "velaslim",
  "presoterapia",
  "reduccion de medidas",
  "tratamiento anticelulitis",
  "tratamiento reafirmante",
  "tratamiento capilar nutritivo",
  "shock de keratina",
  "botox capilar",
  "reparacion del cabello",
  "depilacion cera",
  "depilacion roll-on",
  "depilacion definitiva (laser)"
].map(t => normalizeText(t));

// =========================
// 📋 RENDERIZAR TABLA
// =========================
function renderTreatments(treatments) {
  const tbody = document.getElementById("treatmentBody");
  if (!treatments.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay tratamientos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = treatments.map(t => `
    <tr>
      <td>${t.patient?.fullName || "Sin paciente"}</td>
      <td>${new Date(t.date).toLocaleDateString("es-AR")}</td>
      <td>${t.treatment || "-"}</td>
      <td>$${t.amount?.toFixed(2) || "-"}</td>
      <td><span class="${t.status === "Pagado" ? "status-paid" : "status-pending"}">${t.status || "-"}</span></td>
      <td>${t.method || "-"}</td>
      <td class="actions">
        <button class="btn-view" data-id="${t.id}" title="Ver"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-edit" data-id="${t.id}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn-delete" data-id="${t.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");
}

initSearchableSelect({
    input: "#editTreatmentInput",
    options: "#editTreatmentOptions",
    validator: "#editValidator",
    allowed: allowedTreatments
});

initSearchableSelect({
    input: "#treatmentInput",
    options: "#treatmentOptions",
    validator: "#treatmentValidator",
    allowed: allowedTreatments
});

initSearchableSelect({
    input: "#filterTypeInput",
    options: "#filterTypeOptions",
    onSelect: () => applyFilters()
});


// adaptar el filtro existente
function applyFilters() {
  const patientFilter = document.getElementById("filterPatient").value.toLowerCase();
  const dateFilter = document.getElementById("filterDate").value;
  const typeFilter = document.getElementById("filterTypeInput").value.toLowerCase();
  const statusFilter = document.getElementById("filterStatus").value;

  const filtered = allTreatments.filter(t => {
    const matchesPatient = !patientFilter || (t.patient?.fullName?.toLowerCase().includes(patientFilter));
    const matchesDate = !dateFilter || (t.date && new Date(t.date).toISOString().slice(0, 10) === dateFilter);
    const matchesType = !typeFilter || (t.treatment?.toLowerCase().includes(typeFilter));
    const matchesStatus = !statusFilter || (t.status === statusFilter);
    return matchesPatient && matchesDate && matchesType && matchesStatus;
  });

  renderTreatments(filtered);
}


// =========================
// 🗑️ ELIMINAR TRATAMIENTO
// =========================
async function deleteTreatment(id) {
  const confirm = await Swal.fire({
    title: "¿Eliminar tratamiento?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
    cancelButtonColor: "#d1d1d1"
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await authFetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("No se pudo eliminar");

    allTreatments = allTreatments.filter(t => t.id !== id);
    renderTreatments(allTreatments);

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Tratamiento eliminado correctamente",
      timer: 1800,
      showConfirmButton: false
    });

    // ✅ Espera que se muestre el mensaje y luego recarga la página
    setTimeout(() => {
      window.location.reload();
    }, 1900);

  } catch (err) {
    Swal.fire("Error", "No se pudo eliminar el tratamiento", "error");
  }
}


// =========================
// 💾 NUEVO TRATAMIENTO
// =========================
document.getElementById("treatmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btnSave = document.querySelector(".btn-save-treatment");

  // Evitar doble click
  if (isSavingTreatment) return;

  // Bloquear botón
  isSavingTreatment = true;
  btnSave.disabled = true;
  btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
  btnSave.style.opacity = "0.6";

  

  const newTreatment = {
    patientId: parseInt(document.getElementById("patientSelect").value),
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

  // VALIDACIÓN PACIENTE
    const patientName = normalizeText(document.getElementById("patientInput").value);

    if (!window.allowedPatients.includes(patientName)) {
      Swal.fire({
        icon: "error",
        title: "Paciente no encontrado",
        text: "Debés seleccionar un paciente existente de la lista."
      });

      document.getElementById("patientInput").value = "";
      document.getElementById("patientSelect").value = "";

      isSavingTreatment = false;
      btnSave.disabled = false;
      btnSave.innerHTML = "Guardar";
      btnSave.style.opacity = "1";

      return;
    }

    // VALIDACIÓN TRATAMIENTO
  const value = normalizeText(document.getElementById("treatmentInput").value);

  if (!allowedTreatments.includes(value)) {

    e.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Tratamiento inválido",
      text: "Debés seleccionar un tratamiento de la lista.",
    });

    document.getElementById("treatmentInput").value = "";

    return;
  }

  try {
    const res = await authFetch(`${API_URL}/appointments`, {
      method: "POST",
      body: JSON.stringify(newTreatment)
    });
    
    if (!res.ok) throw new Error("Error al registrar");
    const saved = await res.json();

    allTreatments.unshift(saved);
    renderTreatments(allTreatments);

    Swal.fire({ icon: "success", title: "Guardado", text: "Tratamiento registrado correctamente", timer: 1800, showConfirmButton: false });
    cancelTreatmentForm();

    // ============================
    // 🔄 LIMPIAR FORMULARIO
    // ============================

    // Campos de paciente
    document.getElementById("patientInput").value = "";
    document.getElementById("patientSelect").value = "";

    // Tratamiento
    document.getElementById("treatmentInput").value = "";

    // Fecha y hora
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";

    // Pago
    document.getElementById("paymentStatus").selectedIndex = 0;
    document.getElementById("paymentMethod").selectedIndex = 0;

    // Monto y notas
    document.getElementById("amount").value = "";
    document.getElementById("notes").value = "";

    // Fotos (variables)
    beforePhotoData = "";
    afterPhotoData = "";

    // Reset nombre archivos
    document.getElementById("beforeFileName").textContent = "Ningún archivo seleccionado";
    document.getElementById("afterFileName").textContent = "Ningún archivo seleccionado";

    // Reset PREVIEWS
    const bp = document.getElementById("beforePreview");
    const ap = document.getElementById("afterPreview");
    if (bp) { bp.src = ""; bp.style.display = "none"; }
    if (ap) { ap.src = ""; ap.style.display = "none"; }

  } catch {
      Swal.fire("Error", "No se pudo guardar el tratamiento", "error");

    } finally {
      // 🔓 Reactivar botón
      isSavingTreatment = false;
      const btnSave = document.querySelector(".btn-save-treatment");
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerHTML = "Guardar";
        btnSave.style.opacity = "1";
      }
    }
});

function initImagePreviews() {
  const beforeInput = document.getElementById("beforePhoto");
  const afterInput = document.getElementById("afterPhoto");

  beforeInput?.addEventListener("change", () => {
    loadImageFile(beforeInput, "beforePreview", img => {
      beforePhotoData = img;
      document.getElementById("beforePreview").style.display = "block";
    });
  });

  afterInput?.addEventListener("change", () => {
    loadImageFile(afterInput, "afterPreview", img => {
      afterPhotoData = img;
      document.getElementById("afterPreview").style.display = "block";
    });
  });
}


// 🩷 Abrir imagen en vista ampliada
// =========================
// 🖼️ MODAL DE IMAGEN AMPLIADA (funcional en Ver y Editar)
// =========================
window.openImagePreview = function (src) {
  const modal = document.getElementById("imagePreviewModal");
  const img = document.getElementById("previewImage");

  if (!src || src.includes("placeholder")) return;

  img.src = src;
  modal.style.display = "flex";
  modal.classList.add("active");

  // efecto de zoom
  img.style.transform = "scale(0.9)";
  setTimeout(() => { img.style.transform = "scale(1)"; }, 50);

  // cerrar al hacer clic fuera
  modal.onclick = (e) => {
    if (e.target === modal) closeImagePreview();
  };
};

window.closeImagePreview = function () {
  const modal = document.getElementById("imagePreviewModal");
  const img = document.getElementById("previewImage");

  img.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("active");
    img.src = "";
  }, 200);
};


// =========================
// ✏️ EDITAR TRATAMIENTO (completa y funcional con imágenes)
// =========================
function openEditModal(treatment) {
  editingTreatment = treatment;
  const modal = document.getElementById("editTreatmentModal");
  modal.classList.add("active");
  modal.style.display = "flex";

  document.getElementById("editTreatmentInput").value = treatment.treatment || "";

  // ⬇️ PONER ESTA PARTE ACÁ ⬇️
let rawDate = treatment.date;

// Quita la hora si viene con T
if (rawDate.includes("T")) {
    rawDate = rawDate.split("T")[0];
}

document.getElementById("editTreatmentDate").value = rawDate;

  // ⬆️ FIN CÓDIGO DE FECHA ⬆️

  document.getElementById("editTreatmentTime").value = treatment.time || "";
  document.getElementById("editTreatmentAmount").value = treatment.amount || "";
  document.getElementById("editTreatmentStatus").value = treatment.status || "";
  document.getElementById("editTreatmentMethod").value = treatment.method || "";
  document.getElementById("editTreatmentNotes").value = treatment.notes || "";

  // ============================
// 🔥 CARGA DIFERIDA DE FOTOS
// ============================
const beforeImg = document.getElementById("editBeforePreview");
const afterImg = document.getElementById("editAfterPreview");

beforeImg.src = "";
afterImg.src = "";

(async () => {
  try {
    const resp = await authFetch(`${API_URL}/appointments/${treatment.id}/photos`);

    if (!resp.ok) return;

    const photos = await resp.json();

    if (photos.beforePhoto) {
      beforeImg.src = photos.beforePhoto;
      editingTreatment.beforePhoto = photos.beforePhoto;
    }

    if (photos.afterPhoto) {
      afterImg.src = photos.afterPhoto;
      editingTreatment.afterPhoto = photos.afterPhoto;
    }
  } catch (err) {
    console.warn("No se pudieron cargar fotos");
  }
})();

// ============================
// 📸 CARGAR NUEVAS FOTOS (si el usuario cambia las imágenes)
// ============================
document.getElementById("editBeforePhoto")?.addEventListener("change", () =>
  loadImageFile(
    document.getElementById("editBeforePhoto"),
    "editBeforePreview",
    img => editingTreatment.beforePhoto = img
  )
);

document.getElementById("editAfterPhoto")?.addEventListener("change", () =>
  loadImageFile(
    document.getElementById("editAfterPhoto"),
    "editAfterPreview",
    img => editingTreatment.afterPhoto = img
  )
);


flatpickr("#editTreatmentDate", defaultDatePicker);

}

function closeEditModal() {
  const modal = document.getElementById("editTreatmentModal");
  modal.classList.remove("active");
  modal.style.display = "none";
}

// =========================
// 💾 GUARDAR CAMBIOS AL EDITAR TRATAMIENTO
// =========================
document.getElementById("editTreatmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
    // VALIDACIÓN TRATAMIENTO EDITAR
  const editValue = normalizeText(document.getElementById("editTreatmentInput").value);

  if (!allowedTreatments.includes(editValue)) {
    Swal.fire({
      icon: "error",
      title: "Tratamiento inválido",
      text: "Debés seleccionar un tratamiento de la lista.",
    });

    document.getElementById("editTreatmentInput").value = "";

    return;
  }

  if (!editingTreatment) return;

  // Leer los campos del formulario
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

  // Leer las imágenes si se cambiaron
  const beforeFile = document.getElementById("editBeforePhoto").files[0];
  const afterFile = document.getElementById("editAfterPhoto").files[0];

  if (beforeFile) {
    const reader = new FileReader();
    reader.onload = e => updated.beforePhoto = e.target.result;
    await new Promise(res => { reader.onloadend = res; reader.readAsDataURL(beforeFile); });
  }

  if (afterFile) {
    const reader = new FileReader();
    reader.onload = e => updated.afterPhoto = e.target.result;
    await new Promise(res => { reader.onloadend = res; reader.readAsDataURL(afterFile); });
  }

  // Normalizar imágenes inválidas
if (!updated.beforePhoto || updated.beforePhoto === "null") updated.beforePhoto = null;
if (!updated.afterPhoto || updated.afterPhoto === "null") updated.afterPhoto = null;

  try {
    // DEBUG: mostrar exactamente lo que estás enviando al backend
    console.log("🔍 DATA ENVIADA A /appointments PUT:", updated);

    // LIMPIEZA DE IMÁGENES
    if (!updated.beforePhoto || updated.beforePhoto === "null" || updated.beforePhoto === "undefined") {
        updated.beforePhoto = null;
    }
    if (!updated.afterPhoto || updated.afterPhoto === "null" || updated.afterPhoto === "undefined") {
        updated.afterPhoto = null;
    }
    if (updated.beforePhoto && updated.beforePhoto.length < 100) {
        updated.beforePhoto = null;
    }
    const res = await authFetch(`${API_URL}/appointments/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error();
    const saved = await res.json();

    // 🔄 Actualiza la lista local con las nuevas imágenes
    const i = allTreatments.findIndex(t => t.id === updated.id);
    if (i !== -1) allTreatments[i] = saved;

    // 🔄 Refresca la tabla y cierra modal
    renderTreatments(allTreatments);
    closeEditModal();

    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Cambios aplicados correctamente",
      timer: 1800,
      showConfirmButton: false
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo actualizar el tratamiento", "error");
  }
});


// =========================
// 👁️ VER DETALLES — optimizado con carga diferida de fotos
// =========================
async function openViewModal(treatment) {
  if (!treatment) return;

  treatmentViewCache = treatment;
  const modal = document.getElementById("viewTreatmentModal");

  // 🔥 ABRIR INMEDIATAMENTE
  modal.classList.add("active");
  modal.style.display = "flex";

  // Mostrar loading visual temporal en notas
  document.getElementById("viewNotes").innerHTML =
    `<i class="fa-solid fa-spinner fa-spin"></i> Cargando...`;

  // Limpiar imágenes mientras carga
  const beforeImg = document.getElementById("viewBeforePhoto");
  const afterImg = document.getElementById("viewAfterPhoto");

  beforeImg.style.display = "none";
  afterImg.style.display = "none";

  // Datos básicos inmediatos
  const dateFormatted = treatment.date
    ? new Date(treatment.date).toLocaleDateString("es-AR")
    : "—";

  document.getElementById("viewName").textContent =
    treatment.patient?.fullName || "Sin paciente";
  document.getElementById("viewPhone").textContent =
    treatment.patient?.phone || "—";
  document.getElementById("viewAddress").textContent =
    treatment.patient?.address || "—";

  document.getElementById("viewType").textContent =
    treatment.treatment || "—";
  document.getElementById("viewDate").textContent = dateFormatted;
  document.getElementById("viewAmount").textContent =
    `$${treatment.amount?.toFixed(2) || "—"}`;
  document.getElementById("viewStatus").textContent =
    treatment.status || "—";
  document.getElementById("viewMethod").textContent =
    treatment.method || "—";
  document.getElementById("viewNotes").textContent =
    treatment.notes || "—";

  // 🔥 CARGA ASÍNCRONA DE FOTOS (no bloquea apertura)
  try {
    const resp = await authFetch(
      `${API_URL}/appointments/${treatment.id}/photos`
    );

    if (resp.ok) {
      const photos = await resp.json();

      if (photos.beforePhoto) {
        beforeImg.src = photos.beforePhoto;
        beforeImg.style.display = "block";
        beforeImg.onclick = () =>
          openImagePreview(photos.beforePhoto);

        treatmentViewCache.beforePhoto = photos.beforePhoto;
      }

      if (photos.afterPhoto) {
        afterImg.src = photos.afterPhoto;
        afterImg.style.display = "block";
        afterImg.onclick = () =>
          openImagePreview(photos.afterPhoto);

        treatmentViewCache.afterPhoto = photos.afterPhoto;
      }
    }
  } catch (error) {
    console.warn("No se pudieron cargar las fotos:", error);
  }
}

function closeViewModal() {
  const modal = document.getElementById("viewTreatmentModal");
  modal.classList.remove("active");
  modal.style.display = "none";
}

// =========================
// 🔄 EVENTOS DE BOTONES
// =========================
function handleButtonClick(e) {
  const btn = e.target.closest("button");
  if (!btn || !btn.dataset.id) return;
  const id = btn.dataset.id;
  const treatment = allTreatments.find(t => t.id == id);
  if (!treatment) return;

  if (btn.classList.contains("btn-view")) openViewModal(treatment);
  if (btn.classList.contains("btn-edit")) openEditModal(treatment);
  if (btn.classList.contains("btn-delete")) deleteTreatment(id);
}

// =========================
// 🌸 FUNCIONES DE FORMULARIO
// =========================
function cancelTreatmentForm() {
  document.getElementById("treatmentForm").style.display = "none";
  document.getElementById("registerOptions").style.display = "block";
}

window.openNewPatientModal = function () {
  document.getElementById("newPatientModal").classList.add("active");
};

window.closeNewPatientModal = function () {
  document.getElementById("newPatientModal").classList.remove("active");
};

// Cerrar imagen con el botón flotante
document.getElementById("closeImageBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  closeImagePreview();
});

// Cerrar con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeImagePreview();
});


// =========================
// 👩‍⚕️ CONFIRMAR NUEVO PACIENTE (versión corregida)
// =========================
async function confirmNewPatient() {
  const fullName = document.getElementById("newFullName").value.trim();
  const birthDate = document.getElementById("newBirthDate").value;
  const address = document.getElementById("newAddress").value.trim();
  const phone = document.getElementById("newPhone").value.trim();
  const profession = document.getElementById("newProfession").value.trim();

  // ⚠️ Validación básica
  if (!fullName || !birthDate) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "El nombre y la fecha de nacimiento son obligatorios.",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#333"
    });
    return;
  }

  const newPatient = { fullName, birthDate, address, phone, profession };

  try {
    const res = await authFetch(`${API_URL}/patients`, {
      method: "POST",
      body: JSON.stringify(newPatient)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Error al registrar el paciente");
    }

    const patient = await res.json();

    Swal.fire({
      icon: "success",
      title: "Paciente agregado",
      text: "El paciente se registró correctamente.",
      timer: 1500,
      showConfirmButton: false,
      background: "#fffdf9",
      color: "#333",
    });

    // Cierra modal y vuelve al formulario principal
    closeNewPatientModal();
    document.getElementById("registerOptions").style.display = "none";
    document.getElementById("treatmentForm").style.display = "block";

    // 🔄 Refrescar lista de pacientes
    await loadPatients();

    // ✅ Seleccionar automáticamente el nuevo paciente
    const select = document.getElementById("patientSelect");
    if (select && patient.id) select.value = patient.id;

  } catch (err) {
    console.error("❌ Error al crear paciente:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo registrar el paciente.",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#333"
    });
  }
}


// =========================
// 📄 DESCARGAR PDF PROFESIONAL (rosa grisáceo elegante)
// =========================
async function downloadTreatmentPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const t = treatmentViewCache;

  if (!t) {
    Swal.fire("Atención", "No hay tratamiento seleccionado", "warning");
    return;
  }

  // ==== 🎨 Paleta sobria ====
  const colorHeader = [204, 173, 173];        // 🌸 Rosa grisáceo elegante
  const colorBloque = [248, 246, 246];        // Fondo gris rosado claro
  const colorTexto = [50, 50, 50];            // Texto gris oscuro
  const colorLinea = [150, 140, 140];         // Separadores suaves gris topo
  doc.setFont("helvetica", "normal");

  // ==== 🧭 ENCABEZADO ====
  doc.setFillColor(...colorHeader);
  doc.rect(0, 0, 210, 30, "F"); // franja superior

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);

  const usuario = currentUser?.name || "TuGabinete";
  doc.text(`${usuario} — Informe de Tratamiento`, 14, 20);

  // 🖼️ Foto de perfil arriba a la derecha (20x20mm)
  if (currentUser?.profileImage) {
    try {
      const imgURL = currentUser.profileImage.startsWith("http")
        ? currentUser.profileImage
        : `${API_URL}${currentUser.profileImage}`;
      const base64Img = await toBase64(imgURL);

      const imgSize = 20;
      const x = 210 - imgSize - 10;
      const y = 5;
      doc.addImage(base64Img, "JPEG", x, y, imgSize, imgSize, undefined, "FAST");

      // borde blanco sutil
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.rect(x - 1, y - 1, imgSize + 2, imgSize + 2);
    } catch (err) {
      console.warn("⚠️ No se pudo agregar la imagen de perfil", err);
    }
  }

  // ==== 👩‍⚕️ DATOS DEL PACIENTE ====
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

  // ==== 💆 DETALLES DEL TRATAMIENTO ====
  doc.text("Detalles del Tratamiento", 14, startY + 28);
  doc.line(14, startY + 30, 80, startY + 30);

  const tratamientoY = startY + 37;
  doc.text(`Tratamiento: ${t.treatment || "—"}`, 14, tratamientoY);
  doc.text(`Fecha: ${new Date(t.date).toLocaleDateString("es-AR")}`, 14, tratamientoY + 7);
  doc.text(`Hora: ${t.time || "—"}`, 14, tratamientoY + 14);
  doc.text(`Monto: $${t.amount?.toFixed(2) || "—"}`, 14, tratamientoY + 21);
  doc.text(`Estado del pago: ${t.status || "—"}`, 14, tratamientoY + 28);
  doc.text(`Método de pago: ${t.method || "—"}`, 14, tratamientoY + 35);

  // ==== 📝 NOTAS ====
  const notesY = tratamientoY + 47;
  doc.setFillColor(...colorBloque);
  doc.roundedRect(14, notesY - 6, 182, 30, 3, 3, "F");
  doc.setTextColor(...colorTexto);
  doc.text("Notas / Observaciones:", 18, notesY);
  doc.setFontSize(10);
  doc.text(t.notes || "—", 18, notesY + 8, { maxWidth: 175, lineHeightFactor: 1.4 });

  // ==== 📸 REGISTRO FOTOGRÁFICO ====
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
      doc.addImage(t.beforePhoto, "JPEG", 14, yStartImg, imgWidth, imgHeight, undefined, "FAST");
      doc.setFontSize(10);
      doc.text("Antes", 14, yStartImg + imgHeight + 6);
    } catch (e) {
      console.warn("No se pudo agregar la imagen 'antes'");
    }
  }

  if (t.afterPhoto) {
    try {
      doc.addImage(t.afterPhoto, "JPEG", 110, yStartImg, imgWidth, imgHeight, undefined, "FAST");
      doc.setFontSize(10);
      doc.text("Después", 110, yStartImg + imgHeight + 6);
    } catch (e) {
      console.warn("No se pudo agregar la imagen 'después'");
    }
  }

  // ==== ✍️ FIRMA ====
  doc.setFontSize(11);
  doc.setTextColor(...colorTexto);
  doc.text(`Firma profesional:`, 85, 287);

  // ==== 💾 GUARDAR ====
  const filename = `Informe_${t.patient?.fullName?.replace(/\s+/g, "_") || "Paciente"}_${new Date(t.date).toLocaleDateString("es-AR")}.pdf`;
  doc.save(filename);
}

// =====================================
// 🌸 EXPONER FUNCIONES AL GLOBAL (HTML)
// =====================================

window.cancelTreatmentForm = cancelTreatmentForm;
window.showExistingPatientForm = () => {
  document.getElementById("registerOptions").style.display = "none";
  document.getElementById("treatmentForm").style.display = "block";
  loadPatients();
};
window.openNewPatientModal = () => document.getElementById("newPatientModal").classList.add("active");
window.closeNewPatientModal = () => document.getElementById("newPatientModal").classList.remove("active");
window.confirmNewPatient = confirmNewPatient;
window.closeEditModal = closeEditModal;
window.closeViewModal = closeViewModal;
window.downloadTreatmentPDF = downloadTreatmentPDF;

// =========================
// 📎 NOMBRE DE ARCHIVO SELECCIONADO (estilo prolijo)
// =========================
const beforeInput = document.getElementById("beforePhoto");
const afterInput = document.getElementById("afterPhoto");
const beforeName = document.getElementById("beforeFileName");
const afterName = document.getElementById("afterFileName");

beforeInput.addEventListener("change", () => {
  beforeName.textContent = beforeInput.files.length
    ? beforeInput.files[0].name
    : "Ningún archivo seleccionado";
});

afterInput.addEventListener("change", () => {
  afterName.textContent = afterInput.files.length
    ? afterInput.files[0].name
    : "Ningún archivo seleccionado";
});


const timeInput = document.getElementById("time");
if (timeInput) {
  timeInput.addEventListener("click", () => {
    timeInput.showPicker?.(); // Método moderno (Chrome, Edge)
  });
}


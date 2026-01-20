// ======================================================
// patient-details.js — versión PRO con config + authFetch
// ======================================================

import { API_URL } from "./core/config.js";
import { authFetch } from "./core/authFetch.js";

let currentPatient = null;

// Obtener ID desde la URL (?id=6)
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// ======================================================
// 🚀 INIT
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  if (!patientId) {
    Swal.fire({
      icon: "error",
      title: "Paciente no encontrado",
      text: "Volviendo a la lista de pacientes...",
      confirmButtonColor: "#ffadad",
    }).then(() => {
      window.location.href = "../dashboard/patients.html";
    });
    return;
  }

  loadPatientDetails();
});

// ======================================================
// 📥 CARGAR DATOS COMPLETOS DEL PACIENTE
// ======================================================
async function loadPatientDetails() {
  try {
    const res = await authFetch(`${API_URL}/patients/${patientId}`);
    if (!res.ok) throw new Error("Error al obtener paciente");

    const data = await res.json();
    currentPatient = data;

    // ======================
    // 🧍 DATOS PERSONALES
    // ======================
    document.getElementById("fullName").textContent = data.fullName || "—";
    document.getElementById("age").textContent = data.age ?? "—";
    document.getElementById("phone").textContent = data.phone || "—";
    document.getElementById("address").textContent = data.address || "—";
    document.getElementById("profession").textContent = data.profession || "—";

    // ======================
    // 📝 ENTREVISTA
    // ======================
    const interviewDiv = document.getElementById("interviewContent");

    if (data.interview) {
      const i = data.interview;

      interviewDiv.innerHTML = `
        <p><strong>Tipo de piel:</strong> ${i.skinType || "—"}</p>
        <p><strong>Preocupaciones:</strong> ${
          Array.isArray(i.concerns) ? i.concerns.join(", ") : "—"
        }</p>
        <p><strong>Rutina:</strong> ${i.routineFrequency || "—"}</p>
      `;
    } else {
      interviewDiv.innerHTML = `<p class="muted">Sin entrevista registrada.</p>`;
    }

    // ======================
    // 💆 HISTORIAL
    // ======================
    renderTreatmentsTable(data.appointments || []);

  } catch (err) {
    console.error("❌ Error al cargar paciente:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cargar la ficha del paciente.",
      confirmButtonColor: "#ffadad",
    });
  }
}

// ======================================================
// 📋 TABLA DE TRATAMIENTOS
// ======================================================
function renderTreatmentsTable(appointments) {
  const tbody = document.querySelector("#treatmentsTable tbody");
  tbody.innerHTML = "";

  if (!appointments.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="muted" style="text-align:center;">
          No hay tratamientos registrados
        </td>
      </tr>`;
    return;
  }

  appointments.forEach(t => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${new Date(t.date).toLocaleDateString("es-AR")}</td>
      <td>${t.treatment}</td>
      <td>${t.amount ? "$" + t.amount.toFixed(2) : "—"}</td>
      <td>${t.notes || "—"}</td>

      <td class="actions" style="display:flex; justify-content:center; gap:8px;">
        <button class="btn-view" onclick="openViewModal(${t.id})">
          <i class="fa-solid fa-eye"></i>
        </button>

        <button class="btn-edit" onclick="openEditModal(${t.id})">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <button class="btn-delete" onclick="deleteTreatment(${t.id})">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// ======================================================
// ✏️ MODAL EDITAR TRATAMIENTO
// ======================================================
let editingTreatment = null;

async function openEditModal(treatmentId) {
  const t = currentPatient.appointments.find(a => a.id == treatmentId);
  if (!t) return;

  editingTreatment = t;

  document.getElementById("editTreatmentInput").value = t.treatment || "";
  document.getElementById("editTreatmentDate").value = t.date?.split("T")[0] || "";
  document.getElementById("editTreatmentTime").value = t.time || "";
  document.getElementById("editTreatmentAmount").value = t.amount || "";
  document.getElementById("editTreatmentStatus").value = t.status || "";
  document.getElementById("editTreatmentMethod").value = t.method || "";
  document.getElementById("editTreatmentNotes").value = t.notes || "";

  // Fotos
  document.getElementById("editBeforePreview").src = t.beforePhoto || "";
  document.getElementById("editAfterPreview").src = t.afterPhoto || "";

  document.getElementById("editTreatmentModal").classList.add("active");
}

window.closeEditModal = function () {
  document.getElementById("editTreatmentModal").classList.remove("active");
};

// ======================================================
// 💾 GUARDAR EDICIÓN
// ======================================================
document.getElementById("editTreatmentForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!editingTreatment) return;

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

  // IMÁGENES (si cambian)
  const beforeFile = document.getElementById("editBeforePhoto").files[0];
  const afterFile = document.getElementById("editAfterPhoto").files[0];

  if (beforeFile) {
    updated.beforePhoto = await fileToBase64(beforeFile);
  }
  if (afterFile) {
    updated.afterPhoto = await fileToBase64(afterFile);
  }

  try {
    const res = await authFetch(`${API_URL}/appointments/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
    });

    if (!res.ok) throw new Error();

    Swal.fire({
      icon: "success",
      title: "Actualizado",
      text: "Tratamiento modificado correctamente",
      timer: 1500,
      showConfirmButton: false
    });

    closeEditModal();
    loadPatientDetails();

  } catch (err) {
    Swal.fire("Error", "No se pudo guardar el tratamiento", "error");
  }
});

// HELPERS
function fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// ======================================================
// 👁️ MODAL VER TRATAMIENTO
// ======================================================
window.openViewModal = function (treatmentId) {
  const t = currentPatient.appointments.find(a => a.id == treatmentId);
  if (!t) return;

  document.getElementById("viewContent").innerHTML = `
    <p><strong>Fecha:</strong> ${new Date(t.date).toLocaleDateString("es-AR")}</p>
    <p><strong>Tratamiento:</strong> ${t.treatment}</p>
    <p><strong>Monto:</strong> ${t.amount ? "$" + t.amount : "—"}</p>
    <p><strong>Estado:</strong> ${t.status || "—"}</p>
    <p><strong>Método:</strong> ${t.method || "—"}</p>
    <p><strong>Notas:</strong> ${t.notes || "—"}</p>
  `;

  document.getElementById("viewBeforePhoto").src = t.beforePhoto || "";
  document.getElementById("viewAfterPhoto").src = t.afterPhoto || "";

  document.getElementById("viewTreatmentModal").classList.add("active");
};

window.closeViewModal = function () {
  document.getElementById("viewTreatmentModal").classList.remove("active");
};

// ======================================================
// 🗑️ ELIMINAR TRATAMIENTO
// ======================================================
async function deleteTreatment(id) {
  const confirmDelete = await Swal.fire({
    title: "¿Eliminar tratamiento?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
  });

  if (!confirmDelete.isConfirmed) return;

  try {
    const res = await authFetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error();

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Tratamiento eliminado correctamente",
      timer: 1500,
      showConfirmButton: false
    });

    loadPatientDetails();

  } catch (err) {
    Swal.fire("Error", "No se pudo eliminar el tratamiento", "error");
  }
}

// ======================================================
// 🌸 PREVIEW DE IMÁGENES — ABRIR Y CERRAR
// ======================================================

function openImagePreview(src) {
  const modal = document.getElementById("imagePreviewModal");
  const img = document.getElementById("previewImage");

  img.src = src;
  modal.style.display = "flex";
}

function closeImagePreview() {
  const modal = document.getElementById("imagePreviewModal");
  modal.style.display = "none";
}

// 🌟 Exponer funciones al HTML (para onclick="")
window.openImagePreview = openImagePreview;
window.closeImagePreview = closeImagePreview;

window.openViewModal = openViewModal;

window.openEditModal = openEditModal;

window.deleteTreatment = deleteTreatment;


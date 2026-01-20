import * as api from "./patients.api.js";

let allPatients = [];

// Se llama desde views/patients.js cuando la vista YA está en el DOM
export async function initPatientsPage() {
  bindTopButtons();
  loadPatientsFast();
  await loadPatientsFromServer();
  setupEvents();
}

// ===== navegación SPA =====
function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ===== botones arriba =====
function bindTopButtons() {
    document.getElementById("back-btn")?.addEventListener("click", () => {
        history.pushState(null, "", "/dashboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
});

    document.getElementById("add-patient")?.addEventListener("click", () => {
        history.pushState(null, "", "/patients/new");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
}

// ===== cache =====
function compactPatients(list) {
  return list.map(p => ({
    id: p.id,
    fullName: p.fullName,
    phone: p.phone,
    age: p.age,
    lastTreatment: p.lastTreatment
  }));
}

function getCachedPatients() {
  try {
    const cached = localStorage.getItem("patients");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function savePatients(patients) {
  try {
    localStorage.setItem("patients", JSON.stringify(compactPatients(patients)));
  } catch {}
}

// ===== 1) instant =====
function loadPatientsFast() {
  const cached = getCachedPatients();
  if (cached && Array.isArray(cached)) {
    allPatients = cached;
    renderPatients(allPatients);
  }
}

// ===== 2) server =====
async function loadPatientsFromServer() {
  try {
    const res = await api.getPatients();     // Response
    if (!res.ok) throw new Error("Error obteniendo pacientes");

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];

    const compactServer = compactPatients(list);
    const compactLocal = compactPatients(allPatients);

    if (JSON.stringify(compactLocal) !== JSON.stringify(compactServer)) {
      allPatients = compactServer;
      renderPatients(allPatients);
      savePatients(allPatients);
    }
  } catch (err) {
    console.warn("⚠ No se pudo actualizar pacientes:", err);
  }
}

// ===== render =====
function renderPatients(list) {
  const tbody = document.querySelector("#patientsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:#999;">
          No hay pacientes registrados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td data-label="Nombre">${p.fullName || "-"}</td>
      <td data-label="Teléfono">${p.phone || "-"}</td>
      <td data-label="Edad">${p.age ?? "-"}</td>
      <td data-label="Último trat.">${p.lastTreatment ?? "-"}</td>
      <td class="actions" data-id="${p.id}">
        <button class="btn-view" title="Ver Ficha"><i class="fa-solid fa-clipboard-list"></i></button>
        <button class="btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-delete" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");
}

// ===== filtro =====
function normalize(text) {
  return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterPatients() {
  const input = normalize(document.getElementById("search")?.value);

  const filtered = allPatients.filter(p =>
    normalize(p.fullName).includes(input) ||
    normalize(p.phone).includes(input)
  );

  renderPatients(filtered);
}

// ===== eventos =====
function setupEvents() {
  document.getElementById("search")?.addEventListener("input", filterPatients);

  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest(".actions");
    if (!row) return;

    const id = row.dataset.id;
    const patient = allPatients.find(p => p.id == id);

    if (btn.classList.contains("btn-view")) return go(`/patients/${id}`);
    if (btn.classList.contains("btn-edit")) return go(`/patients/${id}/edit`);
    if (btn.classList.contains("btn-delete")) return confirmDelete(id, patient?.fullName);
  });
}

// ===== delete =====
async function confirmDelete(id, name) {
  const result = await Swal.fire({
    title: "¿Eliminar paciente?",
    text: `¿Deseás eliminar a "${name}" de tus pacientes?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
    cancelButtonColor: "#ccc",
  });

  if (result.isConfirmed) deletePatient(id);
}

async function deletePatient(id) {
  try {
    const res = await api.deletePatient(id); // Response
    if (!res.ok) throw new Error("No se pudo eliminar");

    allPatients = allPatients.filter(p => p.id !== Number(id));
    renderPatients(allPatients);
    savePatients(allPatients);

    Swal.fire({ icon: "success", title: "Eliminado", timer: 1200, showConfirmButton: false });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar." });
  }
}

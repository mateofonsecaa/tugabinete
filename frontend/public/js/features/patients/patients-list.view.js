// /public/js/features/patients/patients-list.view.js
//
// Pantalla "Mis Pacientes" completa: vista (router) + logica de pagina,
// fusionadas en el Paso 5. El HTML vive en patients.templates.js, el
// cache en patients.cache.js; aca vive el comportamiento:
// stale-while-revalidate, busqueda, delegacion de acciones y borrado.

import { initDrawer } from "../../components/drawer.js";
import * as api from "./patients.api.js";
import {
  compactPatients,
  readPatientsCache,
  writePatientsCache,
} from "./patients.cache.js";
import {
  patientsListPageTemplate,
  patientRowTemplate,
  patientsEmptyRowTemplate,
} from "./patients.templates.js";

let allPatients = [];

export function Patients() {
  return patientsListPageTemplate();
}

export async function initPatients() {
  initDrawer();
  bindTopButtons();
  setupEvents();
  loadPatientsFast();
  await loadPatientsFromServer();
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

// ===== 1) instant =====
function loadPatientsFast() {
  const cached = readPatientsCache();
  if (cached && Array.isArray(cached)) {
    allPatients = cached;
    renderPatients(allPatients);
  }
}

// ===== 2) server =====
async function loadPatientsFromServer() {
  try {
    const list = await api.getPatients();

    const compactServer = compactPatients(list);
    const compactLocal = compactPatients(allPatients);

    if (JSON.stringify(compactLocal) !== JSON.stringify(compactServer)) {
      allPatients = compactServer;
      renderPatients(allPatients);
      writePatientsCache(allPatients);
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
    tbody.innerHTML = patientsEmptyRowTemplate();
    return;
  }

  tbody.innerHTML = list.map(patientRowTemplate).join("");
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

  const table = document.getElementById("patientsTable");
  if (!table) return;

  table.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest(".actions");
    if (!row) return;

    const id = row.dataset.id;
    if (!id) return;

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
    await api.deletePatient(id);

    allPatients = allPatients.filter(p => p.id !== Number(id));
    renderPatients(allPatients);
    writePatientsCache(allPatients);

    Swal.fire({ icon: "success", title: "Eliminado", timer: 1200, showConfirmButton: false });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar." });
  }
}

// /public/js/patients/patientDetails.page.js
import * as api from "./patients.api.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientIdFromPath() {
  // "/patients/123"
  const parts = window.location.pathname.split("/").filter(Boolean);
  const id = Number(parts[1]);
  return Number.isFinite(id) ? id : null;
}

function fmtDate(isoOrDate) {
  if (!isoOrDate) return "-";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR");
}

function row(label, value) {
  return `<tr><td style="font-weight:600;">${label}</td><td>${value ?? "-"}</td></tr>`;
}

export async function initPatientDetailsPage() {

  const loading = document.getElementById("pd-loading");
  const content = document.getElementById("pd-content");
  if (loading) loading.hidden = false;
  if (content) content.hidden = true;

  const id = getPatientIdFromPath();
  if (!id) {
    Swal.fire({ icon: "error", title: "Error", text: "ID de paciente inválido" });
    go("/patients");
    return;
  }

  document.getElementById("back-btn")?.addEventListener("click", () => go("/patients"));
  document.getElementById("edit-btn")?.addEventListener("click", () => go(`/patients/${id}/edit`));

  document.getElementById("view-interview-btn")?.addEventListener("click", () => {
    go(`/patients/${id}/interview`);
  });

  await loadPatient(id);
}

async function loadPatient(id) {
  const loading = document.getElementById("pd-loading");
  const content = document.getElementById("pd-content");

  try {
    const res = await api.getPatientById(id); // Response
    if (!res.ok) throw new Error("No se pudo cargar el paciente");

    const p = await res.json();

    // Header
    document.getElementById("patient-name").textContent = p.fullName || "Paciente";

    // Datos personales
    const info = document.getElementById("patient-info");
    info.innerHTML = [
      row("Teléfono", p.phone || "-"),
      row("Fecha de nacimiento", fmtDate(p.birthDate)),
      row("Edad", p.age ?? "-"),
      row("Dirección", p.address || "-"),
      row("Profesión", p.profession || "-"),
    ].join("");

    // Turnos (últimos 10)
    const ap = document.getElementById("patient-appointments");
    const list = Array.isArray(p.appointments) ? p.appointments.slice(0, 10) : [];

    if (!list.length) {
      ap.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999;">Sin turnos</td></tr>`;
    } else {
      ap.innerHTML = list.map(a => `
        <tr>
          <td>${fmtDate(a.date)} ${a.time ? `- ${a.time}` : ""}</td>
          <td>${a.treatment || "-"}</td>
          <td>${a.status || (a.completed ? "Completado" : "Pendiente")}</td>
        </tr>
      `).join("");
    }

    // ✅ ACÁ: oculto loader y muestro contenido
    if (loading) loading.hidden = true;
    if (content) content.hidden = false;

  } catch (err) {
    // (opcional) cambia el texto del loader antes de irte
    const txt = document.querySelector("#pd-loading .pd-loading-text");
    if (txt) txt.textContent = "Error al cargar";

    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
    go("/patients");
  }
}

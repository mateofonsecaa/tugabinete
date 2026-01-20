import * as interviewApi from "./interview.api.js";
import * as patientsApi from "../patients/patients.api.js"; // para traer nombre del paciente (opcional)

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientId() {
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/interview$/);
  return m ? Number(m[1]) : null;
}

function fillForm(form, data) {
  if (!data) return;
  for (const [k, v] of Object.entries(data)) {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v ?? "";
  }
}

function formToData(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = String(v).trim();
  return obj;
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

export async function initPatientInterviewPage() {
  const patientId = getPatientId();
  if (!patientId) return go("/patients");

  document.getElementById("back-btn")?.addEventListener("click", () => go(`/patients/${patientId}`));
  document.getElementById("save-btn")?.addEventListener("click", () => {
    document.getElementById("interview-form")?.requestSubmit();
  });

  const form = document.getElementById("interview-form");
  form?.addEventListener("submit", (e) => onSave(e, patientId));

  // título con nombre
  try {
    const pres = await patientsApi.getPatientById(patientId);
    if (pres.ok) {
      const p = await pres.json();
      document.getElementById("title").textContent = `Entrevista: ${p.fullName || ""}`;
    }
  } catch {}

  // cargar entrevista existente
  try {
    const res = await interviewApi.getInterview(patientId);

    if (res.ok) {
      const interview = await res.json();
      fillForm(form, interview);
      return;
    }

    // 404 => no hay entrevista todavía (ok)
    if (res.status === 404) return;

    const err = await safeJson(res);
    throw new Error(err?.error || "No se pudo cargar la entrevista");
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
  }
}

async function onSave(e, patientId) {
  e.preventDefault();
  const form = e.target;

  try {
    const data = formToData(form);

    const res = await interviewApi.upsertInterview(patientId, data);
    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err?.error || "No se pudo guardar");
    }

    await Swal.fire({
      icon: "success",
      title: "Entrevista guardada",
      timer: 1200,
      showConfirmButton: false,
    });

    go(`/patients/${patientId}`);
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
  }
}

import * as api from "./interview.api.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientId() {
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/interview\/edit\/2$/);
  return m ? Number(m[1]) : null;
}

let formChanged = false;

export function initInterviewEdit2Page() {
  const patientId = getPatientId();
  if (!patientId) return go("/patients");

  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", () => (formChanged = true));
    el.addEventListener("change", () => (formChanged = true));
  });

  // toggle adverseDetails
  document.querySelectorAll(`input[name="adverseReaction"]`).forEach((r) => {
    r.addEventListener("change", () => toggleAdverse(r.value === "Sí"));
  });

  document.getElementById("back-btn")?.addEventListener("click", () => goBack(patientId));

  document.getElementById("save-btn")?.addEventListener("click", async () => {
    const ok = await savePart2(patientId);
    if (ok) formChanged = false;
  });

  document.getElementById("finish-btn")?.addEventListener("click", async () => {
    const ok = await savePart2(patientId);
    if (ok) {
      formChanged = false;
      go(`/patients/${patientId}/interview`);
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (formChanged) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  loadExisting(patientId);
}

async function goBack(patientId) {
  if (!formChanged) return go(`/patients/${patientId}/interview/edit/1`);

  const result = await Swal.fire({
    icon: "warning",
    title: "Cambios sin guardar",
    text: "Tenés cambios sin guardar. ¿Querés salir igualmente?",
    showCancelButton: true,
    confirmButtonText: "Salir sin guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ffadad",
    cancelButtonColor: "#ccc",
    background: "#fffdf9",
    color: "#444",
  });

  if (result.isConfirmed) go(`/patients/${patientId}/interview/edit/1`);
}

function toggleAdverse(show) {
  const field = document.getElementById("adverseDetails");
  if (!field) return;
  field.style.display = show ? "block" : "none";
  if (!show) field.value = "";
  formChanged = true;
}

function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}
function getChecks(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}
function getVal(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

async function loadExisting(patientId) {
  try {
    const res = await api.getInterview(patientId);
    if (!res.ok) return;

    const data = await res.json();

    // radios directos
    ["skinType", "biotipo", "fototipo", "adverseReaction"].forEach((k) => {
      if (!data[k]) return;
      const r = document.querySelector(`input[name="${k}"][value="${data[k]}"]`);
      if (r) r.checked = true;
      if (k === "adverseReaction") toggleAdverse(data[k] === "Sí");
    });

    // concerns: viene string "a, b"
    if (data.concerns) {
      const concerns = Array.isArray(data.concerns)
        ? data.concerns
        : String(data.concerns).split(",");
      const normalized = concerns.map((c) => c.trim().toLowerCase());

      document.querySelectorAll(`input[name="concerns"]`).forEach((chk) => {
        chk.checked = normalized.includes(chk.value.trim().toLowerCase());
      });
    }

    // inputs
    ["cleanser","toner","serum","moisturizerDay","moisturizerNight","eyeCream","sunscreen","routineFrequency",
     "adverseDetails","expectedResults","treatmentFrequency","routineTime"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = data[id] || "";
    });

    formChanged = false;
  } catch (err) {
    console.error("Error cargando entrevista:", err);
  }
}

async function savePart2(patientId) {
  const body = {
    skinType: getRadio("skinType"),
    concerns: getChecks("concerns"), // backend la convierte a string
    biotipo: getRadio("biotipo"),
    fototipo: getRadio("fototipo"),
    cleanser: getVal("cleanser"),
    toner: getVal("toner"),
    serum: getVal("serum"),
    moisturizerDay: getVal("moisturizerDay"),
    moisturizerNight: getVal("moisturizerNight"),
    eyeCream: getVal("eyeCream"),
    sunscreen: getVal("sunscreen"),
    routineFrequency: getVal("routineFrequency"),
    adverseReaction: getRadio("adverseReaction"),
    adverseDetails: getVal("adverseDetails"),
    expectedResults: getVal("expectedResults"),
    treatmentFrequency: getVal("treatmentFrequency"),
    routineTime: getVal("routineTime"),
  };

  try {
    const res = await api.upsertInterview(patientId, body);
    if (!res.ok) throw new Error("Error al guardar entrevista");

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Datos guardados correctamente.",
      timer: 1400,
      showConfirmButton: false,
      background: "#fffdf9",
      color: "#444",
    });

    return true;
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar la información.",
      confirmButtonColor: "#ffadad",
      background: "#fffdf9",
      color: "#444",
    });
    return false;
  }
}

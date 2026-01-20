import * as api from "./interview.api.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientId() {
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/interview\/edit\/1$/);
  return m ? Number(m[1]) : null;
}

let formChanged = false;

export function initInterviewEdit1Page() {
  const patientId = getPatientId();
  if (!patientId) return go("/patients");

  // detectar cambios
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", () => (formChanged = true));
    el.addEventListener("change", () => (formChanged = true));
  });

  // toggle extras en radios Sí/No
  document.querySelectorAll("input[type='radio'][data-extra]").forEach((r) => {
    r.addEventListener("change", () => toggleExtra(r.dataset.extra, r.value === "Sí"));
  });

  // back con confirmación
  document.getElementById("back-btn")?.addEventListener("click", () => goBack(patientId));

  // guardar
  document.getElementById("save-btn")?.addEventListener("click", async () => {
    const ok = await savePart1(patientId);
    if (ok) formChanged = false;
  });

  // continuar
  document.getElementById("next-btn")?.addEventListener("click", async () => {
    const ok = await savePart1(patientId);
    if (ok) {
      formChanged = false;
      go(`/patients/${patientId}/interview/edit/2`);
    }
  });

  // antes de cerrar pestaña
  window.addEventListener("beforeunload", (e) => {
    if (formChanged) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  loadExisting(patientId);
}

async function goBack(patientId) {
  if (!formChanged) return go(`/patients/${patientId}/interview`);

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

  if (result.isConfirmed) go(`/patients/${patientId}/interview`);
}

function toggleExtra(id, show) {
  const field = document.getElementById(id);
  if (!field) return;
  field.style.display = show ? "block" : "none";
  if (!show) field.value = "";
  formChanged = true;
}

async function loadExisting(patientId) {
  try {
    const res = await api.getInterview(patientId);
    if (!res.ok) return; // 404 ok

    const data = await res.json();

    // radios + inputs + extras
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;

      const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
        if (value === "Sí") {
          const extraField = document.getElementById(`${key}Extra`);
          if (extraField) extraField.style.display = "block";
        }
      }

      const input = document.getElementById(key);
      if (input) input.value = value;

      const extra = document.getElementById(`${key}Extra`);
      if (extra && typeof value === "string" && key.endsWith("Extra")) {
        extra.value = value;
        extra.style.display = "block";
      }
    }

    formChanged = false;
  } catch (err) {
    console.error("Error cargando entrevista:", err);
  }
}

function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

async function savePart1(patientId) {
  const body = {
    illness: getRadio("illness"),
    illnessExtra: getVal("illnessExtra"),
    oncology: getRadio("oncology"),
    oncologyExtra: getVal("oncologyExtra"),
    device: getRadio("device"),
    medication: getRadio("medication"),
    medicationExtra: getVal("medicationExtra"),
    hormones: getRadio("hormones"),
    hormonesExtra: getVal("hormonesExtra"),
    allergy: getRadio("allergy"),
    allergyExtra: getVal("allergyExtra"),
    celiac: getRadio("celiac"),
    celiacExtra: getVal("celiacExtra"),
    surgery: getRadio("surgery"),
    surgeryExtra: getVal("surgeryExtra"),
    pregnancy: getRadio("pregnancy"),
    pregnancyExtra: getVal("pregnancyExtra"),
    smoke: getRadio("smoke"),
    alcohol: getRadio("alcohol"),
    sport: getRadio("sport"),
    sportExtra: getVal("sportExtra"),
    water: getVal("water"),
    screenTime: getVal("screenTime"),
    sleep: getVal("sleep"),
    lenses: getRadio("lenses"),
    sun: getRadio("sun"),
    skin: getRadio("skin"),
    family: getRadio("family"),
    familyExtra: getVal("familyExtra"),
    stress: getRadio("stress"),
    hormonal: getRadio("hormonal"),
    hormonalExtra: getVal("hormonalExtra"),
    keloid: getRadio("keloid"),
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

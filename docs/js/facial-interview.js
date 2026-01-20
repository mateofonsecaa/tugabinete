// ======================================================
// facial_interview.js — versión PRO con config + authFetch
// ======================================================

import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";

// ------------------------------------------------------
// 1) CONFIG: ID del paciente desde params
// ------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const patientId = params.get("id");

// ------------------------------------------------------
// 2) INIT: Cargar entrevista
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (!patientId) {
    Swal.fire({
      icon: "error",
      title: "Paciente no encontrado",
      text: "Volviendo a la lista...",
      confirmButtonColor: "#ffadad",
    }).then(() => {
      window.location.href = "../dashboard/patients.html";
    });
    return;
  }

  loadInterview();
});

// ------------------------------------------------------
// 3) CARGAR ENTREVISTA EXISTENTE
// ------------------------------------------------------
async function loadInterview() {
  try {
    const res = await authFetch(`${API_URL}/interviews/${patientId}`);

    if (!res.ok) return; // el paciente aún no tiene entrevista
    const data = await res.json();

    // Asignar todos los campos de forma dinámica
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;

      // 1) Radios
      const radio = document.querySelector(
        `input[name="${key}"][value="${value}"]`
      );
      if (radio) {
        radio.checked = true;
        continue;
      }

      // 2) Extra fields (textarea)
      const extra = document.getElementById(`${key}Extra`);
      if (extra) {
        extra.value = value;
        extra.style.display = "block";
        continue;
      }

      // 3) Inputs directos
      const input = document.getElementById(key);
      if (input) {
        input.value = value;
      }
    }
  } catch (err) {
    console.error("❌ Error al cargar entrevista:", err);
  }
}

// ------------------------------------------------------
// 4) ARMAR EL BODY PARA GUARDAR
// ------------------------------------------------------
function getInterviewBody() {
  const getValue = (id) =>
    document.getElementById(id)?.value?.trim() || "";

  const getRadio = (name) =>
    document.querySelector(`input[name='${name}']:checked`)?.value || "";

  return {
    patientId: Number(patientId),

    // textareas extras
    illnessExtra: getValue("illnessExtra"),
    oncologyExtra: getValue("oncologyExtra"),
    medicationExtra: getValue("medicationExtra"),
    hormonesExtra: getValue("hormonesExtra"),
    allergyExtra: getValue("allergyExtra"),
    celiacExtra: getValue("celiacExtra"),
    surgeryExtra: getValue("surgeryExtra"),
    pregnancyExtra: getValue("pregnancyExtra"),
    sportExtra: getValue("sportExtra"),
    familyExtra: getValue("familyExtra"),
    hormonalExtra: getValue("hormonalExtra"),

    // inputs
    water: getValue("water"),
    screenTime: getValue("screenTime"),
    sleep: getValue("sleep"),

    // radios
    illness: getRadio("illness"),
    oncology: getRadio("oncology"),
    device: getRadio("device"),
    medication: getRadio("medication"),
    hormones: getRadio("hormones"),
    allergy: getRadio("allergy"),
    celiac: getRadio("celiac"),
    surgery: getRadio("surgery"),
    pregnancy: getRadio("pregnancy"),
    smoke: getRadio("smoke"),
    alcohol: getRadio("alcohol"),
    sport: getRadio("sport"),
    lenses: getRadio("lenses"),
    sun: getRadio("sun"),
    skin: getRadio("skin"),
    family: getRadio("family"),
    stress: getRadio("stress"),
    hormonal: getRadio("hormonal"),
    keloid: getRadio("keloid"),
  };
}

// ------------------------------------------------------
// 5) GUARDAR ENTREVISTA
// ------------------------------------------------------
async function saveInterview() {
  const body = getInterviewBody();

  try {
    const res = await authFetch(`${API_URL}/interviews`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al guardar entrevista");
    }

    console.log("✔ Entrevista guardada correctamente");
    return true;

  } catch (err) {
    console.error("❌ Error al guardar entrevista:", err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar la entrevista.",
      confirmButtonColor: "#ffadad",
    });

    return false;
  }
}

// ------------------------------------------------------
// 6) BOTÓN VOLVER
// ------------------------------------------------------
window.goBack = function () {
  window.location.href = `patient-details.html?id=${patientId}`;
};

// ------------------------------------------------------
// 7) BOTÓN CONTINUAR
// ------------------------------------------------------
window.goToNext = async function () {
  const ok = await saveInterview();
  if (ok) {
    window.location.href = `facial_interview_2.html?id=${patientId}`;
  }
};

// ======================================================
// facial_interview_2.js — versión PRO con config + authFetch
// ======================================================

import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";

const params = new URLSearchParams(window.location.search);
const patientId = params.get("id");

// ------------------------------------------------------
// Mostrar/ocultar campo de reacción adversa
// ------------------------------------------------------
window.toggleAdverse = function (show) {
  const field = document.getElementById("adverseDetails");
  field.style.display = show ? "block" : "none";
  if (!show) field.value = "";
};

// ------------------------------------------------------
// Volver a parte 1
// ------------------------------------------------------
window.goBack = function () {
  window.location.href = `facial_interview.html?id=${patientId}`;
};

// ------------------------------------------------------
// Armar BODY correctamente
// ------------------------------------------------------
function getInterviewBody2() {
  const getVal = (id) => document.getElementById(id)?.value.trim() || "";
  const getRadio = (name) =>
    document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  const getChecks = (name) =>
    Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
      (el) => el.value
    );

  return {
    patientId: Number(patientId),

    // radios
    skinType: getRadio("skinType"),

    // checklist
    concerns: getChecks("concerns"),

    // rutina
    cleanser: getVal("cleanser"),
    toner: getVal("toner"),
    serum: getVal("serum"),
    moisturizerDay: getVal("moisturizerDay"),
    moisturizerNight: getVal("moisturizerNight"),
    eyeCream: getVal("eyeCream"),
    sunscreen: getVal("sunscreen"),

    routineFrequency: getVal("routineFrequency"),
    routineTime: getVal("routineTime"),

    // reacciones adversas
    adverseReaction: getRadio("adverseReaction"),
    adverseDetails: getVal("adverseDetails"),

    // expectativas
    expectedResults: getVal("expectedResults"),
    treatmentFrequency: getVal("treatmentFrequency"),
  };
}

// ------------------------------------------------------
// Guardar parte 2
// ------------------------------------------------------
async function saveInterview2() {
  if (!patientId) {
    Swal.fire({
      icon: "error",
      title: "Paciente no encontrado",
      text: "Volvé a la primera parte.",
      confirmButtonColor: "#ffadad",
    });
    return false;
  }

  const body = getInterviewBody2();
  console.log("📤 Body enviado:", body);

  try {
    const res = await authFetch(`${API_URL}/interviews`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al guardar entrevista");
    }

    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Segunda parte guardada correctamente",
      timer: 1500,
      showConfirmButton: false,
      background: "#fffdf9",
    });

    return true;
  } catch (err) {
    console.error("Error al guardar entrevista:", err);

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
// Continuar a parte 3
// ------------------------------------------------------
window.goToNext = async function () {
  const ok = await saveInterview2();
  if (ok) {
    window.location.href = `facial_interview_3.html?id=${patientId}`;
  }
};

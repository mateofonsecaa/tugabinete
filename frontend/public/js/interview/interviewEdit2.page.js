import * as api from "./interview.api.js";

let formChanged = false;
let activeBeforeUnloadHandler = null;

const PART2_RADIO_NAMES = ["skinType", "biotipo", "fototipo", "adverseReaction"];

const PART2_FIELD_IDS = [
  "cleanser",
  "toner",
  "serum",
  "moisturizerDay",
  "moisturizerNight",
  "eyeCream",
  "sunscreen",
  "routineFrequency",
  "adverseDetails",
  "expectedResults",
  "treatmentFrequency",
  "routineTime",
];

function go(path, { scrollTop = false } = {}) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));

  if (scrollTop) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    });
  }
}

function getPatientId() {
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/interview\/edit\/2$/);
  return m ? Number(m[1]) : null;
}

export function initInterviewEdit2Page() {
  const patientId = getPatientId();
  if (!patientId) return go("/patients");

  formChanged = false;

  setupChangeTracking();
  setupClearableRadios();

  document.getElementById("back-btn")?.addEventListener("click", () => goBack(patientId));

  const saveBtn = document.getElementById("save-btn");
  saveBtn?.addEventListener("click", async () => {
    const ok = await withActionLock(saveBtn, "Guardando...", async () => {
      return await savePart2(patientId);
    });

    if (ok) formChanged = false;
  });

  const finishBtn = document.getElementById("finish-btn");
  finishBtn?.addEventListener("click", async () => {
    const ok = await withActionLock(finishBtn, "Finalizando...", async () => {
      const saved = await savePart2(patientId);
      if (!saved) return false;

      formChanged = false;
      go(`/patients/${patientId}/interview`, { scrollTop: true });
      return true;
    });

    if (ok) formChanged = false;
  });

  if (activeBeforeUnloadHandler) {
    window.removeEventListener("beforeunload", activeBeforeUnloadHandler);
  }

  activeBeforeUnloadHandler = (e) => {
    if (!formChanged) return;
    e.preventDefault();
    e.returnValue = "";
  };

  window.addEventListener("beforeunload", activeBeforeUnloadHandler);

  setLoading(true);
  loadExisting(patientId).finally(() => setLoading(false));
}

function setupChangeTracking() {
  document.querySelectorAll("#formFacial2 input, #formFacial2 textarea, #formFacial2 select").forEach((el) => {
    el.addEventListener("input", () => {
      formChanged = true;
    });

    el.addEventListener("change", () => {
      formChanged = true;
    });
  });
}

function setupClearableRadios() {
  document.querySelectorAll("#formFacial2 .interview-edit-choice").forEach((choice) => {
    const radio = choice.querySelector('input[type="radio"]');
    if (!radio) return;

    choice.addEventListener("pointerdown", () => {
      choice.dataset.wasChecked = radio.checked ? "true" : "false";
    });

    choice.addEventListener("click", (e) => {
      const wasChecked = choice.dataset.wasChecked === "true";
      delete choice.dataset.wasChecked;

      if (!wasChecked) return;

      e.preventDefault();
      radio.checked = false;

      if (radio.name === "adverseReaction") {
        toggleAdverse(false, {
          clearWhenHidden: true,
          markDirty: false,
        });
      }

      formChanged = true;
    });

    radio.addEventListener("change", () => {
      if (radio.name === "adverseReaction") {
        toggleAdverse(radio.value === "Sí", {
          clearWhenHidden: true,
          markDirty: false,
        });
      }

      formChanged = true;
    });
  });
}

function setLoading(isLoading) {
  const overlay = document.getElementById("interview-loading");
  const card = document.querySelector(".interview-edit-card");

  if (overlay) {
    overlay.classList.toggle("is-hidden", !isLoading);
  }

  if (card) {
    card.setAttribute("aria-busy", String(isLoading));
  }
}

function getActionButtons() {
  return ["save-btn", "finish-btn"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
}

async function withActionLock(clickedButton, loadingText, task) {
  if (!clickedButton || clickedButton.disabled) return false;

  const buttons = getActionButtons();

  buttons.forEach((btn) => {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent.trim();
    }
    btn.disabled = true;
  });

  clickedButton.textContent = loadingText;

  try {
    return await task();
  } finally {
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || btn.textContent;
    });
  }
}

async function goBack(patientId) {
  if (!formChanged) return go(`/patients/${patientId}/interview/edit/1`, { scrollTop: true });

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

  if (result.isConfirmed) {
    go(`/patients/${patientId}/interview/edit/1`, { scrollTop: true });
  }
}

function toggleAdverse(show, { clearWhenHidden = true, markDirty = true } = {}) {
  const field = document.getElementById("adverseDetails");
  if (!field) return;

  field.style.display = show ? "block" : "none";

  if (!show && clearWhenHidden) {
    field.value = "";
  }

  if (markDirty) {
    formChanged = true;
  }
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

    PART2_RADIO_NAMES.forEach((name) => {
      const value = data[name];
      if (!value) return;

      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (!radio) return;

      radio.checked = true;

      if (name === "adverseReaction") {
        toggleAdverse(value === "Sí", {
          clearWhenHidden: false,
          markDirty: false,
        });
      }
    });

    if (data.concerns) {
      const concerns = Array.isArray(data.concerns)
        ? data.concerns
        : String(data.concerns).split(",");

      const normalized = concerns.map((c) => c.trim().toLowerCase());

      document.querySelectorAll(`input[name="concerns"]`).forEach((chk) => {
        chk.checked = normalized.includes(chk.value.trim().toLowerCase());
      });
    }

    PART2_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.value = data[id] ?? "";
    });

    formChanged = false;
  } catch (err) {
    console.error("Error cargando entrevista:", err);
  }
}

async function savePart2(patientId) {
  const body = {
    skinType: getRadio("skinType"),
    concerns: getChecks("concerns"),
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
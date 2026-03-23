import * as api from "./interview.api.js";

let formChanged = false;
let activeBeforeUnloadHandler = null;

const PART1_RADIO_NAMES = [
  "illness",
  "oncology",
  "device",
  "medication",
  "hormones",
  "allergy",
  "celiac",
  "surgery",
  "pregnancy",
  "smoke",
  "alcohol",
  "sport",
  "lenses",
  "sun",
  "skin",
  "family",
  "stress",
  "hormonal",
  "keloid",
];

const PART1_FIELD_IDS = [
  "illnessExtra",
  "oncologyExtra",
  "medicationExtra",
  "hormonesExtra",
  "allergyExtra",
  "celiacExtra",
  "surgeryExtra",
  "pregnancyExtra",
  "sportExtra",
  "water",
  "screenTime",
  "sleep",
  "familyExtra",
  "hormonalExtra",
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
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/interview\/edit\/1$/);
  return m ? Number(m[1]) : null;
}

export function initInterviewEdit1Page() {
  const patientId = getPatientId();
  if (!patientId) return go("/patients");

  formChanged = false;

  setupChangeTracking();
  setupClearableRadios();
  setupDigitsOnly(["screenTime", "sleep"]);

  document.getElementById("back-btn")?.addEventListener("click", () => goBack(patientId));

  const saveBtn = document.getElementById("save-btn");
  saveBtn?.addEventListener("click", async () => {
    const ok = await withActionLock(saveBtn, "Guardando...", async () => {
      return await savePart1(patientId);
    });

    if (ok) formChanged = false;
  });

  const nextBtn = document.getElementById("next-btn");
  nextBtn?.addEventListener("click", async () => {
    const ok = await withActionLock(nextBtn, "Continuando...", async () => {
      const saved = await savePart1(patientId);
      if (!saved) return false;

      formChanged = false;
      go(`/patients/${patientId}/interview/edit/2`, { scrollTop: true });
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
  document.querySelectorAll("#formFacial1 input, #formFacial1 textarea, #formFacial1 select").forEach((el) => {
    el.addEventListener("input", () => {
      formChanged = true;
    });

    el.addEventListener("change", () => {
      formChanged = true;
    });
  });
}

function setupClearableRadios() {
  document.querySelectorAll("#formFacial1 .interview-edit-choice").forEach((choice) => {
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

      if (radio.dataset.extra) {
        toggleExtra(radio.dataset.extra, false, {
          clearWhenHidden: true,
          markDirty: false,
        });
      }

      formChanged = true;
    });

    radio.addEventListener("change", () => {
      if (radio.dataset.extra) {
        toggleExtra(radio.dataset.extra, radio.value === "Sí", {
          clearWhenHidden: true,
          markDirty: false,
        });
      }

      formChanged = true;
    });
  });
}

function setupDigitsOnly(ids) {
  ids.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("keydown", (e) => {
      if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
        e.preventDefault();
      }
    });

    input.addEventListener("input", () => {
      const cleaned = input.value.replace(/\D+/g, "");
      if (input.value !== cleaned) {
        input.value = cleaned;
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      const digits = text.replace(/\D+/g, "");
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;

      input.setRangeText(digits, start, end, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
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
  return ["save-btn", "next-btn"]
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
  if (!formChanged) return go(`/patients/${patientId}/interview`, { scrollTop: true });

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
    go(`/patients/${patientId}/interview`, { scrollTop: true });
  }
}

function toggleExtra(id, show, { clearWhenHidden = true, markDirty = true } = {}) {
  const field = document.getElementById(id);
  if (!field) return;

  field.style.display = show ? "block" : "none";

  if (!show && clearWhenHidden) {
    field.value = "";
  }

  if (markDirty) {
    formChanged = true;
  }
}

async function loadExisting(patientId) {
  try {
    const res = await api.getInterview(patientId);
    if (!res.ok) return;

    const data = await res.json();

    PART1_RADIO_NAMES.forEach((name) => {
      const value = data[name];
      if (!value) return;

      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (!radio) return;

      radio.checked = true;

      if (radio.dataset.extra) {
        toggleExtra(radio.dataset.extra, value === "Sí", {
          clearWhenHidden: false,
          markDirty: false,
        });
      }
    });

    PART1_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.value = data[id] ?? "";
    });

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
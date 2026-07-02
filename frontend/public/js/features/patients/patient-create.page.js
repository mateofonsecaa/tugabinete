// /public/js/patients/patientCreate.page.js
import * as api from "./patients.api.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getTodayYYYYMMDD() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const normalizeSpaces = (s) => s.replace(/\s+/g, " ").trim();

const onlyLetters = (s) => /^[\p{L}\s]+$/u.test(s);
const phoneAllowed = (s) => /^[0-9+\s()-]+$/.test(s);
const addressAllowed = (s) => /^[\p{L}0-9\s.,#°ºª/\-]+$/u.test(s);
const professionAllowed = (s) => /^[\p{L}\s]+$/u.test(s);

export function initPatientCreatePage() {
  document.getElementById("back-btn")?.addEventListener("click", () => go("/patients"));
  document.getElementById("cancel-create-patient")?.addEventListener("click", () => go("/patients"));

  const birth = document.getElementById("birthDate");
  const birthWrap = birth?.closest(".patient-input-wrap--date");

  if (birth) {
    birth.max = getTodayYYYYMMDD();

    const openPicker = () => {
      if (typeof birth.showPicker === "function") {
        birth.showPicker();
      }
    };

    birth.addEventListener("click", openPicker);
    birth.addEventListener("focus", openPicker);
    birthWrap?.addEventListener("click", openPicker);
  }

  const fullNameEl = document.getElementById("fullName");
  const phoneEl = document.getElementById("phone");
  const addressEl = document.getElementById("address");
  const professionEl = document.getElementById("profession");

  if (fullNameEl) {
    fullNameEl.addEventListener("input", () => {
      fullNameEl.value = fullNameEl.value.replace(/[^\p{L}\s]/gu, "");
      clearFieldError("fullName");
    });
    fullNameEl.addEventListener("blur", () => validateAndRenderField("fullName"));
  }

  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      phoneEl.value = phoneEl.value.replace(/[^0-9+\s()-]/g, "");
      clearFieldError("phone");
    });
    phoneEl.addEventListener("blur", () => validateAndRenderField("phone"));
  }

  if (addressEl) {
    addressEl.addEventListener("input", () => {
      addressEl.value = addressEl.value.replace(/[^\p{L}0-9\s.,#°ºª/\-]/gu, "");
      clearFieldError("address");
    });
    addressEl.addEventListener("blur", () => validateAndRenderField("address"));
  }

  if (professionEl) {
    professionEl.addEventListener("input", () => {
      professionEl.value = professionEl.value.replace(/[^\p{L}\s]/gu, "");
      clearFieldError("profession");
    });
    professionEl.addEventListener("blur", () => validateAndRenderField("profession"));
  }

  if (birth) {
    birth.addEventListener("input", () => clearFieldError("birthDate"));
    birth.addEventListener("change", () => validateAndRenderField("birthDate"));
    birth.addEventListener("blur", () => validateAndRenderField("birthDate"));
  }

  document.getElementById("patient-form")?.addEventListener("submit", onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();

  clearAllFieldErrors();

  const fullName = normalizeSpaces(document.getElementById("fullName").value);
  const birthDate = document.getElementById("birthDate").value;
  const phoneRaw = normalizeSpaces(document.getElementById("phone").value);
  const address = normalizeSpaces(document.getElementById("address").value);
  const profession = normalizeSpaces(document.getElementById("profession").value);

  const errors = {
    fullName: validateFullName(fullName),
    birthDate: validateBirthDate(birthDate),
    phone: validatePhone(phoneRaw),
    address: validateAddress(address),
    profession: validateProfession(profession),
  };

  let hasErrors = false;

  for (const [fieldId, message] of Object.entries(errors)) {
    if (message) {
      setFieldError(fieldId, message);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    focusFirstError();
    return;
  }

  const phoneDigits = phoneRaw.replace(/\D/g, "");

  const data = {
    fullName,
    birthDate: birthDate || null,
    phone: phoneDigits || null,
    address: address || null,
    profession: profession || null,
  };

  const submitBtn = document.getElementById("submit-patient-btn");
  const originalBtnHtml = submitBtn?.innerHTML;

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creando...`;
    }

    const res = await api.createPatient(data);

    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err?.error || "No se pudo guardar");
    }

    await Swal.fire({
      icon: "success",
      title: "Paciente creado",
      timer: 1200,
      showConfirmButton: false,
    });

    localStorage.removeItem("patients");
    go("/patients");
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo crear el paciente.",
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

function validateAndRenderField(fieldId) {
  clearFieldError(fieldId);

  const values = getCurrentValues();
  let message = "";

  if (fieldId === "fullName") message = validateFullName(values.fullName);
  if (fieldId === "birthDate") message = validateBirthDate(values.birthDate);
  if (fieldId === "phone") message = validatePhone(values.phoneRaw);
  if (fieldId === "address") message = validateAddress(values.address);
  if (fieldId === "profession") message = validateProfession(values.profession);

  if (message) {
    setFieldError(fieldId, message);
    return false;
  }

  return true;
}

function getCurrentValues() {
  return {
    fullName: normalizeSpaces(document.getElementById("fullName").value),
    birthDate: document.getElementById("birthDate").value,
    phoneRaw: normalizeSpaces(document.getElementById("phone").value),
    address: normalizeSpaces(document.getElementById("address").value),
    profession: normalizeSpaces(document.getElementById("profession").value),
  };
}

function validateFullName(value) {
  if (!value) return "Ingresá el nombre completo.";
  if (value.length > 60) return "El nombre no puede superar los 60 caracteres.";
  if (!onlyLetters(value)) return "Usá solo letras y espacios.";
  return "";
}

function validateBirthDate(value) {
  if (!value) return "";

  const today = getTodayYYYYMMDD();
  if (value > today) return "La fecha no puede ser posterior a hoy.";

  return "";
}

function validatePhone(value) {
  if (!value) return "";

  if (value.length > 25) return "El teléfono no puede superar los 25 caracteres.";
  if (!phoneAllowed(value)) return "Ingresá un teléfono válido.";

  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return "Ingresá un teléfono válido.";
  if (digits.length > 20) return "El teléfono no puede superar los 20 dígitos.";

  return "";
}

function validateAddress(value) {
  if (!value) return "";
  if (value.length > 80) return "La dirección no puede superar los 80 caracteres.";
  if (!addressAllowed(value)) return "Usá solo letras, números y signos básicos.";
  return "";
}

function validateProfession(value) {
  if (!value) return "";
  if (value.length > 50) return "La profesión no puede superar los 50 caracteres.";
  if (!professionAllowed(value)) return "Usá solo letras y espacios.";
  return "";
}

function setFieldError(fieldId, message) {
  const field = document.querySelector(`[data-field="${fieldId}"]`);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) field.classList.add("is-error");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldId) {
  const field = document.querySelector(`[data-field="${fieldId}"]`);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) field.classList.remove("is-error");
  if (errorEl) errorEl.textContent = "";
}

function clearAllFieldErrors() {
  ["fullName", "birthDate", "phone", "address", "profession"].forEach(clearFieldError);
}

function focusFirstError() {
  const firstErrorField = document.querySelector(".patient-field.is-error input");
  firstErrorField?.focus();
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
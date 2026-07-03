// /public/js/features/patients/patient-create.view.js
//
// Pantalla "Nuevo paciente" completa: vista (router) + logica de pagina,
// fusionadas en el Paso 3 del plan de migracion del dominio Pacientes.
// El HTML vive en patients.templates.js; aca vive el comportamiento:
// listeners, validacion por campo, submit e invalidacion de cache.

import { initDrawer } from "../../components/drawer.js";
import * as api from "./patients.api.js";
import { patientCreatePageTemplate } from "./patients.templates.js";
import { invalidatePatientsCache } from "./patients.cache.js";
import {
  getTodayYYYYMMDD,
  normalizeSpaces,
  sanitizeFullNameInput,
  sanitizePhoneInput,
  sanitizeAddressInput,
  sanitizeProfessionInput,
  toPhoneDigits,
  validateFullName,
  validateBirthDate,
  validatePhone,
  validateAddress,
  validateProfession,
} from "./patients.validation.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function PatientNew() {
  return patientCreatePageTemplate({ today: getTodayYYYYMMDD() });
}

export function initPatientNew() {
  document.body.className = "is-patient-new";
  initDrawer();

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
      fullNameEl.value = sanitizeFullNameInput(fullNameEl.value);
      clearFieldError("fullName");
    });
    fullNameEl.addEventListener("blur", () => validateAndRenderField("fullName"));
  }

  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      phoneEl.value = sanitizePhoneInput(phoneEl.value);
      clearFieldError("phone");
    });
    phoneEl.addEventListener("blur", () => validateAndRenderField("phone"));
  }

  if (addressEl) {
    addressEl.addEventListener("input", () => {
      addressEl.value = sanitizeAddressInput(addressEl.value);
      clearFieldError("address");
    });
    addressEl.addEventListener("blur", () => validateAndRenderField("address"));
  }

  if (professionEl) {
    professionEl.addEventListener("input", () => {
      professionEl.value = sanitizeProfessionInput(professionEl.value);
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

  const phoneDigits = toPhoneDigits(phoneRaw);

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

    await api.createPatient(data);

    await Swal.fire({
      icon: "success",
      title: "Paciente creado",
      timer: 1200,
      showConfirmButton: false,
    });

    invalidatePatientsCache();
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
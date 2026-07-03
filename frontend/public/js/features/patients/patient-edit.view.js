// /public/js/features/patients/patient-edit.view.js
//
// Pantalla "Editar paciente" completa: vista (router) + logica de pagina,
// fusionadas en el Paso 4 del plan de migracion del dominio Pacientes.
// El HTML vive en patients.templates.js; aca vive el comportamiento:
// carga del paciente, bloqueo del form, listeners, submit e invalidacion
// de cache. Las validaciones se unifican recien en el Paso 7.

import { initDrawer } from "../../components/drawer.js";
import * as api from "./patients.api.js";
import { patientEditPageTemplate } from "./patients.templates.js";
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

function getPatientIdFromEditPath() {
  // "/patients/123/edit"
  const m = window.location.pathname.match(/^\/patients\/(\d+)\/edit$/);
  return m ? Number(m[1]) : null;
}

function toDateInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setEditFormLocked(locked) {
  const form = document.getElementById("patient-form");
  if (!form) return;

  form.classList.toggle("is-loading", locked);

  form
    .querySelectorAll("input, select, textarea, button[type='submit']")
    .forEach((el) => {
      el.disabled = locked;
    });
}

export function PatientEdit() {
  return patientEditPageTemplate({ today: getTodayYYYYMMDD() });
}

export async function initPatientEdit() {
  document.body.className = "is-patient-edit";
  initDrawer();

  setEditFormLocked(true);

  const id = getPatientIdFromEditPath();
  if (!id) {
    Swal.fire({ icon: "error", title: "Error", text: "ID inválido" });
    go("/patients");
    return;
  }

  document.getElementById("back-btn")?.addEventListener("click", () => go("/patients"));
  document.getElementById("to-details-btn")?.addEventListener("click", () => go(`/patients/${id}`));

  try {
    await loadPatientIntoForm(id);
  } catch (err) {
    console.error(err);
    document.getElementById("patient-title").textContent = "No se pudo cargar el paciente";

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo cargar el paciente",
    });

    return;
  }

  const fullNameEl = document.getElementById("fullName");
  const phoneEl = document.getElementById("phone");
  const addressEl = document.getElementById("address");
  const professionEl = document.getElementById("profession");

  if (fullNameEl) {
    fullNameEl.addEventListener("input", () => {
      fullNameEl.value = sanitizeFullNameInput(fullNameEl.value);
    });
  }

  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      phoneEl.value = sanitizePhoneInput(phoneEl.value);
    });
  }

  if (addressEl) {
    addressEl.addEventListener("input", () => {
      addressEl.value = sanitizeAddressInput(addressEl.value);
    });
  }

  if (professionEl) {
    professionEl.addEventListener("input", () => {
      professionEl.value = sanitizeProfessionInput(professionEl.value);
    });
  }

  const birth = document.getElementById("birthDate");
  if (birth) {
    birth.addEventListener("click", () => {
      if (typeof birth.showPicker === "function") birth.showPicker();
    });
  }

  document.getElementById("patient-form")?.addEventListener("submit", (e) => onSubmit(e, id));
}

async function loadPatientIntoForm(id) {
  const p = await api.getPatientById(id);

  document.getElementById("patient-title").textContent = p.fullName || "Paciente";
  document.getElementById("fullName").value = p.fullName || "";
  document.getElementById("birthDate").value = toDateInputValue(p.birthDate);
  document.getElementById("phone").value = p.phone || "";
  document.getElementById("address").value = p.address || "";
  document.getElementById("profession").value = p.profession || "";

  setEditFormLocked(false);
}

async function onSubmit(e, id) {
  e.preventDefault();

  const fullName = normalizeSpaces(document.getElementById("fullName").value);
  const birthDate = document.getElementById("birthDate").value;
  const phoneRaw = normalizeSpaces(document.getElementById("phone").value);
  const address = normalizeSpaces(document.getElementById("address").value);
  const profession = normalizeSpaces(document.getElementById("profession").value);

  // Reglas unificadas (Paso 7): las mismas de alta, desde patients.validation.js.
  // Presentacion: Swal con el primer error, como siempre en esta pantalla.
  const firstError =
    validateFullName(fullName) ||
    validateBirthDate(birthDate) ||
    validatePhone(phoneRaw) ||
    validateAddress(address) ||
    validateProfession(profession);

  if (firstError) {
    return Swal.fire({ icon: "error", title: "Error", text: firstError });
  }

  const data = {
    fullName,
    birthDate: birthDate || null,
    phone: toPhoneDigits(phoneRaw) || null,
    address: address || null,
    profession: profession || null,
  };

  try {
    await api.updatePatient(id, data);

    await Swal.fire({
      icon: "success",
      title: "Actualizado",
      timer: 1200,
      showConfirmButton: false,
    });

    invalidatePatientsCache();
    go("/patients");
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
  }
}
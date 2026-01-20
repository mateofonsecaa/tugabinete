// /public/js/patients/patientCreate.page.js
import * as api from "./patients.api.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const normalizeSpaces = (s) => s.replace(/\s+/g, " ").trim();

const onlyLetters = (s) => /^[\p{L}\s]+$/u.test(s);       // letras unicode + espacios
const onlyDigits = (s) => /^[0-9]+$/.test(s);
const lettersDigits = (s) => /^[\p{L}0-9\s]+$/u.test(s);  // letras + números + espacios

export function initPatientCreatePage() {
  // Volver al listado
  document.getElementById("back-btn")?.addEventListener("click", () => go("/patients"));

  // Abrir calendario al click (Chrome/Edge)
  const birth = document.getElementById("birthDate");
  if (birth) {
    birth.addEventListener("click", () => {
      if (typeof birth.showPicker === "function") birth.showPicker();
    });
  }

  // Filtros mientras escribís (permiten espacios)
  const fullNameEl = document.getElementById("fullName");
  const phoneEl = document.getElementById("phone");
  const addressEl = document.getElementById("address");
  const professionEl = document.getElementById("profession");

  if (fullNameEl) {
    fullNameEl.addEventListener("input", () => {
      fullNameEl.value = fullNameEl.value.replace(/[^\p{L}\s]/gu, "");
    });
  }

  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      phoneEl.value = phoneEl.value.replace(/[^0-9]/g, "");
    });
  }

  if (addressEl) {
    addressEl.addEventListener("input", () => {
      addressEl.value = addressEl.value.replace(/[^\p{L}0-9\s]/gu, "");
    });
  }

  if (professionEl) {
    professionEl.addEventListener("input", () => {
      professionEl.value = professionEl.value.replace(/[^\p{L}\s]/gu, "");
    });
  }

  // Submit
  document.getElementById("patient-form")?.addEventListener("submit", onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();

  const fullName = normalizeSpaces(document.getElementById("fullName").value);
  const birthDate = document.getElementById("birthDate").value;
  const phone = document.getElementById("phone").value.trim();
  const address = normalizeSpaces(document.getElementById("address").value);
  const profession = normalizeSpaces(document.getElementById("profession").value);

  // Validaciones idénticas a editar
  if (!fullName) {
    return Swal.fire({ icon: "error", title: "Error", text: "Nombre: requerido." });
  }
  if (fullName.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Nombre: máximo 20 caracteres." });
  }
  if (!onlyLetters(fullName)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Nombre: solo letras y espacios." });
  }

  if (!birthDate) {
    return Swal.fire({ icon: "error", title: "Error", text: "Fecha de nacimiento: requerida." });
  }

  if (!phone) {
    return Swal.fire({ icon: "error", title: "Error", text: "Teléfono: requerido." });
  }
  if (phone.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Teléfono: máximo 20 caracteres." });
  }
  if (!onlyDigits(phone)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Teléfono: solo números." });
  }

  if (address.length > 30) {
    return Swal.fire({ icon: "error", title: "Error", text: "Dirección: máximo 30 caracteres." });
  }
  if (address && !lettersDigits(address)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Dirección: solo letras, números y espacios." });
  }

  if (profession.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Profesión: máximo 20 caracteres." });
  }

  const data = {
    fullName,
    birthDate,
    phone,
    address: address || null,
    profession: profession || null,
  };

  try {
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
    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

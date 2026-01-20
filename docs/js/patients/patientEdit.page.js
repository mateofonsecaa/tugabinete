// /public/js/patients/patientEdit.page.js
import * as api from "./patients.api.js";

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

export async function initPatientEditPage() {
  const id = getPatientIdFromEditPath();
  if (!id) {
    Swal.fire({ icon: "error", title: "Error", text: "ID inválido" });
    go("/patients");
    return;
  }

  document.getElementById("back-btn")?.addEventListener("click", () => go(`/patients/${id}`));
  document.getElementById("to-details-btn")?.addEventListener("click", () => go(`/patients/${id}`));

  await loadPatientIntoForm(id);

  // Permitir espacios y limitar largo mientras escribe
const fullNameEl = document.getElementById("fullName");
const phoneEl = document.getElementById("phone");
const addressEl = document.getElementById("address");
const professionEl = document.getElementById("profession");

if (fullNameEl) {
  fullNameEl.maxLength = 20;
  fullNameEl.addEventListener("input", () => {
    // deja letras + espacios (no borra espacios)
    fullNameEl.value = fullNameEl.value.replace(/[^\p{L}\s]/gu, "");
  });
}

if (phoneEl) {
  phoneEl.maxLength = 20;
  phoneEl.addEventListener("input", () => {
    // solo números (permite vacío mientras escribe)
    phoneEl.value = phoneEl.value.replace(/[^0-9]/g, "");
  });
}

if (addressEl) {
  addressEl.maxLength = 30;
  addressEl.addEventListener("input", () => {
    // letras + números + espacios
    addressEl.value = addressEl.value.replace(/[^\p{L}0-9\s]/gu, "");
  });
}

if (professionEl) {
  professionEl.maxLength = 20;
  professionEl.addEventListener("input", () => {
    // letras + espacios
    professionEl.value = professionEl.value.replace(/[^\p{L}\s]/gu, "");
  });
}
  // Abrir calendario al click (Chrome/Edge)

  const birth = document.getElementById("birthDate");
  if (birth) {
    birth.addEventListener("click", () => {
      if (typeof birth.showPicker === "function") birth.showPicker();
    });
  }

  document.getElementById("patient-form")?.addEventListener("submit", (e) => onSubmit(e, id));
}

async function loadPatientIntoForm(id) {
  const res = await api.getPatientById(id);
  if (!res.ok) throw new Error("No se pudo cargar el paciente");
  const p = await res.json();

  document.getElementById("patient-title").textContent = p.fullName || "Paciente";

  document.getElementById("fullName").value = p.fullName || "";
  document.getElementById("birthDate").value = toDateInputValue(p.birthDate);
  document.getElementById("phone").value = p.phone || "";
  document.getElementById("address").value = p.address || "";
  document.getElementById("profession").value = p.profession || "";
}

async function onSubmit(e, id) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const profession = document.getElementById("profession").value.trim();

  const onlyLetters = (s) => /^[\p{L}\s]+$/u.test(s);           // letras unicode + espacios
  const onlyDigits = (s) => /^[0-9]+$/.test(s);
  const lettersDigits = (s) => /^[\p{L}0-9\s]+$/u.test(s);      // letras + números + espacios

  // Nombre
  if (fullName.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Nombre: máximo 20 caracteres." });
  }
  if (!onlyLetters(fullName)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Nombre: solo letras y espacios." });
  }

  // Teléfono
  if (phone.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Teléfono: máximo 20 caracteres." });
  }
  if (!onlyDigits(phone)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Teléfono: solo números." });
  }

  // Dirección (si viene vacía, ok)
  if (address.length > 30) {
    return Swal.fire({ icon: "error", title: "Error", text: "Dirección: máximo 30 caracteres." });
  }
  if (address && !lettersDigits(address)) {
    return Swal.fire({ icon: "error", title: "Error", text: "Dirección: solo letras, números y espacios." });
  }

  // Profesión (solo límite, como pediste)
  if (profession.length > 20) {
    return Swal.fire({ icon: "error", title: "Error", text: "Profesión: máximo 20 caracteres." });
  }

  const data = {
    fullName,
    birthDate: document.getElementById("birthDate").value, // yyyy-mm-dd
    phone,
    address: address || null,
    profession: profession || null,
  };

  try {
    const res = await api.updatePatient(id, data);
    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err?.error || "No se pudo guardar");
    }

    await Swal.fire({
      icon: "success",
      title: "Actualizado",
      timer: 1200,
      showConfirmButton: false,
    });

    // Para que el listado se refresque (tu listado usa cache)
    localStorage.removeItem("patients");

    go(`/patients/${id}`);
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

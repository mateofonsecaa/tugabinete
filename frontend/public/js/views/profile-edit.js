// views/profile-edit.js
import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";

export function ProfileEdit() {
  return `
    <div class="profile-edit-page">

      <!-- Top bar (MISMO que Agenda/Profile) -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer (MISMO que Agenda/Profile) -->
      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="/dashboard" data-link><i class="fa-solid fa-house"></i> Dashboard</a>
          <a href="/agenda" data-link><i class="fa-solid fa-calendar-days"></i> Agenda</a>
          <a href="/patients" data-link><i class="fa-solid fa-users"></i> Pacientes</a>
          <a href="/treatments" data-link><i class="fa-solid fa-spa"></i> Tratamientos</a>
          <a href="/profile" data-link><i class="fa-solid fa-user"></i> Perfil</a>
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question"></i> Guías y tutoriales</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- CONTENIDO -->
      <main class="profile-edit-main">
        <button class="btn-back" id="backBtn" type="button" title="Volver">
          <i class="fa-solid fa-arrow-left"></i>
        </button>

        <h1>Mi Perfil</h1>

        <div class="preview-container">
          <div class="preview-frame">
            <img id="previewImage" src="../../images/personaejemplo.png" alt="Foto de perfil">
          </div>

          <button class="edit-photo-btn" id="editPhotoBtn" type="button">
            <i class="fa-solid fa-camera"></i> Cambiar foto
          </button>

          <input type="file" id="profileImage" accept="image/*" class="hidden">

          <div id="zoomContainer" style="display:none;">
            <label for="zoomRange">Ajustar tamaño</label>
            <input type="range" id="zoomRange" min="1" max="2" step="0.01" value="1">
          </div>
        </div>

        <form id="editProfileForm" enctype="multipart/form-data">

          <label>Nombre</label>
          <div class="input-icon">
            <input type="text" id="firstName" maxlength="10" placeholder="Nombre" readonly>
            <i class="fa-solid fa-pen edit-icon" data-edit="firstName" title="Editar"></i>
          </div>

          <label>Apellido</label>
          <div class="input-icon">
            <input type="text" id="lastName" maxlength="10" placeholder="Apellido" readonly>
            <i class="fa-solid fa-pen edit-icon" data-edit="lastName" title="Editar"></i>
          </div>

          <label>Profesión</label>
          <div class="input-icon">
            <input type="text" id="profession" maxlength="30" placeholder="Profesión" readonly>
            <i class="fa-solid fa-pen edit-icon" data-edit="profession" title="Editar"></i>
          </div>

          <label>Teléfono</label>
          <div class="input-icon">
            <input type="text" id="phone" readonly placeholder="Teléfono">
            <i class="fa-solid fa-pen edit-icon" data-edit="phone" title="Editar"></i>
          </div>

          <button type="button" class="save-btn" id="saveBtn">Guardar cambios</button>
        </form>

        <p class="note">Podés ajustar el tamaño de tu foto solo después de seleccionarla.</p>
      </main>
    </div>
  `;
}

export function initProfileEdit() {
  initDrawer();

  const previewImage = document.getElementById("previewImage");
  const profileInput = document.getElementById("profileImage");
  const zoomContainer = document.getElementById("zoomContainer");
  const zoomRange = document.getElementById("zoomRange");

  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const professionInput = document.getElementById("profession");
  const phoneInput = document.getElementById("phone");

  const saveBtn = document.getElementById("saveBtn");
  const editPhotoBtn = document.getElementById("editPhotoBtn");
  const backBtn = document.getElementById("backBtn");

  // 🔙 Volver (SPA)
  backBtn?.addEventListener("click", () => navigate("/profile"));

  // ✏️ Habilitar edición (lapicitos)
  document.querySelectorAll("[data-edit]").forEach((icon) => {
    if (icon.dataset.bound) return;
    icon.dataset.bound = "1";
    icon.addEventListener("click", () => {
      const id = icon.getAttribute("data-edit");
      toggleEdit(id);
    });
  });

  function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.readOnly = !field.readOnly;
    if (!field.readOnly) field.focus();
  }

  // 🖼️ Previsualización de imagen
  editPhotoBtn?.addEventListener("click", () => profileInput?.click());

  profileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      previewImage.src = event.target.result;
      zoomContainer.style.display = "block";
      previewImage.style.transform = `scale(${zoomRange.value})`;
    };
    reader.readAsDataURL(file);
  });

  zoomRange?.addEventListener("input", () => {
    previewImage.style.transform = `scale(${zoomRange.value})`;
  });

  // ⚡ Precarga instantánea desde cache (si existe)
  const cached = getCachedUser();
  if (cached) fillFromUser(cached);

  // 🚀 Cargar user real
  loadProfile();

  async function loadProfile() {
    try {
      const res = await authFetch(`${API_URL}/auth/me`);
      const user = await res.json();

      if (!res.ok) throw new Error(user.error || "Error al cargar perfil");

      saveUserLocally(user);
      fillFromUser(user);

    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Error al cargar perfil",
        text: "Por favor, iniciá sesión nuevamente.",
        confirmButtonColor: "#ffadad",
        background: "#fffdf9",
        color: "#333",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }

  function fillFromUser(user) {
    // separar nombre en first/last (igual que antes)
    if (user?.name) {
      const [first, ...rest] = String(user.name).split(" ");
      firstNameInput.value = first || "";
      lastNameInput.value = rest.join(" ") || "";
    } else {
      firstNameInput.value = "";
      lastNameInput.value = "";
    }

    professionInput.value = user?.profession || "";
    phoneInput.value = user?.phone || "";

    const fallback = "/images/personaejemplo.png";
    previewImage.src = user?.profileImage ? user.profileImage : fallback;
    previewImage.style.transform = `scale(1)`;
    if (zoomContainer) zoomContainer.style.display = "none";
    if (zoomRange) zoomRange.value = "1";

    // drawer username
    const du = document.getElementById("drawer-username");
    if (du) du.textContent = user?.name || "Profesional";
  }

  // 💾 Guardar cambios (misma lógica que tu viejo)
  saveBtn?.addEventListener("click", async () => {
    const confirmed = await Swal.fire({
      title: "¿Guardar cambios?",
      text: "Se actualizará tu información personal.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ffadad",
      cancelButtonColor: "#ccc",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      background: "#fffdf9",
      color: "#333",
    });

    if (!confirmed.isConfirmed) return;

    const formData = new FormData();
    formData.append("firstName", firstNameInput.value.trim());
    formData.append("lastName", lastNameInput.value.trim());
    formData.append("profession", professionInput.value.trim());
    formData.append("phone", phoneInput.value.trim());

    // si hay imagen, aplico zoom en canvas como tu viejo
    const file = profileInput?.files?.[0];
    if (file) {
      const img = new Image();
      const zoom = parseFloat(zoomRange?.value || "1");

      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.onload = () => resolve();
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;

      const scaledWidth = img.width * zoom;
      const scaledHeight = img.height * zoom;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      const scaledFile = new File([blob], file.name, { type: "image/jpeg" });
      formData.append("profileImage", scaledFile);
    }

    try {
  const res = await authFetch(`${API_URL}/auth/edit-profile`, {
    method: "PUT",
    body: formData,
  });

  const raw = await res.text(); // <-- clave
  console.log("EDIT PROFILE STATUS:", res.status);
  console.log("EDIT PROFILE RAW:", raw);

  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    throw new Error(data.error || data.message || raw || "Error al actualizar perfil");
  }

  // ✅ refrescar cache del user
  const meRes = await authFetch(`${API_URL}/auth/me`);
  if (meRes.ok) {
    const me = await meRes.json();
    saveUserLocally(me);
  }

  await Swal.fire({
    icon: "success",
    title: "Perfil actualizado",
    text: "Tus datos fueron guardados correctamente",
    showConfirmButton: false,
    timer: 1800,
    background: "#fffdf9",
    color: "#333",
  });

  navigate("/profile");

} catch (err) {
  console.error("EDIT PROFILE ERROR:", err);

  await Swal.fire({
    icon: "error",
    title: "Error",
    text: err.message || "No se pudo actualizar el perfil.",
    confirmButtonColor: "#ffadad",
    background: "#fffdf9",
    color: "#333",
  });
}

  });
}

/* ======================
   Helpers
====================== */

function navigate(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getCachedUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

function saveUserLocally(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

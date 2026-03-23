import { authFetch } from "../core/authFetch.js";
import { getCurrentUser, replaceCurrentUser } from "../core/session.js";
import { initDrawer } from "../components/drawer.js";

const DEFAULT_AVATAR = "../../images/personaejemplo.png";

let activeBeforeUnloadHandler = null;
let activeNavGuardHandler = null;

export function ProfileEdit() {
  return `
    <div class="profile-edit-page">
      <div class="top-bar">
        <button id="open-menu" class="menu-btn" type="button" aria-label="Abrir menú">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn" type="button" aria-label="Cerrar menú">
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

      <main class="profile-edit-main">
        <div class="profile-edit-shell">
          <div class="page-head">
            <button class="btn-back" id="backBtn" type="button" aria-label="Volver a perfil">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Volver</span>
            </button>
          </div>

          <section class="account-grid">
            <div class="account-main-col">
              <section class="account-card account-summary-card">
                <div class="summary-header">
                  <img id="summaryAvatar" class="summary-avatar" src="${DEFAULT_AVATAR}" alt="Foto de perfil">
                  <div class="summary-copy">
                    <h2 id="summaryName">—</h2>
                    <p id="summaryProfession">—</p>
                    <span id="summaryEmailState" class="state-chip">Correo verificado</span>
                  </div>
                </div>
              </section>

              <form id="profileForm" class="profile-form-stack" novalidate>
                <section class="account-card">
                  <div class="card-head">
                    <h3>Información personal y profesional</h3>
                    <p>Completá los datos principales de tu perfil dentro de TuGabinete.</p>
                  </div>

                  <div class="form-grid">
                    <div class="field">
                      <label for="firstName">Nombre</label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autocomplete="given-name"
                        maxlength="40"
                        required
                      >
                      <small class="field-error" data-error-for="firstName"></small>
                    </div>

                    <div class="field">
                      <label for="lastName">Apellido</label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autocomplete="family-name"
                        maxlength="60"
                        required
                      >
                      <small class="field-error" data-error-for="lastName"></small>
                    </div>

                    <div class="field field-span-2">
                      <label for="displayName">Nombre visible profesional</label>
                      <input
                        id="displayName"
                        name="displayName"
                        type="text"
                        autocomplete="nickname"
                        maxlength="80"
                        placeholder="Opcional. Si lo dejás vacío, se usará tu nombre y apellido."
                      >
                      <small class="field-help">Es el nombre que podés mostrar como referencia profesional.</small>
                      <small class="field-error" data-error-for="displayName"></small>
                    </div>

                    <div class="field">
                      <label for="profession">Profesión / Rubro</label>
                      <input
                        id="profession"
                        name="profession"
                        type="text"
                        maxlength="80"
                        placeholder="Ej. Cosmetóloga, Esteticista, Dermocosmiatra"
                      >
                      <small class="field-error" data-error-for="profession"></small>
                    </div>

                    <div class="field">
                      <label for="phone">Teléfono / WhatsApp</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        placeholder="+54 9 351..."
                      >
                      <small class="field-help">Se guardará normalizado para evitar inconsistencias.</small>
                      <small class="field-error" data-error-for="phone"></small>
                    </div>

                    <div class="field field-span-2">
                      <label for="bio">Descripción profesional</label>
                      <textarea
                        id="bio"
                        name="bio"
                        maxlength="280"
                        rows="4"
                        placeholder="Contá brevemente qué hacés, tu enfoque y cómo trabajás."
                      ></textarea>
                      <div class="field-meta">
                        <small class="field-help">Máximo 280 caracteres.</small>
                        <small id="bioCounter">0 / 280</small>
                      </div>
                      <small class="field-error" data-error-for="bio"></small>
                    </div>
                  </div>

                  <div class="form-actions-inline">
                    <button type="button" class="btn-cancel" id="discardProfileBtn" disabled>Descartar</button>
                    <button type="submit" class="btn-save" id="saveProfileBtn" disabled>Guardar cambios</button>
                  </div>
                </section>
              </form>
            </div>

            <div class="account-side-col">
              <section class="account-card">
                <div class="card-head">
                  <h3>Foto de perfil</h3>
                  <p>Usá una imagen clara. Se ajustará a formato cuadrado.</p>
                </div>

                <div class="avatar-card-body">
                  <div class="avatar-frame">
                    <img id="avatarPreview" src="${DEFAULT_AVATAR}" alt="Vista previa del avatar">
                  </div>

                  <div class="avatar-actions">
                    <button type="button" class="btn-save" id="changeAvatarBtn">Cambiar foto</button>
                    <button type="button" class="btn-cancel" id="removeAvatarBtn">Eliminar foto</button>
                  </div>

                  <input id="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden">

                  <small class="field-help">Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB.</small>
                  <small class="field-error" data-error-for="avatar"></small>
                </div>
              </section>

              <section class="account-card">
                <div class="card-head">
                  <h3>Sesiones y seguridad</h3>
                  <p>Cerrá todas las sesiones abiertas en otros dispositivos.</p>
                </div>

                <button type="button" class="btn-cancel full-width" id="logoutOthersBtn">
                  Cerrar otras sesiones
                </button>
              </section>
            </div>
          </section>

          <div id="stickyActions" class="sticky-actions" hidden>
            <button type="button" class="btn-cancel" id="discardProfileBtnMobile">Descartar</button>
            <button type="button" class="btn-save" id="saveProfileBtnMobile" disabled>Guardar cambios</button>
          </div>
        </div>
      </main>

      <div id="avatarCropModal" class="avatar-crop-modal" hidden>
        <div class="avatar-crop-dialog">
          <div class="avatar-crop-head">
            <h3>Recortar foto</h3>
            <button type="button" class="close-btn" id="closeCropperBtn" aria-label="Cerrar recorte">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="avatar-crop-body">
            <img id="cropperImage" alt="Recorte de avatar">
          </div>

          <div class="avatar-crop-actions">
            <button type="button" class="btn-cancel" id="cancelCropBtn">Cancelar</button>
            <button type="button" class="btn-save" id="confirmCropBtn">Usar foto</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initProfileEdit() {
  initDrawer();

  const state = {
    initialProfile: null,
    currentUser: null,
    isDirty: false,
    isSavingProfile: false,
    isCropperReady: false,
    isSavingAvatar: false,
    cropper: null,
    pendingAvatarObjectUrl: null,
  };

  const refs = {
    backBtn: document.getElementById("backBtn"),
    profileForm: document.getElementById("profileForm"),
    saveProfileBtn: document.getElementById("saveProfileBtn"),
    saveProfileBtnMobile: document.getElementById("saveProfileBtnMobile"),
    discardProfileBtn: document.getElementById("discardProfileBtn"),
    discardProfileBtnMobile: document.getElementById("discardProfileBtnMobile"),
    stickyActions: document.getElementById("stickyActions"),
    bioCounter: document.getElementById("bioCounter"),
    avatarPreview: document.getElementById("avatarPreview"),
    summaryAvatar: document.getElementById("summaryAvatar"),
    changeAvatarBtn: document.getElementById("changeAvatarBtn"),
    removeAvatarBtn: document.getElementById("removeAvatarBtn"),
    avatarInput: document.getElementById("avatarInput"),
    logoutOthersBtn: document.getElementById("logoutOthersBtn"),
    summaryName: document.getElementById("summaryName"),
    summaryProfession: document.getElementById("summaryProfession"),
    summaryEmailState: document.getElementById("summaryEmailState"),
    cropModal: document.getElementById("avatarCropModal"),
    cropperImage: document.getElementById("cropperImage"),
    closeCropperBtn: document.getElementById("closeCropperBtn"),
    cancelCropBtn: document.getElementById("cancelCropBtn"),
    confirmCropBtn: document.getElementById("confirmCropBtn"),
  };

  const profileFields = {
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
    displayName: document.getElementById("displayName"),
    profession: document.getElementById("profession"),
    phone: document.getElementById("phone"),
    bio: document.getElementById("bio"),
  };

  bindStaticEvents();
  syncCropperActionState();
  bootstrap();

  async function bootstrap() {
    const cachedUser = getCurrentUser();
    if (cachedUser) {
      state.currentUser = cachedUser;
      renderAccount(cachedUser);
      hydrateProfileForm(cachedUser);
    }

    try {
      const res = await authFetch(`/account`);
      const user = await res.json();
      if (!res.ok) throw new Error(user.message || "No se pudo cargar la cuenta.");

      state.currentUser = user;
      replaceCurrentUser(user);
      renderAccount(user);
      hydrateProfileForm(user);
    } catch (error) {
      await notifyError("Error", error.message || "No se pudo cargar la cuenta.");
    }
  }

  function bindStaticEvents() {
    refs.backBtn?.addEventListener("click", async () => {
      if (!(await confirmLeaveIfDirty())) return;
      navigate("/profile");
    });

    refs.profileForm?.addEventListener("input", handleProfileInput);
    refs.profileForm?.addEventListener("submit", handleProfileSubmit);

    refs.discardProfileBtn?.addEventListener("click", discardProfileChanges);
    refs.discardProfileBtnMobile?.addEventListener("click", discardProfileChanges);
    refs.saveProfileBtnMobile?.addEventListener("click", () =>
      refs.profileForm?.requestSubmit()
    );

    refs.changeAvatarBtn?.addEventListener("click", () => refs.avatarInput?.click());
    refs.avatarInput?.addEventListener("change", handleAvatarSelected);
    refs.removeAvatarBtn?.addEventListener("click", handleAvatarDelete);

    refs.closeCropperBtn?.addEventListener("click", closeCropperModal);
    refs.cancelCropBtn?.addEventListener("click", closeCropperModal);
    refs.confirmCropBtn?.addEventListener("click", confirmAvatarCrop);

    refs.cropModal?.addEventListener("click", (event) => {
      if (event.target === refs.cropModal) {
        closeCropperModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !refs.cropModal.hidden) {
        closeCropperModal();
      }
    });

    refs.logoutOthersBtn?.addEventListener("click", handleLogoutOthers);

    if (activeBeforeUnloadHandler) {
      window.removeEventListener("beforeunload", activeBeforeUnloadHandler);
    }

    if (activeNavGuardHandler) {
      document.removeEventListener("click", activeNavGuardHandler, true);
    }

    activeBeforeUnloadHandler = handleBeforeUnload;
    activeNavGuardHandler = handleNavGuard;

    window.addEventListener("beforeunload", activeBeforeUnloadHandler);
    document.addEventListener("click", activeNavGuardHandler, true);
  }

  function handleProfileInput() {
    clearProfileErrors();
    updateBioCounter();
    state.isDirty = hasProfileChanges();
    syncProfileActionState();
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (state.isSavingProfile) return;
    if (!state.isDirty) return;
    if (!hasProfileChanges()) return;

    state.isSavingProfile = true;
    syncProfileActionState();
    clearProfileErrors();

    try {
      const payload = getProfilePayload();

      const res = await authFetch(`/account/profile`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        applyProfileErrors(data.fieldErrors || {});
        await notifyError("Error", data.message || "No se pudo actualizar el perfil.");
        return;
      }

      state.currentUser = data.user;
      replaceCurrentUser(data.user);
      state.initialProfile = toProfileState(data.user);
      state.isDirty = false;
      renderAccount(data.user);
      hydrateProfileForm(data.user);

      await notifySuccess(
        "Perfil actualizado",
        data.message || "Tus datos se guardaron correctamente."
      );
    } catch (error) {
      await notifyError("Error", error.message || "No se pudo actualizar el perfil.");
    } finally {
      state.isSavingProfile = false;
      syncProfileActionState();
    }
  }

  async function handleAvatarSelected(event) {
    clearFieldError("avatar");

    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.Cropper) {
      setFieldError("avatar", "Cropper.js no se cargó correctamente.");
      refs.avatarInput.value = "";
      await notifyError("Error", "Cropper.js no se cargó correctamente.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFieldError("avatar", "Formato no permitido. Usá JPG, PNG o WEBP.");
      refs.avatarInput.value = "";
      await notifyError("Error", "Formato no permitido. Usá JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldError("avatar", "La imagen supera los 5 MB permitidos.");
      refs.avatarInput.value = "";
      await notifyError("Error", "La imagen supera los 5 MB permitidos.");
      return;
    }

    state.isCropperReady = false;
    state.isSavingAvatar = false;
    syncCropperActionState();

    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }

    if (state.pendingAvatarObjectUrl) {
      URL.revokeObjectURL(state.pendingAvatarObjectUrl);
      state.pendingAvatarObjectUrl = null;
    }

    state.pendingAvatarObjectUrl = URL.createObjectURL(file);

    refs.cropperImage.onload = () => {
      if (state.cropper) {
        state.cropper.destroy();
        state.cropper = null;
      }

      state.cropper = new window.Cropper(refs.cropperImage, {
        aspectRatio: 1,
        viewMode: 2,
        dragMode: "move",
        autoCropArea: 1,
        responsive: true,
        background: false,
        modal: true,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready() {
          state.isCropperReady = true;
          syncCropperActionState();
        },
      });
    };

    refs.cropperImage.onerror = async () => {
      state.isCropperReady = false;
      syncCropperActionState();
      setFieldError("avatar", "No se pudo cargar la imagen seleccionada.");
      await notifyError("Error", "No se pudo cargar la imagen seleccionada.");
    };

    refs.cropModal.hidden = false;
    document.body.style.overflow = "hidden";
    refs.cropperImage.src = state.pendingAvatarObjectUrl;
  }

  async function confirmAvatarCrop() {
    if (!state.cropper) return;
    if (!state.isCropperReady) return;
    if (state.isSavingAvatar) return;

    state.isSavingAvatar = true;
    syncCropperActionState();
    clearFieldError("avatar");

    try {
      const canvas = state.cropper.getCroppedCanvas({
        width: 512,
        height: 512,
        imageSmoothingQuality: "high",
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9)
      );

      if (!blob) {
        setFieldError("avatar", "No se pudo generar la imagen recortada.");
        await notifyError("Error", "No se pudo generar la imagen recortada.");
        return;
      }

      const formData = new FormData();
      formData.append(
        "avatar",
        new File([blob], `avatar-${Date.now()}.webp`, { type: "image/webp" })
      );

      const res = await authFetch(`/account/avatar`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFieldError("avatar", data.message || "No se pudo actualizar la foto.");
        await notifyError("Error", data.message || "No se pudo actualizar la foto.");
        return;
      }

      state.currentUser = data.user;
      replaceCurrentUser(data.user);
      renderAccount(data.user);
      closeCropperModal(true);

      await notifySuccess(
        "Foto actualizada",
        data.message || "La foto de perfil se actualizó correctamente."
      );
    } catch (error) {
      setFieldError("avatar", error.message || "No se pudo actualizar la foto.");
      await notifyError("Error", error.message || "No se pudo actualizar la foto.");
    } finally {
      state.isSavingAvatar = false;
      syncCropperActionState();
    }
}

  async function handleAvatarDelete() {
    const confirmed = await confirmAction(
      "¿Eliminar la foto de perfil?",
      "Vas a volver al avatar por defecto."
    );
    if (!confirmed) return;

    clearFieldError("avatar");

    try {
      const res = await authFetch(`/account/avatar`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFieldError("avatar", data.message || "No se pudo eliminar la foto.");
        await notifyError("Error", data.message || "No se pudo eliminar la foto.");
        return;
      }

      state.currentUser = data.user;
      replaceCurrentUser(data.user);
      renderAccount(data.user);

      await notifySuccess(
        "Foto eliminada",
        data.message || "La foto de perfil fue eliminada."
      );
    } catch (error) {
      setFieldError("avatar", error.message || "No se pudo eliminar la foto.");
      await notifyError("Error", error.message || "No se pudo eliminar la foto.");
    }
  }

  async function handleLogoutOthers() {
    const confirmed = await confirmAction(
      "¿Cerrar las demás sesiones?",
      "La sesión actual se mantendrá activa."
    );
    if (!confirmed) return;

    refs.logoutOthersBtn.disabled = true;

    try {
      const res = await authFetch(`/account/sessions/logout-others`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        await notifyError(
          "Error",
          data.message || "No se pudieron cerrar las demás sesiones."
        );
        return;
      }

      await notifySuccess(
        "Sesiones cerradas",
        data.message || "Se cerraron las demás sesiones activas."
      );
    } catch (error) {
      await notifyError(
        "Error",
        error.message || "No se pudieron cerrar las demás sesiones."
      );
    } finally {
      refs.logoutOthersBtn.disabled = false;
    }
  }

  async function confirmLeaveIfDirty() {
    if (!state.isDirty) return true;
    return confirmAction(
      "Tenés cambios sin guardar",
      "Si salís ahora, vas a perder los cambios del formulario principal."
    );
  }

  function handleBeforeUnload(event) {
    if (!state.isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  }

  async function handleNavGuard(event) {
    const target = event.target.closest("[data-link], #logout");
    if (!target || !state.isDirty) return;

    const leave = await confirmLeaveIfDirty();
    if (leave) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }

  function renderAccount(user) {
    if (!user) return;

    const displayName =
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.name ||
      "Profesional";

    const profession = user.profession || "Sin profesión cargada";
    const avatar = user.profileImage || DEFAULT_AVATAR;
    const emailState =
      user.pendingEmail
        ? `Cambio pendiente: ${user.pendingEmail}`
        : user.emailVerified === false
        ? "Correo no verificado"
        : "Correo verificado";

    refs.summaryName.textContent = displayName;
    refs.summaryProfession.textContent = profession;
    refs.summaryEmailState.textContent = emailState;
    refs.avatarPreview.src = avatar;
    refs.summaryAvatar.src = avatar;

    const drawerUsername = document.getElementById("drawer-username");
    if (drawerUsername) drawerUsername.textContent = displayName;
  }

  function hydrateProfileForm(user) {
    const profile = toProfileState(user);

    profileFields.firstName.value = profile.firstName;
    profileFields.lastName.value = profile.lastName;
    profileFields.displayName.value = profile.displayName;
    profileFields.profession.value = profile.profession;
    profileFields.phone.value = profile.phone;
    profileFields.bio.value = profile.bio;

    state.initialProfile = profile;
    state.isDirty = false;
    updateBioCounter();
    syncProfileActionState();
  }

  function toProfileState(user) {
    return {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      displayName: user?.displayName || "",
      profession: user?.profession || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    };
  }

  function getProfilePayload() {
    return {
      firstName: profileFields.firstName.value,
      lastName: profileFields.lastName.value,
      displayName: profileFields.displayName.value,
      profession: profileFields.profession.value,
      phone: profileFields.phone.value,
      bio: profileFields.bio.value,
    };
  }

  function hasProfileChanges() {
    const current = normalizeProfileState(getProfilePayload());
    const initial = normalizeProfileState(state.initialProfile || {});
    return JSON.stringify(current) !== JSON.stringify(initial);
  }

  function normalizeProfileState(data) {
    return {
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      displayName: String(data.displayName || "").trim(),
      profession: String(data.profession || "").trim(),
      phone: String(data.phone || "").trim(),
      bio: String(data.bio || "").trim(),
    };
  }

  function syncProfileActionState() {
    const disabled = !state.isDirty || state.isSavingProfile;
    refs.saveProfileBtn.disabled = disabled;
    refs.saveProfileBtnMobile.disabled = disabled;
    refs.discardProfileBtn.disabled = !state.isDirty || state.isSavingProfile;
    refs.discardProfileBtnMobile.disabled = !state.isDirty || state.isSavingProfile;
    refs.stickyActions.hidden = !state.isDirty;

    refs.saveProfileBtn.textContent = state.isSavingProfile
      ? "Guardando..."
      : "Guardar cambios";
  }

  function discardProfileChanges() {
    if (!state.initialProfile) return;
    if (!state.isDirty) return;

    hydrateProfileForm(state.initialProfile);
    clearProfileErrors();
  }

  function updateBioCounter() {
    const length = profileFields.bio.value.length;
    refs.bioCounter.textContent = `${length} / 280`;
  }

  function setFieldError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message || "";
  }

  function clearFieldError(field) {
    setFieldError(field, "");
  }

  function clearProfileErrors() {
    ["firstName", "lastName", "displayName", "profession", "phone", "bio"].forEach(
      clearFieldError
    );
  }

  function applyProfileErrors(fieldErrors) {
    clearProfileErrors();

    Object.entries(fieldErrors || {}).forEach(([field, message]) => {
      setFieldError(field, message);
    });
  }

  function syncCropperActionState() {
    const shouldDisableUsePhoto =
      !state.isCropperReady || state.isSavingAvatar;

    refs.confirmCropBtn.disabled = shouldDisableUsePhoto;
    refs.cancelCropBtn.disabled = state.isSavingAvatar;
    refs.closeCropperBtn.disabled = state.isSavingAvatar;

    refs.confirmCropBtn.textContent = state.isSavingAvatar
      ? "Guardando..."
      : "Usar foto";
  }

  function closeCropperModal(force = false) {
    if (state.isSavingAvatar && !force) return;

    refs.cropModal.hidden = true;
    document.body.style.overflow = "";

    state.isCropperReady = false;
    state.isSavingAvatar = false;

    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }

    if (state.pendingAvatarObjectUrl) {
      URL.revokeObjectURL(state.pendingAvatarObjectUrl);
      state.pendingAvatarObjectUrl = null;
    }

    refs.cropperImage.removeAttribute("src");
    refs.avatarInput.value = "";
    syncCropperActionState();
  }

  async function confirmAction(title, text) {
    if (window.Swal) {
      const result = await window.Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#ffadad",
        cancelButtonColor: "#cfcfcf",
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
        background: "#fffdf9",
        color: "#333",
      });
      return result.isConfirmed;
    }

    return window.confirm(`${title}\n\n${text}`);
  }

  async function notifySuccess(title, text) {
    if (window.Swal) {
      return window.Swal.fire({
        icon: "success",
        title,
        text,
        confirmButtonColor: "#ffadad",
        background: "#fffdf9",
        color: "#333",
      });
    }

    alert(`${title}\n\n${text}`);
  }

  async function notifyError(title, text) {
    if (window.Swal) {
      return window.Swal.fire({
        icon: "error",
        title,
        text,
        confirmButtonColor: "#ffadad",
        background: "#fffdf9",
        color: "#333",
      });
    }

    alert(`${title}\n\n${text}`);
  }

  function navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
import * as api from "./feedback.api.js";
import { authFetch } from "../core/authFetch.js";

const MIN_DESCRIPTION_LENGTH = 12;
const MAX_DESCRIPTION_LENGTH = 1200;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CATEGORY_LABELS = {
  IDEA_NUEVA: "Idea nueva",
  MEJORA_VISUAL: "Mejora visual",
  ERROR_PROBLEMA: "Error o problema",
  NUEVA_FUNCION: "Nueva función",
  EXPERIENCIA_DE_USO: "Experiencia de uso",
  OTRA: "Otra",
};

const PRIVATE_CATEGORY_NOTE =
  "Los reportes de error se guardan en privado y no aparecen en la comunidad.";

const PUBLIC_CATEGORY_NOTE =
  "Esta sugerencia se publica en la comunidad para que otros usuarios puedan votarla.";

const state = {
  activeTab: "submit",
  items: [],
  isSubmitting: false,
  pendingVotes: new Set(),
  previewUrl: null,
};

let els = {};

export async function initFeedbackPage() {
  cacheElements();
  bindTabs();
  bindForm();
  bindCommunityActions();
  updateCharCount();
  updatePrivacyNote();
  await Promise.all([loadDrawerUser(), loadCommunityIdeas()]);
}

function cacheElements() {
  els.flash = document.getElementById("feedbackFlash");
  els.tabs = Array.from(document.querySelectorAll("[data-feedback-tab]"));
  els.panels = Array.from(document.querySelectorAll("[data-feedback-panel]"));
  els.form = document.getElementById("feedbackForm");
  els.category = document.getElementById("feedbackCategory");
  els.description = document.getElementById("feedbackDescription");
  els.charCount = document.getElementById("feedbackCharCount");
  els.attachment = document.getElementById("feedbackAttachment");
  els.attachmentMeta = document.getElementById("feedbackAttachmentMeta");
  els.attachmentPreview = document.getElementById("feedbackAttachmentPreview");
  els.contactAllowed = document.getElementById("feedbackContactAllowed");
  els.submitBtn = document.getElementById("feedbackSubmitBtn");
  els.privacyNote = document.getElementById("feedbackPrivacyNote");
  els.communityCategory = document.getElementById("feedbackCommunityCategory");
  els.communitySort = document.getElementById("feedbackCommunitySort");
  els.communityRefresh = document.getElementById("feedbackRefreshBtn");
  els.list = document.getElementById("feedbackList");
  els.drawerUsername = document.getElementById("drawer-username");
}

function bindTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.feedbackTab));
  });
}

function switchTab(nextTab) {
  state.activeTab = nextTab;

  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.feedbackTab === nextTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  els.panels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.feedbackPanel !== nextTab);
  });
}

function bindForm() {
  els.description?.addEventListener("input", updateCharCount);
  els.category?.addEventListener("change", updatePrivacyNote);
  els.attachment?.addEventListener("change", onAttachmentChange);
  els.form?.addEventListener("submit", onSubmit);
}

function bindCommunityActions() {
  els.communityCategory?.addEventListener("change", loadCommunityIdeas);
  els.communitySort?.addEventListener("change", loadCommunityIdeas);
  els.communityRefresh?.addEventListener("click", loadCommunityIdeas);

  els.list?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-vote-id]");
    if (!button) return;

    const id = Number(button.dataset.voteId);
    const shouldVote = button.dataset.voted !== "true";

    await toggleVote(id, shouldVote);
  });
}

async function loadDrawerUser() {
  try {
    const res = await authFetch("/auth/me");
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "No se pudo cargar el usuario.");

    if (els.drawerUsername) {
      els.drawerUsername.textContent = data.name || "Profesional";
    }
  } catch {
    if (els.drawerUsername) {
      els.drawerUsername.textContent = "Profesional";
    }
  }
}

function updateCharCount() {
  const length = (els.description?.value || "").length;
  if (els.charCount) {
    els.charCount.textContent = `${length} / ${MAX_DESCRIPTION_LENGTH}`;
  }
}

function updatePrivacyNote() {
  if (!els.privacyNote || !els.category) return;

  const isPrivate = els.category.value === "ERROR_PROBLEMA";
  els.privacyNote.textContent = isPrivate ? PRIVATE_CATEGORY_NOTE : PUBLIC_CATEGORY_NOTE;
  els.privacyNote.classList.toggle("is-private", isPrivate);
}

function onAttachmentChange() {
  clearAttachmentPreview();

  const file = els.attachment?.files?.[0];
  if (!file) return;

  const validationError = validateAttachment(file);
  if (validationError) {
    showFlash("error", validationError);
    els.attachment.value = "";
    return;
  }

  if (els.attachmentMeta) {
    els.attachmentMeta.textContent = `${file.name} · ${formatBytes(file.size)}`;
  }

  state.previewUrl = URL.createObjectURL(file);

  if (els.attachmentPreview) {
    els.attachmentPreview.innerHTML = `
      <img src="${state.previewUrl}" alt="Vista previa de captura adjunta" />
    `;
    els.attachmentPreview.classList.remove("is-hidden");
  }
}

function clearAttachmentPreview() {
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }

  if (els.attachmentPreview) {
    els.attachmentPreview.innerHTML = "";
    els.attachmentPreview.classList.add("is-hidden");
  }

  if (els.attachmentMeta) {
    els.attachmentMeta.textContent = "";
  }
}

async function onSubmit(event) {
  event.preventDefault();
  if (state.isSubmitting) return;

  clearFlash();

  const category = els.category?.value || "";
  const description = (els.description?.value || "").trim();
  const attachment = els.attachment?.files?.[0] || null;

  if (!category) {
    showFlash("error", "Elegí una categoría.");
    return;
  }

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    showFlash(
      "error",
      `La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`
    );
    return;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    showFlash(
      "error",
      `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`
    );
    return;
  }

  if (attachment) {
    const attachmentError = validateAttachment(attachment);
    if (attachmentError) {
      showFlash("error", attachmentError);
      return;
    }
  }

  const formData = new FormData();
  formData.append("category", category);
  formData.append("description", description);
  formData.append("contactAllowed", String(Boolean(els.contactAllowed?.checked)));

  if (attachment) {
    formData.append("attachment", attachment);
  }

  setSubmitting(true);

  try {
    const res = await api.createFeedback(formData);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No se pudo enviar tu sugerencia.");
    }

    const item = data.item || null;
    const successMessage = data.message || "Tu sugerencia fue enviada correctamente.";

    showFlash("success", successMessage);
    els.form?.reset();
    updateCharCount();
    updatePrivacyNote();
    clearAttachmentPreview();

    if (item?.isPublic) {
      switchTab("community");
      await loadCommunityIdeas();
    }
  } catch (error) {
    showFlash("error", error.message || "No se pudo enviar tu sugerencia.");
  } finally {
    setSubmitting(false);
  }
}

function setSubmitting(isSubmitting) {
  state.isSubmitting = isSubmitting;
  if (!els.submitBtn) return;

  els.submitBtn.disabled = isSubmitting;
  els.submitBtn.classList.toggle("is-loading", isSubmitting);

  const label = els.submitBtn.querySelector(".feedback-submit-btn__label");
  if (label) {
    label.textContent = isSubmitting ? "Enviando..." : "Enviar";
  }
}

async function loadCommunityIdeas() {
  if (!els.list) return;

  els.list.innerHTML = `
    <div class="feedback-empty feedback-empty--loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Cargando ideas...</p>
    </div>
  `;

  try {
    const res = await api.listFeedback({
      sort: els.communitySort?.value || "top",
      category: els.communityCategory?.value || "ALL",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No se pudieron cargar las ideas.");
    }

    state.items = Array.isArray(data.items) ? data.items : [];
    renderCommunityIdeas();
  } catch (error) {
    els.list.innerHTML = `
      <div class="feedback-empty feedback-empty--error">
        <p>${escapeHtml(error.message || "No se pudieron cargar las ideas.")}</p>
      </div>
    `;
  }
}

function renderCommunityIdeas() {
  if (!els.list) return;

  if (!state.items.length) {
    els.list.innerHTML = `
      <div class="feedback-empty">
        <i class="fa-regular fa-lightbulb"></i>
        <p>Todavía no hay ideas públicas para mostrar.</p>
      </div>
    `;
    return;
  }

  els.list.innerHTML = state.items
    .map((item) => {
      const isPending = state.pendingVotes.has(item.id);
      const voteLabel = item.didVote ? "Quitar voto" : "Votar";
      const attachment = item.attachmentUrl
        ? `
          <a class="feedback-card__attachment" href="${item.attachmentUrl}" target="_blank" rel="noreferrer">
            <i class="fa-regular fa-image"></i> Ver captura
          </a>
        `
        : "";

      return `
        <article class="feedback-item-card">
          <div class="feedback-item-card__body">
            <div class="feedback-item-card__meta">
              <span class="feedback-badge">${escapeHtml(getCategoryLabel(item.category))}</span>
              <span class="feedback-date">${escapeHtml(formatFeedbackDate(item.createdAt))}</span>
            </div>

            <p class="feedback-item-card__description">${nl2br(escapeHtml(item.description || ""))}</p>
            ${attachment}
          </div>

          <div class="feedback-item-card__aside">
            <button
              type="button"
              class="feedback-vote-btn ${item.didVote ? "is-voted" : ""} ${isPending ? "is-disabled" : ""}"
              data-vote-id="${item.id}"
              data-voted="${item.didVote ? "true" : "false"}"
              ${isPending ? "disabled" : ""}
            >
              <i class="fa-solid fa-arrow-up"></i>
              <span>${voteLabel}</span>
            </button>
            <strong class="feedback-votes-count">${Number(item.votesCount || 0)}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

async function toggleVote(id, shouldVote) {
  if (!Number.isInteger(id) || state.pendingVotes.has(id)) return;

  clearFlash();
  state.pendingVotes.add(id);
  renderCommunityIdeas();

  try {
    const res = shouldVote ? await api.voteFeedback(id) : await api.unvoteFeedback(id);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No se pudo actualizar el voto.");
    }

    const target = state.items.find((item) => item.id === id);
    if (target && data.item) {
      target.didVote = Boolean(data.item.didVote);
      target.votesCount = Number(data.item.votesCount || 0);
    }
  } catch (error) {
    showFlash("error", error.message || "No se pudo actualizar el voto.");
  } finally {
    state.pendingVotes.delete(id);
    renderCommunityIdeas();
  }
}

function showFlash(type, message) {
  if (!els.flash) return;

  els.flash.innerHTML = `
    <div class="feedback-flash__item is-${type}">
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function clearFlash() {
  if (els.flash) {
    els.flash.innerHTML = "";
  }
}

function validateAttachment(file) {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return "La captura debe ser JPG, PNG o WEBP.";
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return "La captura supera el máximo de 5 MB.";
  }

  return null;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "Otra";
}

function formatFeedbackDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Hace un rato";
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value) {
  return String(value).replace(/\n/g, "<br>");
}
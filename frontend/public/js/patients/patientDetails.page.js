import * as api from "./patients.api.js";

const MAX_HOMECARE_ITEMS = 10;

let currentPatientId = null;
let currentHomeCarePlan = null;
let homeCareDraftItems = [];
let isSavingHomeCare = false;

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientIdFromPath() {
  // "/patients/123"
  const parts = window.location.pathname.split("/").filter(Boolean);
  const id = Number(parts[1]);
  return Number.isFinite(id) ? id : null;
}

function fmtDate(isoOrDate) {
  if (!isoOrDate) return "-";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR");
}

function row(label, value) {
  return `<tr><td style="font-weight:600;">${label}</td><td>${value ?? "-"}</td></tr>`;
}

function textOrDash(value) {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  return str ? str : "-";
}

function renderHomeCare(plan) {
  const emptyBox = document.getElementById("homecare-empty");
  const contentBox = document.getElementById("homecare-content");
  const addBtn = document.getElementById("homecare-add-btn");
  const editBtn = document.getElementById("homecare-edit-btn");

  const titleEl = document.getElementById("homecare-title");
  const objectiveEl = document.getElementById("homecare-objective");
  const startDateEl = document.getElementById("homecare-start-date");
  const endDateEl = document.getElementById("homecare-end-date");
  const statusEl = document.getElementById("homecare-status");
  const notesEl = document.getElementById("homecare-notes");
  const itemsEl = document.getElementById("homecare-items");

  if (!emptyBox || !contentBox || !addBtn || !editBtn || !itemsEl) return;

  if (!plan) {
    emptyBox.hidden = false;
    contentBox.hidden = true;
    addBtn.hidden = false;
    editBtn.hidden = true;
    itemsEl.innerHTML = "";
    return;
  }

  emptyBox.hidden = true;
  contentBox.hidden = false;
  addBtn.hidden = true;
  editBtn.hidden = false;

  if (titleEl) titleEl.textContent = textOrDash(plan.title);
  if (objectiveEl) objectiveEl.textContent = textOrDash(plan.objective);
  if (startDateEl) startDateEl.textContent = fmtDate(plan.startDate);
  if (endDateEl) endDateEl.textContent = fmtDate(plan.endDate);
  if (statusEl) statusEl.textContent = textOrDash(plan.status);
  if (notesEl) notesEl.textContent = textOrDash(plan.generalNotes);

  const items = Array.isArray(plan.items) ? plan.items : [];

  if (!items.length) {
    itemsEl.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:#999;">
          Esta rutina no tiene pasos cargados.
        </td>
      </tr>
    `;
    return;
  }

  itemsEl.innerHTML = items
    .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
    .map(item => `
      <tr>
        <td>${textOrDash(item.stepOrder)}</td>
        <td>${textOrDash(item.moment)}</td>
        <td>${textOrDash(item.action)}</td>
        <td>${textOrDash(item.product)}</td>
        <td>${textOrDash(item.frequency)}</td>
      </tr>
    `)
    .join("");
}

function openHomeCareModal() {
  const modal = document.getElementById("homecare-modal");
  if (!modal) return;

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeHomeCareModal() {
  const modal = document.getElementById("homecare-modal");
  const form = document.getElementById("homecare-form");
  const itemsWrap = document.getElementById("homecare-form-items");

  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }

  if (form) form.reset();
  if (itemsWrap) itemsWrap.innerHTML = "";

  homeCareDraftItems = [];
}

function getEmptyHomeCareItem(stepOrder = 1) {
  return {
    stepOrder,
    moment: "",
    action: "",
    product: "",
    frequency: "",
    duration: "",
    notes: "",
  };
}

function renderHomeCareDraftItems() {
  const wrap = document.getElementById("homecare-form-items");
  if (!wrap) return;

  if (!homeCareDraftItems.length) {
    wrap.innerHTML = `
      <div class="homecare-steps-empty">
        No hay pasos para mostrar.
      </div>
    `;
    updateHomeCareAddButtonState();
    return;
  }

  wrap.innerHTML = homeCareDraftItems
    .map((item, index) => `
      <div class="homecare-step-card" data-index="${index}">
        <div class="homecare-step-card-header">
          <strong>Paso ${index + 1}</strong>
          <button type="button" class="btn-edit-treatment-cancel homecare-remove-item-btn" data-index="${index}">
            Quitar
          </button>
        </div>

        <label>Momento</label>
        <input
          type="text"
          class="homecare-item-moment"
          data-index="${index}"
          value="${item.moment ?? ""}"
          placeholder="Ej: Mañana"
          maxlength="40"
        />

        <label>Acción</label>
        <input
          type="text"
          class="homecare-item-action"
          data-index="${index}"
          value="${item.action ?? ""}"
          placeholder="Ej: Limpiar rostro"
          maxlength="80"
        />

        <label>Producto</label>
        <input
          type="text"
          class="homecare-item-product"
          data-index="${index}"
          value="${item.product ?? ""}"
          placeholder="Ej: Gel limpiador"
          maxlength="80"
        />

        <label>Frecuencia</label>
        <input
          type="text"
          class="homecare-item-frequency"
          data-index="${index}"
          value="${item.frequency ?? ""}"
          placeholder="Ej: Todos los días"
          maxlength="60"
        />
      </div>
    `)
    .join("");

  updateHomeCareAddButtonState();
}

function updateHomeCareAddButtonState() {
  const btn = document.getElementById("homecare-add-item-btn");
  if (!btn) return;

  const reachedLimit = homeCareDraftItems.length >= MAX_HOMECARE_ITEMS;

  btn.disabled = reachedLimit;
  btn.style.opacity = reachedLimit ? "0.6" : "1";
  btn.style.cursor = reachedLimit ? "not-allowed" : "pointer";
  btn.innerHTML = reachedLimit
    ? `<i class="fa-solid fa-ban"></i> Límite alcanzado`
    : `<i class="fa-solid fa-plus"></i> Agregar paso`;
}

function fillHomeCareForm(plan) {
  const formTitle = document.getElementById("homecare-form-title");
  const formObjective = document.getElementById("homecare-form-objective");
  const formStartDate = document.getElementById("homecare-form-start-date");
  const formEndDate = document.getElementById("homecare-form-end-date");
  const formStatus = document.getElementById("homecare-form-status");
  const formNotes = document.getElementById("homecare-form-notes");

  if (!plan) {
    if (formTitle) formTitle.value = "";
    if (formObjective) formObjective.value = "";
    if (formStartDate) formStartDate.value = "";
    if (formEndDate) formEndDate.value = "";
    if (formStatus) formStatus.value = "Activa";
    if (formNotes) formNotes.value = "";

    homeCareDraftItems = [];
    renderHomeCareDraftItems();
    return;
  }

  if (formTitle) formTitle.value = plan.title || "";
  if (formObjective) formObjective.value = plan.objective || "";
  if (formStartDate) formStartDate.value = plan.startDate ? String(plan.startDate).slice(0, 10) : "";
  if (formEndDate) formEndDate.value = plan.endDate ? String(plan.endDate).slice(0, 10) : "";
  if (formStatus) formStatus.value = plan.status || "Activa";
  if (formNotes) formNotes.value = plan.generalNotes || "";

  homeCareDraftItems = Array.isArray(plan.items) && plan.items.length
  ? plan.items.map((item, index) => ({
      stepOrder: item.stepOrder || index + 1,
      moment: item.moment || "",
      action: item.action || "",
      product: item.product || "",
      frequency: item.frequency || "",
      duration: item.duration || "",
      notes: item.notes || "",
    }))
  : [];

  renderHomeCareDraftItems();
}

function normalizeHomeCareItemsForSave() {
  return homeCareDraftItems
    .map((item, index) => ({
      stepOrder: index + 1,
      moment: String(item.moment || "").trim(),
      action: String(item.action || "").trim(),
      product: String(item.product || "").trim(),
      frequency: String(item.frequency || "").trim(),
      duration: String(item.duration || "").trim(),
      notes: String(item.notes || "").trim(),
    }))
    .filter((item) => item.action);
}

function isValidHomeCareDate(value) {
  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const min = "2000-01-01";
  const max = "2100-12-31";

  return value >= min && value <= max;
}

function buildHomeCarePayload() {
  const title = String(document.getElementById("homecare-form-title")?.value || "").trim();
  const objective = String(document.getElementById("homecare-form-objective")?.value || "").trim();
  const startDate = document.getElementById("homecare-form-start-date")?.value || "";
  const endDate = document.getElementById("homecare-form-end-date")?.value || "";

    if (!isValidHomeCareDate(startDate)) {
    throw new Error("La fecha de inicio debe estar entre 2000-01-01 y 2100-12-31.");
  }

  if (!isValidHomeCareDate(endDate)) {
    throw new Error("La fecha de fin debe estar entre 2000-01-01 y 2100-12-31.");
  }

  if (startDate && endDate && endDate < startDate) {
    throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
  }

  const status = document.getElementById("homecare-form-status")?.value || "Activa";
  const generalNotes = String(document.getElementById("homecare-form-notes")?.value || "").trim();

  if (!title) {
    throw new Error("El nombre de la rutina es obligatorio.");
  }

  const items = normalizeHomeCareItemsForSave();

  return {
    title,
    objective,
    startDate,
    endDate,
    status,
    generalNotes,
    items,
  };
}

async function onSaveHomeCare(e) {
  e.preventDefault();

  if (isSavingHomeCare) return;
  if (!currentPatientId) {
    Swal.fire({ icon: "error", title: "Error", text: "Paciente inválido." });
    return;
  }

  const btnSave = document.getElementById("save-homecare-btn");

  try {
    isSavingHomeCare = true;

    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
      btnSave.style.opacity = "0.6";
    }

    const payload = buildHomeCarePayload();
    const res = await api.savePatientHomeCare(currentPatientId, payload);
    const saved = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("PUT /patients/:id/homecare failed", {
        status: res.status,
        patientId: currentPatientId,
        body: saved,
        payload,
      });

      throw new Error(saved?.error || saved?.message || "No se pudo guardar la rutina.");
    }
    currentHomeCarePlan = saved;

    closeHomeCareModal();
    await loadPatient(currentPatientId);

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "La rutina en casa se guardó correctamente.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "No se pudo guardar la rutina.",
    });
  } finally {
    isSavingHomeCare = false;

    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar rutina`;
      btnSave.style.opacity = "1";
    }
  }
}

export async function initPatientDetailsPage() {

  const loading = document.getElementById("pd-loading");
  const content = document.getElementById("pd-content");
  if (loading) loading.hidden = false;
  if (content) content.hidden = true;

  const id = getPatientIdFromPath();
  if (!id) {
    Swal.fire({ icon: "error", title: "Error", text: "ID de paciente inválido" });
    go("/patients");
    return;
  }

  document.getElementById("back-btn")?.addEventListener("click", () => go("/patients"));
  document.getElementById("edit-btn")?.addEventListener("click", () => go(`/patients/${id}/edit`));

  document.getElementById("view-interview-btn")?.addEventListener("click", () => {
    go(`/patients/${id}/interview`);
  });

    document.getElementById("homecare-add-btn")?.addEventListener("click", () => {
    fillHomeCareForm(null);
    openHomeCareModal();
  });

  document.getElementById("homecare-edit-btn")?.addEventListener("click", () => {
    fillHomeCareForm(currentHomeCarePlan);
    openHomeCareModal();
  });

  document.getElementById("close-homecare-modal-btn")?.addEventListener("click", () => {
    closeHomeCareModal();
  });

  document.getElementById("cancel-homecare-btn")?.addEventListener("click", () => {
    closeHomeCareModal();
  });

    document.getElementById("homecare-add-item-btn")?.addEventListener("click", () => {
    if (homeCareDraftItems.length >= MAX_HOMECARE_ITEMS) {
      Swal.fire({
        icon: "warning",
        title: "Límite alcanzado",
        text: `Solo podés cargar hasta ${MAX_HOMECARE_ITEMS} pasos en una rutina.`,
      });
      return;
    }

    homeCareDraftItems.push(getEmptyHomeCareItem(homeCareDraftItems.length + 1));
    renderHomeCareDraftItems();
  });

  document.getElementById("homecare-form-items")?.addEventListener("input", (e) => {
    const index = Number(e.target.dataset.index);
    if (!Number.isInteger(index) || !homeCareDraftItems[index]) return;

    if (e.target.classList.contains("homecare-item-moment")) {
      homeCareDraftItems[index].moment = e.target.value;
    }

    if (e.target.classList.contains("homecare-item-action")) {
      homeCareDraftItems[index].action = e.target.value;
    }

    if (e.target.classList.contains("homecare-item-product")) {
      homeCareDraftItems[index].product = e.target.value;
    }

    if (e.target.classList.contains("homecare-item-frequency")) {
      homeCareDraftItems[index].frequency = e.target.value;
    }
  });

  document.getElementById("homecare-form-items")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".homecare-remove-item-btn");
    if (!btn) return;

    const index = Number(btn.dataset.index);
    if (!Number.isInteger(index)) return;

    homeCareDraftItems.splice(index, 1);

    homeCareDraftItems = homeCareDraftItems.map((item, idx) => ({
    ...item,
    stepOrder: idx + 1,
  }));

    renderHomeCareDraftItems();
  });
  
  document.getElementById("homecare-form")?.addEventListener("submit", onSaveHomeCare);
  
  await loadPatient(id);
}

async function loadPatient(id) {
  const loading = document.getElementById("pd-loading");
  const content = document.getElementById("pd-content");

  try {
    const res = await api.getPatientById(id);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Error response GET /patients/:id", {
        status: res.status,
        body: data,
        patientId: id,
      });
      throw new Error(data?.error || data?.message || "No se pudo cargar el paciente");
    }

    const p = data;

    currentPatientId = p.id;
    currentHomeCarePlan = p.homeCarePlan || null;

    document.getElementById("patient-name").textContent = p.fullName || "Paciente";

    const info = document.getElementById("patient-info");
    info.innerHTML = [
      row("Teléfono", p.phone || "-"),
      row("Fecha de nacimiento", fmtDate(p.birthDate)),
      row("Edad", p.age ?? "-"),
      row("Dirección", p.address || "-"),
      row("Profesión", p.profession || "-"),
    ].join("");

    renderHomeCare(p.homeCarePlan || null);

    const ap = document.getElementById("patient-appointments");
    const list = Array.isArray(p.appointments) ? p.appointments.slice(0, 10) : [];

    if (!list.length) {
      ap.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999;">Sin turnos</td></tr>`;
    } else {
      ap.innerHTML = list.map(a => `
        <tr>
          <td>${fmtDate(a.date)} ${a.time ? `- ${a.time}` : ""}</td>
          <td>${a.treatment || "-"}</td>
          <td>${a.status || (a.completed ? "Completado" : "Pendiente")}</td>
        </tr>
      `).join("");
    }

    if (loading) loading.hidden = true;
    if (content) content.hidden = false;

  } catch (err) {
    console.error("loadPatient failed", { patientId: id, error: err });

    const txt = document.querySelector("#pd-loading .pd-loading-text");
    if (txt) txt.textContent = "Error al cargar";

    Swal.fire({ icon: "error", title: "Error", text: err.message || "Error" });
    go("/patients");
  }
}
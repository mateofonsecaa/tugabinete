// /public/js/interview/interviewView.page.js
import { authFetch } from "../core/authFetch.js";

function go(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getPatientIdFromPath() {
  // Espera: /patients/:id/interview
  const parts = window.location.pathname.split("/").filter(Boolean);
  // ["patients", ":id", "interview"]
  const id = Number(parts[1]);
  return Number.isFinite(id) ? id : null;
}

export async function initInterviewViewPage() {
  const patientId = getPatientIdFromPath();

  if (!patientId) {
    Swal.fire({
      icon: "error",
      title: "Paciente no encontrado",
      text: "Volviendo a pacientes...",
      confirmButtonColor: "#ffadad",
    });
    go("/patients");
    return;
  }

  // ✅ Botón volver a ficha paciente
  document.getElementById("back-btn")?.addEventListener("click", () => {
    go(`/patients/${patientId}`);
  });

  // ✅ Editar entrevista (parte 1)
  document.getElementById("edit-btn")?.addEventListener("click", () => {
    go(`/patients/${patientId}/interview/edit/1`);
  });

  await loadInterview(patientId);
}

async function loadInterview(patientId) {
  try {
    const res = await authFetch(`/interviews/${patientId}`);

    if (res.status === 404) {
      // no hay entrevista todavía
      renderNoData();
      return;
    }

    if (!res.ok) throw new Error("Error al obtener entrevista");

    const data = await res.json();
    renderInterview(data);

  } catch (err) {
    console.error("❌ Error al cargar entrevista:", err);
    renderNoData(true);
  }
}

function renderNoData(isError = false) {
  const msg = isError
    ? "No se pudieron cargar los datos de entrevista."
    : "No se encontraron datos de entrevista para este paciente.";

  document.getElementById("healthData").innerHTML = `<p class="no-data">${msg}</p>`;
  document.getElementById("observationsData").innerHTML = "";
  document.getElementById("facialData").innerHTML = "";
}

// ✅ mismo render que tenías antes (copiado/ajustado)
function renderInterview(data) {
  const healthFields = [
    ["illness", "¿Padece alguna enfermedad o condición médica?"],
    ["oncology", "¿Ha tenido o tiene algún problema oncológico?"],
    ["device", "¿Utiliza marcapasos u otro dispositivo electrónico implantado?"],
    ["medication", "¿Está tomando alguna medicación actualmente?"],
    ["hormones", "¿Toma anticonceptivos o medicación hormonal?"],
    ["allergy", "¿Tiene alguna alergia conocida?"],
    ["celiac", "¿Es celíaca o tiene intolerancia alimentaria?"],
    ["surgery", "¿Ha sido sometida a cirugía facial o estética?"],
    ["pregnancy", "¿Está embarazada o en lactancia?"],
    ["smoke", "¿Fuma?"],
    ["alcohol", "¿Consume alcohol regularmente?"],
    ["sport", "¿Con qué frecuencia realiza actividad física?"],
    ["water", "¿Cuánta agua consume por día aproximadamente?"],
    ["screenTime", "¿Cuántas horas pasa frente a pantallas?"],
    ["sleep", "¿Cuántas horas duerme por noche?"],
    ["lenses", "¿Usa lentes de contacto?"],
    ["sun", "¿Tuvo mucha exposición solar de chica?"],
    ["skin", "Cuando se expone al sol, su piel tiende a:"],
    ["family", "¿Antecedentes familiares (rosácea, acné…)?"],
    ["stress", "Nivel de estrés percibido:"],
    ["hormonal", "¿Cambios hormonales recientes?"],
    ["keloid", "¿Tendencia a cicatrizar con queloides?"],
  ];

  const observationsFields = [
    ["biotipo", "Biotipo Cutáneo"],
    ["fototipo", "Fototipo de Fitzpatrick"],
  ];

  const facialFields = [
    ["skinType", "Tipo de piel"],
    ["concerns", "Preocupaciones faciales"],
    ["cleanser", "Limpiador"],
    ["toner", "Tónico"],
    ["serum", "Sérum"],
    ["moisturizerDay", "Crema hidratante (día)"],
    ["moisturizerNight", "Crema hidratante (noche)"],
    ["eyeCream", "Contorno de ojos"],
    ["sunscreen", "Protector solar"],
    ["routineFrequency", "Frecuencia de rutina facial"],
    ["adverseReaction", "Reacción adversa a cosméticos"],
    ["adverseDetails", "Detalles de reacción adversa"],
    ["expectedResults", "Resultados esperados"],
    ["treatmentFrequency", "Frecuencia deseada de tratamientos"],
    ["routineTime", "Tiempo diario dedicado a la rutina"],
  ];

  const healthContainer = document.getElementById("healthData");
  const observationsContainer = document.getElementById("observationsData");
  const facialContainer = document.getElementById("facialData");

  healthContainer.innerHTML = healthFields
    .filter(([k]) => data[k] || data[k + "Extra"])
    .map(([k, label]) => {
      const extra = data[k + "Extra"]
        ? `<br><em>${escapeHtml(data[k + "Extra"])}</em>`
        : "";
      return `
        <div class="entry">
          <p class="question">${label}</p>
          <p class="answer">${escapeHtml(data[k] || "—")}${extra}</p>
        </div>
      `;
    })
    .join("");

  observationsContainer.innerHTML = observationsFields
    .filter(([k]) => data[k] || data[k + "Extra"])
    .map(([k, label]) => {
      const extra = data[k + "Extra"]
        ? `<br><em>${escapeHtml(data[k + "Extra"])}</em>`
        : "";
      return `
        <div class="entry">
          <p class="question">${label}</p>
          <p class="answer">${escapeHtml(data[k] || "—")}${extra}</p>
        </div>
      `;
    })
    .join("");

  facialContainer.innerHTML = facialFields
    .filter(([k]) => data[k] || data[k + "Extra"])
    .map(([k, label]) => {
      let val = data[k];
      if (Array.isArray(val)) val = val.join(", ");
      const extra = data[k + "Extra"]
        ? `<br><em>${escapeHtml(data[k + "Extra"])}</em>`
        : "";

      return `
        <div class="entry">
          <p class="question">${label}</p>
          <p class="answer">${escapeHtml(val || "—")}${extra}</p>
        </div>
      `;
    })
    .join("");

  // si no hay nada, muestro mensaje
  if (!healthContainer.innerHTML && !observationsContainer.innerHTML && !facialContainer.innerHTML) {
    renderNoData(false);
  }
}

// helper simple para evitar HTML raro si alguien mete "<"
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

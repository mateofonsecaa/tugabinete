import { initDrawer } from "../components/drawer.js";
import { initFeedbackPage } from "../feedback/feedback.page.js";

export function Feedback() {
  return `
    <div class="feedback-page">
      <div class="top-bar">
        <button id="open-menu" class="menu-btn" aria-label="Abrir menú">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn" aria-label="Cerrar menú">
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

      <main>
        <section class="feedback-shell">
            <section class="feedback-header">
                <div class="feedback-header-inner">
                    <h1>Ayudanos a mejorar</h1>
                    <p class="feedback-subtitle">
                    Contanos una idea, una mejora o un problema. Las ideas públicas se pueden votar.
                    Los errores se envían en privado para no exponer fallas a otros usuarios.
                    </p>
                </div>
            </section>

          <div id="feedbackFlash" class="feedback-flash" aria-live="polite"></div>

          <div class="feedback-tabs" role="tablist" aria-label="Secciones de feedback">
            <button
              type="button"
              class="feedback-tab is-active"
              id="feedbackTabSubmit"
              data-feedback-tab="submit"
              role="tab"
              aria-selected="true"
              aria-controls="feedbackPanelSubmit"
            >
              Enviar sugerencia
            </button>
            <button
              type="button"
              class="feedback-tab"
              id="feedbackTabCommunity"
              data-feedback-tab="community"
              role="tab"
              aria-selected="false"
              aria-controls="feedbackPanelCommunity"
            >
              Ideas de la comunidad
            </button>
          </div>

          <section
            id="feedbackPanelSubmit"
            class="feedback-panel"
            data-feedback-panel="submit"
            role="tabpanel"
            aria-labelledby="feedbackTabSubmit"
          >
            <div class="feedback-grid">
              <article class="feedback-card">
                <form id="feedbackForm" novalidate>
                  <div class="feedback-field">
                    <label for="feedbackCategory">Categoría</label>
                    <select id="feedbackCategory" name="category" required>
                      <option value="IDEA_NUEVA">Idea nueva</option>
                      <option value="MEJORA_VISUAL">Mejora visual</option>
                      <option value="ERROR_PROBLEMA">Error o problema</option>
                      <option value="NUEVA_FUNCION">Nueva función</option>
                      <option value="EXPERIENCIA_DE_USO">Experiencia de uso</option>
                      <option value="OTRA">Otra</option>
                    </select>
                  </div>

                  <div class="feedback-field">
                    <div class="feedback-field-head">
                      <label for="feedbackDescription">Descripción / idea</label>
                      <span id="feedbackCharCount" class="feedback-char-count">0 / 1200</span>
                    </div>
                    <textarea
                      id="feedbackDescription"
                      name="description"
                      rows="7"
                      minlength="12"
                      maxlength="1200"
                      placeholder="Escribí qué mejorarías, qué falla o qué te gustaría ver. Cuanto más concreto, mejor."
                      required
                    ></textarea>
                  </div>

                  <div class="feedback-field">
                    <label for="feedbackAttachment">Captura opcional</label>
                    <input
                      type="file"
                      id="feedbackAttachment"
                      name="attachment"
                      accept="image/png,image/jpeg,image/webp"
                    />
                    <small class="feedback-help">JPG, PNG o WEBP. Máximo 5 MB.</small>
                    <div id="feedbackAttachmentMeta" class="feedback-file-meta"></div>
                    <div id="feedbackAttachmentPreview" class="feedback-file-preview is-hidden"></div>
                  </div>

                  <label class="feedback-check">
                    <input type="checkbox" id="feedbackContactAllowed" name="contactAllowed" />
                    <span>Acepto que me contacten por esta sugerencia.</span>
                  </label>

                  <div id="feedbackPrivacyNote" class="feedback-privacy-note"></div>

                  <div class="feedback-actions">
                    <button type="submit" id="feedbackSubmitBtn" class="feedback-submit-btn">
                      <span class="feedback-submit-btn__label">Enviar</span>
                    </button>
                  </div>
                </form>
              </article>

              <aside class="feedback-card feedback-sidecard">
                <h2>Qué entra en cada tipo</h2>
                <ul class="feedback-side-list">
                  <li><strong>Idea nueva:</strong> propuesta de valor o mejora grande.</li>
                  <li><strong>Mejora visual:</strong> diseño, legibilidad, orden, espaciado.</li>
                  <li><strong>Error o problema:</strong> fallas, comportamientos raros o bloqueos.</li>
                  <li><strong>Nueva función:</strong> algo que hoy no existe.</li>
                  <li><strong>Experiencia de uso:</strong> fricción, pasos de más o confusión.</li>
                </ul>
                <p class="feedback-side-note">
                  Las ideas públicas aparecen en comunidad y se pueden votar. Los errores se procesan en privado.
                </p>
              </aside>
            </div>
          </section>

          <section
            id="feedbackPanelCommunity"
            class="feedback-panel is-hidden"
            data-feedback-panel="community"
            role="tabpanel"
            aria-labelledby="feedbackTabCommunity"
          >
            <div class="feedback-community-toolbar">
              <div class="feedback-community-filters">
                <div class="feedback-field feedback-field--compact">
                  <label for="feedbackCommunityCategory">Categoría</label>
                  <select id="feedbackCommunityCategory">
                    <option value="ALL">Todas</option>
                    <option value="IDEA_NUEVA">Idea nueva</option>
                    <option value="MEJORA_VISUAL">Mejora visual</option>
                    <option value="NUEVA_FUNCION">Nueva función</option>
                    <option value="EXPERIENCIA_DE_USO">Experiencia de uso</option>
                    <option value="OTRA">Otra</option>
                  </select>
                </div>

                <div class="feedback-field feedback-field--compact">
                  <label for="feedbackCommunitySort">Orden</label>
                  <select id="feedbackCommunitySort">
                    <option value="top">Más votadas</option>
                    <option value="new">Más recientes</option>
                  </select>
                </div>
              </div>

              <button type="button" id="feedbackRefreshBtn" class="feedback-refresh-btn">
                Actualizar
              </button>
            </div>

            <div id="feedbackList" class="feedback-list"></div>
          </section>
        </section>
      </main>
    </div>
  `;
}

export function initFeedback() {
  initDrawer();
  initFeedbackPage();
}
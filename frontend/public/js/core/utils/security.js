// /public/js/core/utils/security.js
//
// Utilidades de seguridad compartidas del frontend.
//
// escapeHtml: convierte los 5 caracteres con significado en HTML a sus
// entidades, para interpolar datos no confiables dentro de template
// literals que terminan en innerHTML.
//
// Reglas de uso:
//  - Escapá TODO dato que venga del usuario o del backend (nombres,
//    notas, labels, URLs, ids) al interpolarlo en HTML, tanto en
//    contenido de texto como dentro de atributos entre comillas dobles.
//  - NO escapes strings que ya son HTML generado por otra función de
//    template (doble escape rompe el markup).
//  - Esto cubre interpolación en HTML. NO alcanza para otros contextos:
//    atributos de eventos inline, bloques <script>, o URLs javascript:
//    requieren otras defensas (no usamos ninguno de esos en la app).

export function escapeHtml(unsafe) {
  return String(unsafe ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

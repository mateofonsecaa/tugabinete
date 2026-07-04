const isProd = process.env.NODE_ENV === "production";

export function getRefreshCookieName() {
  return process.env.REFRESH_COOKIE_NAME || "tg_refresh";
}

function baseCookieOptions() {
  // 🛡️ BLINDAJE DE SESIÓN (PASO 4): Política SameSite dinámica.
  // Permite "none" para arquitecturas desacopladas (Frontend en Netlify, API en otro lado).
  // Por defecto en producción usamos "none" para que no se caigan las sesiones cross-site.
  const sameSitePolicy = process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax");

  return {
    httpOnly: true,
    // La regla estricta de los navegadores: si es "none", TIENE que ser secure (HTTPS).
    secure: sameSitePolicy === "none" ? true : isProd,
    sameSite: sameSitePolicy,
    path: "/api/auth",
  };
}

export function setRefreshCookie(res, token, expiresAt) {
  const expires = new Date(expiresAt);
  const maxAge = Math.max(0, expires.getTime() - Date.now());

  res.cookie(getRefreshCookieName(), token, {
    ...baseCookieOptions(),
    expires,
    maxAge,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(getRefreshCookieName(), baseCookieOptions());
}

export function readRefreshCookie(req) {
  return req.cookies?.[getRefreshCookieName()] || null;
}
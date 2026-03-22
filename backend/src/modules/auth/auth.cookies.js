const isProd = process.env.NODE_ENV === "production";

export function getRefreshCookieName() {
  return process.env.REFRESH_COOKIE_NAME || "tg_refresh";
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
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
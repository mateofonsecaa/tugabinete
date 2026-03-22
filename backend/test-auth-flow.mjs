const BASE_URL = "http://localhost:4000/api";
const EMAIL = "mateomfonseca@gmail.com";
const PASSWORD = "Messiteam096!";

function logSection(title) {
  console.log("\n" + "=".repeat(20));
  console.log(title);
  console.log("=".repeat(20));
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractCookie(setCookieHeaders, cookieName = "tg_refresh") {
  const header = setCookieHeaders.find((h) => h.startsWith(`${cookieName}=`));
  if (!header) return null;
  return header.split(";")[0];
}

async function main() {
  logSection("1) LOGIN");

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });

  const loginText = await loginRes.text();
  const loginBody = tryParseJson(loginText);

  console.log("Status login:", loginRes.status);
  console.log("Body login:", loginBody);

  const setCookieHeaders = loginRes.headers.getSetCookie?.() ?? [];
  console.log("Set-Cookie headers:", setCookieHeaders);

  const refreshCookie = extractCookie(setCookieHeaders);

  if (!loginRes.ok) {
    console.error("\nLOGIN FALLÓ. No sigas.");
    return;
  }

  if (!refreshCookie) {
    console.error("\nLOGIN OK pero NO vino cookie tg_refresh. Eso está mal.");
    return;
  }

  const accessToken = loginBody?.accessToken;

  if (!accessToken) {
    console.error("\nLOGIN OK pero NO vino accessToken. Eso está mal.");
    return;
  }

  logSection("2) /auth/me");

  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const meText = await meRes.text();
  const meBody = tryParseJson(meText);

  console.log("Status /me:", meRes.status);
  console.log("Body /me:", meBody);

  logSection("3) REFRESH");

  const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: refreshCookie,
    },
  });

  const refreshText = await refreshRes.text();
  const refreshBody = tryParseJson(refreshText);

  console.log("Status refresh:", refreshRes.status);
  console.log("Body refresh:", refreshBody);

  const refreshSetCookieHeaders = refreshRes.headers.getSetCookie?.() ?? [];
  console.log("Set-Cookie refresh:", refreshSetCookieHeaders);

  const rotatedCookie = extractCookie(refreshSetCookieHeaders) || refreshCookie;

  logSection("4) LOGOUT");

  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Cookie: rotatedCookie,
    },
  });

  const logoutText = await logoutRes.text();

  console.log("Status logout:", logoutRes.status);
  console.log("Body logout:", logoutText || "(vacío)");

  logSection("5) REFRESH DESPUÉS DE LOGOUT");

  const refreshAfterLogoutRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: rotatedCookie,
    },
  });

  const refreshAfterLogoutText = await refreshAfterLogoutRes.text();
  const refreshAfterLogoutBody = tryParseJson(refreshAfterLogoutText);

  console.log("Status refresh post-logout:", refreshAfterLogoutRes.status);
  console.log("Body refresh post-logout:", refreshAfterLogoutBody);
}

main().catch((err) => {
  console.error("ERROR EJECUTANDO PRUEBA:");
  console.error(err);
});
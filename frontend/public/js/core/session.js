import { API_URL } from "./config.js";

const state = {
  status: "unknown",
  accessToken: null,
  user: null,
  bootstrapPromise: null,
  refreshPromise: null,
};

const channel =
  "BroadcastChannel" in window ? new BroadcastChannel("tg-auth") : null;

function clearLegacyStorage() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
  } catch {}
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeError(message, code = "REQUEST_FAILED", status = 0) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

async function readResponseData(res) {
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

async function request(url, options = {}) {
  let res;

  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
    });
  } catch {
    throw makeError(
      "No se pudo contactar al servidor.",
      "NETWORK_ERROR",
      0
    );
  }

  const data = await readResponseData(res);

  if (!res.ok) {
    throw makeError(
      data?.error || "La solicitud falló.",
      data?.code || "REQUEST_FAILED",
      res.status
    );
  }

  return data;
}

function broadcastLogout() {
  channel?.postMessage({ type: "LOGOUT" });

  try {
    localStorage.setItem("tg_logout", String(Date.now()));
  } catch {}
}

function redirectToLoginIfNeeded() {
  if (window.location.pathname !== "/login") {
    history.pushState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

function handleRemoteLogout() {
  clearSession({ broadcast: false });
  redirectToLoginIfNeeded();
}

channel?.addEventListener("message", (event) => {
  if (event.data?.type === "LOGOUT") {
    handleRemoteLogout();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "tg_logout") {
    handleRemoteLogout();
  }
});

export function getAccessToken() {
  return state.accessToken;
}

export function getCurrentUser() {
  return state.user;
}

export function isAuthenticated() {
  return state.status === "authenticated" && !!state.accessToken;
}

export function getSessionStatus() {
  return state.status;
}

export function setSession({ accessToken, user }) {
  clearLegacyStorage();

  if (accessToken) {
    state.accessToken = accessToken;
  }

  if (user) {
    state.user = user;
  }

  state.status = "authenticated";
}

export function clearSession({ broadcast = true } = {}) {
  clearLegacyStorage();
  state.accessToken = null;
  state.user = null;
  state.status = "guest";

  if (broadcast) {
    broadcastLogout();
  }
}

export async function loginSession(email, password) {
  state.status = "authenticating";

  try {
    const data = await request(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setSession({
      accessToken: data.accessToken,
      user: data.user,
    });

    return data;
  } catch (error) {
    state.status = "guest";
    throw error;
  }
}

async function doRefresh(allowRaceRetry = true) {
  try {
    const data = await request(`${API_URL}/auth/refresh`, {
      method: "POST",
    });

    setSession({
      accessToken: data.accessToken,
    });

    return data.accessToken;
  } catch (error) {
    if (allowRaceRetry && error.code === "REFRESH_RACE") {
      await sleep(350);
      return doRefresh(false);
    }

    throw error;
  }
}

export async function refreshSession() {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = doRefresh(true).finally(() => {
    state.refreshPromise = null;
  });

  return state.refreshPromise;
}

export async function fetchMe() {
  if (!state.accessToken) {
    throw makeError("No hay access token en memoria.", "NO_ACCESS_TOKEN");
  }

  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${state.accessToken}`,
    },
  });

  const data = await readResponseData(res);

  if (!res.ok) {
    throw makeError(
      data?.error || "No se pudo obtener el usuario actual.",
      data?.code || "ME_FAILED",
      res.status
    );
  }

  state.user = data;
  return data;
}

export async function bootstrapSession() {
  clearLegacyStorage();

  if (state.bootstrapPromise) {
    return state.bootstrapPromise;
  }

  state.status = "authenticating";

  state.bootstrapPromise = (async () => {
    try {
      await refreshSession();
      await fetchMe();
      state.status = "authenticated";
      return true;
    } catch (error) {
      if (error.code === "NETWORK_ERROR") {
        state.status = "unknown";
        throw error;
      }

      clearSession({ broadcast: false });
      state.status = "guest";
      return false;
    } finally {
      state.bootstrapPromise = null;
    }
  })();

  return state.bootstrapPromise;
}

export async function logoutSession() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}

export async function logoutAllSessions() {
  try {
    if (!state.accessToken) {
      await logoutSession();
      return;
    }

    await fetch(`${API_URL}/auth/logout-all`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
      },
    });
  } finally {
    clearSession();
  }
}
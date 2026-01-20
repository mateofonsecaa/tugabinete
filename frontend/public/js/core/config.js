const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export const API_URL = isLocal
    ? "http://localhost:4000/api"
    : "https://api.tugabinete.com/api";

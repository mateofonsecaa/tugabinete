import crypto from "crypto";

export const VERIFICATION_TTL_MINUTES = 15;
export const PASSWORD_RESET_TTL_MINUTES =
  Number(process.env.PASSWORD_RESET_TTL_MINUTES) > 0
    ? Number(process.env.PASSWORD_RESET_TTL_MINUTES)
    : 30;

export const PASSWORD_HASH_ROUNDS = 12;

export const generateOpaqueToken = () =>
  crypto.randomBytes(32).toString("base64url");

export const hashToken = (token = "") =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim().slice(0, 100);
  }

  if (typeof req.ip === "string" && req.ip.trim()) {
    return req.ip.trim().slice(0, 100);
  }

  return null;
};

export const getRequestUserAgent = (req) => {
  const raw =
    req.get?.("user-agent") ||
    req.headers["user-agent"] ||
    "";

  const normalized = String(raw).trim();
  return normalized ? normalized.slice(0, 500) : null;
};
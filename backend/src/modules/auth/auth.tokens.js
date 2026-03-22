import crypto from "crypto";
import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL_MINUTES = Number(
  process.env.ACCESS_TOKEN_TTL_MINUTES || 15
);

export const REFRESH_TOKEN_TTL_DAYS = Number(
  process.env.REFRESH_TOKEN_TTL_DAYS || 30
);

function getAccessTokenSecret() {
  return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
}

export function signAccessToken({ userId, email, sessionId, tokenVersion }) {
  const secret = getAccessTokenSecret();

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET no está configurado.");
  }

  return jwt.sign(
    {
      sub: String(userId),
      email,
      sid: sessionId,
      tv: tokenVersion ?? 0,
    },
    secret,
    { expiresIn: `${ACCESS_TOKEN_TTL_MINUTES}m` }
  );
}

export function verifyAccessToken(token) {
  const secret = getAccessTokenSecret();

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET no está configurado.");
  }

  return jwt.verify(token, secret);
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getInitialRefreshExpiresAt() {
  return new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );
}

export function newSessionId() {
  return crypto.randomUUID();
}

export function newSessionFamilyId() {
  return crypto.randomUUID();
}
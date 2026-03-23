import * as service from "./auth.service.js";
import * as repo from "./auth.repository.js";
import { clearRefreshCookie, setRefreshCookie } from "./auth.cookies.js";
import { buildUserAvatarUrl } from "../../core/storage/storage.service.js";

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
}

const REFRESH_FATAL_CODES = new Set([
  "NO_REFRESH_COOKIE",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REVOKED",
  "REFRESH_TOKEN_REUSED",
]);

export const register = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    return res.status(result.status ?? 200).json(result);
  } catch (err) {
    console.error("register error:", err);
    next(err);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const result = await service.resendVerification(req.body);
    return res.status(result.status ?? 200).json(result);
  } catch (err) {
    console.error("resendVerification error:", err);
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await service.login(req.body, req);

    setNoStore(res);
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);

    return res.status(200).json({
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await service.refreshSession(req);

    setNoStore(res);
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);

    return res.status(200).json({
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (REFRESH_FATAL_CODES.has(err.code)) {
      clearRefreshCookie(res);
    }

    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await service.logout(req);
    clearRefreshCookie(res);
    return res.status(204).end();
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    await service.logoutAll(req.user.id);
    clearRefreshCookie(res);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    const result = await service.verifyEmail(token);
    return res.redirect(result.redirectUrl);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await service.forgotPassword(req.body, req);
    return res.status(result.status ?? 200).json(result);
  } catch (err) {
    next(err);
  }
};

export const validateResetToken = async (req, res, next) => {
  try {
    const result = await service.validateResetToken(req.body);
    return res.status(result.status ?? 200).json(result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await service.resetPassword(req.body, req);
    return res.status(result.status ?? 200).json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    setNoStore(res);

    const user = await repo.findPublicUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        code: "USER_NOT_FOUND",
        message: "Usuario no encontrado.",
      });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      displayName: user.displayName ?? null,
      email: user.email,
      pendingEmail: user.pendingEmail ?? null,
      profession: user.profession ?? null,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      profileImage: buildUserAvatarUrl(user),
      emailVerified: user.isVerified,
    });
  } catch (err) {
    return next(err);
  }
};
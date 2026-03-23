import * as service from "./account.service.js";
import { setRefreshCookie } from "../auth/auth.cookies.js";

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
}

export async function getAccount(req, res, next) {
  try {
    setNoStore(res);
    const result = await service.getAccount(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await service.updateProfile(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const result = await service.updateAvatar(req.user.id, req.file);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    const result = await service.deleteAvatar(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function requestEmailChange(req, res, next) {
  try {
    const result = await service.requestEmailChange(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function confirmEmailChange(req, res, next) {
  try {
    const result = await service.confirmEmailChange(req.params.token);
    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      return res.status(200).json(result);
    }

    const statusMap = {
      success: "email-change-success",
      expired: "email-change-expired",
      invalid: "email-change-invalid",
      used: "email-change-used",
    };

    return res.redirect(`${frontend}/verify?status=${statusMap[result.status] || "email-change-invalid"}`);
  } catch (err) {
    return next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await service.changePassword(req.user.id, req.body, req);

    setNoStore(res);
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);

    return res.status(200).json({
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    return next(err);
  }
}

export async function logoutOtherSessions(req, res, next) {
  try {
    const result = await service.logoutOtherSessions(
      req.user.id,
      req.user.sessionId
    );
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
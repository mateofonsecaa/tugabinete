import prisma from "../../config/prisma.js";
import { verifyAccessToken } from "../../modules/auth/auth.tokens.js";

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      error: "Access token requerido.",
      code: "ACCESS_TOKEN_REQUIRED",
    });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Access token inválido.",
      code: "ACCESS_TOKEN_INVALID",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        error: "Token inválido.",
        code: "ACCESS_TOKEN_INVALID",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        authTokenVersion: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Usuario no válido.",
        code: "USER_NOT_FOUND",
      });
    }

    const tokenVersion = Number.isInteger(decoded.tv) ? decoded.tv : 0;

    if ((user.authTokenVersion ?? 0) !== tokenVersion) {
      return res.status(401).json({
        error: "Tu sesión fue invalidada. Iniciá sesión nuevamente.",
        code: "SESSION_VERSION_MISMATCH",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      sessionId: decoded.sid ?? null,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: "Access token inválido o expirado.",
      code: "ACCESS_TOKEN_EXPIRED_OR_INVALID",
    });
  }
};

export default authenticate;
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";

export default async function verifyToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        authTokenVersion: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no válido" });
    }

    const tokenVersion = Number.isInteger(decoded.tokenVersion)
      ? decoded.tokenVersion
      : 0;

    if (tokenVersion !== (user.authTokenVersion ?? 0)) {
      return res.status(401).json({
        error: "Tu sesión dejó de ser válida. Iniciá sesión nuevamente.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}
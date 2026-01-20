import jwt from "jsonwebtoken";

export default function verifyToken(req, res, next) {
const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // "Bearer token"

    if (!token)
        return res.status(401).json({ message: "Token inválido" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Esto queda disponible para cualquier controlador
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(403).json({ message: "Token expirado o inválido" });
    }
}

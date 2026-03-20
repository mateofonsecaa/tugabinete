const buckets = new Map();

function cleanupExpiredBuckets(now) {
  if (Math.random() > 0.03) return;

  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function createRateLimit({
  windowMs,
  max,
  keyGenerator,
  message = "Demasiados intentos. Esperá unos minutos e intentá nuevamente.",
  code = "RATE_LIMITED",
}) {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = String(
      typeof keyGenerator === "function" ? keyGenerator(req) : req.ip || "unknown"
    );

    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        ok: false,
        code,
        message,
      });
    }

    current.count += 1;
    buckets.set(key, current);

    return next();
  };
}
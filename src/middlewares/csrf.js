const crypto = require("node:crypto");

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function iguaisEmTempoConstante(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !TOKEN_PATTERN.test(a) || !TOKEN_PATTERN.test(b)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function csrfProtection(req, res, next) {
  const metodo = req.method.toUpperCase();
  const apiPublicaDeLeitura = metodo === "GET" && req.originalUrl?.startsWith("/api");
  if (!req.session.csrfToken && !UNSAFE_METHODS.has(metodo) && !apiPublicaDeLeitura) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken || null;

  if (!UNSAFE_METHODS.has(metodo)) return next();

  const tokenDoCabecalho = typeof req.get === "function"
    ? req.get("X-CSRF-Token")
    : req.headers?.["x-csrf-token"];
  const tokenEnviado = tokenDoCabecalho || req.body?._csrf;

  if (iguaisEmTempoConstante(req.session.csrfToken, tokenEnviado)) return next();

  if (req.originalUrl?.startsWith("/api")) {
    return res.status(403).json({ erro: "Solicitação inválida. Atualize a página e tente novamente." });
  }
  return res.status(403).send("Solicitação inválida. Atualize a página e tente novamente.");
}

module.exports = { csrfProtection };

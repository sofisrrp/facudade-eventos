const test = require("node:test");
const assert = require("node:assert/strict");
const auth = require("../src/middlewares/auth");

function executar(req) {
  assert.equal(typeof auth.csrfProtection, "function");
  const res = {
    locals: {},
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    send(payload) { this.payload = payload; return this; }
  };
  let continuou = false;
  auth.csrfProtection(req, res, () => { continuou = true; });
  return { req, res, continuou };
}

test("GET cria token CSRF por sessão e continua", () => {
  const resultado = executar({ method: "GET", originalUrl: "/registro", session: {} });
  assert.equal(resultado.continuou, true);
  assert.match(resultado.res.locals.csrfToken, /^[a-f0-9]{64}$/);
});

test("GET público da API não cria sessão anônima", () => {
  const req = { method: "GET", originalUrl: "/api/eventos", session: {} };
  const resultado = executar(req);
  assert.equal(resultado.continuou, true);
  assert.equal(Object.hasOwn(req.session, "csrfToken"), false);
});

test("POST sem token é recusado com 403", () => {
  const resultado = executar({ method: "POST", originalUrl: "/eventos", session: { csrfToken: "a".repeat(64) }, body: {}, get: () => undefined });
  assert.equal(resultado.continuou, false);
  assert.equal(resultado.res.statusCode, 403);
});

test("POST com token da sessão continua", () => {
  const token = "a".repeat(64);
  const resultado = executar({ method: "POST", originalUrl: "/eventos", session: { csrfToken: token }, body: { _csrf: token }, get: () => undefined });
  assert.equal(resultado.continuou, true);
});

test("DELETE aceita token enviado pelo cabeçalho do fetch", () => {
  const token = "b".repeat(64);
  const resultado = executar({ method: "DELETE", originalUrl: "/api/eventos/1", session: { csrfToken: token }, body: {}, get: (name) => name === "X-CSRF-Token" ? token : undefined });
  assert.equal(resultado.continuou, true);
});

test("token adulterado é recusado", () => {
  const resultado = executar({ method: "PUT", originalUrl: "/api/eventos/1", session: { csrfToken: "a".repeat(64) }, body: { _csrf: "c".repeat(64) }, get: () => undefined });
  assert.equal(resultado.continuou, false);
  assert.equal(resultado.res.statusCode, 403);
});

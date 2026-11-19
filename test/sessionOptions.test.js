const test = require("node:test");
const assert = require("node:assert/strict");

let createSessionOptions;
try {
  ({ createSessionOptions } = require("../src/config/sessionOptions"));
} catch {
  createSessionOptions = undefined;
}

function options(env) {
  assert.equal(typeof createSessionOptions, "function");
  return createSessionOptions(env);
}

test("cookie local usa SameSite Lax e não exige HTTPS", () => {
  const result = options({ NODE_ENV: "development", SESSION_SECRET: "s".repeat(40) });
  assert.equal(result.cookie.sameSite, "lax");
  assert.equal(result.cookie.secure, false);
  assert.equal(result.name, "eventos.sid");
});

test("cookie de produção é Secure e segredo fraco é rejeitado", () => {
  const result = options({ NODE_ENV: "production", SESSION_SECRET: "s".repeat(40) });
  assert.equal(result.cookie.secure, true);
  assert.throws(() => options({ NODE_ENV: "production", SESSION_SECRET: "curto" }), /SESSION_SECRET/);
});

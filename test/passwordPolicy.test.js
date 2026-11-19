const test = require("node:test");
const assert = require("node:assert/strict");
const authController = require("../src/controllers/authController");

function validar(senha) {
  assert.equal(typeof authController.validarSenha, "function");
  return authController.validarSenha(senha);
}

test("aceita senha de 10 caracteres com maiúscula e símbolo", () => {
  assert.equal(validar("Senha forte!"), null);
});

test("rejeita senha menor que 10 caracteres", () => {
  assert.equal(typeof validar("Abc!12345"), "string");
});

test("rejeita senha sem letra maiúscula", () => {
  assert.equal(typeof validar("senha forte!"), "string");
});

test("rejeita senha sem símbolo", () => {
  assert.equal(typeof validar("Senha forte"), "string");
});

test("rejeita senha que ultrapassa 72 bytes UTF-8 do bcrypt", () => {
  assert.equal(typeof validar("a".repeat(73)), "string");
});

test("conta caracteres Unicode como pontos de código", () => {
  assert.equal(validar("A" + "🎓".repeat(3) + "!abcde"), null);
});

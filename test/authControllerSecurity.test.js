const test = require("node:test");
const assert = require("node:assert/strict");
const Usuario = require("../src/models/Usuario");
const authController = require("../src/controllers/authController");

test("cadastro de organizador não grava códigos de autorização no log", async () => {
  const originals = {
    buscarPorEmail: Usuario.buscarPorEmail,
    gerarProximoIdInstitucional: Usuario.gerarProximoIdInstitucional,
    criar: Usuario.criar,
    consoleLog: console.log,
    codigoOrganizador: process.env.CODIGO_ORGANIZADOR
  };
  const logs = [];
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    render() {}
  };

  Usuario.buscarPorEmail = async () => null;
  Usuario.gerarProximoIdInstitucional = async () => "FAC-ORG-003";
  Usuario.criar = async () => 3;
  process.env.CODIGO_ORGANIZADOR = "codigo-secreto-de-teste";
  console.log = (...args) => logs.push(args.join(" "));

  try {
    await authController.registro({
      body: {
        nome: "Organizador Teste",
        email: "organizador-teste@example.com",
        senha: "Senha Forte!",
        perfil: "organizador",
        codigo_autorizacao: "codigo-secreto-de-teste"
      }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(logs, []);
  } finally {
    Usuario.buscarPorEmail = originals.buscarPorEmail;
    Usuario.gerarProximoIdInstitucional = originals.gerarProximoIdInstitucional;
    Usuario.criar = originals.criar;
    console.log = originals.consoleLog;
    if (originals.codigoOrganizador === undefined) {
      delete process.env.CODIGO_ORGANIZADOR;
    } else {
      process.env.CODIGO_ORGANIZADOR = originals.codigoOrganizador;
    }
  }
});

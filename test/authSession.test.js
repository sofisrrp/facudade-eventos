const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const Usuario = require("../src/models/Usuario");
const authController = require("../src/controllers/authController");

test("login troca o ID da sessão antes de gravar o usuário autenticado", async () => {
  const buscarOriginal = Usuario.buscarPorEmail;
  const senhaExistente = "Eventos!26";
  const senhaHash = await bcrypt.hash(senhaExistente, 10);
  Usuario.buscarPorEmail = async () => ({ id: 7, nome: "Ana", perfil: "aluno", senha_hash: senhaHash });

  const req = { body: { email: "ana@faculdade.com", senha: senhaExistente, perfil: "aluno" } };
  const sessaoAntiga = { csrfToken: "token-antigo" };
  req.session = {
    ...sessaoAntiga,
    regenerate(callback) {
      req.session = {};
      callback(null);
    }
  };
  const res = { redirecionou: null, redirect(url) { this.redirecionou = url; } };

  try {
    await authController.login(req, res);
    assert.notEqual(req.session.csrfToken, "token-antigo");
    assert.deepEqual(req.session.usuario, { id: 7, nome: "Ana", perfil: "aluno" });
    assert.equal(res.redirecionou, "/");
  } finally {
    Usuario.buscarPorEmail = buscarOriginal;
  }
});

test("login rejeita senha longa que bcrypt truncaria para a senha correta", async () => {
  const buscarOriginal = Usuario.buscarPorEmail;
  const prefixo = "a".repeat(72);
  const senhaHash = await bcrypt.hash(prefixo, 10);
  Usuario.buscarPorEmail = async () => ({ id: 7, nome: "Ana", perfil: "aluno", senha_hash: senhaHash });

  const req = { body: { email: "ana@faculdade.com", senha: `${prefixo}b`, perfil: "aluno" } };
  req.session = { regenerate(callback) { req.session = {}; callback(null); } };
  const res = {
    statusCode: 200,
    erro: null,
    status(code) { this.statusCode = code; return this; },
    render(_view, dados) { this.erro = dados.erro; },
    redirect() { this.redirecionou = true; }
  };

  try {
    await authController.login(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(req.session.usuario, undefined);
    assert.equal(res.erro, "E-mail, senha, perfil ou ID inválidos");
  } finally {
    Usuario.buscarPorEmail = buscarOriginal;
  }
});

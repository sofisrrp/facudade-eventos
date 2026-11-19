
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/authController");
const { exigirLogin } = require("../middlewares/auth");

// Segurança: no máximo 10 tentativas de login a cada 15 minutos
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Muitas tentativas de login. Tente de novo em 15 minutos."
});

// Evita criação automatizada de contas por um único endereço IP.
const limitarCadastro = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Muitas tentativas de cadastro. Tente de novo em 15 minutos."
});

// Cada linha liga um endereço a uma função do controller
router.get("/login", ctrl.formLogin);
router.post("/login", limitarLogin, ctrl.login);
router.get("/registro", ctrl.formRegistro);
router.post("/registro", limitarCadastro, ctrl.registro);
router.post("/logout", ctrl.logout);

// Página de perfil
router.get("/perfil", exigirLogin, ctrl.perfil);

// Salvar alterações do perfil
router.post("/perfil", exigirLogin, ctrl.atualizarPerfil);

module.exports = router;

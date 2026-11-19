const router = require("express").Router();
const ctrl = require("../controllers/eventoController");
const { exigirLogin, exigirOrganizador, exigirAluno } = require("../middlewares/auth");

router.use(exigirLogin); // tudo aqui exige login

// ---- Área do aluno ----
router.get("/minhas", exigirAluno, ctrl.minhas);              // /eventos/minhas
router.post("/:id/inscrever", exigirAluno, ctrl.inscrever);   // se inscreve
router.post("/:id/cancelar", exigirAluno, ctrl.cancelar);     // cancela a inscrição

// ---- Painel e ações do organizador ----
router.get("/organizador", exigirOrganizador, ctrl.painelOrganizador);
router.get("/novo", exigirOrganizador, ctrl.formNovo);
router.post("/", exigirOrganizador, ctrl.criar);
router.get("/:id/editar", exigirOrganizador, ctrl.formEditar);
router.post("/:id/editar", exigirOrganizador, ctrl.atualizar);
router.get("/:id/inscritos", exigirOrganizador, ctrl.inscritos);

module.exports = router;

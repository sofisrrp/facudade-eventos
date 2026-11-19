const router = require("express").Router();
const ctrl = require("../controllers/tipoController");
const { exigirLogin, exigirOrganizador } = require("../middlewares/auth");

router.use(exigirLogin, exigirOrganizador); // área restrita: só organizador

router.get("/", ctrl.listar);
router.post("/", ctrl.criar);
router.get("/:id/editar", ctrl.formEditar);
router.post("/:id/editar", ctrl.atualizar);
router.post("/:id/excluir", ctrl.remover);

module.exports = router;

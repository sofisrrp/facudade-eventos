
const router = require("express").Router();
const ctrl = require("../controllers/apiEventoController");
const { exigirOrganizador, exigirAluno } = require("../middlewares/auth");
const Favorito = require("../models/Favorito");

// Listagem e consulta de eventos
router.get("/", ctrl.listar);
router.get("/:id", ctrl.detalhe);

// Cadastro, edição e exclusão de eventos
router.post("/", exigirOrganizador, ctrl.criar);
router.put("/:id", exigirOrganizador, ctrl.atualizar);
router.delete("/:id", exigirOrganizador, ctrl.remover);

// Adiciona um evento aos favoritos
router.post("/:id/favorito", exigirAluno, async (req, res) => {
  const eventoId = Number(req.params.id);

  if (!Number.isInteger(eventoId) || eventoId <= 0) {
    return res.status(400).json({ erro: "ID de evento inválido." });
  }

  const Evento = require("../models/Evento");
  const evento = await Evento.buscarPorId(eventoId);

  if (!evento) {
    return res.status(404).json({ erro: "Evento não encontrado." });
  }

  await Favorito.adicionar(req.session.usuario.id, eventoId);

  res.json({ mensagem: "Evento favoritado!", favorito: true });
});

// Remove um evento dos favoritos
router.delete("/:id/favorito", exigirAluno, async (req, res) => {
  const eventoId = Number(req.params.id);

  if (!Number.isInteger(eventoId) || eventoId <= 0) {
    return res.status(400).json({ erro: "ID de evento inválido." });
  }

  await Favorito.remover(req.session.usuario.id, eventoId);

  res.json({ mensagem: "Favorito removido!", favorito: false });
});

// Lista os favoritos do aluno
router.get("/favoritos/lista", exigirAluno, async (req, res) => {
  const favoritos = await Favorito.listar(req.session.usuario.id);
  res.json(favoritos);
});

module.exports = router;

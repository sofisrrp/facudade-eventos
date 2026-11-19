const Evento = require("../models/Evento");
const { validarEvento } = require("../validators/evento");
const { parseEventoId } = require("../validators/eventoId");
const { isForeignKeyError } = require("../models/databaseErrors");

exports.validarEvento = validarEvento;

// GET /api/eventos?busca=palestra  -> devolve a lista em JSON (status 200)

exports.listar = async (req, res) => {
  const busca = req.query.busca || "";

  if (typeof busca !== "string" || Array.from(busca).length > 100) {
    return res.status(400).json({
      erro: "A busca deve ter até 100 caracteres."
    });
  }

  const usuario = req.session.usuario;

  // Somente alunos recebem seus dados de inscrição e favoritos.
  const usuarioId =
    usuario && usuario.perfil === "aluno" ? usuario.id : 0;

  const eventos = await Evento.listar(busca, usuarioId);

  const resposta = eventos.map((evento) => {
    const podeVerTotal = usuario && usuario.perfil === "organizador";

    if (podeVerTotal) return evento;

    const { total_inscritos, ...eventoPublico } = evento;
    return eventoPublico;
  });

  res.json(resposta);
};


// GET /api/eventos/:id -> busca um evento sem expor dados de inscrição.
exports.detalhe = async (req, res) => {
  const id = parseEventoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ erro: "ID de evento inválido." });
  }
  const evento = await Evento.buscarPorId(id);
  if (!evento) return res.status(404).json({ erro: "Evento não encontrado." });
  res.status(200).json(evento);
};

// POST /api/eventos -> cria evento para o organizador autenticado.
exports.criar = async (req, res) => {
  const dados = validarEvento(req.body);
  if (typeof dados === "string") return res.status(400).json({ erro: dados });

  try {
    const usuarioId = req.session.usuario.id;
    const id = await Evento.criar({ ...dados, usuario_id: usuarioId });
    res.status(201).json({ id, ...dados, usuario_id: usuarioId });
  } catch (erro) {
    if (isForeignKeyError(erro)) {
      return res.status(400).json({ erro: "Escolha um tipo de evento existente." });
    }
    throw erro;
  }
};

// PUT /api/eventos/:id -> atualiza apenas evento pertencente ao organizador.
exports.atualizar = async (req, res) => {
  const id = parseEventoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ erro: "ID de evento inválido." });
  }
  const dados = validarEvento(req.body);
  if (typeof dados === "string") return res.status(400).json({ erro: dados });

  try {
    const usuarioId = req.session.usuario.id;
    const ok = await Evento.atualizar(id, usuarioId, dados);
    if (!ok) return res.status(404).json({ erro: "Evento não encontrado ou não é seu." });
    res.status(200).json({ id, ...dados, usuario_id: usuarioId });
  } catch (erro) {
    if (isForeignKeyError(erro)) {
      return res.status(400).json({ erro: "Escolha um tipo de evento existente." });
    }
    throw erro;
  }
};

// DELETE /api/eventos/3 -> apaga. Status 204 (deu certo, sem conteúdo)
exports.remover = async (req, res) => {
  const id = parseEventoId(req.params.id);
  if (id === null) {
    return res.status(400).json({ erro: "ID de evento inválido." });
  }
  const ok = await Evento.remover(id, req.session.usuario.id);
  if (!ok) {
    return res.status(404).json({ erro: "Evento não encontrado ou não é seu" });
  }
  res.status(204).end();
};

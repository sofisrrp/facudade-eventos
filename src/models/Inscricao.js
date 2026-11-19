const {
  Inscricao: InscricaoModel,
  Usuario: UsuarioModel,
  Evento: EventoModel,
  Tipo: TipoModel
} = require("./index");

exports.criar = async (usuarioId, eventoId) => {
  await InscricaoModel.findOrCreate({
    where: { usuario_id: usuarioId, evento_id: eventoId },
    defaults: { usuario_id: usuarioId, evento_id: eventoId }
  });
};

exports.remover = async (usuarioId, eventoId) =>
  (await InscricaoModel.destroy({
    where: { usuario_id: usuarioId, evento_id: eventoId }
  })) > 0;

exports.listarDoUsuario = async (usuarioId) => {
  const inscricoes = await InscricaoModel.findAll({
    attributes: ["evento_id"],
    where: { usuario_id: usuarioId },
    include: [{
      model: EventoModel,
      as: "evento",
      attributes: ["id", "titulo", "data_evento", "local"],
      include: [{ model: TipoModel, as: "tipo", attributes: ["nome"] }]
    }],
    order: [[{ model: EventoModel, as: "evento" }, "data_evento", "ASC"]]
  });

  return inscricoes.map((inscricao) => {
    const evento = inscricao.get({ plain: true }).evento;
    return { ...evento, tipo: evento.tipo.nome };
  });
};

exports.listarDoEvento = async (eventoId) => {
  const inscricoes = await InscricaoModel.findAll({
    attributes: ["data_inscricao"],
    where: { evento_id: eventoId },
    include: [{ model: UsuarioModel, as: "aluno", attributes: ["nome", "email"] }],
    order: [["data_inscricao", "ASC"]]
  });

  return inscricoes.map((inscricao) => {
    const dados = inscricao.get({ plain: true });
    return { ...dados.aluno, data_inscricao: dados.data_inscricao };
  });
};

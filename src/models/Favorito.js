const {
  Favorito: FavoritoModel,
  Evento: EventoModel,
  Tipo: TipoModel,
  Usuario: UsuarioModel
} = require("./index");

exports.verificar = async (usuarioId, eventoId) =>
  (await FavoritoModel.count({ where: { usuario_id: usuarioId, evento_id: eventoId } })) > 0;

exports.adicionar = async (usuarioId, eventoId) => {
  await FavoritoModel.findOrCreate({
    where: { usuario_id: usuarioId, evento_id: eventoId },
    defaults: { usuario_id: usuarioId, evento_id: eventoId }
  });
};

exports.remover = async (usuarioId, eventoId) => {
  await FavoritoModel.destroy({ where: { usuario_id: usuarioId, evento_id: eventoId } });
};

exports.listar = async (usuarioId) => {
  const favoritos = await FavoritoModel.findAll({
    attributes: ["evento_id"],
    where: { usuario_id: usuarioId },
    include: [{
      model: EventoModel,
      as: "evento",
      attributes: ["id", "titulo", "descricao", "data_evento", "local", "tipo_id", "usuario_id"],
      include: [
        { model: TipoModel, as: "tipo", attributes: ["nome"] },
        { model: UsuarioModel, as: "organizador", attributes: ["nome"] }
      ]
    }],
    order: [[{ model: EventoModel, as: "evento" }, "data_evento", "ASC"]]
  });

  return favoritos.map((favorito) => {
    const evento = favorito.get({ plain: true }).evento;
    return {
      ...evento,
      tipo: evento.tipo.nome,
      organizador: evento.organizador.nome
    };
  });
};

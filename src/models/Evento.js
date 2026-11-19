const { Op, fn, col } = require("sequelize");
const {
  Evento: EventoModel,
  Tipo: TipoModel,
  Usuario: UsuarioModel,
  Inscricao: InscricaoModel,
  Favorito: FavoritoModel
} = require("./index");

const plain = (evento) => evento?.get({ plain: true });

function mapEvento(evento) {
  const dados = plain(evento);
  if (!dados) return dados;
  dados.tipo = dados.tipo?.nome || dados.tipo;
  dados.organizador = dados.organizador?.nome || dados.organizador;
  return dados;
}

function hojeISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

async function contarInscritos(eventoIds) {
  if (eventoIds.length === 0) return new Map();

  const linhas = await InscricaoModel.findAll({
    attributes: ["evento_id", [fn("COUNT", col("id")), "total_inscritos"]],
    where: { evento_id: { [Op.in]: eventoIds } },
    group: ["evento_id"],
    raw: true
  });
  return new Map(linhas.map((linha) => [
    Number(linha.evento_id),
    Number(linha.total_inscritos)
  ]));
}

const incluirNomes = [
  { model: TipoModel, as: "tipo", attributes: ["nome"], required: true },
  { model: UsuarioModel, as: "organizador", attributes: ["nome"], required: true }
];

exports.listar = async (busca = "", usuarioId = 0) => {
  const where = { data_evento: { [Op.gte]: hojeISO() } };
  if (busca) {
    const termo = `%${busca}%`;
    where[Op.or] = [
      { titulo: { [Op.like]: termo } },
      { "$tipo.nome$": { [Op.like]: termo } }
    ];
  }

  const eventos = await EventoModel.findAll({
    attributes: ["id", "titulo", "descricao", "data_evento", "local", "tipo_id", "usuario_id"],
    include: incluirNomes,
    where,
    order: [["data_evento", "ASC"]]
  });
  const ids = eventos.map((evento) => Number(evento.id));

  const [contagens, inscricoes, favoritos] = await Promise.all([
    contarInscritos(ids),
    usuarioId && ids.length
      ? InscricaoModel.findAll({
          attributes: ["evento_id"],
          where: { usuario_id: usuarioId, evento_id: { [Op.in]: ids } },
          raw: true
        })
      : [],
    usuarioId && ids.length
      ? FavoritoModel.findAll({
          attributes: ["evento_id"],
          where: { usuario_id: usuarioId, evento_id: { [Op.in]: ids } },
          raw: true
        })
      : []
  ]);

  const inscritosIds = new Set(inscricoes.map((linha) => Number(linha.evento_id)));
  const favoritosIds = new Set(favoritos.map((linha) => Number(linha.evento_id)));

  return eventos.map((evento) => {
    const dados = mapEvento(evento);
    const id = Number(dados.id);
    return {
      ...dados,
      total_inscritos: contagens.get(id) || 0,
      inscrito: inscritosIds.has(id),
      favorito: favoritosIds.has(id)
    };
  });
};

exports.buscarPorId = async (id) => {
  const evento = await EventoModel.findByPk(id, { include: incluirNomes });
  if (!evento) return undefined;
  const dados = mapEvento(evento);
  dados.disponivel = dados.data_evento >= hojeISO();
  return dados;
};

exports.criar = async (dados) => {
  const evento = await EventoModel.create(dados);
  return evento.id;
};

exports.atualizar = async (id, usuarioId, dados) => {
  const [alterados] = await EventoModel.update(dados, {
    where: { id, usuario_id: usuarioId }
  });
  if (alterados > 0) return true;
  return Boolean(await EventoModel.findOne({
    attributes: ["id"],
    where: { id, usuario_id: usuarioId }
  }));
};

exports.remover = async (id, usuarioId) =>
  (await EventoModel.destroy({ where: { id, usuario_id: usuarioId } })) > 0;

exports.listarDoOrganizador = async (usuarioId) => {
  const eventos = await EventoModel.findAll({
    attributes: ["id", "titulo", "descricao", "data_evento", "local", "tipo_id", "usuario_id"],
    include: incluirNomes,
    where: { usuario_id: usuarioId },
    order: [["data_evento", "DESC"]]
  });
  const contagens = await contarInscritos(eventos.map((evento) => Number(evento.id)));

  return eventos.map((evento) => {
    const dados = mapEvento(evento);
    dados.total_inscritos = contagens.get(Number(dados.id)) || 0;
    return dados;
  });
};

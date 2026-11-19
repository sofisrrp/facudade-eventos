const { Tipo: TipoModel } = require("./index");

const plain = (tipo) => tipo?.get({ plain: true });

exports.listar = async () => {
  const tipos = await TipoModel.findAll({ order: [["nome", "ASC"]] });
  return tipos.map(plain);
};

exports.buscarPorId = async (id) => plain(await TipoModel.findByPk(id));

exports.criar = async (nome) => {
  const tipo = await TipoModel.create({ nome });
  return tipo.id;
};

exports.atualizar = async (id, nome) => {
  const [alterados] = await TipoModel.update({ nome }, { where: { id } });
  if (alterados > 0) return true;
  return Boolean(await TipoModel.findByPk(id, { attributes: ["id"] }));
};

exports.remover = async (id) =>
  (await TipoModel.destroy({ where: { id } })) > 0;

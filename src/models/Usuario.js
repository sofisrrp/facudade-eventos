const { Usuario: UsuarioModel } = require("./index");

const plain = (usuario) => usuario?.get({ plain: true });

exports.buscarPorEmail = async (email) => {
  const usuario = await UsuarioModel.findOne({ where: { email } });
  return plain(usuario);
};

exports.criar = async ({
  nome,
  email,
  senhaHash,
  perfil = "aluno",
  idInstitucional = null
}) => {
  const usuario = await UsuarioModel.create({
    nome,
    email,
    perfil,
    id_institucional: idInstitucional,
    senha_hash: senhaHash
  });
  return usuario.id;
};

exports.gerarProximoIdInstitucional = async () => {
  const usuarios = await UsuarioModel.findAll({
    attributes: ["id_institucional"],
    where: { perfil: "organizador" }
  });

  const maiorNumero = usuarios.reduce((maior, usuario) => {
    const resultado = String(usuario.id_institucional || "").match(/^FAC-ORG-(\d+)$/);
    return resultado ? Math.max(maior, Number(resultado[1])) : maior;
  }, 0);

  return `FAC-ORG-${String(maiorNumero + 1).padStart(3, "0")}`;
};

exports.buscarPorId = async (id) => {
  const usuario = await UsuarioModel.findByPk(id, {
    attributes: ["id", "nome", "email", "perfil", "id_institucional"]
  });
  return plain(usuario);
};

exports.atualizarPerfil = async (id, dados) => {
  const [alterados] = await UsuarioModel.update(
    { nome: dados.nome, email: dados.email },
    { where: { id } }
  );
  if (alterados > 0) return true;
  return Boolean(await UsuarioModel.findByPk(id, { attributes: ["id"] }));
};

exports.atualizarSenha = async (id, senhaHash) => {
  await UsuarioModel.update({ senha_hash: senhaHash }, { where: { id } });
};

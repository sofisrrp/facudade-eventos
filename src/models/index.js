const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = sequelize.define("Usuario", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  perfil: {
    type: DataTypes.ENUM("aluno", "organizador"),
    allowNull: false,
    defaultValue: "aluno"
  },
  id_institucional: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  senha_hash: { type: DataTypes.STRING(100), allowNull: false }
}, { tableName: "usuarios" });

const Tipo = sequelize.define("Tipo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(50), allowNull: false, unique: true }
}, { tableName: "tipos" });

const Evento = sequelize.define("Evento", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titulo: { type: DataTypes.STRING(150), allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  data_evento: { type: DataTypes.DATEONLY, allowNull: false },
  local: { type: DataTypes.STRING(100), allowNull: true },
  tipo_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "eventos" });

const Inscricao = sequelize.define("Inscricao", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  evento_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  data_inscricao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: "inscricoes" });

const Favorito = sequelize.define("Favorito", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  evento_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "favoritos" });

Tipo.hasMany(Evento, { as: "eventos", foreignKey: "tipo_id" });
Evento.belongsTo(Tipo, { as: "tipo", foreignKey: "tipo_id" });

Usuario.hasMany(Evento, { as: "eventos", foreignKey: "usuario_id" });
Evento.belongsTo(Usuario, { as: "organizador", foreignKey: "usuario_id" });

Usuario.hasMany(Inscricao, { as: "inscricoes", foreignKey: "usuario_id" });
Inscricao.belongsTo(Usuario, { as: "aluno", foreignKey: "usuario_id" });
Evento.hasMany(Inscricao, { as: "inscricoes", foreignKey: "evento_id" });
Inscricao.belongsTo(Evento, { as: "evento", foreignKey: "evento_id" });

Usuario.hasMany(Favorito, { as: "favoritos", foreignKey: "usuario_id" });
Favorito.belongsTo(Usuario, { as: "aluno", foreignKey: "usuario_id" });
Evento.hasMany(Favorito, { as: "favoritos", foreignKey: "evento_id" });
Favorito.belongsTo(Evento, { as: "evento", foreignKey: "evento_id" });

module.exports = {
  sequelize,
  Usuario,
  Tipo,
  Evento,
  Inscricao,
  Favorito
};

function codigoOriginal(erro) {
  return erro?.original?.code || erro?.parent?.code || erro?.code;
}

exports.isUniqueConstraintError = (erro) =>
  erro?.name === "SequelizeUniqueConstraintError" || codigoOriginal(erro) === "ER_DUP_ENTRY";

exports.isForeignKeyError = (erro) =>
  erro?.name === "SequelizeForeignKeyConstraintError" ||
  ["ER_NO_REFERENCED_ROW_2", "ER_ROW_IS_REFERENCED_2"].includes(codigoOriginal(erro));

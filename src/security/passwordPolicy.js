const bcrypt = require("bcryptjs");

const MIN_PASSWORD_CODE_POINTS = 10;

function senhaCabeNoBcrypt(senha) {
  return typeof senha === "string" && !bcrypt.truncates(senha);
}

function validarNovaSenha(senha) {
  if (typeof senha !== "string" || Array.from(senha).length < MIN_PASSWORD_CODE_POINTS) {
    return "A senha deve ter pelo menos 10 caracteres.";
  }
  if (!/\p{Lu}/u.test(senha)) {
    return "A senha deve conter pelo menos uma letra maiúscula.";
  }
  if (!/[\p{P}\p{S}]/u.test(senha)) {
    return "A senha deve conter pelo menos um símbolo, como ! ou #.";
  }
  if (!senhaCabeNoBcrypt(senha)) {
    return "A senha deve ter no máximo 72 bytes UTF-8. Tente uma frase mais curta.";
  }
  return null;
}

module.exports = { validarNovaSenha, senhaCabeNoBcrypt };

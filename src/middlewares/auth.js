// "Porteiro 1": só deixa passar quem está logado
exports.csrfProtection = require("./csrf").csrfProtection;

exports.exigirLogin = (req, res, next) => {
  if (req.session.usuario) return next();
  if (req.originalUrl.startsWith("/api")) return res.status(401).json({ erro: "Faça login" });
  res.redirect("/login");
};

function exigirPerfil(perfil, nomePerfis) {
  return (req, res, next) => {
    if (!req.session.usuario) {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(401).json({ erro: "Faça login" });
      }
      return res.redirect("/login");
    }
    if (req.session.usuario.perfil === perfil) return next();
    if (req.originalUrl.startsWith("/api")) {
      return res.status(403).json({ erro: `Acesso permitido apenas para ${nomePerfis}` });
    }
    return res.status(403).send(`Acesso permitido apenas para ${nomePerfis}. <a href='/'>Voltar</a>`);
  };
}

exports.exigirOrganizador = exigirPerfil("organizador", "organizadores");
exports.exigirAluno = exigirPerfil("aluno", "alunos");

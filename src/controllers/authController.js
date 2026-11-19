
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const {
  validarNovaSenha,
  senhaCabeNoBcrypt
} = require("../security/passwordPolicy");
const { SESSION_COOKIE_NAME } = require("../config/sessionOptions");

exports.validarSenha = validarNovaSenha;

// Mostra a página de login
exports.formLogin = (req, res) => {
  res.render("login", {
    erro: null,
    perfilSelecionado: "aluno"
  });
};

// Realiza o login
exports.login = async (req, res) => {
  const email = String(req.body.email || "").trim();
  const senha = String(req.body.senha || "");
  const perfil = String(req.body.perfil || "");
  const idInstitucional = String(req.body.id_institucional || "").trim();

  const u = email ? await Usuario.buscarPorEmail(email) : null;

  const senhaCorreta =
    senhaCabeNoBcrypt(senha) &&
    u &&
    await bcrypt.compare(senha, u.senha_hash);

  const perfilCorreto =
    u &&
    ["aluno", "organizador"].includes(perfil) &&
    u.perfil === perfil;

  const idCorreto = perfil !== "organizador" || (
    u &&
    u.id_institucional &&
    idInstitucional === String(u.id_institucional)
  );

  if (!senhaCorreta || !perfilCorreto || !idCorreto) {
    return res.status(401).render("login", {
      erro: "E-mail, senha, perfil ou ID inválidos",
      perfilSelecionado: perfil === "organizador"
        ? "organizador"
        : "aluno"
    });
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate((erro) =>
      erro ? reject(erro) : resolve()
    );
  });

  req.session.usuario = {
    id: u.id,
    nome: u.nome,
    perfil: u.perfil
  };

  res.redirect(
    u.perfil === "organizador"
      ? "/eventos/organizador"
      : "/"
  );
};

// Mostra a página de cadastro
exports.formRegistro = (req, res) => {
  res.render("registro", {
    erro: null,
    sucesso: null,
    idInstitucional: null
  });
};

// Realiza o cadastro
exports.registro = async (req, res) => {
  const nome = String(req.body.nome || "").trim();
  const email = String(req.body.email || "").trim();
  const senha = String(req.body.senha || "");
  const perfil = String(req.body.perfil || "aluno");
  const codigo = String(req.body.codigo_autorizacao || "").trim();

  // Verifica os dados básicos
  const erroSenha = validarNovaSenha(senha);

  if (
    !nome ||
    !email ||
    erroSenha ||
    !["aluno", "organizador"].includes(perfil)
  ) {
    return res.status(400).render("registro", {
      erro: erroSenha || "Preencha todos os campos corretamente.",
      sucesso: null,
      idInstitucional: null
    });
  }

  // Verifica o código de autorização do organizador
  if (perfil === "organizador") {
    const codigoCorreto = process.env.CODIGO_ORGANIZADOR;

    if (!codigoCorreto || codigo !== codigoCorreto) {
      return res.status(403).render("registro", {
        erro: "Código de autorização inválido.",
        sucesso: null,
        idInstitucional: null
      });
    }
  }

  // Verifica se o e-mail já existe
  if (await Usuario.buscarPorEmail(email)) {
    return res.status(409).render("registro", {
      erro: "Este e-mail já está cadastrado.",
      sucesso: null,
      idInstitucional: null
    });
  }

  // Criptografa a senha
  const senhaHash = await bcrypt.hash(senha, 10);

  // Gera o próximo ID disponível para organizadores
  const idInstitucional = perfil === "organizador"
    ? await Usuario.gerarProximoIdInstitucional()
    : null;

  // Salva o usuário no banco de dados
  await Usuario.criar({
    nome,
    email,
    senhaHash,
    perfil,
    idInstitucional
  });

  // Exibe a confirmação do cadastro
  res.render("registro", {
    erro: null,
    sucesso: "Cadastro realizado com sucesso!",
    idInstitucional
  });
};

// Realiza o logout
exports.logout = (req, res, next) => {
  req.session.destroy((erro) => {
    if (erro) return next(erro);

    res.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.redirect("/");
  });
};


// Mostra a página de perfil
exports.perfil = async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.session.usuario.id);

  if (!usuario) {
    return res.redirect("/logout");
  }

  res.render("perfil", {
    usuario,
    erro: null,
    sucesso: null
  });
};

// Atualiza os dados do perfil
exports.atualizarPerfil = async (req, res) => {
  const id = req.session.usuario.id;
  const nome = String(req.body.nome || "").trim();
  const email = String(req.body.email || "").trim();
  const senha = String(req.body.senha || "");
  const confirmarSenha = String(req.body.confirmar_senha || "");

  const usuario = await Usuario.buscarPorId(id);

  if (!usuario) {
    return res.redirect("/logout");
  }

  // Valida nome e e-mail
  if (!nome || !email || !email.includes("@")) {
    return res.status(400).render("perfil", {
      usuario: { ...usuario, nome, email },
      erro: "Preencha um nome e um e-mail válido.",
      sucesso: null
    });
  }

  // Verifica se o e-mail já pertence a outra conta
  const contaEmail = await Usuario.buscarPorEmail(email);

  if (contaEmail && Number(contaEmail.id) !== Number(id)) {
    return res.status(409).render("perfil", {
      usuario: { ...usuario, nome, email },
      erro: "Este e-mail já está cadastrado em outra conta.",
      sucesso: null
    });
  }

  // Atualiza a senha somente se o campo foi preenchido
  if (senha) {
    const erroSenha = validarNovaSenha(senha);

    if (erroSenha || senha !== confirmarSenha) {
      return res.status(400).render("perfil", {
        usuario: { ...usuario, nome, email },
        erro: erroSenha || "As senhas não coincidem.",
        sucesso: null
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await Usuario.atualizarSenha(id, senhaHash);
  }

  await Usuario.atualizarPerfil(id, { nome, email });

  // Atualiza o nome na sessão
  req.session.usuario.nome = nome;

  const usuarioAtualizado = await Usuario.buscarPorId(id);

  res.render("perfil", {
    usuario: usuarioAtualizado,
    erro: null,
    sucesso: "Perfil atualizado com sucesso!"
  });
};

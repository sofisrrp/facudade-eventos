const Evento = require("../models/Evento");
const Tipo = require("../models/Tipo");
const Inscricao = require("../models/Inscricao");
const { validarEvento } = require("../validators/evento");
const { isForeignKeyError } = require("../models/databaseErrors");

// Página inicial. O HTML é só a "casca": o JavaScript do navegador
// (public/js/site.js) busca os eventos na API.
exports.home = (req, res) => res.render("eventos/index");

// Painel usa a mesma listagem de cards e a mesma API da página inicial.
exports.painelOrganizador = async (req, res) => {
  const eventos = await Evento.listarDoOrganizador(req.session.usuario.id);

  res.render("eventos/organizador", { eventos });
};

// Função auxiliar: mostra o formulário de evento (usada em vários lugares)
async function mostrarForm(res, { evento, acao, titulo, erro = null, status = 200 }) {
  const tipos = await Tipo.listar(); // precisa dos tipos para o campo "Tipo"
  res.status(status).render("eventos/form", { evento, tipos, acao, titulo, erro });
}

// ---------- ORGANIZADOR: criar e editar eventos ----------

exports.formNovo = (req, res) =>
  mostrarForm(res, { evento: {}, acao: "/eventos", titulo: "Novo evento" });

exports.criar = async (req, res) => {
  const evento = validarEvento(req.body);
  if (typeof evento === "string") {
    return mostrarForm(res, { evento: req.body, acao: "/eventos", titulo: "Novo evento", erro: evento, status: 400 });
  }
  try {
    await Evento.criar({ ...evento, usuario_id: req.session.usuario.id });
  } catch (erro) {
    if (isForeignKeyError(erro)) {
      return mostrarForm(res, { evento: req.body, acao: "/eventos", titulo: "Novo evento",
        erro: "Escolha um tipo de evento existente", status: 400 });
    }
    throw erro;
  }
  res.redirect("/eventos/organizador");
};

exports.formEditar = async (req, res) => {
  const evento = await Evento.buscarPorId(req.params.id);
  if (!evento || evento.usuario_id !== req.session.usuario.id) {
    return res.status(404).render("404");
  }
  mostrarForm(res, { evento, acao: `/eventos/${evento.id}/editar`, titulo: "Editar evento" });
};

exports.atualizar = async (req, res) => {
  const evento = validarEvento(req.body);
  if (typeof evento === "string") {
    return mostrarForm(res, { evento: req.body, acao: `/eventos/${req.params.id}/editar`,
      titulo: "Editar evento", erro: evento, status: 400 });
  }
  try {
    const ok = await Evento.atualizar(req.params.id, req.session.usuario.id, evento);
    if (!ok) return res.status(404).render("404");
  } catch (erro) {
    if (isForeignKeyError(erro)) {
      return mostrarForm(res, { evento: req.body, acao: `/eventos/${req.params.id}/editar`,
        titulo: "Editar evento", erro: "Escolha um tipo de evento existente", status: 400 });
    }
    throw erro;
  }
  res.redirect("/eventos/organizador");
};

// Página de detalhes de UM evento (opcional)
exports.detalhe = async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return next();
  const evento = await Evento.buscarPorId(req.params.id);
  if (!evento) return res.status(404).render("404");
  res.render("eventos/detalhe", { evento });
};

// ---------- ORGANIZADOR: ver quem se inscreveu ----------

exports.inscritos = async (req, res) => {
  const evento = await Evento.buscarPorId(req.params.id);
  // 404 se não existe OU se o evento pertence a outro organizador
  if (!evento || evento.usuario_id !== req.session.usuario.id) {
    return res.status(404).render("404");
  }
  const inscritos = await Inscricao.listarDoEvento(evento.id);
  res.render("eventos/inscritos", { evento, inscritos });
};

// ---------- ALUNO: inscrição ----------

exports.inscrever = async (req, res) => {
  // A rota também é protegida pelo middleware, mas mantemos a checagem no controller.
  if (req.session.usuario.perfil !== "aluno") {
    return res.status(403).send("Apenas alunos podem se inscrever. <a href='/'>Voltar</a>");
  }
  const evento = await Evento.buscarPorId(req.params.id);
  if (!evento) return res.status(404).render("404");
  if (!evento.disponivel) {
    return res.status(409).send("As inscrições para este evento estão encerradas. <a href='/'>Voltar</a>");
  }

  await Inscricao.criar(req.session.usuario.id, evento.id);
  res.redirect("/");
};

exports.cancelar = async (req, res) => {
  await Inscricao.remover(req.session.usuario.id, req.params.id);
  res.redirect("/eventos/minhas");
};

exports.minhas = async (req, res) => {
  const eventos = await Inscricao.listarDoUsuario(req.session.usuario.id);
  res.render("eventos/minhas", { eventos });
};

const Tipo = require("../models/Tipo");
const { isUniqueConstraintError, isForeignKeyError } = require("../models/databaseErrors");

// Função auxiliar: mostra a página de tipos (com mensagem de erro opcional)
async function mostrarLista(res, erro = null, status = 200) {
  res.status(status).render("tipos/index", { tipos: await Tipo.listar(), erro });
}

// Lista os tipos
exports.listar = (req, res) => mostrarLista(res);

// Cria um tipo
exports.criar = async (req, res) => {
  const nome = (req.body.nome || "").trim(); // trim() tira espaços das pontas
  if (!nome) return mostrarLista(res, "Informe o nome", 400);
  try {
    await Tipo.criar(nome);
    res.redirect("/tipos");
  } catch (erro) {
    // O banco recusa nome repetido (UNIQUE): erro 409
    if (isUniqueConstraintError(erro)) return mostrarLista(res, "Esse tipo já existe", 409);
    throw erro; // outro erro: deixa o app.js tratar
  }
};

// Formulário de edição
exports.formEditar = async (req, res) => {
  const tipo = await Tipo.buscarPorId(req.params.id);
  if (!tipo) return res.status(404).render("404");
  res.render("tipos/form", { tipo, erro: null });
};

// Recebe a edição
exports.atualizar = async (req, res) => {
  const nome = (req.body.nome || "").trim();
  const tipo = { id: req.params.id, nome };
  if (!nome) return res.status(400).render("tipos/form", { tipo, erro: "Informe o nome" });
  try {
    if (!(await Tipo.atualizar(req.params.id, nome))) return res.status(404).render("404");
    res.redirect("/tipos");
  } catch (erro) {
    if (isUniqueConstraintError(erro)) {
      return res.status(409).render("tipos/form", { tipo, erro: "Esse tipo já existe" });
    }
    throw erro;
  }
};

// Apaga um tipo
exports.remover = async (req, res) => {
  try {
    await Tipo.remover(req.params.id);
    res.redirect("/tipos");
  } catch (erro) {
    // A chave estrangeira impede apagar um tipo que ainda tem eventos
    if (isForeignKeyError(erro)) {
      return mostrarLista(res, "Este tipo possui eventos e não pode ser apagado", 409);
    }
    throw erro;
  }
};

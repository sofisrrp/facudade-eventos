// =========================================================
//  app.js - O "ponto de partida" do sistema
//  Liga tudo: configurações, rotas e o servidor.
// =========================================================
require("dotenv").config();                 // lê o arquivo .env
const express = require("express");         // o framework do servidor
const session = require("express-session"); // guarda quem está logado
const eventoController = require("./src/controllers/eventoController");
const { csrfProtection } = require("./src/middlewares/csrf");
const { createSessionOptions, createSessionStore, SESSION_COOKIE_NAME } = require("./src/config/sessionOptions");

const app = express();

// Diz ao Express que as páginas são feitas com EJS (pasta "views")
app.set("view engine", "ejs");

// Só confie em um proxy reverso conhecido, necessário para cookies Secure atrás do HTTPS.
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

// Permite ler os dados enviados pelo navegador:
app.use(express.json());                          // dados em JSON (fetch)
app.use(express.urlencoded({ extended: true }));  // dados de formulários HTML

// Libera a pasta "public" (css e js que o navegador baixa)
app.use(express.static("public"));

// Em produção, sessões ficam no MySQL; em desenvolvimento, o armazenamento em memória basta.
const sessionStore = createSessionStore(session, process.env);
app.use(session(createSessionOptions(process.env, sessionStore || undefined)));

// Deixa a variável "usuario" disponível em TODAS as páginas
// (se não estiver logado, ela vale null)
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// Protege login, formulários, inscrições e ações da API que alteram dados.
app.use(csrfProtection);

// ---------- ROTAS ----------
app.get("/", eventoController.home);                          // página inicial (pública)
app.use("/", require("./src/routes/authRoutes"));             // login, cadastro, sair
app.use("/eventos", require("./src/routes/eventoRoutes"));    // cadastrar/editar evento (restrita)
app.use("/tipos", require("./src/routes/tipoRoutes"));        // gerenciar tipos (restrita)
app.use("/api/eventos", require("./src/routes/apiRoutes"));   // dados em JSON para o fetch

// Se nenhuma rota combinou: API responde JSON e páginas respondem EJS.
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ erro: "Rota da API não encontrada." });
  }
  res.status(404).render("404");
});

// Se acontecer um erro inesperado (ex.: banco desligado)
app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500
    ? erro.status
    : 500;
  if (status === 500) console.error(erro);
  if (req.originalUrl.startsWith("/api")) {
    const mensagem = status === 500 ? "Erro no servidor" : "Requisição inválida";
    return res.status(status).json({ erro: mensagem });
  }
  res.status(status).send(status === 500 ? "Erro no servidor. Veja o terminal." : "Requisição inválida.");
});

// Liga o servidor
const porta = process.env.PORT || 3001;
async function iniciarServidor() {
  if (sessionStore) await sessionStore.onReady();
  const servidor = app.listen(porta, () => {
    console.log(`Site rodando em http://localhost:${porta}`);
  });
  servidor.on("error", (erro) => {
    console.error("Não foi possível iniciar o servidor:", erro.message);
    process.exitCode = 1;
  });
  return servidor;
}

if (require.main === module) {
  iniciarServidor().catch((erro) => {
    console.error("Não foi possível preparar as sessões:", erro.message);
    process.exitCode = 1;
  });
}

module.exports = { app, iniciarServidor, SESSION_COOKIE_NAME };

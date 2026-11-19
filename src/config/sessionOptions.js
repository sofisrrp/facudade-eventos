const SESSION_COOKIE_NAME = "eventos.sid";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 2;

function createSessionOptions(env = process.env, store) {
  const secret = typeof env.SESSION_SECRET === "string" ? env.SESSION_SECRET : "";
  if (secret.length < 32 || secret === "troque_por_um_texto_longo_e_aleatorio") {
    throw new Error("Configure SESSION_SECRET no .env com pelo menos 32 caracteres aleatórios.");
  }

  const options = {
    name: SESSION_COOKIE_NAME,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE
    }
  };
  if (store) options.store = store;
  return options;
}

function createSessionStore(session, env = process.env) {
  if (env.NODE_ENV !== "production") return null;

  const MySQLStore = require("express-mysql-session")(session);
  return new MySQLStore({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    createDatabaseTable: true,
    clearExpired: true,
    expiration: SESSION_MAX_AGE
  });
}

module.exports = { createSessionOptions, createSessionStore, SESSION_COOKIE_NAME };

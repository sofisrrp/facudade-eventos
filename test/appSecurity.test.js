const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret-that-is-longer-than-thirty-two-characters";

const { app } = require("../app");

test("formulário de login entrega token e bloqueia logout sem CSRF", async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve, reject) => server.close((erro) => erro ? reject(erro) : resolve())));
  await new Promise((resolve) => server.once("listening", resolve));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const pagina = await fetch(`${baseUrl}/login`);
  assert.equal(pagina.status, 200);
  const html = await pagina.text();
  const token = html.match(/<meta name="csrf-token" content="([a-f0-9]{64})">/)?.[1];
  assert.ok(token);
  assert.match(html, new RegExp(`name="_csrf" value="${token}"`));

  const cookie = pagina.headers.get("set-cookie");
  assert.match(cookie, /eventos\.sid=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);

  const idInvalido = await fetch(`${baseUrl}/api/eventos/abc`, { headers: { cookie } });
  assert.equal(idInvalido.status, 400);

  const idForaDoLimiteInt = await fetch(`${baseUrl}/api/eventos/2147483648`, { headers: { cookie } });
  assert.equal(idForaDoLimiteInt.status, 400);

  const rotaDesconhecida = await fetch(`${baseUrl}/api/nao-existe`);
  assert.equal(rotaDesconhecida.status, 404);
  assert.match(rotaDesconhecida.headers.get("content-type"), /application\/json/);

  const jsonMalformado = await fetch(`${baseUrl}/api/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  });
  assert.equal(jsonMalformado.status, 400);

  const apiSemLogin = await fetch(`${baseUrl}/api/eventos`, {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({})
  });
  assert.equal(apiSemLogin.status, 401);

  for (let tentativa = 1; tentativa <= 11; tentativa++) {
    const cadastro = await fetch(`${baseUrl}/registro`, {
      method: "POST",
      headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ _csrf: token, nome: "", email: "", senha: "" })
    });
    assert.equal(cadastro.status, tentativa <= 10 ? 400 : 429);
  }

  for (let tentativa = 1; tentativa <= 11; tentativa++) {
    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ _csrf: token, email: "", senha: "x", perfil: "aluno" })
    });
    assert.equal(login.status, tentativa <= 10 ? 401 : 429);
  }

  const semToken = await fetch(`${baseUrl}/logout`, {
    method: "POST",
    headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
    body: ""
  });
  assert.equal(semToken.status, 403);

  const comToken = await fetch(`${baseUrl}/logout`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ _csrf: token })
  });
  assert.equal(comToken.status, 302);
  assert.match(comToken.headers.get("set-cookie"), /eventos\.sid=/);
  assert.match(comToken.headers.get("set-cookie"), /1970|Expires/i);
});

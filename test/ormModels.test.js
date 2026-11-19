const test = require("node:test");
const assert = require("node:assert/strict");
const models = require("../src/models");

test("mapeia as cinco entidades para as tabelas já existentes", () => {
  assert.equal(models.Usuario.getTableName(), "usuarios");
  assert.equal(models.Tipo.getTableName(), "tipos");
  assert.equal(models.Evento.getTableName(), "eventos");
  assert.equal(models.Inscricao.getTableName(), "inscricoes");
  assert.equal(models.Favorito.getTableName(), "favoritos");
});

test("declara Tipo 1:N Evento com a chave estrangeira tipo_id", () => {
  assert.equal(models.Tipo.associations.eventos.associationType, "HasMany");
  assert.equal(models.Tipo.associations.eventos.foreignKey, "tipo_id");
  assert.equal(models.Evento.associations.tipo.associationType, "BelongsTo");
  assert.equal(models.Evento.associations.tipo.foreignKey, "tipo_id");
});

test("declara Usuario 1:N Evento com a chave estrangeira usuario_id", () => {
  assert.equal(models.Usuario.associations.eventos.associationType, "HasMany");
  assert.equal(models.Usuario.associations.eventos.foreignKey, "usuario_id");
  assert.equal(models.Evento.associations.organizador.associationType, "BelongsTo");
  assert.equal(models.Evento.associations.organizador.foreignKey, "usuario_id");
});

test("mantém o schema atual: campos snake_case e timestamps desligados", () => {
  assert.ok(models.Evento.rawAttributes.tipo_id);
  assert.ok(models.Evento.rawAttributes.usuario_id);
  assert.equal(models.Evento.options.timestamps, false);
  assert.equal(models.Inscricao.options.timestamps, false);
});

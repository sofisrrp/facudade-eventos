const test = require("node:test");
const assert = require("node:assert/strict");
const models = require("../src/models");
const Evento = require("../src/models/Evento");

test("atualização de dados iguais continua indicando sucesso para o dono", async () => {
  const updateOriginal = models.Evento.update;
  const findOriginal = models.Evento.findOne;
  let updateArgs;
  models.Evento.update = async (...args) => { updateArgs = args; return [0]; };
  models.Evento.findOne = async () => ({ id: 5 });

  try {
    const resultado = await Evento.atualizar(5, 7, {
      titulo: "Palestra",
      descricao: "Descrição",
      data_evento: "2026-12-02",
      local: "Auditório",
      tipo_id: 1
    });
    assert.equal(resultado, true);
    assert.deepEqual(updateArgs[1], { where: { id: 5, usuario_id: 7 } });
    assert.equal(updateArgs[0].titulo, "Palestra");
    assert.equal(updateArgs[0].tipo_id, 1);
  } finally {
    models.Evento.update = updateOriginal;
    models.Evento.findOne = findOriginal;
  }
});

test("atualização de outro organizador retorna não encontrado", async () => {
  const updateOriginal = models.Evento.update;
  const findOriginal = models.Evento.findOne;
  models.Evento.update = async () => [0];
  models.Evento.findOne = async () => null;

  try {
    const resultado = await Evento.atualizar(5, 99, {
      titulo: "Palestra",
      descricao: "Descrição",
      data_evento: "2026-12-02",
      local: "Auditório",
      tipo_id: 1
    });
    assert.equal(resultado, false);
  } finally {
    models.Evento.update = updateOriginal;
    models.Evento.findOne = findOriginal;
  }
});

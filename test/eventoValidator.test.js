const test = require("node:test");
const assert = require("node:assert/strict");
const apiEventoController = require("../src/controllers/apiEventoController");
const { parseEventoId } = require("../src/validators/eventoId");

function validar(dados) {
  assert.equal(typeof apiEventoController.validarEvento, "function");
  return apiEventoController.validarEvento(dados);
}

test("normaliza evento válido", () => {
  assert.deepEqual(validar({
    titulo: "  Palestra de tecnologia  ",
    descricao: "  Conversa com convidados.  ",
    data_evento: "2026-12-02",
    local: "  Auditório  ",
    tipo_id: "2"
  }), {
    titulo: "Palestra de tecnologia",
    descricao: "Conversa com convidados.",
    data_evento: "2026-12-02",
    local: "Auditório",
    tipo_id: 2
  });
});

test("rejeita título vazio ou acima de 150 caracteres", () => {
  assert.equal(typeof validar({ titulo: " ", data_evento: "2026-12-02", tipo_id: 1 }), "string");
  assert.equal(typeof validar({ titulo: "x".repeat(151), data_evento: "2026-12-02", tipo_id: 1 }), "string");
});

test("rejeita data impossível e tipo inválido", () => {
  assert.equal(typeof validar({ titulo: "Evento", data_evento: "2026-02-30", tipo_id: 1 }), "string");
  assert.equal(typeof validar({ titulo: "Evento", data_evento: "2026-12-02", tipo_id: "abc" }), "string");
});

test("rejeita local acima de 100 caracteres", () => {
  assert.equal(typeof validar({ titulo: "Evento", data_evento: "2026-12-02", tipo_id: 1, local: "x".repeat(101) }), "string");
});

test("aceita apenas IDs inteiros positivos que cabem na coluna INT do MySQL", () => {
  assert.equal(parseEventoId("1"), 1);
  assert.equal(parseEventoId("2147483647"), 2147483647);
  assert.equal(parseEventoId("0"), null);
  assert.equal(parseEventoId("2147483648"), null);
  assert.equal(parseEventoId("9007199254740993"), null);
  assert.equal(parseEventoId("1.5"), null);
  assert.equal(parseEventoId("abc"), null);
});

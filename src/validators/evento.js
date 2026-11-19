function validarDataISO(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const dataVerificada = new Date(`${data}T00:00:00.000Z`);
  return !Number.isNaN(dataVerificada.valueOf()) && dataVerificada.toISOString().slice(0, 10) === data;
}

function validarEvento(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Envie os dados do evento.";
  }

  if (typeof body.titulo !== "string") return "Informe o título do evento.";
  const titulo = body.titulo.trim();
  if (!titulo) return "Informe o título do evento.";
  if (Array.from(titulo).length > 150) return "O título deve ter até 150 caracteres.";

  if (!validarDataISO(body.data_evento)) return "Informe uma data válida no formato AAAA-MM-DD.";

  const tipoId = typeof body.tipo_id === "string" && /^\d+$/.test(body.tipo_id)
    ? Number(body.tipo_id)
    : body.tipo_id;
  if (!Number.isSafeInteger(tipoId) || tipoId < 1) return "Escolha um tipo de evento válido.";

  const descricao = body.descricao == null ? "" : body.descricao;
  if (typeof descricao !== "string" || Buffer.byteLength(descricao, "utf8") > 60000) {
    return "A descrição é inválida ou muito grande.";
  }

  const local = body.local == null ? "" : body.local;
  if (typeof local !== "string" || Array.from(local).length > 100) {
    return "O local deve ter até 100 caracteres.";
  }

  return {
    titulo,
    descricao: descricao.trim(),
    data_evento: body.data_evento,
    local: local.trim(),
    tipo_id: tipoId
  };
}

module.exports = { validarEvento };

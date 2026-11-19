const MYSQL_INT_MAX = 2147483647;

function parseEventoId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > MYSQL_INT_MAX) return null;
  return id;
}

module.exports = { parseEventoId };

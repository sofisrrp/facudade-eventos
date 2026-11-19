const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { validarSenha } = require("../src/controllers/authController");

test("contas de demonstração usam uma senha simples que atende à política", async () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "banco.sql"), "utf8");
  const hashes = [...sql.matchAll(/'\$2b\$10\$[^']+'/g)]
    .map(([hash]) => hash.slice(1, -1));
  const senhaTeste = "Eventos!26";

  assert.equal(validarSenha(senhaTeste), null);
  assert.equal(hashes.length, 3);
  for (const hash of hashes) {
    assert.equal(await bcrypt.compare(senhaTeste, hash), true);
  }
});

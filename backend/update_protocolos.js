const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'saude_na_mao_v2.db'));

async function updateProtocolos() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Adiciona colunas se não existirem
      db.run("ALTER TABLE protocolos ADD COLUMN tipo_protocolo TEXT", (err) => {
        if (err) console.log("Coluna tipo_protocolo já existe ou erro: ", err.message);
      });
      db.run("ALTER TABLE protocolos ADD COLUMN prioridade TEXT", (err) => {
        if (err) console.log("Coluna prioridade já existe ou erro: ", err.message);
      });
      db.run("ALTER TABLE protocolos ADD COLUMN parecer_medico TEXT", (err) => {
        if (err) console.log("Coluna parecer_medico já existe ou erro: ", err.message);
      });
      db.run("ALTER TABLE protocolos ADD COLUMN medico_id INTEGER", (err) => {
        if (err) console.log("Coluna medico_id já existe ou erro: ", err.message);
      });

      console.log("Banco de dados de protocolos atualizado com sucesso!");
      resolve();
    });
  });
}

updateProtocolos().then(() => db.close());

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'saude_na_mao_v2.db'));

async function updateMedicos() {
  const senhaMedicoHash = await bcrypt.hash('medico123', 10);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Adiciona colunas se não existirem
      db.run("ALTER TABLE medicos ADD COLUMN senha TEXT", (err) => {
        if (err) console.log("Coluna senha já existe ou erro: ", err.message);
      });
      db.run("ALTER TABLE medicos ADD COLUMN perfil TEXT", (err) => {
        if (err) console.log("Coluna perfil já existe ou erro: ", err.message);
      });

      // Atualiza senhas para os médicos mocados
      db.run("UPDATE medicos SET senha = ? WHERE senha IS NULL", [senhaMedicoHash]);

      // Define os perfis mocados
      db.run("UPDATE medicos SET perfil = 'Clinico Geral' WHERE especialidade = 'Clínico Geral'");
      db.run("UPDATE medicos SET perfil = 'Especialista' WHERE especialidade != 'Clínico Geral'");

      console.log("Banco de dados atualizado com sucesso!");
      resolve();
    });
  });
}

updateMedicos().then(() => db.close());

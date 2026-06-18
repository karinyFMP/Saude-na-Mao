const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, 'saude_na_mao_v2.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log(`Conectado ao banco de dados SQLite (${DB_PATH}).`);
  }
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeDatabase() {
  // Habilitar WAL mode e foreign keys
  await runAsync('PRAGMA journal_mode=WAL');
  await runAsync('PRAGMA foreign_keys=ON');

  // Criar tabelas
  await runAsync(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      unidade TEXT DEFAULT 'UBS Central',
      data_nascimento TEXT,
      cartao_sus TEXT,
      telefone TEXT,
      endereco TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      unidade TEXT DEFAULT 'UBS Central',
      status TEXT CHECK(status IN ('Confirmada', 'Pendente', 'Realizada', 'Cancelada')) DEFAULT 'Pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS protocolos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      especialidade TEXT NOT NULL,
      descricao TEXT,
      status TEXT CHECK(status IN ('Em análise', 'Aprovado', 'Negado', 'Concluído')) DEFAULT 'Em análise',
      data_pedido TEXT NOT NULL,
      data_resposta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS unidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      endereco TEXT NOT NULL,
      telefone TEXT,
      horario_funcionamento TEXT DEFAULT '07:00 - 17:00',
      tipo TEXT DEFAULT 'UBS',
      latitude REAL,
      longitude REAL
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS medicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      unidade_id INTEGER,
      crm TEXT,
      FOREIGN KEY (unidade_id) REFERENCES unidades(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS servidores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT DEFAULT 'Atendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed data
  await seedDatabase();
  await seedServidores();
}

async function seedServidores() {
  const row = await getAsync('SELECT COUNT(*) as count FROM servidores');
  if (row && row.count > 0) {
    console.log('Servidores já cadastrados. Seed de servidores ignorado.');
    return;
  }

  console.log('Inserindo servidor padrão...');
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  await runAsync(
    `INSERT INTO servidores (nome, cpf, senha, cargo) VALUES (?, ?, ?, ?)`,
    ['auditor', '000.000.000-00', senhaAdmin, 'auditor']
  );
  console.log('Servidor padrão criado: CPF 000.000.000-00 / senha admin123');
}

async function seedDatabase() {
  const row = await getAsync('SELECT COUNT(*) as count FROM pacientes');

  if (row.count > 0) {
    console.log('Banco de dados já possui dados. Seed ignorado.');
    return;
  }

  console.log('Inserindo dados iniciais...');

  const senhaHash = await bcrypt.hash('123456', 10);
  const senhaHash2 = await bcrypt.hash('654321', 10);

  // 1. Pacientes
  await runAsync(
    `INSERT INTO pacientes (nome, cpf, senha, unidade, data_nascimento, cartao_sus, telefone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Maria Silva', '123.456.789-00', senhaHash, 'UBS Central', '1985-03-15', '898 0012 3456 7890', '(11) 98765-4321']
  );
  await runAsync(
    `INSERT INTO pacientes (nome, cpf, senha, unidade, data_nascimento, cartao_sus, telefone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['João Santos', '987.654.321-00', senhaHash2, 'UBS Jardim América', '1990-07-22', '898 0098 7654 3210', '(11) 91234-5678']
  );

  // 2. Unidades de saúde (antes dos médicos!)
  await runAsync(`INSERT INTO unidades (nome, endereco, telefone, horario_funcionamento, tipo) VALUES (?, ?, ?, ?, ?)`,
    ['UBS Central', 'Rua das Flores, 123 - Centro', '(11) 3456-7890', '07:00 - 19:00', 'UBS']);
  await runAsync(`INSERT INTO unidades (nome, endereco, telefone, horario_funcionamento, tipo) VALUES (?, ?, ?, ?, ?)`,
    ['UBS Jardim América', 'Av. Brasil, 456 - Jardim América', '(11) 3456-7891', '07:00 - 17:00', 'UBS']);
  await runAsync(`INSERT INTO unidades (nome, endereco, telefone, horario_funcionamento, tipo) VALUES (?, ?, ?, ?, ?)`,
    ['UPA 24h São Lucas', 'Rua São Lucas, 789 - Vila Nova', '(11) 3456-7892', '24 horas', 'UPA']);
  await runAsync(`INSERT INTO unidades (nome, endereco, telefone, horario_funcionamento, tipo) VALUES (?, ?, ?, ?, ?)`,
    ['Hospital Municipal', 'Av. Paulista, 1000 - Bela Vista', '(11) 3456-7893', '24 horas', 'Hospital']);
  await runAsync(`INSERT INTO unidades (nome, endereco, telefone, horario_funcionamento, tipo) VALUES (?, ?, ?, ?, ?)`,
    ['UBS Vila Esperança', 'Rua da Esperança, 321 - Vila Esperança', '(11) 3456-7894', '07:00 - 17:00', 'UBS']);

  // 3. Médicos (referenciam unidades)
  // Unidade 1: UBS Central
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Carlos Mendes', 'Clínico Geral', 1, 'CRM/SP 123456']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Mariana Rocha', 'Clínico Geral', 1, 'CRM/SP 111111']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Ana Oliveira', 'Cardiologia', 1, 'CRM/SP 234567']);

  // Unidade 2: UBS Jardim América
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Paulo Ribeiro', 'Clínico Geral', 2, 'CRM/SP 222222']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Beatriz Santos', 'Clínico Geral', 2, 'CRM/SP 333333']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Pedro Lima', 'Ortopedia', 2, 'CRM/SP 345678']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Fernanda Costa', 'Dermatologia', 2, 'CRM/SP 456789']);

  // Unidade 3: UPA 24h São Lucas
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Roberto Silva', 'Clínico Geral', 3, 'CRM/SP 444444']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Amanda Souza', 'Clínico Geral', 3, 'CRM/SP 555555']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Ricardo Souza', 'Pediatria', 3, 'CRM/SP 567890']);

  // Unidade 4: Hospital Municipal
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Eduardo Lima', 'Clínico Geral', 4, 'CRM/SP 666666']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Sofia Martins', 'Clínico Geral', 4, 'CRM/SP 777777']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Juliana Alves', 'Ginecologia', 4, 'CRM/SP 678901']);

  // Unidade 5: UBS Vila Esperança
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Gabriel Santos', 'Clínico Geral', 5, 'CRM/SP 888888']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dra. Camila Oliveira', 'Clínico Geral', 5, 'CRM/SP 999999']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm) VALUES (?, ?, ?, ?)`,
    ['Dr. Marcos Pereira', 'Neurologia', 5, 'CRM/SP 789012']);

  // 4. Consultas (referenciam pacientes)
  await runAsync(`INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, 'Dr. Carlos Mendes', 'Clínico Geral', '2026-05-10', '09:00', 'UBS Central', 'Confirmada']);
  await runAsync(`INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, 'Dra. Ana Oliveira', 'Cardiologia', '2026-05-15', '14:30', 'UBS Central', 'Pendente']);
  await runAsync(`INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, 'Dr. Pedro Lima', 'Ortopedia', '2026-04-20', '10:00', 'UBS Jardim América', 'Realizada']);
  await runAsync(`INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [2, 'Dra. Fernanda Costa', 'Dermatologia', '2026-05-12', '11:00', 'UBS Jardim América', 'Confirmada']);

  // 5. Protocolos
  await runAsync(`INSERT INTO protocolos (paciente_id, especialidade, descricao, status, data_pedido) VALUES (?, ?, ?, ?, ?)`,
    [1, 'Cardiologia', 'Encaminhamento para ecocardiograma', 'Aprovado', '2026-04-01']);
  await runAsync(`INSERT INTO protocolos (paciente_id, especialidade, descricao, status, data_pedido) VALUES (?, ?, ?, ?, ?)`,
    [1, 'Ortopedia', 'Solicitação de ressonância do joelho', 'Em análise', '2026-04-25']);
  await runAsync(`INSERT INTO protocolos (paciente_id, especialidade, descricao, status, data_pedido, data_resposta) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'Neurologia', 'Encaminhamento neurológico', 'Concluído', '2026-03-10', '2026-03-20']);
  await runAsync(`INSERT INTO protocolos (paciente_id, especialidade, descricao, status, data_pedido) VALUES (?, ?, ?, ?, ?)`,
    [2, 'Dermatologia', 'Biópsia de pele', 'Em análise', '2026-04-28']);

  console.log('Dados iniciais inseridos com sucesso!');
}

module.exports = { db, initializeDatabase, runAsync, getAsync, allAsync };

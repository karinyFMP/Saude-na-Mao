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
      status TEXT CHECK(status IN ('Em análise', 'Autorizado', 'Executado', 'Negado', 'Concluído')) DEFAULT 'Em análise',
      data_pedido TEXT NOT NULL,
      data_resposta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      tipo_protocolo TEXT,
      prioridade TEXT,
      parecer_medico TEXT,
      medico_id INTEGER,
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
      crm TEXT UNIQUE,
      senha TEXT,
      perfil TEXT,
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
  
  // Migração de status antigos e atualização de constraint do SQLite
  try {
    await runAsync(`UPDATE protocolos SET status = 'Autorizado' WHERE status = 'Aprovado'`);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      console.log('Realizando migração da tabela protocolos para atualizar a constraint CHECK...');
      await runAsync(`PRAGMA foreign_keys=off`);
      await runAsync(`DROP TABLE IF EXISTS protocolos_new`);
      await runAsync(`
        CREATE TABLE protocolos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER NOT NULL,
          especialidade TEXT NOT NULL,
          descricao TEXT,
          status TEXT CHECK(status IN ('Em análise', 'Autorizado', 'Executado', 'Negado', 'Concluído')) DEFAULT 'Em análise',
          data_pedido TEXT NOT NULL,
          data_resposta TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          tipo_protocolo TEXT,
          prioridade TEXT,
          parecer_medico TEXT,
          medico_id INTEGER,
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
        )
      `);
      await runAsync(`
        INSERT INTO protocolos_new 
        SELECT 
          id, paciente_id, especialidade, descricao, 
          CASE WHEN status = 'Aprovado' THEN 'Autorizado' ELSE status END as status,
          data_pedido, data_resposta, created_at, tipo_protocolo, prioridade, parecer_medico, medico_id
        FROM protocolos
      `);
      await runAsync(`DROP TABLE protocolos`);
      await runAsync(`ALTER TABLE protocolos_new RENAME TO protocolos`);
      await runAsync(`PRAGMA foreign_keys=on`);
      
      // Tenta novamente após recriar a tabela
      await runAsync(`UPDATE protocolos SET status = 'Autorizado' WHERE status = 'Aprovado'`);
      console.log('Migração da tabela protocolos concluída.');
    } else {
      throw err;
    }
  }
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
  const senhaMedicoHash = await bcrypt.hash('medico123', 10);
  
  // Unidade 1: UBS Central
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Carlos Mendes', 'Clínico Geral', 1, 'CRM/SP 123456', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Mariana Rocha', 'Clínico Geral', 1, 'CRM/SP 111111', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Ana Oliveira', 'Cardiologia', 1, 'CRM/SP 234567', senhaMedicoHash, 'Especialista']);

  // Unidade 2: UBS Jardim América
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Paulo Ribeiro', 'Clínico Geral', 2, 'CRM/SP 222222', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Beatriz Santos', 'Clínico Geral', 2, 'CRM/SP 333333', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Pedro Lima', 'Ortopedia', 2, 'CRM/SP 345678', senhaMedicoHash, 'Especialista']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Fernanda Costa', 'Dermatologia', 2, 'CRM/SP 456789', senhaMedicoHash, 'Especialista']);

  // Unidade 3: UPA 24h São Lucas
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Roberto Silva', 'Clínico Geral', 3, 'CRM/SP 444444', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Amanda Souza', 'Clínico Geral', 3, 'CRM/SP 555555', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Ricardo Souza', 'Pediatria', 3, 'CRM/SP 567890', senhaMedicoHash, 'Especialista']);

  // Unidade 4: Hospital Municipal
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Eduardo Lima', 'Clínico Geral', 4, 'CRM/SP 666666', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Sofia Martins', 'Clínico Geral', 4, 'CRM/SP 777777', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Juliana Alves', 'Ginecologia', 4, 'CRM/SP 678901', senhaMedicoHash, 'Especialista']);

  // Unidade 5: UBS Vila Esperança
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Gabriel Santos', 'Clínico Geral', 5, 'CRM/SP 888888', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dra. Camila Oliveira', 'Clínico Geral', 5, 'CRM/SP 999999', senhaMedicoHash, 'Clinico Geral']);
  await runAsync(`INSERT INTO medicos (nome, especialidade, unidade_id, crm, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Dr. Marcos Pereira', 'Neurologia', 5, 'CRM/SP 789012', senhaMedicoHash, 'Especialista']);

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
  const protocolosMocados = [
    {
      paciente_id: 1,
      especialidade: 'Cardiologia',
      descricao: 'Paciente hipertenso de longa data (HA estágio II), apresentando episódios recentes de dispneia aos médios esforços e dor torácica atípica. Eletrocardiograma basal mostrou sobrecarga ventricular esquerda. Solicito ecocardiograma transtorácico para avaliação da função sistólica e diastólica, além de possível isquemia miocárdica.',
      status: 'Aprovado',
      data_pedido: '2026-04-01',
      data_resposta: '2026-04-05',
      tipo_protocolo: 'Pedido de Exame de Imagem',
      prioridade: 'Alta',
      parecer_medico: 'Risco cardiovascular elevado. O exame é imprescindível para estadiamento da doença e adequação terapêutica, visando prevenir eventos agudos maiores.',
      medico_id: 1
    },
    {
      paciente_id: 1,
      especialidade: 'Ortopedia',
      descricao: 'Paciente vítima de trauma torcional em joelho direito durante partida de futebol há 2 semanas. Apresenta falseio articular, derrame articular volumoso (+3/+4) e teste de Lachman positivo. Suspeita clínica de ruptura de Ligamento Cruzado Anterior (LCA) e possível lesão meniscal associada.',
      status: 'Em análise',
      data_pedido: '2026-04-25',
      data_resposta: null,
      tipo_protocolo: 'Encaminhamento Cirúrgico',
      prioridade: 'Eletiva',
      parecer_medico: 'A ressonância magnética é mandatória para confirmação da extensão da lesão ligamentar e programação cirúrgica ortopédica definitiva.',
      medico_id: 2
    },
    {
      paciente_id: 1,
      especialidade: 'Neurologia',
      descricao: 'Quadro de cefaleia tensional crônica refratária ao uso de analgésicos comuns e profilaxia com amitriptilina. Nas últimas semanas, evoluiu com episódios de aura visual (escotomas cintilantes) e parestesia em dimídio direito. Ausência de déficits motores focais no momento da consulta.',
      status: 'Concluído',
      data_pedido: '2026-03-10',
      data_resposta: '2026-03-20',
      tipo_protocolo: 'Encaminhamento ao Especialista',
      prioridade: 'Eletiva',
      parecer_medico: 'Devido à mudança no padrão da cefaleia e surgimento de sinais neurológicos focais transitórios, encaminho ao neurologista para descartar causas secundárias e otimizar tratamento profilático.',
      medico_id: 1
    },
    {
      paciente_id: 2,
      especialidade: 'Dermatologia',
      descricao: 'Paciente apresenta lesão pigmentada assimétrica, com bordas irregulares e coloração heterogênea (tons de marrom e preto) em região escapular esquerda, medindo cerca de 8mm de diâmetro. Relata leve prurido local. Dermatoscopia sugere rede pigmentar atípica.',
      status: 'Em análise',
      data_pedido: '2026-04-28',
      data_resposta: null,
      tipo_protocolo: 'Procedimento Ambulatorial',
      prioridade: 'Urgente',
      parecer_medico: 'Alta suspeita clínica e dermatoscópica para Melanoma Extensivo Superficial. Solicito biópsia excisional com urgência para diagnóstico histopatológico e estadiamento precoce.',
      medico_id: 4
    },
    {
      paciente_id: 2,
      especialidade: 'Gastroenterologia',
      descricao: 'Queixa de pirose retroesternal diária, regurgitação ácida e plenitude pós-prandial há 6 meses. Relata episódios esporádicos de disfagia para sólidos nas últimas duas semanas. Perda ponderal não intencional de 3kg no período. Uso prévio de IBPs sem melhora sustentada.',
      status: 'Aprovado',
      data_pedido: '2026-05-02',
      data_resposta: '2026-05-04',
      tipo_protocolo: 'Pedido de Exame Endoscópico',
      prioridade: 'Alta',
      parecer_medico: 'Presença de sintomas de alarme (disfagia e perda ponderal) em paciente com doença do refluxo gastroesofágico refratária. Endoscopia digestiva alta indicada com brevidade para afastar neoplasia ou complicações como estenose péptica.',
      medico_id: 5
    },
    {
      paciente_id: 1,
      especialidade: 'Oftalmologia',
      descricao: 'Paciente idoso relata baixa acuidade visual progressiva e indolor em ambos os olhos, pior à esquerda, ao longo do último ano. Dificuldade severa para leitura e ofuscamento noturno. Avaliação preliminar com oftalmoscópio direto mostra opacidade do cristalino bilateral.',
      status: 'Em análise',
      data_pedido: '2026-05-15',
      data_resposta: null,
      tipo_protocolo: 'Encaminhamento Cirúrgico',
      prioridade: 'Eletiva',
      parecer_medico: 'Catarata senil bilateral com impacto significativo nas atividades de vida diária. Encaminho para avaliação oftalmológica especializada visando indicação de facectomia com implante de lente intraocular.',
      medico_id: 1
    },
    {
      paciente_id: 2,
      especialidade: 'Endocrinologia',
      descricao: 'Acompanhamento de Diabetes Mellitus tipo 2 há 5 anos. Exames laboratoriais recentes revelam HbA1c de 9.5%, glicemia de jejum de 210 mg/dL e microalbuminúria positiva (150 mg/g de creatinina). Otimizada dose de metformina e introduzida gliclazida, sem alcance do alvo terapêutico.',
      status: 'Negado',
      data_pedido: '2026-04-15',
      data_resposta: '2026-04-18',
      tipo_protocolo: 'Dispensação de Medicamento Especial',
      prioridade: 'Eletiva',
      parecer_medico: 'Devido à falha secundária aos antidiabéticos orais tradicionais e nefropatia diabética incipiente, solicito liberação de inibidor de SGLT2 (Dapagliflozina) para proteção cardiorrenal e controle glicêmico.',
      medico_id: 6
    }
  ];

  for (const p of protocolosMocados) {
    await runAsync(
      `INSERT INTO protocolos 
      (paciente_id, especialidade, descricao, status, data_pedido, data_resposta, tipo_protocolo, prioridade, parecer_medico, medico_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.paciente_id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.tipo_protocolo, p.prioridade, p.parecer_medico, p.medico_id]
    );
  }

  console.log('Dados iniciais inseridos com sucesso!');
}

module.exports = { db, initializeDatabase, runAsync, getAsync, allAsync };

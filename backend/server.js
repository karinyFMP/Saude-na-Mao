require('express-async-errors'); // Trata automaticamente exceções em rotas async
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeDatabase, runAsync, getAsync, allAsync } = require('./database');
const { validateSchema } = require('./middlewares/validate');
const { verificarAdmin, JWT_SECRET } = require('./middlewares/verificarAdmin');
const { registerSchema, loginSchema, updatePacienteSchema, agendamentoSchema } = require('./schemas/apiSchemas');

const app = express();
const PORT = process.env.PORT || 3001;

// Diretório de uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configuração do Multer (aceita só PDF, máx 10MB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Apenas arquivos PDF são permitidos.'));
  }
});

// Middleware
app.use(cors());
app.use(express.json());
// Servir arquivos de upload
app.use('/uploads', express.static(UPLOADS_DIR));

// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================

// POST /api/login — Validação de credenciais
app.post('/api/login', validateSchema(loginSchema), async (req, res) => {
  const { cpf, senha } = req.body;

  const paciente = await getAsync('SELECT * FROM pacientes WHERE cpf = ?', [cpf]);
  
  if (!paciente) {
    return res.status(401).json({ error: 'CPF ou senha inválidos.' });
  }

  const senhaValida = await bcrypt.compare(senha, paciente.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'CPF ou senha inválidos.' });
  }

  // Retorna dados do paciente sem a senha
  const { senha: _, ...dadosPaciente } = paciente;
  res.json({
    message: 'Login realizado com sucesso!',
    paciente: dadosPaciente
  });
});

// POST /api/register — Cadastro de novo paciente
app.post('/api/register', validateSchema(registerSchema), async (req, res) => {
  const { nome, cpf, senha, cartao_sus } = req.body;

  const pacienteExistente = await getAsync('SELECT id FROM pacientes WHERE cpf = ?', [cpf]);
  if (pacienteExistente) {
    return res.status(409).json({ error: 'CPF já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  
  const result = await runAsync(
    'INSERT INTO pacientes (nome, cpf, senha, cartao_sus, unidade) VALUES (?, ?, ?, ?, ?)',
    [nome, cpf, senhaHash, cartao_sus || null, 'UBS Central']
  );

  const paciente = await getAsync(
    'SELECT id, nome, cpf, unidade, data_nascimento, cartao_sus, telefone, endereco FROM pacientes WHERE id = ?',
    [result.lastID]
  );

  res.status(201).json({
    message: 'Cadastro realizado com sucesso!',
    paciente
  });
});

// PUT /api/pacientes/:id — Atualizar dados do paciente
app.put('/api/pacientes/:id', validateSchema(updatePacienteSchema), async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, endereco, cpf, cartao_sus, unidade, data_nascimento } = req.body;

  const result = await runAsync(
    'UPDATE pacientes SET nome = ?, telefone = ?, endereco = ?, cpf = ?, cartao_sus = ?, unidade = ?, data_nascimento = ? WHERE id = ?',
    [nome, telefone, endereco, cpf, cartao_sus, unidade, data_nascimento, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const paciente = await getAsync(
    'SELECT id, nome, cpf, unidade, data_nascimento, cartao_sus, telefone, endereco FROM pacientes WHERE id = ?',
    [id]
  );

  res.json({
    message: 'Perfil atualizado com sucesso!',
    paciente
  });
});

// ============================================================
// ROTAS DO DASHBOARD
// ============================================================

// GET /api/dashboard/:pacienteId — Retorna dados do paciente, consultas e protocolos
app.get('/api/dashboard/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;

  const paciente = await getAsync(
    'SELECT id, nome, cpf, unidade, data_nascimento, cartao_sus, telefone, endereco FROM pacientes WHERE id = ?',
    [pacienteId]
  );

  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const consultas = await allAsync(
    `SELECT c.id, c.medico, c.especialidade, c.data, c.horario, c.unidade, c.status, c.created_at
     FROM consultas c
     WHERE c.paciente_id = ?
     ORDER BY c.data DESC, c.horario ASC`,
    [pacienteId]
  );

  const protocolos = await allAsync(
    `SELECT p.id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.created_at
     FROM protocolos p
     WHERE p.paciente_id = ?
     ORDER BY p.data_pedido DESC`,
    [pacienteId]
  );

  res.json({
    paciente,
    consultas: consultas || [],
    protocolos: protocolos || []
  });
});

// ============================================================
// ROTAS DE AGENDAMENTO
// ============================================================

// POST /api/agendar — Insere nova consulta no banco
app.post('/api/agendar', validateSchema(agendamentoSchema), async (req, res) => {
  const { paciente_id, medico, especialidade, data, horario, unidade } = req.body;

  const existing = await getAsync(
    `SELECT id FROM consultas WHERE paciente_id = ? AND data = ? AND horario = ? AND status != 'Cancelada'`,
    [paciente_id, data, horario]
  );

  if (existing) {
    return res.status(409).json({ error: 'Já existe uma consulta agendada para este horário.' });
  }

  const result = await runAsync(
    `INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pendente')`,
    [paciente_id, medico, especialidade, data, horario, unidade || 'UBS Central']
  );

  const consulta = await getAsync('SELECT * FROM consultas WHERE id = ?', [result.lastID]);

  res.status(201).json({
    message: 'Consulta agendada com sucesso!',
    consulta
  });
});

// DELETE /api/consultas/:id — Cancelar consulta
app.delete('/api/consultas/:id', async (req, res) => {
  const { id } = req.params;

  const result = await runAsync(
    `UPDATE consultas SET status = 'Cancelada' WHERE id = ? AND status IN ('Pendente', 'Confirmada')`,
    [id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Consulta não encontrada ou não pode ser cancelada.' });
  }

  res.json({ message: 'Consulta cancelada com sucesso.' });
});

// ============================================================
// ROTAS DE UNIDADES DE SAÚDE E MÉDICOS
// ============================================================

app.get('/api/ubs', async (req, res) => {
  const unidades = await allAsync('SELECT * FROM unidades ORDER BY nome');
  res.json(unidades || []);
});

app.get('/api/medicos', async (req, res) => {
  const { especialidade, unidade } = req.query;

  let query = `
    SELECT m.id, m.nome, m.especialidade, m.crm, u.nome as unidade_nome
    FROM medicos m
    LEFT JOIN unidades u ON m.unidade_id = u.id
  `;
  
  const conditions = [];
  const params = [];

  if (especialidade) {
    conditions.push('m.especialidade = ?');
    params.push(especialidade);
  }

  if (unidade) {
    conditions.push('u.nome = ?');
    params.push(unidade);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY m.nome';

  const medicos = await allAsync(query, params);
  res.json(medicos || []);
});

app.get('/api/especialidades', async (req, res) => {
  const rows = await allAsync('SELECT DISTINCT especialidade FROM medicos ORDER BY especialidade');
  res.json(rows.map(r => r.especialidade));
});

// ============================================================
// ROTAS DE PROTOCOLOS
// ============================================================

app.get('/api/protocolos/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;
  const protocolos = await allAsync(
    `SELECT * FROM protocolos WHERE paciente_id = ? ORDER BY data_pedido DESC`,
    [pacienteId]
  );
  res.json(protocolos || []);
});

// GET /api/protocolo/:id — Obtém os detalhes completos de um protocolo para o paciente
app.get('/api/protocolo/:id', async (req, res) => {
  const { id } = req.params;

  const protocolo = await getAsync(
    `SELECT
      p.id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.created_at,
      p.tipo_protocolo, p.prioridade, p.parecer_medico, p.justificativa_auditor,
      pac.id as paciente_id, pac.nome as paciente_nome, pac.cpf as paciente_cpf, pac.unidade as paciente_unidade, pac.data_nascimento, pac.cartao_sus, pac.telefone,
      m.nome as medico_solicitante_nome, m.especialidade as medico_solicitante_especialidade, m.crm as medico_solicitante_crm
     FROM protocolos p
     INNER JOIN pacientes pac ON p.paciente_id = pac.id
     LEFT JOIN medicos m ON p.medico_id = m.id
     WHERE p.id = ?`,
    [id]
  );

  if (!protocolo) {
    return res.status(404).json({ error: 'Protocolo não encontrado.' });
  }

  res.json(protocolo);
});

// ============================================================
// ROTAS DO SERVIDOR (ADMINISTRAÇÃO) — Isoladas e protegidas
// ============================================================

// POST /api/servidor/login — Autentica um servidor/atendente
app.post('/api/servidor/login', async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
  }

  const servidor = await getAsync('SELECT * FROM servidores WHERE cpf = ?', [cpf]);

  if (!servidor) {
    return res.status(401).json({ error: 'CPF ou senha inválidos.' });
  }

  const senhaValida = await bcrypt.compare(senha, servidor.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'CPF ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: servidor.id, nome: servidor.nome, cargo: servidor.cargo, role: 'servidor' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Login realizado com sucesso!',
    token,
    servidor: { id: servidor.id, nome: servidor.nome, cargo: servidor.cargo }
  });
});

// ============================================================
// ROTAS DO MÉDICO
// ============================================================

// POST /api/medico/login — Autentica um médico
app.post('/api/medico/login', async (req, res) => {
  const { crm, senha } = req.body;

  if (!crm || !senha) {
    return res.status(400).json({ error: 'CRM e senha são obrigatórios.' });
  }

  const medico = await getAsync('SELECT * FROM medicos WHERE crm = ?', [crm]);

  if (!medico) {
    return res.status(401).json({ error: 'CRM ou senha inválidos.' });
  }

  if (!medico.senha) {
    return res.status(401).json({ error: 'Médico sem senha configurada. Contate o administrador.' });
  }

  const senhaValida = await bcrypt.compare(senha, medico.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'CRM ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: medico.id, nome: medico.nome, especialidade: medico.especialidade, crm: medico.crm, perfil: medico.perfil, role: 'medico' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Retorna os dados do médico sem a senha
  const { senha: _, ...dadosMedico } = medico;

  res.json({
    message: 'Login realizado com sucesso!',
    token,
    medico: dadosMedico
  });
});

// GET /api/medico/protocolos — Lista protocolos
app.get('/api/medico/protocolos', async (req, res) => {
  let query = `
    SELECT
      p.id,
      p.especialidade,
      p.descricao,
      p.status,
      p.data_pedido,
      p.data_resposta,
      p.created_at,
      p.tipo_protocolo,
      p.prioridade,
      pac.id as paciente_id,
      pac.nome as paciente_nome,
      pac.cpf as paciente_cpf
    FROM protocolos p
    INNER JOIN pacientes pac ON p.paciente_id = pac.id
    ORDER BY p.data_pedido DESC
  `;
  const protocolos = await allAsync(query);
  res.json(protocolos || []);
});

// GET /api/medico/protocolos/:id — Detalhes do protocolo
app.get('/api/medico/protocolos/:id', async (req, res) => {
  const { id } = req.params;
  const protocolo = await getAsync(
    `SELECT
      p.id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.created_at,
      p.tipo_protocolo, p.prioridade, p.parecer_medico, p.justificativa_auditor,
      pac.id as paciente_id, pac.nome as paciente_nome, pac.cpf as paciente_cpf,
      m.nome as medico_solicitante_nome, m.especialidade as medico_solicitante_especialidade, m.crm as medico_solicitante_crm
     FROM protocolos p
     INNER JOIN pacientes pac ON p.paciente_id = pac.id
     LEFT JOIN medicos m ON p.medico_id = m.id
     WHERE p.id = ?`,
    [id]
  );
  if (!protocolo) {
    return res.status(404).json({ error: 'Protocolo não encontrado.' });
  }
  res.json(protocolo);
});

// POST /api/medico/protocolos — Cria novo protocolo
app.post('/api/medico/protocolos', async (req, res) => {
  const {
    pacienteCpf, tipoProtocolo, especialidade, prioridade, descricao, parecerMedico, medicoId, cid, procedimentos
  } = req.body;

  const paciente = await getAsync('SELECT id FROM pacientes WHERE cpf = ?', [pacienteCpf]);
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado para o CPF informado.' });
  }

  const dataPedido = new Date().toISOString().split('T')[0];

  const result = await runAsync(
    `INSERT INTO protocolos (paciente_id, especialidade, descricao, status, data_pedido, tipo_protocolo, prioridade, parecer_medico, medico_id, cid, procedimentos)
     VALUES (?, ?, ?, 'Em análise', ?, ?, ?, ?, ?, ?, ?)`,
    [paciente.id, especialidade || '', descricao, dataPedido, tipoProtocolo, prioridade, parecerMedico || null, medicoId, cid || null, procedimentos || null]
  );

  res.status(201).json({ message: 'Protocolo criado com sucesso!', protocoloId: result.lastID });
});

// GET /api/medico/pacientes/:cpf — Busca paciente pelo CPF
app.get('/api/medico/pacientes/:cpf', async (req, res) => {
  const { cpf } = req.params;
  const paciente = await getAsync('SELECT id, nome, cpf, data_nascimento FROM pacientes WHERE cpf = ?', [cpf]);
  
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }
  res.json(paciente);
});


// GET /api/auditor/protocolos — Lista todos os protocolos (requer token de servidor)
app.get('/api/auditor/protocolos', verificarAdmin, async (req, res) => {
  const { status, paciente } = req.query;

  let query = `
    SELECT
      p.id,
      p.especialidade,
      p.descricao,
      p.status,
      p.data_pedido,
      p.data_resposta,
      p.created_at,
      pac.id as paciente_id,
      pac.nome as paciente_nome,
      pac.cpf as paciente_cpf,
      pac.unidade as paciente_unidade
    FROM protocolos p
    INNER JOIN pacientes pac ON p.paciente_id = pac.id
  `;

  const conditions = [];
  const params = [];

  if (status && status !== 'Todos') {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (paciente) {
    conditions.push('pac.nome LIKE ?');
    params.push(`%${paciente}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.data_pedido DESC';

  const protocolos = await allAsync(query, params);
  res.json(protocolos || []);
});

// GET /api/auditor/protocolos/:id — Obtém detalhes completos de um protocolo (requer token de servidor)
app.get('/api/auditor/protocolos/:id', verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const protocolo = await getAsync(
    `SELECT
      p.id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.created_at,
      p.tipo_protocolo, p.prioridade, p.parecer_medico, p.justificativa_auditor,
      pac.id as paciente_id, pac.nome as paciente_nome, pac.cpf as paciente_cpf, pac.unidade as paciente_unidade, pac.data_nascimento, pac.cartao_sus, pac.telefone,
      m.nome as medico_solicitante_nome, m.especialidade as medico_solicitante_especialidade, m.crm as medico_solicitante_crm
     FROM protocolos p
     INNER JOIN pacientes pac ON p.paciente_id = pac.id
     LEFT JOIN medicos m ON p.medico_id = m.id
     WHERE p.id = ?`,
    [id]
  );

  if (!protocolo) {
    return res.status(404).json({ error: 'Protocolo não encontrado.' });
  }

  res.json(protocolo);
});

// PUT /api/auditor/protocolos/:id — Atualiza status de um protocolo (requer token de servidor)
app.put('/api/auditor/protocolos/:id', verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, justificativa_auditor } = req.body;

  const statusPermitidos = ['Em análise', 'Autorizado', 'Executado', 'Negado', 'Concluído'];
  if (!status || !statusPermitidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${statusPermitidos.join(', ')}` });
  }

  const dataResposta = (['Autorizado', 'Executado', 'Negado', 'Concluído'].includes(status))
    ? new Date().toISOString().split('T')[0]
    : null;

  const result = await runAsync(
    `UPDATE protocolos SET status = ?, data_resposta = ?, justificativa_auditor = ? WHERE id = ?`,
    [status, dataResposta, justificativa_auditor || null, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Protocolo não encontrado.' });
  }

  const protocolo = await getAsync(
    `SELECT p.*, pac.nome as paciente_nome FROM protocolos p
     INNER JOIN pacientes pac ON p.paciente_id = pac.id
     WHERE p.id = ?`,
    [id]
  );

  res.json({ message: 'Status atualizado com sucesso!', protocolo });
});


// ============================================================
// ROTAS DE ANEXOS DE PROTOCOLOS
// ============================================================

// GET /api/protocolos/:id/anexos — Lista anexos de um protocolo
app.get('/api/protocolos/:id/anexos', async (req, res) => {
  const { id } = req.params;
  const anexos = await allAsync(
    `SELECT id, nome_arquivo, caminho, tamanho, uploaded_at FROM protocolo_anexos WHERE protocolo_id = ? ORDER BY uploaded_at DESC`,
    [id]
  );
  res.json(anexos || []);
});

// POST /api/protocolos/:id/anexos — Faz upload de um PDF
app.post('/api/protocolos/:id/anexos', upload.single('arquivo'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const protocolo = await getAsync('SELECT id FROM protocolos WHERE id = ?', [id]);
  if (!protocolo) {
    fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: 'Protocolo não encontrado.' });
  }

  const result = await runAsync(
    `INSERT INTO protocolo_anexos (protocolo_id, nome_arquivo, caminho, tamanho) VALUES (?, ?, ?, ?)`,
    [id, req.file.originalname, req.file.filename, req.file.size]
  );

  const anexo = await getAsync('SELECT * FROM protocolo_anexos WHERE id = ?', [result.lastID]);
  res.status(201).json({ message: 'Arquivo enviado com sucesso!', anexo });
});

// DELETE /api/protocolos/:id/anexos/:anexoId — Remove um anexo
app.delete('/api/protocolos/:id/anexos/:anexoId', async (req, res) => {
  const { id, anexoId } = req.params;

  const anexo = await getAsync(
    'SELECT * FROM protocolo_anexos WHERE id = ? AND protocolo_id = ?',
    [anexoId, id]
  );

  if (!anexo) {
    return res.status(404).json({ error: 'Anexo não encontrado.' });
  }

  // Remove arquivo do disco
  const filePath = path.join(UPLOADS_DIR, anexo.caminho);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await runAsync('DELETE FROM protocolo_anexos WHERE id = ?', [anexoId]);
  res.json({ message: 'Anexo removido com sucesso.' });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('Erro na API:', err);
  if (err.message && err.message.includes('PDF')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo permitido: 10MB.' });
  }
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR E EXPORT
// ============================================================

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🏥 Saúde na Mão - Backend rodando na porta ${PORT}`);
        console.log(`   API: http://localhost:${PORT}/api`);
      });
    })
    .catch((err) => {
      console.error('Erro ao inicializar o banco de dados:', err);
      process.exit(1);
    });
}

module.exports = { app, initializeDatabase };

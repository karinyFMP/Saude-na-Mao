require('express-async-errors'); // Trata automaticamente exceções em rotas async
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { initializeDatabase, runAsync, getAsync, allAsync } = require('./database');
const { validateSchema } = require('./middlewares/validate');
const { registerSchema, loginSchema, updatePacienteSchema, agendamentoSchema } = require('./schemas/apiSchemas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('Erro na API:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================

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

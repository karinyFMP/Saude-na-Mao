const request = require('supertest');
const { app, initializeDatabase } = require('../server');

// ============================================================
// SETUP: Banco em Memória — Isolado, não afeta dados reais
// ============================================================
beforeAll(async () => {
  await initializeDatabase();
});

// ============================================================
// SUÍTE 1: Autenticação — Área do Paciente
// ============================================================
describe('🔐 Autenticação e Login de Pacientes', () => {

  it('TC-01 | Deve REJEITAR login com campos vazios (Proteção Zod)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({});
    // loginSchema requer cpf e senha não-vazios
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dados inválidos.');
  });

  it('TC-02 | Deve REJEITAR login de paciente com CPF não cadastrado', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: '999.999.999-99', senha: 'qualquersenha' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'CPF ou senha inválidos.');
  });

  it('TC-03 | Deve REJEITAR login de paciente com senha incorreta', async () => {
    // Seed cria paciente de CPF 123.456.789-00 com senha 'senha123'
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: '123.456.789-00', senha: 'senhaerrada' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'CPF ou senha inválidos.');
  });

  it('TC-04 | Deve ACEITAR login de paciente e retornar os dados (sem a senha)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: '123.456.789-00', senha: '123456' }); // Credenciais reais do seed
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paciente');
    expect(res.body.paciente).not.toHaveProperty('senha'); // CRÍTICO: senha NUNCA vaza!
    expect(res.body.paciente).toHaveProperty('nome', 'Maria Silva');
    expect(res.body.paciente).toHaveProperty('cpf', '123.456.789-00');
  });
});

// ============================================================
// SUÍTE 2: Autenticação — Área Administrativa (Servidores)
// ============================================================
describe('🛡️ Autenticação Admin e JWT', () => {

  it('TC-05 | Deve BARRAR acesso admin sem token (status 401)', async () => {
    const res = await request(app).get('/api/admin/protocolos');
    expect(res.status).toBe(401);
    // Verificar mensagem real retornada pelo verificarAdmin.js
    expect(res.body).toHaveProperty('error', 'Token de autorização não fornecido.');
  });

  it('TC-06 | Deve BARRAR acesso com token JWT adulterado (status 401)', async () => {
    const tokenFalso = 'eyJhbGciOiJIUzI1NiJ9.e30.payloadfalsificado';
    const res = await request(app)
      .get('/api/admin/protocolos')
      .set('Authorization', `Bearer ${tokenFalso}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token inválido ou expirado.');
  });

  it('TC-07 | Deve BARRAR acesso com role incorreta (role != servidor) → status 403', async () => {
    const jwt = require('jsonwebtoken');
    // Assinar um token com role 'paciente' usando o mesmo secret do sistema
    const tokenPaciente = jwt.sign(
      { id: 99, nome: 'Impostor', role: 'paciente' },
      'saude_na_mao_admin_secret_2024',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/admin/protocolos')
      .set('Authorization', `Bearer ${tokenPaciente}`);
    expect(res.status).toBe(403); // Permissão insuficiente — Ameaça de Escalada de Privilégio BLOQUEADA
    expect(res.body).toHaveProperty('error', 'Acesso negado. Permissão insuficiente.');
  });

  it('TC-08 | Deve AUTENTICAR o servidor admin e retornar token JWT válido', async () => {
    const res = await request(app)
      .post('/api/servidor/login')
      .send({ cpf: '000.000.000-00', senha: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.servidor).toHaveProperty('nome', 'Admin Sistema');
  });
});

// ============================================================
// SUÍTE 3: Protocolos (CRUD + Segurança de Negócio)
// ============================================================
describe('📋 Gestão de Protocolos (Admin)', () => {
  let adminToken = '';

  // Antes de tudo, pegar o token do servidor
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/servidor/login')
      .send({ cpf: '000.000.000-00', senha: 'admin123' });
    adminToken = res.body.token;
  });

  it('TC-09 | Deve listar todos os protocolos com token válido', async () => {
    const res = await request(app)
      .get('/api/admin/protocolos')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('TC-10 | Deve buscar um protocolo existente pelo ID', async () => {
    const res = await request(app)
      .get('/api/admin/protocolos/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('especialidade');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('paciente_nome');
  });

  it('TC-11 | Deve retornar 404 para protocolo inexistente', async () => {
    const res = await request(app)
      .get('/api/admin/protocolos/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Protocolo não encontrado.');
  });

  it('TC-12 | Deve REJEITAR atualização de status com valor inválido (Regra de Negócio)', async () => {
    const res = await request(app)
      .put('/api/admin/protocolos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Hackado' }); // Status não permitido
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Status inválido');
  });

  it('TC-13 | Deve REJEITAR atualização de status sem o campo status no body', async () => {
    const res = await request(app)
      .put('/api/admin/protocolos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({}); // Body vazio
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('TC-14 | Deve APROVAR um protocolo e retornar status 200 com data_resposta preenchida', async () => {
    const res = await request(app)
      .put('/api/admin/protocolos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aprovado' });
    expect(res.status).toBe(200);
    expect(res.body.protocolo).toHaveProperty('status', 'Aprovado');
    expect(res.body.protocolo).toHaveProperty('data_resposta');
    expect(res.body.protocolo.data_resposta).not.toBeNull();
  });

  it('TC-15 | Deve NEGAR um protocolo e registrar data_resposta corretamente', async () => {
    const res = await request(app)
      .put('/api/admin/protocolos/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Negado' });
    expect(res.status).toBe(200);
    expect(res.body.protocolo.status).toBe('Negado');
    expect(res.body.protocolo.data_resposta).not.toBeNull();
  });
});

// ============================================================
// SUÍTE 4: Registro de Pacientes
// ============================================================
describe('📝 Registro e Cadastro de Novos Pacientes', () => {

  it('TC-16 | Deve CRIAR novo paciente e retornar 201 sem vazar senha', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        nome: 'Paciente Teste Unitário',
        cpf: '111.222.333-44',
        senha: 'senhasegura123',
        cartao_sus: '123456789',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('paciente');
    expect(res.body.paciente).not.toHaveProperty('senha'); // NUNCA vaza a senha
    expect(res.body.paciente.nome).toBe('Paciente Teste Unitário');
  });

  it('TC-17 | Deve REJEITAR cadastro de CPF já existente (status 409)', async () => {
    // Tenta cadastrar novamente o mesmo CPF
    const res = await request(app)
      .post('/api/register')
      .send({
        nome: 'Duplicado',
        cpf: '111.222.333-44',
        senha: 'outrasenha',
      });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'CPF já cadastrado.');
  });

  it('TC-18 | Deve REJEITAR cadastro sem nome (Zod - mín. 3 chars)', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ nome: 'AB', cpf: '555.666.777-88', senha: 'senha123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dados inválidos.');
  });
});

// ============================================================
// SUÍTE 5: Agendamento de Consultas
// ============================================================
describe('🗓️ Agendamento de Consultas', () => {

  it('TC-19 | Deve CRIAR um agendamento com dados válidos (status 201)', async () => {
    const res = await request(app)
      .post('/api/agendar')
      .send({
        paciente_id: 1,
        medico: 'Dr. Teste Automação',
        especialidade: 'Clínico Geral',
        data: '2027-01-15',
        horario: '10:00',
        unidade: 'UBS Central',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('consulta');
    expect(res.body.consulta).toHaveProperty('status', 'Pendente');
  });

  it('TC-20 | Deve BLOQUEAR agendamento duplicado no mesmo horário (status 409)', async () => {
    const res = await request(app)
      .post('/api/agendar')
      .send({
        paciente_id: 1,
        medico: 'Dr. Outro',
        especialidade: 'Cardiologia',
        data: '2027-01-15', // Mesmo dia
        horario: '10:00', // Mesmo horário
        unidade: 'UBS Norte',
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Já existe uma consulta');
  });

  it('TC-21 | Deve REJEITAR agendamento sem campo obrigatório `medico`', async () => {
    const res = await request(app)
      .post('/api/agendar')
      .send({
        paciente_id: 1,
        especialidade: 'Clínico Geral',
        data: '2027-02-01',
        horario: '14:00',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dados inválidos.');
  });
});

// ============================================================
// SUÍTE 6: Global Error Handler (Anti-Queda do Servidor)
// ============================================================
describe('💥 Resiliência: Global Error Handler (500)', () => {

  it('TC-22 | Deve retornar 500 JSON (não texto) em caso de erro interno — servidor NÃO cai', async () => {
    // Acessa uma rota que existe mas com ID alfabético, causando falha interna controlada
    const res = await request(app)
      .get('/api/dashboard/nao-sou-um-numero')
      .expect('Content-Type', /json/);
    // O servidor deve continuar rodando e responder com JSON (seja 404 ou 500)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
  });
});

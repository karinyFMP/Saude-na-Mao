const request = require('supertest');
const { app, initializeDatabase } = require('../server');

beforeAll(async () => {
  await initializeDatabase();
});

// ============================================================
// SUÍTE 7: Rotas do Dashboard (Dados do Paciente)
// ============================================================
describe('📊 Dashboard do Paciente', () => {

  it('TC-23 | Deve retornar dados completos do dashboard para paciente existente', async () => {
    const res = await request(app).get('/api/dashboard/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paciente');
    expect(res.body).toHaveProperty('consultas');
    expect(res.body).toHaveProperty('protocolos');
    expect(Array.isArray(res.body.consultas)).toBe(true);
    expect(Array.isArray(res.body.protocolos)).toBe(true);
    // Dados do paciente NÃO devem conter a senha
    expect(res.body.paciente).not.toHaveProperty('senha');
  });

  it('TC-24 | Deve retornar 404 para paciente inexistente no dashboard', async () => {
    const res = await request(app).get('/api/dashboard/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Paciente não encontrado.');
  });

  it('TC-25 | Consultas retornadas devem ter os campos obrigatórios', async () => {
    const res = await request(app).get('/api/dashboard/1');
    expect(res.status).toBe(200);
    if (res.body.consultas.length > 0) {
      const consulta = res.body.consultas[0];
      expect(consulta).toHaveProperty('id');
      expect(consulta).toHaveProperty('especialidade');
      expect(consulta).toHaveProperty('status');
      expect(consulta).toHaveProperty('data');
    }
  });

  it('TC-26 | Protocolos retornados devem ter os campos obrigatórios', async () => {
    const res = await request(app).get('/api/dashboard/1');
    expect(res.status).toBe(200);
    if (res.body.protocolos.length > 0) {
      const protocolo = res.body.protocolos[0];
      expect(protocolo).toHaveProperty('id');
      expect(protocolo).toHaveProperty('especialidade');
      expect(protocolo).toHaveProperty('status');
    }
  });
});

// ============================================================
// SUÍTE 8: Cancelamento de Consulta
// ============================================================
describe('❌ Cancelamento de Consultas', () => {

  it('TC-27 | Deve cancelar consulta com status "Pendente" → status 200', async () => {
    // Seed cria consulta id=2 como "Pendente"
    const res = await request(app).delete('/api/consultas/2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Consulta cancelada com sucesso.');
  });

  it('TC-28 | Deve retornar 404 ao tentar cancelar consulta inexistente', async () => {
    const res = await request(app).delete('/api/consultas/99999');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('não encontrada');
  });

  it('TC-29 | Não deve permitir cancelar uma consulta já cancelada (idempotência)', async () => {
    // Consulta 2 já foi cancelada no TC-27
    const res = await request(app).delete('/api/consultas/2');
    expect(res.status).toBe(404); // Não encontra porque o status não é mais cancelável
  });
});

// ============================================================
// SUÍTE 9: Unidades de Saúde e Médicos
// ============================================================
describe('🏥 Unidades de Saúde (UBS)', () => {

  it('TC-30 | Deve listar todas as unidades de saúde', async () => {
    const res = await request(app).get('/api/ubs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Cada UBS deve ter id e nome
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('nome');
  });

  it('TC-31 | Deve listar todos os médicos sem filtro', async () => {
    const res = await request(app).get('/api/medicos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('nome');
    expect(res.body[0]).toHaveProperty('especialidade');
  });

  it('TC-32 | Deve filtrar médicos por especialidade', async () => {
    const res = await request(app)
      .get('/api/medicos')
      .query({ especialidade: 'Cardiologia' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Todos os médicos retornados devem ser Cardiologia
    res.body.forEach((m) => {
      expect(m.especialidade).toBe('Cardiologia');
    });
  });

  it('TC-33 | Deve filtrar médicos por unidade', async () => {
    const res = await request(app)
      .get('/api/medicos')
      .query({ unidade: 'UBS Central' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((m) => {
      expect(m.unidade_nome).toBe('UBS Central');
    });
  });

  it('TC-34 | Deve listar todas as especialidades distintas', async () => {
    const res = await request(app).get('/api/especialidades');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Deve retornar strings, não objetos
    expect(typeof res.body[0]).toBe('string');
  });
});

// ============================================================
// SUÍTE 10: Atualização de Perfil do Paciente
// ============================================================
describe('👤 Atualização de Perfil', () => {

  it('TC-35 | Deve atualizar telefone e endereço do paciente', async () => {
    const res = await request(app)
      .put('/api/pacientes/1')
      .send({
        nome: 'Maria Silva',
        cpf: '123.456.789-00',
        telefone: '(11) 99999-0000',
        endereco: 'Rua Nova, 500 - Centro',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paciente');
    expect(res.body.paciente.telefone).toBe('(11) 99999-0000');
    expect(res.body.paciente.endereco).toBe('Rua Nova, 500 - Centro');
    // Senha jamais retorna
    expect(res.body.paciente).not.toHaveProperty('senha');
  });

  it('TC-36 | Deve retornar 404 ao tentar atualizar paciente inexistente', async () => {
    const res = await request(app)
      .put('/api/pacientes/99999')
      .send({ nome: 'Fantasma', cpf: '000.000.000-99' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Paciente não encontrado.');
  });
});

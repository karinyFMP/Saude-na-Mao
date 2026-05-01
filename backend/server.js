const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================

// POST /api/login — Validação de credenciais
app.post('/api/login', (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
  }

  db.get('SELECT * FROM pacientes WHERE cpf = ?', [cpf], async (err, paciente) => {
    if (err) {
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }

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
});

// ============================================================
// ROTAS DO DASHBOARD
// ============================================================

// GET /api/dashboard/:pacienteId — Retorna dados do paciente, consultas e protocolos
app.get('/api/dashboard/:pacienteId', (req, res) => {
  const { pacienteId } = req.params;

  // Buscar dados do paciente
  db.get(
    'SELECT id, nome, cpf, unidade, data_nascimento, cartao_sus, telefone FROM pacientes WHERE id = ?',
    [pacienteId],
    (err, paciente) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar dados do paciente.' });
      }

      if (!paciente) {
        return res.status(404).json({ error: 'Paciente não encontrado.' });
      }

      // Buscar consultas do paciente com JOINs
      db.all(
        `SELECT c.id, c.medico, c.especialidade, c.data, c.horario, c.unidade, c.status, c.created_at
         FROM consultas c
         WHERE c.paciente_id = ?
         ORDER BY c.data DESC, c.horario ASC`,
        [pacienteId],
        (err, consultas) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar consultas.' });
          }

          // Buscar protocolos do paciente
          db.all(
            `SELECT p.id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.created_at
             FROM protocolos p
             WHERE p.paciente_id = ?
             ORDER BY p.data_pedido DESC`,
            [pacienteId],
            (err, protocolos) => {
              if (err) {
                return res.status(500).json({ error: 'Erro ao buscar protocolos.' });
              }

              res.json({
                paciente,
                consultas: consultas || [],
                protocolos: protocolos || []
              });
            }
          );
        }
      );
    }
  );
});

// ============================================================
// ROTAS DE AGENDAMENTO
// ============================================================

// POST /api/agendar — Insere nova consulta no banco
app.post('/api/agendar', (req, res) => {
  const { paciente_id, medico, especialidade, data, horario, unidade } = req.body;

  if (!paciente_id || !medico || !especialidade || !data || !horario) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // Verificar conflito de horário
  db.get(
    `SELECT id FROM consultas WHERE paciente_id = ? AND data = ? AND horario = ? AND status != 'Cancelada'`,
    [paciente_id, data, horario],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar disponibilidade.' });
      }

      if (existing) {
        return res.status(409).json({ error: 'Já existe uma consulta agendada para este horário.' });
      }

      db.run(
        `INSERT INTO consultas (paciente_id, medico, especialidade, data, horario, unidade, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pendente')`,
        [paciente_id, medico, especialidade, data, horario, unidade || 'UBS Central'],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao agendar consulta.' });
          }

          // Retorna a consulta recém-criada
          db.get('SELECT * FROM consultas WHERE id = ?', [this.lastID], (err, consulta) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao buscar consulta criada.' });
            }
            res.status(201).json({
              message: 'Consulta agendada com sucesso!',
              consulta
            });
          });
        }
      );
    }
  );
});

// DELETE /api/consultas/:id — Cancelar consulta
app.delete('/api/consultas/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE consultas SET status = 'Cancelada' WHERE id = ? AND status IN ('Pendente', 'Confirmada')`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao cancelar consulta.' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Consulta não encontrada ou não pode ser cancelada.' });
      }

      res.json({ message: 'Consulta cancelada com sucesso.' });
    }
  );
});

// ============================================================
// ROTAS DE UNIDADES DE SAÚDE
// ============================================================

// GET /api/ubs — Lista unidades de saúde disponíveis
app.get('/api/ubs', (req, res) => {
  db.all('SELECT * FROM unidades ORDER BY nome', (err, unidades) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar unidades de saúde.' });
    }
    res.json(unidades || []);
  });
});

// ============================================================
// ROTAS DE MÉDICOS
// ============================================================

// GET /api/medicos — Lista médicos, opcionalmente filtrados por especialidade
app.get('/api/medicos', (req, res) => {
  const { especialidade } = req.query;

  let query = `
    SELECT m.id, m.nome, m.especialidade, m.crm, u.nome as unidade_nome
    FROM medicos m
    LEFT JOIN unidades u ON m.unidade_id = u.id
  `;
  const params = [];

  if (especialidade) {
    query += ' WHERE m.especialidade = ?';
    params.push(especialidade);
  }

  query += ' ORDER BY m.nome';

  db.all(query, params, (err, medicos) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar médicos.' });
    }
    res.json(medicos || []);
  });
});

// GET /api/especialidades — Lista especialidades disponíveis
app.get('/api/especialidades', (req, res) => {
  db.all(
    'SELECT DISTINCT especialidade FROM medicos ORDER BY especialidade',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar especialidades.' });
      }
      res.json(rows.map(r => r.especialidade));
    }
  );
});

// ============================================================
// ROTAS DE PROTOCOLOS
// ============================================================

// GET /api/protocolos/:pacienteId — Lista protocolos do paciente
app.get('/api/protocolos/:pacienteId', (req, res) => {
  const { pacienteId } = req.params;

  db.all(
    `SELECT * FROM protocolos WHERE paciente_id = ? ORDER BY data_pedido DESC`,
    [pacienteId],
    (err, protocolos) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar protocolos.' });
      }
      res.json(protocolos || []);
    }
  );
});

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🏥 Saúde na Mão - Backend rodando na porta ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`\n📋 Credenciais de teste:`);
      console.log(`   CPF: 123.456.789-00 | Senha: 123456`);
      console.log(`   CPF: 987.654.321-00 | Senha: 654321\n`);
    });
  })
  .catch((err) => {
    console.error('Erro ao inicializar o banco de dados:', err);
    process.exit(1);
  });

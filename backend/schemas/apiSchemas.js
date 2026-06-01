const { z } = require('zod');

// Schema para Registro
const registerSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  cpf: z.string().min(11, { message: 'CPF inválido' }),
  senha: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  cartao_sus: z.string().optional().or(z.literal('')),
});

// Schema para Login
const loginSchema = z.object({
  cpf: z.string().min(1, { message: 'CPF é obrigatório' }),
  senha: z.string().min(1, { message: 'Senha é obrigatória' }),
});

// Schema para Atualizar Paciente
const updatePacienteSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cpf: z.string().min(11).optional(),
  cartao_sus: z.string().optional(),
  unidade: z.string().optional(),
  data_nascimento: z.string().optional(),
});

// Schema para Agendar Consulta
const agendamentoSchema = z.object({
  paciente_id: z.number().int().positive({ message: 'ID do paciente inválido' }),
  medico: z.string().min(1, { message: 'Médico é obrigatório' }),
  especialidade: z.string().min(1, { message: 'Especialidade é obrigatória' }),
  data: z.string().min(1, { message: 'Data é obrigatória' }),
  horario: z.string().min(1, { message: 'Horário é obrigatório' }),
  unidade: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updatePacienteSchema,
  agendamentoSchema,
};

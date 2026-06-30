import { z } from 'zod';

export const agendamentoSchema = z.object({
  medico: z.string().min(1, { message: 'Selecione um médico' }),
  data: z.string().min(1, { message: 'A data é obrigatória' }),
  horario: z.string().min(1, { message: 'O horário é obrigatório' }),
  unidade: z.string().min(1, { message: 'A unidade é obrigatória' }),
});
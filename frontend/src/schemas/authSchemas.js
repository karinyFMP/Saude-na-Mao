import { z } from 'zod';

// Validação de CPF básico (apenas formato para este exemplo)
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
// Validação de CNS básico
const cnsRegex = /^\d{3} \d{4} \d{4} \d{4}$/;

export const loginSchema = z.object({
  cpf: z.string()
    .min(1, { message: 'O CPF é obrigatório' })
    .regex(cpfRegex, { message: 'Formato de CPF inválido (000.000.000-00)' }),
  senha: z.string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

export const registerSchema = z.object({
  nome: z.string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  cpf: z.string()
    .min(1, { message: 'O CPF é obrigatório' })
    .regex(cpfRegex, { message: 'Formato de CPF inválido (000.000.000-00)' }),
  cartao_sus: z.string()
    .regex(cnsRegex, { message: 'Formato de CNS inválido (000 0000 0000 0000)' })
    .optional()
    .or(z.literal('')),
  senha: z.string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

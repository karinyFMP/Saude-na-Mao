import { z } from 'zod';
import { ESPECIALIDADES } from './protocoloMedicoSchema';

// ============================================================
// SCHEMA ZOD — CADASTRO DO MÉDICO
// ============================================================

const crmRegex = /^CRM\/[A-Z]{2}\s?\d{4,6}$/i;

/**
 * Regra de perfil:
 *  - 'Clinico Geral'  → especialidadeArea não é exigida
 *  - 'Especialista'   → especialidadeArea obrigatória
 */
export const cadastroMedicoSchema = z
  .object({
    nome: z
      .string()
      .min(3, 'Nome deve ter ao menos 3 caracteres.'),

    cpf: z
      .string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato: 000.000.000-00'),

    crm: z
      .string()
      .regex(crmRegex, 'Formato: CRM/UF 123456 (ex: CRM/SP 654321)'),

    email: z
      .string()
      .email('E-mail inválido.'),

    telefone: z
      .string()
      .min(14, 'Telefone inválido.')
      .optional()
      .or(z.literal('')),

    /**
     * REGRA CLÍNICO GERAL vs ESPECIALISTA
     * Valor discrimina o tipo de conta e impacta os protocolos que o médico pode criar.
     */
    perfil: z.enum(['Clinico Geral', 'Especialista'], {
      errorMap: () => ({ message: 'Selecione o perfil médico.' }),
    }),

    especialidadeArea: z.string().optional(),

    senha: z
      .string()
      .min(8, 'Senha deve ter ao menos 8 caracteres.')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
      .regex(/[0-9]/, 'Inclua ao menos um número.'),

    confirmarSenha: z.string(),
  })
  .superRefine((data, ctx) => {
    // Especialista obrigatoriamente informa a área
    if (data.perfil === 'Especialista') {
      if (!data.especialidadeArea || data.especialidadeArea.trim() === '') {
        ctx.addIssue({
          path: ['especialidadeArea'],
          code: z.ZodIssueCode.custom,
          message: 'Informe a especialidade médica.',
        });
      }
    }

    // Confirmação de senha
    if (data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        path: ['confirmarSenha'],
        code: z.ZodIssueCode.custom,
        message: 'As senhas não coincidem.',
      });
    }
  });

export { ESPECIALIDADES };

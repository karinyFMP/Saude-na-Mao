import { z } from 'zod';

// ============================================================
// CONSTANTES DE NEGÓCIO
// ============================================================

/**
 * Tipos de protocolo que EXIGEM o campo "Parecer Médico".
 * Regra aplicada tanto para Clínico Geral quanto para Especialista.
 * O Auditor (antigo Administrador) avaliará o parecer posteriormente.
 */
export const TIPOS_QUE_EXIGEM_PARECER = [
  'Pedido de Exame',
  'Encaminhamento ao Especialista',
  'Encaminhamento Cirúrgico',
  'Procedimento Ambulatorial',
  'Dispensação de Medicamento Especial'
];

export const TODOS_TIPOS_PROTOCOLO = [
  'Pedido de Exame',
  'Encaminhamento ao Especialista',
  'Encaminhamento Cirúrgico',
  'Procedimento Ambulatorial',
  'Dispensação de Medicamento Especial'
];

/**
 * Especialidades disponíveis para encaminhamento.
 * Clínico Geral pode encaminhar para qualquer uma.
 * Médico Especialista seleciona a sua própria.
 */
export const ESPECIALIDADES = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Geriatria',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Oncologia',
  'Ortopedia',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Reumatologia',
  'Urologia',
];

export const PRIORIDADES = ['Eletiva', 'Urgente', 'Emergência'];

// ============================================================
// SCHEMA ZOD — PROTOCOLO MÉDICO
// ============================================================

/**
 * Schema de validação do protocolo.
 *
 * REGRA DE NEGÓCIO CRÍTICA (Auditor):
 *   Se o tipo selecionado requer parecer (TIPOS_QUE_EXIGEM_PARECER),
 *   o campo `parecerMedico` torna-se obrigatório com mínimo de 50 chars,
 *   pois esse texto será avaliado pelo Auditor no fluxo de aprovação.
 */
export const protocoloSchema = z
  .object({
    // --- Paciente ---
    pacienteCpf: z
      .string()
      .min(1, 'CPF do paciente é obrigatório.')
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato: 000.000.000-00'),

    pacienteNome: z
      .string()
      .min(3, 'Nome muito curto.'),

    cid: z
      .string()
      .min(3, 'CID obrigatório e válido (ex: A00.0).')
      .max(10, 'CID muito longo.'),
      
    procedimento: z
      .string()
      .min(5, 'Procedimento deve ter pelo menos 5 caracteres.'),

    // --- Protocolo ---
    tipoProtocolo: z
      .string()
      .min(1, 'Selecione o tipo de protocolo.'),

    /**
     * REGRA CLÍNICO GERAL / ESPECIALISTA:
     * Campo de especialidade é obrigatório apenas quando o tipo for
     * "Encaminhamento ao Especialista". Para outros tipos fica opcional.
     */
    especialidade: z.string().optional(),

    prioridade: z
      .string()
      .min(1, 'Selecione a prioridade.'),

    descricao: z
      .string()
      .min(10, 'Descrição mínima de 10 caracteres.')
      .max(500, 'Descrição máxima de 500 caracteres.'),

    /**
     * REGRA DE NEGÓCIO — PARECER MÉDICO (campo condicional):
     * Obrigatório quando tipoProtocolo ∈ TIPOS_QUE_EXIGEM_PARECER.
     * O Auditor usará este campo para deferir ou negar o protocolo.
     * Mínimo 50 chars para garantir justificativa detalhada.
     */
    parecerMedico: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const exigeParecer = TIPOS_QUE_EXIGEM_PARECER.includes(data.tipoProtocolo);

    // Validação condicional do Parecer Médico
    if (exigeParecer) {
      if (!data.parecerMedico || data.parecerMedico.trim().length === 0) {
        ctx.addIssue({
          path: ['parecerMedico'],
          code: z.ZodIssueCode.custom,
          message: 'Parecer Médico é obrigatório para este tipo de protocolo.',
        });
      } else if (data.parecerMedico.trim().length < 50) {
        ctx.addIssue({
          path: ['parecerMedico'],
          code: z.ZodIssueCode.custom,
          message: `Justificativa insuficiente. Mínimo 50 caracteres (atual: ${data.parecerMedico.trim().length}).`,
        });
      }
    }

    // Validação condicional de Especialidade
    if (data.tipoProtocolo === 'Encaminhamento ao Especialista') {
      if (!data.especialidade || data.especialidade.trim().length === 0) {
        ctx.addIssue({
          path: ['especialidade'],
          code: z.ZodIssueCode.custom,
          message: 'Informe a especialidade para o encaminhamento.',
        });
      }
    }
  });

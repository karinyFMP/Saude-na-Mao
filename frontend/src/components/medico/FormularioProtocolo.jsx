import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import {
  AlertCircle, FileText, User, Stethoscope, ClipboardList,
  ChevronDown, Send, RotateCcw, Info, ArrowLeft, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  protocoloSchema,
  TIPOS_QUE_EXIGEM_PARECER,
  TODOS_TIPOS_PROTOCOLO,
  ESPECIALIDADES,
  PRIORIDADES,
} from '../../schemas/protocoloMedicoSchema';
import { criarProtocolo, buscarPaciente } from '../../services/medicoApi';

// ============================================================
// HELPERS
// ============================================================

/** Formata CPF enquanto o usuário digita */
function formatCpf(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

// ============================================================
// SUB-COMPONENTE: Mensagem de erro contextual
// ============================================================
function FieldError({ message }) {
  if (!message) return null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#E53E3E', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500 }} role="alert">
      <AlertCircle size={13} />
      {message}
    </span>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function FormularioProtocolo({ medico, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(protocoloSchema),
    defaultValues: {
      pacienteCpf:      '',
      pacienteNome:     '',
      pacienteDataNasc: '',
      pacienteTelefone: '',
      cid:              '',
      procedimento:     '',
      tipoProtocolo:    '',
      especialidade:    '',
      prioridade:       '',
      descricao:        '',
      parecerMedico:    '',
    },
  });

  const tipoSelecionado    = watch('tipoProtocolo');
  const parecerAtual       = watch('parecerMedico') ?? '';

  const exigeParecer       = TIPOS_QUE_EXIGEM_PARECER.includes(tipoSelecionado);
  const exigeEspecialidade = tipoSelecionado === 'Encaminhamento ao Especialista';

  const tiposDisponiveis = medico?.perfil === 'Especialista'
    ? TODOS_TIPOS_PROTOCOLO.filter(t => t !== 'Encaminhamento ao Especialista')
    : TODOS_TIPOS_PROTOCOLO;

  const handleCpfBlur = useCallback(async (cpf) => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return;
    setBuscandoPaciente(true);
    try {
      const paciente = await buscarPaciente(cpf);
      setPacienteEncontrado(paciente);
      setValue('pacienteNome', paciente.nome);
      setValue('pacienteDataNasc', paciente.data_nascimento || '');
      setValue('pacienteTelefone', paciente.telefone || '');
    } catch {
      setPacienteEncontrado(null);
      toast.warning('Paciente não encontrado para este CPF. Verifique ou preencha manualmente.');
    } finally {
      setBuscandoPaciente(false);
    }
  }, []);

  const onSubmit = async (dados) => {
    setSubmitting(true);
    try {
      await criarProtocolo({
        ...dados,
        procedimentos: dados.procedimento, // mapeia o campo do form para o backend
        medicoId:    medico?.id,
        medicoNome:  medico?.nome,
        medicoCrm:   medico?.crm,
        medicoPerfil: medico?.perfil,
      });
      toast.success('Protocolo criado com sucesso!');
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erro ao criar protocolo. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>

      <div className="pm-form-card" style={{ padding: '0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {/* Cabeçalho do Cartão */}
        <div className="pm-form-header" style={{ padding: '24px 32px' }}>
          <div className="pm-form-header-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="pm-form-title">Novo Protocolo Médico</h2>
            <p className="pm-form-subtitle">
              {medico?.perfil === 'Especialista'
                ? 'Especialista — registro de conduta e procedimentos'
                : 'Clínico Geral — atendimento inicial e encaminhamentos'}
            </p>
          </div>
        </div>

        <form id="form-protocolo" onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: '32px' }}>

          {/* ================================================
              SEÇÃO 1 — PACIENTE
              ================================================ */}
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--primary-dark)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <User size={18} /> Identificação do Paciente
            </h3>

            {/* Linha 1: Grid 1fr 1fr */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="pm-field">
                <label htmlFor="pacienteCpf" className="pm-label">
                  CPF do Paciente <span className="pm-required">*</span>
                </label>
                <Controller
                  name="pacienteCpf"
                  control={control}
                  render={({ field }) => (
                    <div style={{ position: 'relative' }}>
                      <input
                        id="pacienteCpf"
                        className={`pm-input ${errors.pacienteCpf ? 'pm-input--error' : ''}`}
                        placeholder="000.000.000-00"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(formatCpf(e.target.value));
                          if (pacienteEncontrado) setPacienteEncontrado(null);
                        }}
                        onBlur={(e) => handleCpfBlur(e.target.value)}
                        maxLength={14}
                        autoComplete="off"
                      />
                      {buscandoPaciente && (
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--primary)' }}>
                          Buscando...
                        </span>
                      )}
                      {pacienteEncontrado && !buscandoPaciente && (
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#10B981' }}>
                          <Search size={14} />
                        </span>
                      )}
                    </div>
                  )}
                />
                <FieldError message={errors.pacienteCpf?.message} />
              </div>

              <div className="pm-field">
                <label htmlFor="pacienteNome" className="pm-label">
                  Nome Completo <span className="pm-required">*</span>
                </label>
                <input
                  id="pacienteNome"
                  className={`pm-input ${errors.pacienteNome ? 'pm-input--error' : ''} ${pacienteEncontrado ? 'pm-input--readonly' : ''}`}
                  placeholder="Ex: Maria da Silva"
                  readOnly={!!pacienteEncontrado}
                  style={pacienteEncontrado ? { background: '#F0FDF4', cursor: 'default' } : {}}
                  {...register('pacienteNome')}
                />
                <FieldError message={errors.pacienteNome?.message} />
              </div>
            </div>

            {/* Linha 1b: Data de Nascimento + Telefone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="pm-field">
                <label htmlFor="pacienteDataNasc" className="pm-label">
                  Data de Nascimento
                </label>
                <input
                  id="pacienteDataNasc"
                  type="date"
                  className="pm-input"
                  readOnly={!!pacienteEncontrado}
                  style={pacienteEncontrado ? { background: '#F0FDF4', cursor: 'default' } : {}}
                  {...register('pacienteDataNasc')}
                />
              </div>
              <div className="pm-field">
                <label htmlFor="pacienteTelefone" className="pm-label">
                  Telefone
                </label>
                <input
                  id="pacienteTelefone"
                  className="pm-input"
                  placeholder="(63) 90000-0000"
                  readOnly={!!pacienteEncontrado}
                  style={pacienteEncontrado ? { background: '#F0FDF4', cursor: 'default' } : {}}
                  {...register('pacienteTelefone')}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '32px 0' }} />

          {/* ================================================
              SEÇÃO 2 — PROTOCOLO
              ================================================ */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--primary-dark)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FileText size={18} /> Dados do Protocolo
            </h3>

            {/* Linha 2: Grid 1fr 1fr */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="pm-field">
                <label htmlFor="tipoProtocolo" className="pm-label">
                  Tipo do Protocolo <span className="pm-required">*</span>
                </label>
                <div className={`pm-select-wrap ${errors.tipoProtocolo ? 'pm-select-wrap--error' : ''}`}>
                  <select
                    id="tipoProtocolo"
                    className="pm-select"
                    {...register('tipoProtocolo')}
                  >
                    <option value="">Selecione o tipo...</option>
                    {tiposDisponiveis.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pm-select-icon" />
                </div>
                <FieldError message={errors.tipoProtocolo?.message} />
              </div>

              <div className="pm-field">
                <label htmlFor="prioridade" className="pm-label">
                  Prioridade <span className="pm-required">*</span>
                </label>
                <div className={`pm-select-wrap ${errors.prioridade ? 'pm-select-wrap--error' : ''}`}>
                  <select
                    id="prioridade"
                    className="pm-select"
                    {...register('prioridade')}
                  >
                    <option value="">Selecione...</option>
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pm-select-icon" />
                </div>
                <FieldError message={errors.prioridade?.message} />
              </div>
            </div>

            {/* Linha 2.5: Grid 1fr 1fr para CID e Procedimento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
              <div className="pm-field">
                <label htmlFor="cid" className="pm-label">
                  CID <span className="pm-required">*</span>
                </label>
                <input
                  id="cid"
                  className={`pm-input ${errors.cid ? 'pm-input--error' : ''}`}
                  placeholder="Ex: A00.0"
                  {...register('cid')}
                />
                <FieldError message={errors.cid?.message} />
              </div>

              <div className="pm-field">
                <label htmlFor="procedimento" className="pm-label">
                  Procedimento Solicitado <span className="pm-required">*</span>
                </label>
                <input
                  id="procedimento"
                  className={`pm-input ${errors.procedimento ? 'pm-input--error' : ''}`}
                  placeholder="Ex: Ressonância Magnética do Joelho Esquerdo"
                  {...register('procedimento')}
                />
                <FieldError message={errors.procedimento?.message} />
              </div>
            </div>

            {exigeEspecialidade && (
              <div className="pm-field" style={{ marginBottom: '20px', animation: 'fadeInUp 0.3s ease-out' }}>
                <label htmlFor="especialidade" className="pm-label">
                  Especialidade de Destino <span className="pm-required">*</span>
                </label>
                <div className={`pm-select-wrap ${errors.especialidade ? 'pm-select-wrap--error' : ''}`}>
                  <select
                    id="especialidade"
                    className="pm-select"
                    {...register('especialidade')}
                  >
                    <option value="">Selecione a especialidade...</option>
                    {ESPECIALIDADES.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pm-select-icon" />
                </div>
                <FieldError message={errors.especialidade?.message} />
              </div>
            )}

            {/* Linha 3: 100% de largura */}
            <div className="pm-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="descricao" className="pm-label">
                Descrição Clínica <span className="pm-required">*</span>
              </label>
              <textarea
                id="descricao"
                className={`pm-textarea ${errors.descricao ? 'pm-input--error' : ''}`}
                placeholder="Descreva detalhadamente a situação clínica, sintomas e observações técnicas..."
                rows={4}
                {...register('descricao')}
              />
              <FieldError message={errors.descricao?.message} />
            </div>
          </div>

          {/* ================================================
              SEÇÃO 3 — PARECER MÉDICO (condicional)
              ================================================ */}
          {exigeParecer && (
            <div style={{ marginTop: '32px', padding: '24px', background: '#FFFDF5', border: '1px solid #F59E0B', borderRadius: '8px', animation: 'fadeInUp 0.3s ease-out' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#92400E', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Stethoscope size={18} /> Parecer Médico (Auditoria)
              </h3>
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', color: '#78350F', marginBottom: '16px', lineHeight: 1.5 }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                <p style={{ margin: 0 }}>
                  Forneça uma justificativa clínica detalhada — será analisada pelo Auditor antes da aprovação final. <strong>Mínimo de 50 caracteres.</strong>
                </p>
              </div>

              <div className="pm-field">
                <textarea
                  id="parecerMedico"
                  className={`pm-textarea pm-textarea--parecer ${errors.parecerMedico ? 'pm-input--error' : ''}`}
                  placeholder="Justifique a necessidade deste procedimento com base em achados clínicos e exames preliminares..."
                  rows={4}
                  {...register('parecerMedico')}
                  style={{ borderColor: '#F59E0B' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <FieldError message={errors.parecerMedico?.message} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: parecerAtual.length >= 50 ? '#10B981' : '#D97706', marginLeft: 'auto' }}>
                    {parecerAtual.length} / 50 mín.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AÇÕES DO FORMULÁRIO */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="pm-btn pm-btn--ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pm-btn pm-btn--primary"
              disabled={submitting}
            >
              {submitting ? (
                <><span className="pm-spinner" /> Enviando...</>
              ) : (
                <><Send size={16} /> Criar Protocolo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Stethoscope, User, Mail, Phone, Lock, Eye, EyeOff,
  AlertCircle, Loader2, ChevronDown, ArrowLeft, BadgeCheck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cadastroMedicoSchema, ESPECIALIDADES } from '../../schemas/cadastroMedicoSchema';
import { medicoApi } from '../../services/medicoApi';
import './CadastroMedico.css';

// ============================================================
// HELPERS
// ============================================================

const formatCpf = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

const formatTelefone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
};

// Sub-componente de erro reutilizável
function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="cm-error" role="alert">
      <AlertCircle size={13} />
      {message}
    </span>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CadastroMedico() {
  const navigate = useNavigate();
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cadastroMedicoSchema),
    defaultValues: {
      nome:             '',
      cpf:              '',
      crm:              '',
      email:            '',
      telefone:         '',
      perfil:           '',
      especialidadeArea: '',
      senha:            '',
      confirmarSenha:   '',
    },
  });

  const perfil = watch('perfil');

  /**
   * REGRA CLÍNICO GERAL vs ESPECIALISTA:
   * Campo de especialidade aparece condicionalmente.
   * Ao trocar o perfil, limpa o valor da especialidade para evitar dados inválidos.
   */
  const isEspecialista = perfil === 'Especialista';

  const onSubmit = async (dados) => {
    setLoading(true);
    try {
      await medicoApi.post('/medico/cadastro', dados);
      toast.success('Cadastro realizado! Aguarde aprovação para acessar o painel.');
      navigate('/medico/login');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // A tela de cadastro PODE ter scroll (regra de negócio):
    // usa padding ao invés de overflow:hidden para scroll natural.
    <div className="cm-page">
      {/* Círculos decorativos — mesmo padrão das demais telas de autenticação */}
      <div className="cm-bg">
        <div className="cm-bg-circle cm-bg-circle-1" />
        <div className="cm-bg-circle cm-bg-circle-2" />
        <div className="cm-bg-circle cm-bg-circle-3" />
      </div>

      <div className="cm-container">
        {/* Brand */}
        <div className="cm-brand">
          <div className="cm-logo-wrap">
            <Stethoscope size={28} />
          </div>
          <h1 className="cm-brand-title">Saúde na Mão</h1>
          <p className="cm-brand-subtitle">Cadastro de Médico</p>
        </div>

        {/* Card — scroll é intencional aqui por ter muitos campos */}
        <div className="cm-card">
          <div className="cm-card-header">
            <BadgeCheck size={22} className="cm-card-header-icon" />
            <div>
              <h2 className="cm-card-title">Criar conta médica</h2>
              <p className="cm-card-desc">Preencha seus dados profissionais</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="cm-form">

            {/* ---- DADOS PESSOAIS ---- */}
            <div className="cm-section-label">Dados pessoais</div>

            <div className="cm-field">
              <label htmlFor="cm-nome" className="cm-label">
                Nome Completo <span className="cm-required">*</span>
              </label>
              <div className={`cm-input-wrap ${errors.nome ? 'cm-input-wrap--error' : ''}`}>
                <User size={17} className="cm-input-icon" />
                <input
                  id="cm-nome"
                  type="text"
                  placeholder="Dr(a). Nome Sobrenome"
                  autoComplete="name"
                  disabled={loading}
                  {...register('nome')}
                />
              </div>
              <FieldError message={errors.nome?.message} />
            </div>

            <div className="cm-row">
              <div className="cm-field">
                <label htmlFor="cm-cpf" className="cm-label">
                  CPF <span className="cm-required">*</span>
                </label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <div className={`cm-input-wrap ${errors.cpf ? 'cm-input-wrap--error' : ''}`}>
                      <input
                        id="cm-cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        autoComplete="off"
                        maxLength={14}
                        disabled={loading}
                        value={field.value}
                        onChange={(e) => field.onChange(formatCpf(e.target.value))}
                      />
                    </div>
                  )}
                />
                <FieldError message={errors.cpf?.message} />
              </div>

              <div className="cm-field">
                <label htmlFor="cm-crm" className="cm-label">
                  CRM <span className="cm-required">*</span>
                </label>
                <div className={`cm-input-wrap ${errors.crm ? 'cm-input-wrap--error' : ''}`}>
                  <input
                    id="cm-crm"
                    type="text"
                    placeholder="CRM/SP 123456"
                    autoComplete="off"
                    disabled={loading}
                    {...register('crm')}
                  />
                </div>
                <FieldError message={errors.crm?.message} />
              </div>
            </div>

            <div className="cm-row">
              <div className="cm-field">
                <label htmlFor="cm-email" className="cm-label">
                  E-mail <span className="cm-required">*</span>
                </label>
                <div className={`cm-input-wrap ${errors.email ? 'cm-input-wrap--error' : ''}`}>
                  <Mail size={17} className="cm-input-icon" />
                  <input
                    id="cm-email"
                    type="email"
                    placeholder="medico@hospital.com"
                    autoComplete="email"
                    disabled={loading}
                    {...register('email')}
                  />
                </div>
                <FieldError message={errors.email?.message} />
              </div>

              <div className="cm-field">
                <label htmlFor="cm-telefone" className="cm-label">Telefone</label>
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <div className={`cm-input-wrap ${errors.telefone ? 'cm-input-wrap--error' : ''}`}>
                      <Phone size={17} className="cm-input-icon" />
                      <input
                        id="cm-telefone"
                        type="tel"
                        placeholder="(00) 90000-0000"
                        autoComplete="tel"
                        maxLength={15}
                        disabled={loading}
                        value={field.value}
                        onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                      />
                    </div>
                  )}
                />
                <FieldError message={errors.telefone?.message} />
              </div>
            </div>

            {/* ---- PERFIL MÉDICO ---- */}
            <div className="cm-section-label">Perfil profissional</div>

            {/*
              REGRA CLÍNICO GERAL vs ESPECIALISTA:
              Radio buttons explícitos garantem UX clara e acessível.
              O perfil selecionado impacta quais tipos de protocolo o médico
              poderá criar no PainelMedico (ver FormularioProtocolo.jsx).
            */}
            <div className="cm-field">
              <span className="cm-label">
                Tipo de atuação <span className="cm-required">*</span>
              </span>
              <div className="cm-perfil-group" role="radiogroup" aria-label="Tipo de atuação médica">
                <label
                  htmlFor="perfil-clinico"
                  className={`cm-perfil-card ${perfil === 'Clinico Geral' ? 'cm-perfil-card--active' : ''}`}
                >
                  <input
                    id="perfil-clinico"
                    type="radio"
                    value="Clinico Geral"
                    className="cm-radio-hidden"
                    {...register('perfil')}
                    onChange={(e) => {
                      setValue('perfil', e.target.value, { shouldValidate: true });
                      setValue('especialidadeArea', '');
                    }}
                  />
                  <div className="cm-perfil-card-icon">👨‍⚕️</div>
                  <div>
                    <p className="cm-perfil-card-name">Clínico Geral</p>
                    <p className="cm-perfil-card-desc">Atendimento inicial e encaminhamentos</p>
                  </div>
                </label>

                <label
                  htmlFor="perfil-especialista"
                  className={`cm-perfil-card ${perfil === 'Especialista' ? 'cm-perfil-card--active' : ''}`}
                >
                  <input
                    id="perfil-especialista"
                    type="radio"
                    value="Especialista"
                    className="cm-radio-hidden"
                    {...register('perfil')}
                    onChange={(e) => {
                      setValue('perfil', e.target.value, { shouldValidate: true });
                    }}
                  />
                  <div className="cm-perfil-card-icon">🔬</div>
                  <div>
                    <p className="cm-perfil-card-name">Especialista</p>
                    <p className="cm-perfil-card-desc">Médico com especialidade específica</p>
                  </div>
                </label>
              </div>
              <FieldError message={errors.perfil?.message} />
            </div>

            {/*
              CAMPO CONDICIONAL — Especialidade:
              Só aparece se o médico selecionou "Especialista".
              Clínico Geral não informa especialidade.
            */}
            {isEspecialista && (
              <div className="cm-field cm-field--animated">
                <label htmlFor="cm-especialidade" className="cm-label">
                  Especialidade Médica <span className="cm-required">*</span>
                </label>
                <div className={`cm-select-wrap ${errors.especialidadeArea ? 'cm-input-wrap--error' : ''}`}>
                  <select
                    id="cm-especialidade"
                    className="cm-select"
                    disabled={loading}
                    {...register('especialidadeArea')}
                  >
                    <option value="">Selecione sua especialidade...</option>
                    {ESPECIALIDADES.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="cm-select-icon" />
                </div>
                <FieldError message={errors.especialidadeArea?.message} />
              </div>
            )}

            {/* ---- SENHA ---- */}
            <div className="cm-section-label">Segurança</div>

            <div className="cm-row">
              <div className="cm-field">
                <label htmlFor="cm-senha" className="cm-label">
                  Senha <span className="cm-required">*</span>
                </label>
                <div className={`cm-input-wrap ${errors.senha ? 'cm-input-wrap--error' : ''}`}>
                  <Lock size={17} className="cm-input-icon" />
                  <input
                    id="cm-senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                    autoComplete="new-password"
                    disabled={loading}
                    {...register('senha')}
                  />
                  <button
                    type="button"
                    className="cm-toggle-pw"
                    onClick={() => setShowSenha(v => !v)}
                    tabIndex={-1}
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <FieldError message={errors.senha?.message} />
              </div>

              <div className="cm-field">
                <label htmlFor="cm-confirmar" className="cm-label">
                  Confirmar Senha <span className="cm-required">*</span>
                </label>
                <div className={`cm-input-wrap ${errors.confirmarSenha ? 'cm-input-wrap--error' : ''}`}>
                  <Lock size={17} className="cm-input-icon" />
                  <input
                    id="cm-confirmar"
                    type={showConfirmar ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    disabled={loading}
                    {...register('confirmarSenha')}
                  />
                  <button
                    type="button"
                    className="cm-toggle-pw"
                    onClick={() => setShowConfirmar(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmar ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  >
                    {showConfirmar ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <FieldError message={errors.confirmarSenha?.message} />
              </div>
            </div>

            {/* ---- AÇÕES ---- */}
            <button
              id="btn-cadastrar-medico"
              type="submit"
              className="cm-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={18} className="cm-spin" /> Cadastrando...</>
                : 'Criar Conta Médica'}
            </button>

            <div className="cm-toggle">
              <button
                type="button"
                className="cm-toggle-btn"
                onClick={() => navigate('/medico/login')}
              >
                <ArrowLeft size={14} /> Já tenho conta · Fazer login
              </button>
            </div>
          </form>
        </div>

        <p className="cm-footer">
          Cadastro sujeito à verificação do CRM. © 2026 Saúde na Mão
        </p>
      </div>
    </div>
  );
}

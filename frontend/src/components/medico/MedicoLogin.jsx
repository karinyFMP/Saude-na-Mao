import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { medicoLogin } from '../../services/medicoApi';
import { useMedicoAuth } from '../../contexts/MedicoAuthContext';
import './MedicoLogin.css';

// Schema simples para login
const loginSchema = z.object({
  crm:   z.string().min(4, 'CRM inválido.'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres.'),
});

export default function MedicoLogin() {
  const { loginMedico } = useMedicoAuth();
  const navigate = useNavigate();
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ crm, senha }) => {
    setLoading(true);
    try {
      const { medico, token } = await medicoLogin(crm, senha);
      loginMedico(medico, token);
      toast.success(`Bem-vindo(a), Dr(a). ${medico.nome.split(' ')[0]}!`);
      navigate('/medico/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'CRM ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-page">
      {/* Círculos decorativos — mesmo padrão do login do paciente e auditor */}
      <div className="ml-bg">
        <div className="ml-bg-circle ml-bg-circle-1" />
        <div className="ml-bg-circle ml-bg-circle-2" />
        <div className="ml-bg-circle ml-bg-circle-3" />
      </div>

      <div className="ml-container">
        {/* Brand */}
        <div className="ml-brand">
          <div className="ml-logo-wrap">
            <Stethoscope size={28} />
          </div>
          <h1 className="ml-brand-title">Saúde na Mão</h1>
          <p className="ml-brand-subtitle">Painel do Médico</p>
        </div>

        {/* Card */}
        <div className="ml-card">
          <h2 className="ml-card-title">Entrar no painel</h2>
          <p className="ml-card-desc">Acesso exclusivo para médicos cadastrados.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* CRM */}
            <div className="ml-field">
              <label htmlFor="crm" className="ml-label">CRM</label>
              <input
                id="crm"
                className={`ml-input ${errors.crm ? 'ml-input--error' : ''}`}
                placeholder="Ex: CRM/SP 123456"
                autoComplete="username"
                disabled={loading}
                {...register('crm')}
              />
              {errors.crm && (
                <span className="ml-error">
                  <AlertCircle size={13} /> {errors.crm.message}
                </span>
              )}
            </div>

            {/* Senha */}
            <div className="ml-field">
              <label htmlFor="medico-senha" className="ml-label">Senha</label>
              <div className="ml-input-wrap">
                <input
                  id="medico-senha"
                  type={showSenha ? 'text' : 'password'}
                  className={`ml-input ml-input--padded ${errors.senha ? 'ml-input--error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  {...register('senha')}
                />
                <button
                  type="button"
                  className="ml-toggle-senha"
                  onClick={() => setShowSenha(v => !v)}
                  tabIndex={-1}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.senha && (
                <span className="ml-error">
                  <AlertCircle size={13} /> {errors.senha.message}
                </span>
              )}
            </div>

            <button
              id="btn-login-medico"
              type="submit"
              className="ml-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={18} className="ml-spin" /> Entrando...</>
                : 'Entrar no Painel'}
            </button>
          </form>

        </div>

        <p className="ml-footer">
          Acesso restrito a profissionais de saúde cadastrados.
        </p>
      </div>
    </div>
  );
}

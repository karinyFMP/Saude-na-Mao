import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuditorAuth } from '../../contexts/AuditorAuthContext';
import { auditorLogin } from '../../services/auditorApi';
import logoImg from '../../assets/images/icone.png';
import './AuditorLogin.css';

export default function AuditorLogin() {
  const { loginServidor } = useAuditorAuth();
  const navigate = useNavigate();

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const handleCpfChange = (e) => {
    setCpf(formatCpf(e.target.value));
    if (errors.cpf) setErrors(prev => ({ ...prev, cpf: '' }));
  };

  const validate = () => {
    const newErrors = {};
    const cpfClean = cpf.replace(/\D/g, '');
    if (!cpf) newErrors.cpf = 'Informe o CPF de acesso.';
    else if (cpfClean.length < 11) newErrors.cpf = 'CPF inválido.';
    if (!senha) newErrors.senha = 'Informe a senha.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errosValidacao = validate();
    if (Object.keys(errosValidacao).length > 0) {
      setErrors(errosValidacao);
      return;
    }

    setLoading(true);
    try {
      const data = await auditorLogin(cpf, senha);
      loginServidor(data.servidor, data.token);
      toast.success(`Bem-vindo, ${data.servidor.nome}!`);
      navigate('/auditor/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Credenciais inválidas. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auditor-login-page">
      {/* Círculos decorativos — mesmo padrão do login do paciente */}
      <div className="auditor-login-bg">
        <div className="auditor-login-bg-circle auditor-login-bg-circle-1" />
        <div className="auditor-login-bg-circle auditor-login-bg-circle-2" />
        <div className="auditor-login-bg-circle auditor-login-bg-circle-3" />
      </div>

      <div className="auditor-login-container">
        {/* Brand */}
        <div className="auditor-login-brand">
          <div className="auditor-login-logo-wrap" style={{ padding: 0, background: 'transparent', border: 'none' }}>
            <img src={logoImg} alt="Logotipo Saúde na Mão" width="64" height="64" style={{ borderRadius: '14px', objectFit: 'cover' }} />
          </div>
          <h1 className="auditor-login-title">Painel do Servidor</h1>
          <p className="auditor-login-subtitle">Saúde na Mão — Área de Auditoria</p>
        </div>

        {/* Card */}
        <div className="auditor-login-card">
          <div className="auditor-restricted-badge">
            <span className="auditor-restricted-dot" />
            Acesso Restrito
          </div>

          <h2 className="auditor-login-card-title">Entrar no painel</h2>
          <p className="auditor-login-card-desc">
            Acesso exclusivo para auditores.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* CPF */}
            <div className="auditor-field">
              <label htmlFor="auditor-cpf">CPF de Acesso</label>
              <div className={`auditor-input-wrap ${errors.cpf ? 'error' : ''}`}>
                <User size={16} className="auditor-input-icon" />
                <input
                  id="auditor-cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              {errors.cpf && (
                <span className="auditor-field-error">
                  <AlertCircle size={13} /> {errors.cpf}
                </span>
              )}
            </div>

            {/* Senha */}
            <div className="auditor-field">
              <label htmlFor="auditor-senha">Senha</label>
              <div className={`auditor-input-wrap ${errors.senha ? 'error' : ''}`}>
                <Lock size={16} className="auditor-input-icon" />
                <input
                  id="auditor-senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errors.senha) setErrors(prev => ({ ...prev, senha: '' }));
                  }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auditor-toggle-pass"
                  onClick={() => setShowSenha(v => !v)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.senha && (
                <span className="auditor-field-error">
                  <AlertCircle size={13} /> {errors.senha}
                </span>
              )}
            </div>

            <button
              id="auditor-login-btn"
              type="submit"
              className="auditor-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auditor-spinner" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>
        </div>

        <p className="auditor-login-footer">
          <Shield size={12} />
          Acesso monitorado • © 2026 Saúde na Mão
        </p>
      </div>
    </div>
  );
}

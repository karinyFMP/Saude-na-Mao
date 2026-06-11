import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminLogin } from '../../services/adminApi';
import logoImg from '../../assets/images/icone.png';
import './AdminLogin.css';

export default function AdminLogin() {
  const { loginServidor } = useAdminAuth();
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
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
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
      const data = await adminLogin(cpf, senha);
      loginServidor(data.servidor, data.token);
      toast.success(`Bem-vindo, ${data.servidor.nome}!`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Credenciais inválidas. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Círculos decorativos — mesmo padrão do login do paciente */}
      <div className="admin-login-bg">
        <div className="admin-login-bg-circle admin-login-bg-circle-1" />
        <div className="admin-login-bg-circle admin-login-bg-circle-2" />
        <div className="admin-login-bg-circle admin-login-bg-circle-3" />
      </div>

      <div className="admin-login-container">
        {/* Brand */}
        <div className="admin-login-brand">
          <div className="admin-login-logo-wrap" style={{ padding: 0, background: 'transparent', border: 'none' }}>
            <img src={logoImg} alt="Logotipo Saúde na Mão" width="64" height="64" style={{ borderRadius: '14px', objectFit: 'cover' }} />
          </div>
          <h1 className="admin-login-title">Painel do Servidor</h1>
          <p className="admin-login-subtitle">Saúde na Mão — Área Administrativa</p>
        </div>

        {/* Card */}
        <div className="admin-login-card">
          <div className="admin-restricted-badge">
            <span className="admin-restricted-dot" />
            Acesso Restrito
          </div>

          <h2 className="admin-login-card-title">Entrar no painel</h2>
          <p className="admin-login-card-desc">
            Acesso exclusivo para servidores e atendentes autorizados.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* CPF */}
            <div className="admin-field">
              <label htmlFor="admin-cpf">CPF de Acesso</label>
              <div className={`admin-input-wrap ${errors.cpf ? 'error' : ''}`}>
                <User size={16} className="admin-input-icon" />
                <input
                  id="admin-cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              {errors.cpf && (
                <span className="admin-field-error">
                  <AlertCircle size={13} /> {errors.cpf}
                </span>
              )}
            </div>

            {/* Senha */}
            <div className="admin-field">
              <label htmlFor="admin-senha">Senha</label>
              <div className={`admin-input-wrap ${errors.senha ? 'error' : ''}`}>
                <Lock size={16} className="admin-input-icon" />
                <input
                  id="admin-senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
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
                  className="admin-toggle-pass"
                  onClick={() => setShowSenha(v => !v)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.senha && (
                <span className="admin-field-error">
                  <AlertCircle size={13} /> {errors.senha}
                </span>
              )}
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              className="admin-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-spinner" />
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

        <p className="admin-login-footer">
          <Shield size={12} />
          Acesso monitorado · © 2026 Saúde na Mão
        </p>
      </div>
    </div>
  );
}

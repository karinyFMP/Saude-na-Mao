import { useState } from 'react';
import { login, register } from '../services/api';
import './Login.css';
import logoImg from '../assets/images/icone.png';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cartao_sus, setCartao_sus] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Máscara de CPF
  const formatCPF = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Máscara de CNS (Cartão SUS) - Formato: 000 0000 0000 0000
  const formatCNS = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 15);
    return nums
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2');
  };

  const handleCPFChange = (e) => {
    setCpf(formatCPF(e.target.value));
    setErro('');
  };

  const handleCNSChange = (e) => {
    setCartao_sus(formatCNS(e.target.value));
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!nome || !cpf || !senha || !cartao_sus) {
        setErro('Preencha todos os campos obrigatórios.');
        return;
      }
    } else {
      if (!cpf || !senha) {
        setErro('Preencha todos os campos.');
        return;
      }
    }

    setLoading(true);
    setErro('');

    try {
      if (isRegistering) {
        const data = await register(nome, cpf, senha, cartao_sus);
        onLogin(data.paciente);
      } else {
        const data = await login(cpf, senha);
        onLogin(data.paciente);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErro('');
    setNome('');
    setCpf('');
    setCartao_sus('');
    setSenha('');
  };

  return (
    <div className="login-page">
      {/* Decorative Background */}
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
        <div className="login-bg-circle login-bg-circle-3" />
      </div>

      <div className="login-container">
        {/* Header / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <img src={logoImg} alt="Logotipo Saúde na Mão" width="64" height="64" style={{ borderRadius: '14px', objectFit: 'cover' }} />
          </div>
          <h1 className="login-title">Saúde na Mão</h1>
          <p className="login-subtitle">Sua saúde digital, simples e acessível</p>
        </div>

        {/* Login Card */}
        <form className="login-card" onSubmit={handleSubmit}>
          <h2 className="login-card-title">
            {isRegistering ? 'Criar sua conta' : 'Entrar na sua conta'}
          </h2>
          <p className="login-card-desc">
            {isRegistering 
              ? 'Preencha os dados abaixo para se cadastrar' 
              : 'Use seu CPF e senha para acessar'}
          </p>

          {erro && (
            <div className="login-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{erro}</span>
            </div>
          )}

          {isRegistering && (
            <div className="login-field">
              <label htmlFor="nome">Nome Completo</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {isRegistering && (
            <div className="login-field">
              <label htmlFor="cns">Cartão Nacional de Saúde (CNS)</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
                <input
                  id="cns"
                  type="text"
                  placeholder="000 0000 0000 0000"
                  value={cartao_sus}
                  onChange={handleCNSChange}
                  maxLength={18}
                />
              </div>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="cpf">CPF</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 8h10M7 12h10M7 16h10"/>
              </svg>
              <input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                autoComplete="off"
                maxLength={14}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="senha">Senha</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(''); }}
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
            id="btn-login"
          >
            {loading ? (
              <div className="login-spinner" />
            ) : (
              <>
                {isRegistering ? 'Cadastrar' : 'Entrar'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          <div className="login-mode-toggle">
            <button 
              type="button" 
              onClick={toggleMode}
              className="login-mode-toggle-btn"
            >
              {isRegistering 
                ? 'Já possui uma conta? Faça login' 
                : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </form>

        <p className="login-footer">
          © 2026 Saúde na Mão · Versão 1.0
        </p>
      </div>
    </div>
  );
}


import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import logoImg from '../assets/images/icone.png';
import './Login.css';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.cpf, data.senha);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      // O interceptor já mostra o toast
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (data) => {
    setLoading(true);
    try {
      await register(data);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      // O interceptor já mostra o toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
        <div className="login-bg-circle login-bg-circle-3" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <img src={logoImg} alt="Logotipo Saúde na Mão" width="64" height="64" style={{ borderRadius: '14px', objectFit: 'cover' }} />
          </div>
          <h1 className="login-title">Saúde na Mão</h1>
          <p className="login-subtitle">Sua saúde digital, simples e acessível</p>
        </div>

        {isRegistering ? (
          <RegisterForm 
            onSubmit={handleRegisterSubmit} 
            loading={loading} 
            onToggleMode={() => setIsRegistering(false)} 
          />
        ) : (
          <LoginForm 
            onSubmit={handleLoginSubmit} 
            loading={loading} 
            onToggleMode={() => setIsRegistering(true)} 
          />
        )}

        <p className="login-footer">
          © 2026 Saúde na Mão · Versão 1.0
        </p>
      </div>
    </div>
  );
}

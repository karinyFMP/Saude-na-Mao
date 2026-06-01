import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchemas';
import { Eye, EyeOff, User, Lock, Loader2 } from 'lucide-react';

export default function LoginForm({ onSubmit, loading, onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const formatCPF = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCPFChange = (e) => {
    setValue('cpf', formatCPF(e.target.value), { shouldValidate: true });
  };

  return (
    <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="login-card-title">Entrar na sua conta</h2>
      <p className="login-card-desc">Use seu CPF e senha para acessar</p>

      <div className="login-field">
        <label htmlFor="cpf">CPF</label>
        <div className={`login-input-wrapper ${errors.cpf ? 'error' : ''}`}>
          <User className="login-input-icon" size={20} />
          <input
            id="cpf"
            type="text"
            placeholder="000.000.000-00"
            {...register('cpf')}
            onChange={handleCPFChange}
            autoComplete="off"
            maxLength={14}
          />
        </div>
        {errors.cpf && <span className="field-error">{errors.cpf.message}</span>}
      </div>

      <div className="login-field">
        <label htmlFor="senha">Senha</label>
        <div className={`login-input-wrapper ${errors.senha ? 'error' : ''}`}>
          <Lock className="login-input-icon" size={20} />
          <input
            id="senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            {...register('senha')}
          />
          <button
            type="button"
            className="login-toggle-pw"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.senha && <span className="field-error">{errors.senha.message}</span>}
      </div>

      <button
        type="submit"
        className="login-submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="login-spinner" size={20} /> : 'Entrar'}
      </button>

      <div className="login-mode-toggle">
        <button 
          type="button" 
          onClick={onToggleMode}
          className="login-mode-toggle-btn"
        >
          Não tem uma conta? Cadastre-se
        </button>
      </div>
    </form>
  );
}

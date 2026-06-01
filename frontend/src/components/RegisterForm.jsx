import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/authSchemas';
import { Eye, EyeOff, User, Lock, CreditCard, Loader2 } from 'lucide-react';

export default function RegisterForm({ onSubmit, loading, onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const formatCPF = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCNS = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 15);
    return nums
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2');
  };

  const handleCPFChange = (e) => {
    setValue('cpf', formatCPF(e.target.value), { shouldValidate: true });
  };

  const handleCNSChange = (e) => {
    setValue('cartao_sus', formatCNS(e.target.value), { shouldValidate: true });
  };

  return (
    <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="login-card-title">Criar sua conta</h2>
      <p className="login-card-desc">Preencha os dados abaixo para se cadastrar</p>

      <div className="login-field">
        <label htmlFor="nome">Nome Completo</label>
        <div className={`login-input-wrapper ${errors.nome ? 'error' : ''}`}>
          <User className="login-input-icon" size={20} />
          <input
            id="nome"
            type="text"
            placeholder="Seu nome completo"
            {...register('nome')}
            autoComplete="name"
          />
        </div>
        {errors.nome && <span className="field-error">{errors.nome.message}</span>}
      </div>

      <div className="login-field">
        <label htmlFor="cns">Cartão Nacional de Saúde (CNS)</label>
        <div className={`login-input-wrapper ${errors.cartao_sus ? 'error' : ''}`}>
          <CreditCard className="login-input-icon" size={20} />
          <input
            id="cns"
            type="text"
            placeholder="000 0000 0000 0000"
            {...register('cartao_sus')}
            onChange={handleCNSChange}
            maxLength={18}
          />
        </div>
        {errors.cartao_sus && <span className="field-error">{errors.cartao_sus.message}</span>}
      </div>

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
            placeholder="Crie uma senha"
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
        {loading ? <Loader2 className="login-spinner" size={20} /> : 'Cadastrar'}
      </button>

      <div className="login-mode-toggle">
        <button 
          type="button" 
          onClick={onToggleMode}
          className="login-mode-toggle-btn"
        >
          Já possui uma conta? Faça login
        </button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';
import { updatePaciente } from '../services/api';

const Perfil = ({ paciente, onBack, onUpdatePaciente }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    nome: paciente?.nome || '',
    cpf: paciente?.cpf || '',
    cartao_sus: paciente?.cartao_sus || '',
    telefone: paciente?.telefone || '',
    endereco: paciente?.endereco || '',
    unidade: paciente?.unidade || '',
    data_nascimento: paciente?.data_nascimento || ''
  });

  // Pega iniciais para o avatar
  const iniciais = paciente?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
  const primeiroNome = paciente?.nome?.split(' ')[0] || 'Paciente';

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'cartao_sus') formattedValue = formatCNS(value);
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleEditClick = () => {
    setFormData({
      nome: paciente?.nome || '',
      cpf: paciente?.cpf || '',
      cartao_sus: paciente?.cartao_sus || '',
      telefone: paciente?.telefone || '',
      endereco: paciente?.endereco || '',
      unidade: paciente?.unidade || '',
      data_nascimento: paciente?.data_nascimento || ''
    });
    setIsEditing(true);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await updatePaciente(paciente.id, formData);
      if (onUpdatePaciente) {
        onUpdatePaciente(response.paciente);
      }
      setIsEditing(false);
      showToast('Dados do perfil atualizados com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-container">
      <style>{`
        .perfil-container {
          background-color: var(--primary-bg, #f6f8fa);
          min-height: 100vh;
          padding-bottom: 100px;
          font-family: 'Inter', sans-serif;
        }

        /* Modern Gradient Header with glow */
        .perfil-header {
          background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
          padding: 50px 20px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          border-bottom-left-radius: 36px;
          border-bottom-right-radius: 36px;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 47, 108, 0.15);
          overflow: hidden;
        }

        /* Abstract glowing orb in header background */
        .perfil-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 140%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%);
          pointer-events: none;
        }

        /* Nav Buttons on Header */
        .back-button, .edit-button {
          position: absolute;
          top: 25px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 14px;
          padding: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }
        .back-button:hover, .edit-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .back-button:active, .edit-button:active {
          transform: translateY(0);
        }
        .back-button { left: 20px; }
        .edit-button { right: 20px; }

        /* Floating Avatar */
        .avatar-large {
          width: 100px;
          height: 100px;
          background: white;
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 800;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 5px rgba(255, 255, 255, 0.2);
          margin-bottom: 16px;
          transition: all 0.3s ease;
        }
        .avatar-large:hover {
          transform: scale(1.05);
        }

        .perfil-nome {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Connected status badge */
        .status-badge-sus {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          margin-top: 10px;
          backdrop-filter: blur(4px);
        }
        
        .status-badge-sus.editing {
          background: var(--status-pending-bg, #FEF3C7);
          color: var(--status-pending, #D97706);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .dot-blink {
          width: 8px;
          height: 8px;
          background-color: #10B981;
          border-radius: 50%;
          display: inline-block;
          animation: blink 2s infinite ease-in-out;
        }
        .status-badge-sus.editing .dot-blink {
          background-color: var(--status-pending, #D97706);
        }

        @keyframes blink {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* Content Layout */
        .perfil-content {
          padding: 0 20px;
          margin-top: -24px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 10;
        }

        /* Section Titles */
        .perfil-section-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 24px 0 10px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .perfil-section-title svg {
          color: var(--primary);
        }

        /* Stunning cards */
        .info-card {
          background: white;
          border-radius: 24px;
          padding: 12px 24px;
          box-shadow: 0 8px 24px rgba(0, 47, 108, 0.05);
          margin-bottom: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: transform 0.3s ease;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-item:last-child {
          border-bottom: none;
        }

        /* Icon Box */
        .icon-box {
          width: 44px;
          height: 44px;
          background: var(--primary-lightest, #E8F0FE);
          color: var(--primary, #1351B4);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .info-item:hover .icon-box {
          background: var(--primary);
          color: white;
          transform: scale(1.05);
        }

        .label {
          font-size: 0.75rem;
          color: var(--text-muted, #718096);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
          display: block;
        }

        .value {
          font-size: 1.05rem;
          color: var(--text-primary, #1A202C);
          font-weight: 600;
        }

        /* Inputs customized for profile updating */
        .edit-input {
          width: 100%;
          border: 1.5px solid var(--border, #E2E8F0);
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 1rem;
          font-weight: 500;
          margin-top: 6px;
          background: var(--bg-input, #F7F9FC);
          color: var(--text-primary);
          box-sizing: border-box;
          transition: all 0.3s ease;
        }
        .edit-input:focus {
          border-color: var(--primary-light, #2670E8);
          background: white;
          outline: none;
          box-shadow: 0 0 0 4px var(--primary-lightest, #E8F0FE);
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
          margin-top: 36px;
          padding-bottom: 40px;
        }

        .btn-save {
          background: var(--gradient-success, linear-gradient(135deg, #00884A 0%, #10B981 100%));
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.1rem;
          width: 100%;
          max-width: 320px;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.35);
        }
        .btn-save:active {
          transform: translateY(0);
        }
        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-cancel {
          background: white;
          color: #DC2626;
          border: 2px solid #DC2626;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.1rem;
          width: 100%;
          max-width: 320px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-cancel:hover {
          background: #FEF2F2;
          transform: translateY(-2px);
        }
        .btn-cancel:active {
          transform: translateY(0);
        }

        .btn-sair {
          background: white;
          color: #DC2626;
          border: 2.5px solid #FEE2E2;
          padding: 15px 24px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.05rem;
          width: 100%;
          max-width: 320px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-sair:hover {
          background: #DC2626;
          color: white;
          border-color: #DC2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.2);
        }
        .btn-sair:active {
          transform: translateY(0);
        }

        /* Custom Sliding Toast notification */
        .perfil-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          color: white;
          padding: 14px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: toast-slide-in 0.4s forwards;
        }

        .perfil-toast-success {
          background: linear-gradient(135deg, #00884A 0%, #10B981 100%);
          border-left: 5px solid #047857;
        }

        .perfil-toast-error {
          background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
          border-left: 5px solid #B91C1C;
        }

        @keyframes toast-slide-in {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Renderização condicional do Toast */}
      {toast.show && (
        <div className={`perfil-toast perfil-toast-${toast.type}`} role="alert">
          {toast.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="perfil-header">
        <button className="back-button" onClick={onBack} aria-label="Voltar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        {!isEditing && (
          <button className="edit-button" onClick={handleEditClick} aria-label="Editar Perfil">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}

        <div className="avatar-large">{iniciais}</div>
        <h2 className="perfil-nome">{isEditing ? 'Atualizar Perfil' : primeiroNome}</h2>
        
        <div className={`status-badge-sus ${isEditing ? 'editing' : ''}`}>
          {isEditing ? (
            <>
              <span className="dot-blink"></span>
              Modo de Edição
            </>
          ) : (
            <>
              <span className="dot-blink"></span>
              Cadastro SUS Ativo
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="perfil-content">
        
        {/* CARD 1: Dados Pessoais */}
        <h3 className="perfil-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Dados Pessoais
        </h3>
        
        <div className="info-card">
          {/* Nome Completo */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Nome Completo</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                />
              ) : (
                <span className="value">{paciente?.nome}</span>
              )}
            </div>
          </div>

          {/* Data de Nascimento */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Data de Nascimento</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{formatDate(paciente?.data_nascimento)}</span>
              )}
            </div>
          </div>

          {/* CPF */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">CPF</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                />
              ) : (
                <span className="value">{paciente?.cpf}</span>
              )}
            </div>
          </div>

          {/* CNS */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Cartão Nacional de Saúde (CNS)</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="cartao_sus"
                  value={formData.cartao_sus}
                  onChange={handleInputChange}
                  placeholder="000 0000 0000 0000"
                />
              ) : (
                <span className="value">{paciente?.cartao_sus || 'Não informado'}</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Contatos e Endereço */}
        <h3 className="perfil-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Contato e Localização
        </h3>

        <div className="info-card">
          {/* Telefone */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Telefone de Contato</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <span className="value">{paciente?.telefone || 'Não informado'}</span>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Endereço Residencial</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro..."
                />
              ) : (
                <span className="value">{paciente?.endereco || 'Não informado'}</span>
              )}
            </div>
          </div>

          {/* Unidade de Referência */}
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Unidade de Saúde de Referência</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleInputChange}
                  placeholder="Nome da UBS ou UPA"
                />
              ) : (
                <span className="value">{paciente?.unidade || 'UBS Central'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          {isEditing ? (
            <>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn-sair" onClick={() => window.location.reload()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Finalizar Sessão
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Perfil;
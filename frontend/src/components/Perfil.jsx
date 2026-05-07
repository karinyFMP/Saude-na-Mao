import React, { useState } from 'react';
import { updatePaciente } from '../services/api';

const Perfil = ({ paciente, onBack, onUpdatePaciente }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: paciente?.nome || '',
    cpf: paciente?.cpf || '',
    cartao_sus: paciente?.cartao_sus || '',
    telefone: paciente?.telefone || '',
    endereco: paciente?.endereco || '',
    unidade: paciente?.unidade || '',
    data_nascimento: paciente?.data_nascimento || ''
  });
  const [erro, setErro] = useState('');

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

  const handleSave = async () => {
    setLoading(true);
    setErro('');
    try {
      const response = await updatePaciente(paciente.id, formData);
      if (onUpdatePaciente) {
        onUpdatePaciente(response.paciente);
      }
      setIsEditing(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-container">
      <style>{`
        .perfil-container {
          background-color: var(--bg-body);
          min-height: 100vh;
          padding-bottom: 100px;
        }
        .perfil-header {
          background: var(--gradient-header);
          padding: 40px 20px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
          position: relative;
        }
        .back-button, .edit-button {
          position: absolute;
          top: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 12px;
          padding: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .back-button:hover, .edit-button:hover {
          background: rgba(255,255,255,0.3);
        }
        .back-button { left: 20px; }
        .edit-button { right: 20px; }
        
        .avatar-large {
          width: 90px;
          height: 90px;
          background: white;
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          margin-bottom: 15px;
        }
        .perfil-nome { font-size: 1.4rem; font-weight: 700; margin: 0; }
        .perfil-email { font-size: 0.9rem; opacity: 0.8; }
        
        .perfil-content {
          padding: 0 20px;
          margin-top: 20px;
        }
        .info-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: var(--shadow-card);
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .info-item:last-child { border-bottom: none; }
        .icon-box {
          width: 40px;
          height: 40px;
          background: var(--primary-bg);
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .label { font-size: 0.8rem; color: var(--text-muted); display: block; }
        .value { font-size: 1rem; color: var(--text-primary); font-weight: 600; }
        
        .edit-input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.95rem;
          margin-top: 4px;
          background: var(--bg-input);
          color: var(--text-primary);
        }
        .edit-input:focus {
          border-color: var(--primary);
          background: white;
        }
        
        .error-msg {
          color: var(--status-cancelled);
          font-size: 0.85rem;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          margin-top: 30px;
          padding-bottom: 20px;
        }
        .btn-save {
          background: var(--gradient-success, #10B981);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          width: 280px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .btn-save:active { transform: scale(0.98); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-cancel {
          background: white;
          color: #DC2626;
          border: 2px solid #DC2626;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          width: 280px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover {
          background: #FEF2F2;
        }
        .btn-cancel:active {
          transform: scale(0.98);
        }
        .btn-sair {
          background: var(--primary);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          width: 280px;
          box-shadow: var(--shadow-btn);
          transition: transform 0.2s;
          cursor: pointer;
        }
        .btn-sair:active {
          transform: scale(0.98);
        }
      `}</style>

      <header className="perfil-header">
        <button className="back-button" onClick={onBack}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        {!isEditing && (
          <button className="edit-button" onClick={handleEditClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}

        <div className="avatar-large">{iniciais}</div>
        <h2 className="perfil-nome">{primeiroNome}</h2>
      </header>

      <main className="perfil-content">
        {erro && <p className="error-msg">{erro}</p>}
        
        <div className="info-card">
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Nome Completo</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.nome}</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">CPF</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.cpf}</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Cartão Nacional de Saúde (CNS)</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="cartao_sus"
                  value={formData.cartao_sus}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.cartao_sus || 'Não informado'}</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Telefone de Contato</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.telefone || 'Não informado'}</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Endereço Residencial</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.endereco || 'Não informado'}</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label">Unidade de Saúde de Referência</span>
              {isEditing ? (
                <input 
                  className="edit-input"
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleInputChange}
                />
              ) : (
                <span className="value">{paciente?.unidade || 'UBS Central'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {isEditing ? (
            <>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn-sair" onClick={() => window.location.reload()}>
              Finalizar Sessão
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Perfil;
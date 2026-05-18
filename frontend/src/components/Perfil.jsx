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
          background: #10B981;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.05rem;
          width: 280px;
          cursor: pointer;
        }

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
          cursor: pointer;
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
          {[
            ['Nome Completo', 'nome'],
            ['Data de Nascimento', 'data_nascimento'],
            ['CPF', 'cpf'],
            ['Cartão Nacional de Saúde (CNS)', 'cartao_sus'],
            ['Telefone de Contato', 'telefone'],
            ['Endereço Residencial', 'endereco'],
            ['Unidade de Saúde de Referência', 'unidade']
          ].map(([label, field]) => (
            <div className="info-item" key={field}>
              <div className="icon-box">•</div>
              <div style={{ flex: 1 }}>
                <span className="label">{label}</span>
                {isEditing ? (
                  <input
                    className="edit-input"
                    type={field === 'data_nascimento' ? 'date' : 'text'}
                    name={field}
                    value={formData[field]}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="value">
                    {field === 'data_nascimento'
                      ? formatDate(paciente?.[field])
                      : paciente?.[field] || 'Não informado'}
                  </span>
                )}
              </div>
            </div>
          ))}
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
            <>
              <button className="btn-save" onClick={handleEditClick}>
                Editar Perfil
              </button>
              <button className="btn-sair" onClick={() => window.location.reload()}>
                Finalizar Sessão
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Perfil;
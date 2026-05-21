import React from 'react';

export default function CartaoSUSModal({ paciente, onClose }) {
  if (!paciente) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCNS = (value) => {
    if (!value) return '';
    const nums = value.replace(/\D/g, '').slice(0, 15);
    return nums
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2');
  };

  const cns = formatCNS(paciente.cartao_sus) || '123 4567 8901 2345';

  return (
    <div className="sus-modal-backdrop" onClick={onClose}>
      <style>{`
        .sus-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 47, 108, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: backdropFadeIn 0.3s ease-out;
          padding: 20px;
        }
        .sus-modal-content {
          width: 100%;
          max-width: 400px;
          background: transparent;
          animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sus-card-container {
          background: linear-gradient(135deg, #002F6C 0%, #00884A 100%);
          border-radius: 20px;
          padding: 24px;
          color: white;
          box-shadow: 0 20px 40px rgba(0, 47, 108, 0.3);
          position: relative;
          overflow: hidden;
        }
        .sus-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        .sus-card-logo-gov {
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.5px;
        }
        .sus-card-logo-sus {
          font-weight: 800;
          font-size: 1.5rem;
          color: #FFCD00;
        }
        .sus-card-number {
          font-family: monospace;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 20px;
          text-align: center;
          background: rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 10px;
        }
        .sus-card-field {
          margin-bottom: 12px;
        }
        .sus-card-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          opacity: 0.8;
          margin-bottom: 2px;
        }
        .sus-card-value {
          font-size: 1.05rem;
          font-weight: 600;
        }
        .sus-card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .sus-card-barcode-area {
          margin-top: 30px;
          background: white;
          padding: 15px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sus-barcode {
          width: 100%;
          height: 50px;
          background: repeating-linear-gradient(
            to right,
            black,
            black 3px,
            white 3px,
            white 6px,
            black 6px,
            black 7px,
            white 7px,
            white 10px,
            black 10px,
            black 14px,
            white 14px,
            white 16px
          );
        }
        .sus-modal-close {
          margin-top: 20px;
          width: 100%;
          padding: 14px;
          background: white;
          color: var(--primary-dark);
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
        }
      `}</style>
      <div className="sus-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sus-card-container">
          <div className="sus-card-header">
            <span className="sus-card-logo-gov">gov.br</span>
            <span className="sus-card-logo-sus">SUS</span>
          </div>
          <div className="sus-card-number">{cns}</div>
          
          <div className="sus-card-field">
            <div className="sus-card-label">Nome do Cidadão</div>
            <div className="sus-card-value">{paciente.nome || 'Paciente'}</div>
          </div>
          
          <div className="sus-card-row">
            <div className="sus-card-field">
              <div className="sus-card-label">Nascimento</div>
              <div className="sus-card-value">{formatDate(paciente.data_nascimento) || '—'}</div>
            </div>
            <div className="sus-card-field">
              <div className="sus-card-label">CPF</div>
              <div className="sus-card-value">{paciente.cpf || '—'}</div>
            </div>
          </div>

          <div className="sus-card-barcode-area">
            <div className="sus-barcode"></div>
            <span style={{color: 'black', fontSize: '0.8rem', marginTop: '8px', fontFamily: 'monospace', fontWeight: 'bold'}}>{cns}</span>
          </div>
        </div>
        <button className="sus-modal-close" onClick={onClose}>Fechar Cartão</button>
      </div>
    </div>
  );
}

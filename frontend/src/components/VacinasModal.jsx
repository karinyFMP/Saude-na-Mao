import React from 'react';

export default function VacinasModal({ onClose }) {
  // Dados de mock
  const vacinas = [
    { id: 1, nome: 'COVID-19 (Pfizer Biontech)', data: '10/05/2023', dose: 'Reforço Bivalente', status: 'Em dia', lote: 'AB1234' },
    { id: 2, nome: 'COVID-19 (AstraZeneca)', data: '15/08/2021', dose: 'Dose 2', status: 'Em dia', lote: 'XYZ987' },
    { id: 3, nome: 'Influenza (Gripe)', data: '20/04/2024', dose: 'Dose Anual', status: 'Em dia', lote: 'INF2024' },
    { id: 4, nome: 'Hepatite B', data: 'Pendência', dose: 'Dose 3', status: 'Atrasada', lote: '-' },
  ];

  return (
    <div className="sus-modal-backdrop" onClick={onClose}>
      <style>{`
        .sus-modal-content {
          width: 100%;
          max-width: 500px;
          background: #f6f8fa;
          border-radius: 20px;
          overflow: hidden;
          animation: modalSlideUp 0.3s ease-out;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          max-height: 85vh;
        }
        .modal-header {
          background: linear-gradient(135deg, #00884A 0%, #10B981 100%);
          color: white;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-title {
          font-weight: 700;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px; height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .close-btn:hover { background: rgba(255,255,255,0.3); }
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        .vacina-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border-left: 4px solid #10B981;
        }
        .vacina-atrasada { border-left-color: #EF4444; }
        .vacina-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .vacina-nome { font-weight: 700; color: #1a202c; }
        .vacina-badge {
          background: #D1FAE5; color: #059669;
          font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600;
        }
        .vacina-badge-atrasada {
          background: #FEE2E2; color: #DC2626;
        }
        .vacina-info {
          font-size: 0.85rem; color: #64748b;
          display: flex; justify-content: space-between;
        }
      `}</style>
      <div className="sus-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Minhas Vacinas
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {vacinas.map(v => (
            <div key={v.id} className={`vacina-card ${v.status === 'Atrasada' ? 'vacina-atrasada' : ''}`}>
              <div className="vacina-header">
                <span className="vacina-nome">{v.nome}</span>
                <span className={`vacina-badge ${v.status === 'Atrasada' ? 'vacina-badge-atrasada' : ''}`}>
                  {v.status}
                </span>
              </div>
              <div className="vacina-info">
                <span>{v.dose}</span>
                <span>{v.data}</span>
              </div>
              <div className="vacina-info" style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                <span>Lote: {v.lote}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

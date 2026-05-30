import React, { useState } from 'react';

export default function ExamesModal({ onClose }) {
  const [downloading, setDownloading] = useState(null);

  const exames = [
    { id: 1, nome: 'Hemograma Completo', data: '12/03/2026', laboratorio: 'Lab Central SUS', status: 'Disponível', tipo: 'Normal' },
    { id: 2, nome: 'Glicemia em Jejum', data: '12/03/2026', laboratorio: 'Lab Central SUS', status: 'Disponível', tipo: 'Atenção' },
    { id: 3, col: 'Colesterol Total', nome: 'Perfil Lipídico', data: '15/10/2025', laboratorio: 'Lab Central SUS', status: 'Disponível', tipo: 'Normal' },
  ];

  const handleDownload = (id) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      alert('Download do laudo concluído!');
    }, 1500);
  };

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
        .modal-header-exames {
          background: linear-gradient(135deg, #FFCD00 0%, #F59E0B 100%);
          color: #002F6C;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-title {
          font-weight: 800;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .close-btn {
          background: rgba(0,0,0,0.1);
          border: none;
          color: #002F6C;
          width: 32px; height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
        }
        .close-btn:hover { background: rgba(0,0,0,0.2); }
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        .exame-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .exame-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .exame-nome { font-weight: 700; color: #1a202c; font-size: 1.05rem; }
        .exame-badge {
          font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 700;
        }
        .badge-normal { background: #D1FAE5; color: #059669; }
        .badge-atencao { background: #FEF3C7; color: #D97706; }
        .exame-info {
          font-size: 0.85rem; color: #64748b;
          margin-bottom: 12px;
        }
        .download-btn {
          width: 100%;
          padding: 10px;
          background: #E8F0FE;
          color: #1351B4;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s;
        }
        .download-btn:hover { background: #D4E5FF; }
      `}</style>
      <div className="sus-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header-exames">
          <div className="modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Resultados de Exames
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {exames.map(ex => (
            <div key={ex.id} className="exame-card">
              <div className="exame-header">
                <span className="exame-nome">{ex.nome}</span>
                <span className={`exame-badge ${ex.tipo === 'Normal' ? 'badge-normal' : 'badge-atencao'}`}>
                  {ex.tipo}
                </span>
              </div>
              <div className="exame-info">
                <div>Coletado em: {ex.data}</div>
                <div>Local: {ex.laboratorio}</div>
              </div>
              <button 
                className="download-btn" 
                onClick={() => handleDownload(ex.id)}
                disabled={downloading === ex.id}
              >
                {downloading === ex.id ? 'Baixando...' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Visualizar Laudo (PDF)
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

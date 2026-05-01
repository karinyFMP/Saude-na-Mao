import React from 'react';

const Perfil = ({ paciente, onBack }) => {
  // Pega apenas o primeiro nome para o círculo do avatar
  const iniciais = paciente?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

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
          padding: 40px 20px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
          position: relative;
        }
        .back-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 12px;
          padding: 8px;
          color: white;
          cursor: pointer;
        }
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
          margin-top: -30px;
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
        }
        .label { font-size: 0.8rem; color: var(--text-muted); display: block; }
        .value { font-size: 1rem; color: var(--text-primary); font-weight: 600; }
        
        .logout-section {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }
        .btn-sair {
          background: #fff5f5;
          color: #ff4d4d;
          border: 1px solid #ffebeb;
          padding: 12px 30px;
          border-radius: 15px;
          font-weight: 700;
          width: 100%;
        }
      `}</style>

      <header className="perfil-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="avatar-large">{iniciais}</div>
        <h2 className="perfil-nome">{paciente?.nome}</h2>
        <p className="perfil-email">{paciente?.email}</p>
      </header>

      <main className="perfil-content">
        <div className="info-card">
          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <span className="label">Cartão Nacional de Saúde (CNS)</span>
              <span className="value">{paciente?.cartao_sus || '000 0000 0000 0000'}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <span className="label">Unidade de Saúde</span>
              <span className="value">{paciente?.unidade || 'Unidade Básica Central'}</span>
            </div>
          </div>
        </div>

        <div className="logout-section">
          <button className="btn-sair" onClick={() => window.location.reload()}>
            Finalizar Sessão
          </button>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
import { useState, useEffect } from 'react';
import { getDashboard, cancelarConsulta } from '../services/api';
import './Dashboard.css';

export default function Dashboard({ paciente, refreshKey, onNavigate, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [paciente.id, refreshKey]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await getDashboard(paciente.id);
      setData(result);
      setErro('');
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (consultaId) => {
    setCancellingId(consultaId);
    try {
      await cancelarConsulta(consultaId);
      showToast('Consulta cancelada com sucesso!', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getStatusColor = (status) => {
    const map = { Confirmada: 'confirmed', Pendente: 'pending', Realizada: 'done', Cancelada: 'cancelled' };
    return map[status] || 'pending';
  };

  const getStatusLabel = (status) => {
    const map = { Confirmada: '✓ Confirmada', Pendente: '◷ Pendente', Realizada: '✓ Realizada', Cancelada: '✕ Cancelada' };
    return map[status] || status;
  };

  const formatDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };



  const firstName = data?.paciente?.nome?.split(' ')[0] || 'Paciente';

  const upcomingConsultas = data?.consultas?.filter(
    (c) => c.status === 'Confirmada' || c.status === 'Pendente'
  ) || [];

  const pastConsultas = data?.consultas?.filter(
    (c) => c.status === 'Realizada' || c.status === 'Cancelada'
  ) || [];

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner" />
        <p>Carregando seus dados...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="dash-error">
        <h2>Ops! Algo deu errado.</h2>
        <p>{erro}</p>
        <button onClick={loadDashboard} className="dash-retry-btn">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Toast */}
      {toast && (
        <div className={`dash-toast dash-toast-${toast.type} toast-enter`} role="alert">
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-bg">
          <div className="dash-header-circle dash-header-circle-1" />
          <div className="dash-header-circle dash-header-circle-2" />
        </div>
        <div className="dash-header-content">
          <div className="dash-header-top">
            <div>
              <p className="dash-greeting">Bem-vindo(a),</p>
              <h1 className="dash-user-name">{firstName} 👋</h1>
            </div>
            <button onClick={onLogout} className="dash-logout-btn" aria-label="Sair">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          <div className="dash-patient-card">
            <div className="dash-patient-avatar">{data?.paciente?.nome?.charAt(0) || 'P'}</div>
            <div className="dash-patient-info">
              <p className="dash-patient-name">{data?.paciente?.nome}</p>
              <p className="dash-patient-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                CNS: {data?.paciente?.cartao_sus || '—'}
              </p>
              <p className="dash-patient-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {data?.paciente?.unidade || '—'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="dash-main">
        {/* Quick Services */}
        <section className="dash-section dash-services-section">
          <h2 className="dash-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Serviços Rápidos
          </h2>
          <div className="dash-services-grid">
            <button className="dash-service-btn" onClick={() => onNavigate('agendamento')} id="btn-agendar">
              <div className="dash-service-icon dash-service-icon-blue">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
              </div>
              <span>Agendar Consulta</span>
            </button>
            <button className="dash-service-btn" onClick={() => onNavigate('protocolos')} id="btn-protocolos">
              <div className="dash-service-icon dash-service-icon-purple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span>Protocolos</span>
            </button>
            <button className="dash-service-btn" onClick={() => onNavigate('unidades')} id="btn-unidades">
              <div className="dash-service-icon dash-service-icon-teal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span>Unidades de Saúde</span>
            </button>
          </div>
        </section>

        {/* Upcoming */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Próximas Consultas
            </h2>
            <span className="dash-badge">{upcomingConsultas.length}</span>
          </div>
          {upcomingConsultas.length === 0 ? (
            <div className="dash-empty">
              <p>Nenhuma consulta agendada</p>
              <button className="dash-empty-action" onClick={() => onNavigate('agendamento')}>Agendar agora</button>
            </div>
          ) : (
            <div className="dash-cards-list">
              {upcomingConsultas.map((c, i) => (
                <div key={c.id} className={`dash-card dash-card-${getStatusColor(c.status)}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="dash-card-body">
                    <div className="dash-card-top">
                      <div>
                        <h3 className="dash-card-title">{c.especialidade}</h3>
                        <p className="dash-card-doctor">{c.medico}</p>
                      </div>
                      <span className={`dash-status dash-status-${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                    </div>
                    <div className="dash-card-details">
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formatDate(c.data)}</span>
                      </div>
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{c.horario}</span>
                      </div>
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{c.unidade}</span>
                      </div>
                    </div>
                    {(c.status === 'Pendente' || c.status === 'Confirmada') && (
                      <button className="dash-card-cancel" onClick={() => handleCancelar(c.id)} disabled={cancellingId === c.id}>
                        {cancellingId === c.id ? 'Cancelando...' : 'Cancelar consulta'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Protocol Summary */}
        {data?.protocolos?.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Protocolos
              </h2>
              <button className="dash-see-all" onClick={() => onNavigate('protocolos')}>Ver todos →</button>
            </div>
            <div className="dash-cards-list">
              {data.protocolos.slice(0, 2).map((p, i) => (
                <div key={p.id} className="dash-card dash-card-protocol" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="dash-card-body">
                    <div className="dash-card-top">
                      <div>
                        <h3 className="dash-card-title">{p.especialidade}</h3>
                        <p className="dash-card-doctor">{p.descricao}</p>
                      </div>
                      <span className={`dash-status dash-status-${
                        p.status === 'Aprovado' ? 'confirmed' :
                        p.status === 'Concluído' ? 'done' :
                        p.status === 'Negado' ? 'cancelled' : 'pending'
                      }`}>{p.status}</span>
                    </div>
                    <div className="dash-card-details">
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>Pedido em {formatDate(p.data_pedido)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {pastConsultas.length > 0 && (
          <section className="dash-section">
            <h2 className="dash-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Histórico
            </h2>
            <div className="dash-cards-list">
              {pastConsultas.map((c, i) => (
                <div key={c.id} className={`dash-card dash-card-${getStatusColor(c.status)} dash-card-past`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="dash-card-body">
                    <div className="dash-card-top">
                      <div>
                        <h3 className="dash-card-title">{c.especialidade}</h3>
                        <p className="dash-card-doctor">{c.medico}</p>
                      </div>
                      <span className={`dash-status dash-status-${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                    </div>
                    <div className="dash-card-details">
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formatDate(c.data)}</span>
                      </div>
                      <div className="dash-card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{c.horario}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="dash-bottom-nav" aria-label="Navegação principal">
        <button className="dash-nav-item dash-nav-item-active" onClick={() => onNavigate('dashboard')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Início</span>
        </button>
        <button className="dash-nav-item" onClick={() => onNavigate('agendamento')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Agendar</span>
        </button>
        <button className="dash-nav-item" onClick={() => onNavigate('protocolos')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>Protocolos</span>
        </button>
        <button className="dash-nav-item" onClick={() => onNavigate('unidades')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>UBS</span>
        </button>
      </nav>
    </div>
  );
}

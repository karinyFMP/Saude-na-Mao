import { useState, useEffect } from 'react';
import { getDashboard, cancelarConsulta } from '../services/api';
import './Dashboard.css';
import CartaoSUSModal from './CartaoSUSModal';


export default function Dashboard({ paciente, refreshKey, onNavigate, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'cartao', 'exames', null

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
      showToast('Agendamento cancelado com sucesso.', 'error');
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

  const formatDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const renderTimeline = (status) => {
    if (status === 'Cancelada') {
      return (
        <div className="dash-timeline-cancelada">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          Consulta Cancelada
        </div>
      );
    }

    const isPending = status === 'Pendente' || status === 'Confirmada' || status === 'Realizada';
    const isConfirmed = status === 'Confirmada' || status === 'Realizada';
    const isDone = status === 'Realizada';

    return (
      <div className="dash-timeline">
        <div className={`timeline-step ${isPending ? 'active' : ''}`}>
          <div className="timeline-circle"></div>
          <span>Solicitado</span>
        </div>
        <div className={`timeline-line ${isConfirmed ? 'active' : ''}`}></div>
        <div className={`timeline-step ${isConfirmed ? 'active' : ''}`}>
          <div className="timeline-circle"></div>
          <span>Confirmado</span>
        </div>
        <div className={`timeline-line ${isDone ? 'active' : ''}`}></div>
        <div className={`timeline-step ${isDone ? 'active' : ''}`}>
          <div className="timeline-circle"></div>
          <span>Realizado</span>
        </div>
      </div>
    );
  };

  const firstName = paciente?.nome?.split(' ')[0] || 'Paciente';

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
      {/* Toast Notification */}
      {toast && (
        <div className={`dash-toast dash-toast-${toast.type} toast-enter`} role="alert">
          {toast.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          {toast.type === 'info' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'cartao' && <CartaoSUSModal paciente={paciente} onClose={() => setActiveModal(null)} />}
      

      {/* Modern Header */}
      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner">
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px' }}>Sua saúde digital simples e acessível</span>
          </div>
          <div className="dash-header-right">
            <div className="dash-avatar-mini" onClick={() => onNavigate('perfil')}>
              {paciente?.nome?.charAt(0) || 'P'}
            </div>
          </div>
        </div>
      </header>

      {/* Patient Info Bar */}
      <div className="dash-patient-bar">
        <div className="dash-patient-bar-content">
          <div className="dash-patient-bar-main">
            <p className="dash-patient-bar-greeting">Olá, <strong>{firstName}</strong></p>
            <div className="dash-patient-bar-details">
              <span>CNS: {paciente?.cartao_sus || '—'}</span>
              <span className="dot-separator">•</span>
              <span>UBS: {paciente?.unidade || 'UBS Central'}</span>
            </div>
          </div>
          <button className="dash-logout-mini" onClick={onLogout} aria-label="Sair">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      <main className="dash-main">
        {/* Quick Services Grid (5 items) */}
        <section className="dash-section dash-services-section">
          <div className="dash-services-dense-grid">
            <button className="dash-service-card-new" onClick={() => onNavigate('agendamento')}>
              <div className="service-card-icon bg-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="service-card-info">
                <h4>Agendar Consulta</h4>
                <p>Marque consultas com o Clínico Geral</p>
              </div>
              <div className="service-card-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>

            <button className="dash-service-card-new" onClick={() => setActiveModal('cartao')}>
              <div className="service-card-icon bg-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
              </div>
              <div className="service-card-info">
                <h4>Cartão SUS</h4>
                <p>Veja seu cartão de saúde digital</p>
              </div>
              <div className="service-card-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>

            <button className="dash-service-card-new" onClick={() => onNavigate('protocolos')}>
              <div className="service-card-icon bg-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="service-card-info">
                <h4>Protocolos</h4>
                <p>Acompanhe seus encaminhamentos</p>
              </div>
              <div className="service-card-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>

            <button className="dash-service-card-new" onClick={() => onNavigate('unidades')}>
              <div className="service-card-icon bg-teal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div className="service-card-info">
                <h4>Unidades</h4>
                <p>Encontre postos de atendimento</p>
              </div>
              <div className="service-card-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>
          </div>
        </section>

        {/* Upcoming Consultas */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">
              Próximas Consultas
            </h2>
          </div>
          {upcomingConsultas.length === 0 ? (
            <div className="dash-empty">
              <p>Você não tem consultas agendadas</p>
              <button className="dash-empty-action" onClick={() => onNavigate('agendamento')}>Agendar Nova</button>
            </div>
          ) : (
            <div className="dash-cards-list">
              {upcomingConsultas.map((c, i) => (
                <div key={c.id} className="dash-card">
                  <div className="dash-card-body">
                    <div className="dash-card-header-new">
                      <h3 className="dash-card-title">{c.especialidade}</h3>
                      <span className={`dash-badge-status status-${getStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <p className="dash-card-doctor">Dr(a). {c.medico}</p>
                    
                    {renderTimeline(c.status)}

                    <div className="dash-card-details">
                      <div className="dash-card-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formatDate(c.data)} às {c.horario}</span>
                      </div>
                      <div className="dash-card-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{c.unidade}</span>
                      </div>
                    </div>
                    
                    {c.status === 'Pendente' && (
                      <button className="dash-card-cancel" onClick={() => handleCancelar(c.id)} disabled={cancellingId === c.id}>
                        {cancellingId === c.id ? 'Cancelando...' : 'Cancelar Agendamento'}
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
              <h2 className="dash-section-title">Meus Protocolos</h2>
              <button className="dash-see-all" onClick={() => onNavigate('protocolos')}>Ver todos</button>
            </div>
            <div className="dash-cards-list">
              {data.protocolos.slice(0, 2).map((p, i) => (
                <div key={p.id} className="dash-card">
                  <div className="dash-card-body">
                    <div className="dash-card-header-new">
                      <h3 className="dash-card-title">{p.especialidade}</h3>
                      <span className={`dash-badge-status status-${
                        p.status === 'Aprovado' ? 'confirmed' :
                        p.status === 'Concluído' ? 'done' :
                        p.status === 'Negado' ? 'cancelled' : 'pending'
                      }`}>{p.status}</span>
                    </div>
                    <p className="dash-card-doctor">{p.descricao}</p>
                    <div className="dash-card-details" style={{ marginTop: '12px' }}>
                      <div className="dash-card-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>Pedido em: {formatDate(p.data_pedido)}</span>
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
            <h2 className="dash-section-title">Histórico de Consultas</h2>
            <div className="dash-cards-list">
              {pastConsultas.map((c, i) => (
                <div key={c.id} className="dash-card dash-card-past">
                  <div className="dash-card-body">
                    <div className="dash-card-header-new">
                      <h3 className="dash-card-title">{c.especialidade}</h3>
                      <span className={`dash-badge-status status-${getStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <p className="dash-card-doctor">Dr(a). {c.medico}</p>
                    
                    {renderTimeline(c.status)}

                    <div className="dash-card-details" style={{ marginTop: '12px' }}>
                      <div className="dash-card-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formatDate(c.data)}</span>
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
        <button className="dash-nav-item" onClick={() => onNavigate('perfil')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

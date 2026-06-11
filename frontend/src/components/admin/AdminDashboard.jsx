import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, RefreshCw, Search, Filter,
  CheckCircle2, Clock, XCircle, CheckCheck,
  Loader2, FileX, AlertTriangle, LayoutDashboard, FileSearch,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getAdminProtocolos } from '../../services/adminApi';
import './AdminDashboard.css';

// --- Helpers ---
const STATUS_OPTIONS = ['Em análise', 'Aprovado', 'Negado', 'Concluído'];
const FILTER_STATUS = ['Todos', ...STATUS_OPTIONS];

const STATUS_META = {
  'Em análise': { cls: 'em-analise', icon: <Clock size={11} /> },
  'Aprovado':   { cls: 'aprovado',   icon: <CheckCircle2 size={11} /> },
  'Negado':     { cls: 'negado',     icon: <XCircle size={11} /> },
  'Concluído':  { cls: 'concluido',  icon: <CheckCheck size={11} /> },
};

const STAT_ICONS = {
  total:      { icon: <LayoutDashboard size={20} />, bgClass: 'bg-blue' },
  emAnalise:  { icon: <Clock size={20} />,           bgClass: 'bg-purple' },
  aprovados:  { icon: <CheckCircle2 size={20} />,    bgClass: 'bg-green' },
  negados:    { icon: <XCircle size={20} />,         bgClass: 'bg-red' },
  concluidos: { icon: <CheckCheck size={20} />,      bgClass: 'bg-teal' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { cls: '', icon: null };
  return (
    <span className={`admin-status-badge ${meta.cls}`}>
      {meta.icon}
      {status}
    </span>
  );
}

// ---- Main Component ----
export default function AdminDashboard() {
  const { servidor, logoutServidor } = useAdminAuth();
  const navigate = useNavigate();

  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPaciente, setFilterPaciente] = useState('');

  const fetchProtocolos = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setLoadingError(false);
    try {
      const filtros = {};
      if (filterStatus !== 'Todos') filtros.status = filterStatus;
      if (filterPaciente.trim()) filtros.paciente = filterPaciente.trim();
      const data = await getAdminProtocolos(filtros);
      setProtocolos(data);
    } catch (err) {
      setLoadingError(true);
      toast.error(err?.response?.data?.error || 'Erro ao carregar protocolos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, filterPaciente]);

  useEffect(() => { fetchProtocolos(true); }, []); // eslint-disable-line

  const handleSearch = (e) => { e.preventDefault(); fetchProtocolos(true); };

  const handleLogout = () => {
    logoutServidor();
    toast.info('Sessão encerrada.');
    navigate('/admin/login', { replace: true });
  };

  const stats = {
    total:      protocolos.length,
    emAnalise:  protocolos.filter(p => p.status === 'Em análise').length,
    aprovados:  protocolos.filter(p => p.status === 'Aprovado').length,
    negados:    protocolos.filter(p => p.status === 'Negado').length,
    concluidos: protocolos.filter(p => p.status === 'Concluído').length,
  };

  const STAT_CARDS = [
    { key: 'total',      label: 'Total',       value: stats.total,      sub: 'protocolos' },
    { key: 'emAnalise',  label: 'Em Análise',  value: stats.emAnalise,  sub: 'pendentes' },
    { key: 'aprovados',  label: 'Aprovados',   value: stats.aprovados,  sub: 'deferidos' },
    { key: 'negados',    label: 'Negados',     value: stats.negados,    sub: 'indeferidos' },
    { key: 'concluidos', label: 'Concluídos',  value: stats.concluidos, sub: 'finalizados' },
  ];

  return (
    <div className="admin-dashboard">

      {/* Modern Header (Identical to patient's Dashboard) */}
      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner">
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px' }}>Painel Administrativo Restrito</span>
          </div>
          <div className="dash-header-right">
            {servidor && (
              <div className="dash-avatar-mini" title={servidor.nome}>
                {servidor.nome.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Info Bar (Similar to dash-patient-bar) */}
      <div className="dash-patient-bar">
        <div className="dash-patient-bar-content">
          <div className="dash-patient-bar-main">
            <p className="dash-patient-bar-greeting">Olá, <strong>{servidor?.nome?.split(' ')[0] || 'Servidor'}</strong></p>
            <div className="dash-patient-bar-details">
              <span>Cargo: {servidor?.cargo || 'Administrador'}</span>
              <span className="dot-separator">•</span>
              <span>Acesso Restrito</span>
            </div>
          </div>
          <button className="dash-logout-mini" onClick={handleLogout} aria-label="Sair">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="admin-main">

        {/* Stats (Using same structure as Patient's Services Grid, but 5 in a row) */}
        <section className="dash-section dash-services-section">
          <div className="dash-services-dense-grid admin-stats-grid">
            {STAT_CARDS.map(s => (
              <div key={s.key} className="dash-service-card-new" style={{ cursor: 'default' }}>
                <div className={`service-card-icon ${STAT_ICONS[s.key].bgClass}`}>
                  {STAT_ICONS[s.key].icon}
                </div>
                <div className="service-card-info">
                  <h4>{s.label}</h4>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)', margin: '4px 0 0 0' }}>
                    {loading ? '—' : s.value}
                  </p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section */}
        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Protocolos de Encaminhamento</span>
            <span className="admin-section-count">
              {loading ? '...' : `${protocolos.length} registro(s)`}
            </span>
          </div>

          {/* Filters */}
          <form className="admin-filters" onSubmit={handleSearch}>
            <div className="admin-filter-field">
              <label htmlFor="admin-filter-paciente">Buscar paciente</label>
              <div className="admin-filter-input-wrap">
                <Search size={14} className="admin-filter-icon" />
                <input
                  id="admin-filter-paciente"
                  type="text"
                  placeholder="Nome do paciente..."
                  value={filterPaciente}
                  onChange={e => setFilterPaciente(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-filter-field" style={{ maxWidth: 220 }}>
              <label htmlFor="admin-filter-status">Filtrar por status</label>
              <div className="admin-filter-input-wrap">
                <Filter size={14} className="admin-filter-icon" />
                <select
                  id="admin-filter-status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  {FILTER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button
              id="admin-refresh-btn"
              type="submit"
              className={`admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw size={14} />
              {refreshing ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Table */}
          <div className="admin-table-wrapper">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>Especialidade</th>
                    <th>Descrição</th>
                    <th>Data Pedido</th>
                    <th>Data Resposta</th>
                    <th>Status Atual</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="admin-state-row">
                      <td colSpan={8}>
                        <div className="admin-loading-state">
                          <Loader2 size={36} />
                          <p>Carregando protocolos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : loadingError ? (
                    <tr className="admin-state-row">
                      <td colSpan={8}>
                        <div className="admin-error-state">
                          <AlertTriangle size={36} />
                          <p>Erro ao carregar dados. Tente novamente.</p>
                        </div>
                      </td>
                    </tr>
                  ) : protocolos.length === 0 ? (
                    <tr className="admin-state-row">
                      <td colSpan={8}>
                        <div className="admin-empty-state">
                          <FileX size={36} />
                          <p>Nenhum protocolo encontrado para os filtros selecionados.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    protocolos.map(p => {
                      return (
                        <tr key={p.id}>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            #{p.id}
                          </td>
                          <td>
                            <div className="admin-patient-cell">
                              <span className="admin-patient-name">{p.paciente_nome}</span>
                              <span className="admin-patient-cpf">{p.paciente_cpf}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {p.especialidade}
                          </td>
                          <td style={{ maxWidth: 200, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {p.descricao || '—'}
                          </td>
                          <td>{formatDate(p.data_pedido)}</td>
                          <td>{formatDate(p.data_resposta)}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <div className="admin-action-cell">
                              <button
                                className="admin-action-icon-btn"
                                onClick={() => navigate(`/admin/protocolo/${p.id}`)}
                                title="Analisar Protocolo"
                              >
                                <FileSearch size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

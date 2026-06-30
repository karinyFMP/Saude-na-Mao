import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, RefreshCw, Search, Filter,
  CheckCircle2, Clock, XCircle, CheckCheck,
  Loader2, FileX, AlertTriangle, LayoutDashboard, FileSearch,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuditorAuth } from '../../contexts/AuditorAuthContext';
import { getAuditorProtocolos } from '../../services/auditorApi';
import './AuditorDashboard.css';

// --- Helpers ---
const STATUS_OPTIONS = ['Em análise', 'Autorizado', 'Executado', 'Negado', 'Concluído'];
const FILTER_STATUS = ['Todos', ...STATUS_OPTIONS];

const STATUS_META = {
  'Em análise': { cls: 'em-analise', icon: <Clock size={11} /> },
  'Autorizado':  { cls: 'autorizado', icon: <CheckCircle2 size={11} /> },
  'Executado':   { cls: 'executado',  icon: <CheckCheck size={11} /> },
  'Negado':      { cls: 'negado',     icon: <XCircle size={11} /> },
  'Concluído':   { cls: 'concluido',  icon: <CheckCheck size={11} /> },
};

const STAT_ICONS = {
  total:        { icon: <LayoutDashboard size={20} />, color: 'blue' },
  emAnalise:    { icon: <Clock size={20} />,           color: 'purple' },
  autorizados:  { icon: <CheckCircle2 size={20} />,    color: 'green' },
  executados:   { icon: <CheckCheck size={20} />,      color: 'teal' },
  negados:      { icon: <XCircle size={20} />,         color: 'red' },
  concluidos:   { icon: <CheckCheck size={20} />,      color: 'blue' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { cls: '', icon: null };
  return (
    <span className={`auditor-status-badge ${meta.cls}`}>
      {meta.icon}
      {status}
    </span>
  );
}

// ---- Main Component ----
export default function AuditorDashboard() {
  const { servidor, logoutServidor } = useAuditorAuth();
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
      const data = await getAuditorProtocolos(filtros);
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
    navigate('/auditor/login', { replace: true });
  };

  const stats = {
    total:       protocolos.length,
    emAnalise:   protocolos.filter(p => p.status === 'Em análise').length,
    autorizados: protocolos.filter(p => p.status === 'Autorizado').length,
    executados:  protocolos.filter(p => p.status === 'Executado').length,
    negados:     protocolos.filter(p => p.status === 'Negado').length,
    concluidos:  protocolos.filter(p => p.status === 'Concluído').length,
  };

  const STAT_CARDS = [
    { key: 'total',       label: 'Total',        value: stats.total,       sub: 'protocolos' },
    { key: 'emAnalise',   label: 'Em Análise',   value: stats.emAnalise,   sub: 'pendentes' },
    { key: 'autorizados', label: 'Autorizados',   value: stats.autorizados, sub: 'deferidos' },
    { key: 'executados',  label: 'Executados',    value: stats.executados,  sub: 'realizados' },
    { key: 'negados',     label: 'Negados',       value: stats.negados,     sub: 'indeferidos' },
    { key: 'concluidos',  label: 'Concluídos',    value: stats.concluidos,  sub: 'finalizados' },
  ];

  return (
    <div className="auditor-dashboard">

      {/* Modern Header (Identical to patient's Dashboard) */}
      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner">
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px' }}>Painel de Auditoria Restrito</span>
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
              <span>Cargo: {servidor?.cargo || 'Auditor'}</span>
            </div>
          </div>
          <button className="dash-logout-mini" onClick={handleLogout} aria-label="Sair">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="auditor-main">

        {/* Stats */}
        <section className="auditor-stats-grid-new" aria-label="Resumo de protocolos">
          {STAT_CARDS.map(s => {
            const statMeta = STAT_ICONS[s.key];
            return (
              <div key={s.key} className={`auditor-stat-card auditor-stat-card--${statMeta.color}`}>
                <div className="auditor-stat-icon">
                  {statMeta.icon}
                </div>
                <div className="auditor-stat-info">
                  <span className="auditor-stat-value">{loading ? '—' : s.value}</span>
                  <span className="auditor-stat-label">{s.label}</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Section */}
        <div className="auditor-section">
          <div className="auditor-section-header">
            <span className="auditor-section-title">Protocolos de Encaminhamento</span>
            <span className="auditor-section-count">
              {loading ? '...' : `${protocolos.length} registro(s)`}
            </span>
          </div>

          {/* Filters */}
          <form className="auditor-filters" onSubmit={handleSearch}>
            <div className="auditor-filter-field">
              <label htmlFor="auditor-filter-paciente">Buscar paciente</label>
              <div className="auditor-filter-input-wrap">
                <Search size={14} className="auditor-filter-icon" />
                <input
                  id="auditor-filter-paciente"
                  type="text"
                  placeholder="Nome do paciente..."
                  value={filterPaciente}
                  onChange={e => setFilterPaciente(e.target.value)}
                />
              </div>
            </div>

            <div className="auditor-filter-field" style={{ maxWidth: 220 }}>
              <label htmlFor="auditor-filter-status">Filtrar por status</label>
              <div className="auditor-filter-input-wrap">
                <Filter size={14} className="auditor-filter-icon" />
                <select
                  id="auditor-filter-status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  {FILTER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button
              id="auditor-refresh-btn"
              type="submit"
              className={`auditor-refresh-btn ${refreshing ? 'spinning' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw size={14} />
              {refreshing ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Table */}
          <div className="auditor-table-wrapper">
            <div className="auditor-table-scroll">
              <table className="auditor-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>Especialidade</th>
                    <th>Data Pedido</th>
                    <th>Data Resposta</th>
                    <th>Status Atual</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="auditor-state-row">
                      <td colSpan={7}>
                        <div className="auditor-loading-state">
                          <Loader2 size={36} />
                          <p>Carregando protocolos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : loadingError ? (
                    <tr className="auditor-state-row">
                      <td colSpan={7}>
                        <div className="auditor-error-state">
                          <AlertTriangle size={36} />
                          <p>Erro ao carregar dados. Tente novamente.</p>
                        </div>
                      </td>
                    </tr>
                  ) : protocolos.length === 0 ? (
                    <tr className="auditor-state-row">
                      <td colSpan={7}>
                        <div className="auditor-empty-state">
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
                            <div className="auditor-patient-cell">
                              <span className="auditor-patient-name">{p.paciente_nome}</span>
                              <span className="auditor-patient-cpf">{p.paciente_cpf}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {p.especialidade}
                          </td>
                          <td>{formatDate(p.data_pedido)}</td>
                          <td>{formatDate(p.data_resposta)}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <div className="auditor-action-cell">
                              <button
                                className="auditor-action-icon-btn"
                                onClick={() => navigate(`/auditor/protocolo/${p.id}`)}
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

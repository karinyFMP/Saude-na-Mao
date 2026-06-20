import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, LogOut, Plus, ClipboardList, Clock,
  CheckCircle2, XCircle, CheckCheck, LayoutDashboard,
  FileSearch, RefreshCw, Loader2, FileX, AlertTriangle,
  ChevronRight, User, Shield,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useMedicoAuth } from '../../contexts/MedicoAuthContext';
import { getMeusProtocolos } from '../../services/medicoApi';
import FormularioProtocolo from './FormularioProtocolo';
import './PainelMedico.css';

// ============================================================
// HELPERS
// ============================================================

const STATUS_META = {
  'Em análise': { cls: 'em-analise', Icon: Clock },
  'Aprovado':   { cls: 'aprovado',   Icon: CheckCircle2 },
  'Negado':     { cls: 'negado',     Icon: XCircle },
  'Concluído':  { cls: 'concluido',  Icon: CheckCheck },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { cls: '', Icon: Clock };
  return (
    <span className={`pm-status-badge pm-status-badge--${meta.cls}`}>
      <meta.Icon size={11} />
      {status}
    </span>
  );
}

// ============================================================
// SUB-COMPONENTE: Card de estatísticas
// ============================================================
function StatCard({ icon: Icon, label, value, colorClass, loading }) {
  return (
    <div className={`pm-stat-card pm-stat-card--${colorClass}`}>
      <div className="pm-stat-icon">
        <Icon size={20} />
      </div>
      <div className="pm-stat-info">
        <span className="pm-stat-value">{loading ? '—' : value}</span>
        <span className="pm-stat-label">{label}</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL — PainelMedico
// ============================================================

/**
 * PainelMedico
 *
 * REGRA CLÍNICO GERAL vs ESPECIALISTA:
 *   - medico.perfil === 'Clínico Geral'  → pode criar todos os tipos de protocolo
 *   - medico.perfil === 'Especialista'   → tipos filtrados no FormularioProtocolo
 *   A distinção visual (badge de perfil) é exibida no header.
 *
 * REGRA AUDITOR:
 *   Protocolos com status "Em análise" aguardam avaliação do Auditor.
 *   O médico NÃO pode alterar status — isso é exclusivo do Auditor.
 */
export default function PainelMedico() {
  const { medico, logoutMedico } = useMedicoAuth();
  const navigate = useNavigate();

  const [view, setView]               = useState('dashboard'); // 'dashboard' | 'novo-protocolo'
  const [protocolos, setProtocolos]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchProtocolos = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setLoadingError(false);
    try {
      const data = await getMeusProtocolos();
      setProtocolos(data);
    } catch (err) {
      setLoadingError(true);
      toast.error(err?.response?.data?.error || 'Erro ao carregar protocolos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProtocolos(true); }, []); // eslint-disable-line

  const handleLogout = () => {
    logoutMedico();
    toast.info('Sessão encerrada.');
    navigate('/medico/login', { replace: true });
  };

  const handleProtocoloCriado = () => {
    setView('dashboard');
    fetchProtocolos(false);
  };

  // Estatísticas derivadas
  const stats = {
    total:      protocolos.length,
    emAnalise:  protocolos.filter(p => p.status === 'Em análise').length,
    aprovados:  protocolos.filter(p => p.status === 'Aprovado').length,
    negados:    protocolos.filter(p => p.status === 'Negado').length,
    concluidos: protocolos.filter(p => p.status === 'Concluído').length,
  };

  const STAT_CARDS = [
    { icon: LayoutDashboard, label: 'Total',       value: stats.total,      color: 'blue' },
    { icon: Clock,           label: 'Em Análise',  value: stats.emAnalise,  color: 'purple' },
    { icon: CheckCircle2,    label: 'Aprovados',   value: stats.aprovados,  color: 'green' },
    { icon: XCircle,         label: 'Negados',     value: stats.negados,    color: 'red' },
    { icon: CheckCheck,      label: 'Concluídos',  value: stats.concluidos, color: 'teal' },
  ];

  // ============================================================
  // RENDER — Vista "Novo Protocolo"
  // ============================================================
  if (view === 'novo-protocolo') {
    return (
      <div className="pm-wrapper">
        <PainelHeader medico={medico} onLogout={handleLogout} />

        <main className="pm-main">
          <FormularioProtocolo
            medico={medico}
            onSuccess={handleProtocoloCriado}
            onCancel={() => setView('dashboard')}
          />
        </main>
      </div>
    );
  }

  // ============================================================
  // RENDER — Vista "Dashboard"
  // ============================================================
  return (
    <div className="pm-wrapper">
      <PainelHeader medico={medico} onLogout={handleLogout} />

      <main className="pm-main">

        {/* --- Stats --- */}
        <section className="pm-stats-grid" aria-label="Resumo de protocolos">
          {STAT_CARDS.map(c => (
            <StatCard
              key={c.label}
              icon={c.icon}
              label={c.label}
              value={c.value}
              colorClass={c.color}
              loading={loading}
            />
          ))}
        </section>

        {/* --- Seção de Protocolos --- */}
        <section className="pm-section" aria-label="Meus protocolos">
          <div className="pm-section-header">
            <div>
              <h2 className="pm-section-title">Meus Protocolos</h2>
              <p className="pm-section-subtitle">
                {/* REGRA AUDITOR: informar que "Em análise" aguarda avaliação */}
                Protocolos "Em análise" aguardam avaliação do Auditor
              </p>
            </div>
            <div className="pm-section-actions">
              <button
                id="btn-novo-protocolo"
                className="pm-btn pm-btn--primary"
                onClick={() => setView('novo-protocolo')}
              >
                <Plus size={16} />
                Novo Protocolo
              </button>
            </div>
          </div>

          {/* Tabela de Protocolos */}
          <div className="pm-table-wrapper">
            <div className="pm-table-scroll">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>Tipo</th>
                    <th>Especialidade</th>
                    <th>Prioridade</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="pm-state-row">
                      <td colSpan={8}>
                        <div className="pm-state-content">
                          <Loader2 size={32} className="pm-spinner-icon" />
                          <p>Carregando protocolos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : loadingError ? (
                    <tr className="pm-state-row">
                      <td colSpan={8}>
                        <div className="pm-state-content pm-state-content--error">
                          <AlertTriangle size={32} />
                          <p>Erro ao carregar dados. Tente novamente.</p>
                        </div>
                      </td>
                    </tr>
                  ) : protocolos.length === 0 ? (
                    <tr className="pm-state-row">
                      <td colSpan={8}>
                        <div className="pm-state-content pm-state-content--empty">
                          <FileX size={32} />
                          <p>Nenhum protocolo criado ainda.</p>
                          <button
                            className="pm-btn pm-btn--primary pm-btn--sm"
                            onClick={() => setView('novo-protocolo')}
                          >
                            <Plus size={14} /> Criar primeiro protocolo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    protocolos.map(p => (
                      <tr key={p.id}>
                        <td className="pm-td-id">#{p.id}</td>
                        <td>
                          <div className="pm-patient-cell">
                            <span className="pm-patient-name">{p.paciente_nome}</span>
                            <span className="pm-patient-cpf">{p.paciente_cpf}</span>
                          </div>
                        </td>
                        <td className="pm-td-tipo">{p.tipo_protocolo || p.tipo}</td>
                        <td>{p.especialidade || '—'}</td>
                        <td>
                          <span className={`pm-prioridade pm-prioridade--${(p.prioridade || 'eletiva').toLowerCase()}`}>
                            {p.prioridade || 'Eletiva'}
                          </span>
                        </td>
                        <td>{formatDate(p.data_pedido)}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>
                          <button
                            className="pm-action-btn"
                            title="Ver detalhes"
                            onClick={() => navigate(`/medico/protocolo/${p.id}`)}
                          >
                            <FileSearch size={16} />
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTE: Header reutilizável
// ============================================================

/**
 * PainelHeader
 *
 * REGRA CLÍNICO GERAL / ESPECIALISTA:
 *   O badge de perfil diferencia visualmente os dois tipos de médico.
 *   O Clínico Geral é marcado em azul; o Especialista em roxo.
 */
function PainelHeader({ medico, onLogout, children }) {
  const isEspecialista = medico?.perfil === 'Especialista';

  return (
    <header className="pm-header">
      <div className="pm-header-inner">

        {/* Grupo esquerdo: Logo + botão de voltar (se houver) */}
        <div className="pm-header-left-group">
          <div className="pm-header-brand">
            <Stethoscope size={22} className="pm-header-brand-icon" />
            <div>
              <h1 className="pm-header-title">Saúde na Mão</h1>
              <span className="pm-header-subtitle">Painel do Médico</span>
            </div>
          </div>

          {/* Botão de voltar — renderizado à esquerda, com gap do logo */}
          {children}
        </div>

        {/* Grupo direito: info do médico + logout */}
        <div className="pm-header-user">
          {medico && (
            <>
              <div className="pm-header-user-info">
                <span className="pm-header-user-name">
                  Dr(a). {medico.nome?.split(' ')[0]}
                </span>
                {/* REGRA CLÍNICO / ESPECIALISTA — badge de perfil */}
                <span className={`pm-perfil-badge ${isEspecialista ? 'pm-perfil-badge--especialista' : 'pm-perfil-badge--clinico'}`}>
                  {isEspecialista ? <Shield size={11} /> : <User size={11} />}
                  {medico.perfil || 'Clínico Geral'}
                </span>
              </div>
              <div className="pm-header-avatar">
                {medico.nome?.charAt(0).toUpperCase()}
              </div>
            </>
          )}
          <button
            id="btn-logout-medico"
            className="pm-logout-btn"
            onClick={onLogout}
            title="Sair"
            aria-label="Sair do sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}


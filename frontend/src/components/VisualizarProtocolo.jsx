import { useState } from 'react';
import './VisualizarProtocolo.css';

// ----------------------------------------------------------------
// Componente: VisualizarProtocolo
// Exibe todos os detalhes de um protocolo médico de forma clara e
// organizada: cabeçalho do paciente, métricas de progresso,
// informações do protocolo, linha do tempo e observações clínicas.
// ----------------------------------------------------------------

export default function VisualizarProtocolo({ paciente, protocolo, onBack }) {
  const [activeTab, setActiveTab] = useState('detalhes');

  // Formata "2024-03-15" → "15/03/2024"
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Mapeamento de status para classes CSS e rótulos
  const statusConfig = {
    'Aprovado':   { cls: 'approved',  label: 'Aprovado',   icon: '✓' },
    'Em análise': { cls: 'analysis',  label: 'Em Análise', icon: '◷' },
    'Concluído':  { cls: 'done',      label: 'Concluído',  icon: '✓' },
    'Negado':     { cls: 'denied',    label: 'Negado',     icon: '✕' },
    'Ativo':      { cls: 'approved',  label: 'Ativo',      icon: '▶' },
    'Pendente':   { cls: 'pending',   label: 'Pendente',   icon: '◷' },
  };
  const sc = statusConfig[protocolo?.status] || statusConfig['Em análise'];

  // Calcula progresso (etapas concluídas / total)
  const etapas = protocolo?.etapas || defaultEtapas;
  const concluidas = etapas.filter(e => e.status === 'concluido').length;
  const progressoPct = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;

  // Observações clínicas
  const observacoes = protocolo?.observacoes || defaultObservacoes;

  // Medicamentos do protocolo
  const medicamentos = protocolo?.medicamentos || defaultMedicamentos;

  // ── Três novas informações ───────────────────────────────────
  // Lê do objeto protocolo; se ausente, usa valores do mockProtocolo
  const localRealizacao    = protocolo?.local            || mockProtocolo.local;
  const medicoResponsavel  = protocolo?.medicoResponsavel || mockProtocolo.medicoResponsavel;
  const dataRealizacao     = protocolo?.dataRealizacao    || mockProtocolo.dataRealizacao;

  return (
    <div className="vp-page">

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <header className="vp-header">
        {/* Círculos decorativos */}
        <div className="vp-header-circle vp-header-circle-1" />
        <div className="vp-header-circle vp-header-circle-2" />

        <div className="vp-header-content">
          {/* Linha topo: botão voltar + badge de status */}
          <div className="vp-header-top">
            <button className="vp-back-btn" onClick={onBack} aria-label="Voltar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className={`vp-status-badge vp-status-${sc.cls}`}>
              {sc.icon} {sc.label}
            </span>
          </div>

          {/* Informações do paciente */}
          <div className="vp-patient-info">
            <div className="vp-patient-avatar">
              {paciente?.nome?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <h1 className="vp-patient-name">{paciente?.nome || 'Paciente'}</h1>
              <div className="vp-patient-meta">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                       stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  CNS: {paciente?.cartao_sus || '—'}
                </span>
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                       stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  UBS: {paciente?.unidade || 'UBS Central'}
                </span>
              </div>
            </div>
          </div>

          {/* Título do protocolo */}
          <p className="vp-proto-title-label">Protocolo</p>
          <h2 className="vp-proto-title">
            {protocolo?.especialidade || 'Especialidade não informada'}
          </h2>
          <p className="vp-proto-desc">
            {protocolo?.descricao || 'Protocolo de acompanhamento clínico especializado'}
          </p>

          {/* ── Banner com as três novas informações ─────────── */}
          {/* Exibido no cabeçalho para visibilidade imediata     */}
          <div className="vp-proto-meta-banner">

            {/* Local de realização */}
            <div className="vp-proto-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="vp-proto-meta-label">Local</span>
              <span className="vp-proto-meta-value">{localRealizacao}</span>
            </div>

            {/* Médico responsável */}
            <div className="vp-proto-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="vp-proto-meta-label">Médico</span>
              <span className="vp-proto-meta-value">{medicoResponsavel}</span>
            </div>

            {/* Data de realização */}
            <div className="vp-proto-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="vp-proto-meta-label">Data</span>
              <span className="vp-proto-meta-value">{formatDate(dataRealizacao)}</span>
            </div>

          </div>
        </div>
      </header>

      {/* ── Cards de métricas ──────────────────────────────── */}
      <div className="vp-metrics">
        {/* Progresso */}
        <div className="vp-metric-card">
          <div className="vp-metric-icon vp-metric-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <p className="vp-metric-label">Progresso</p>
            <p className="vp-metric-value">{progressoPct}%</p>
          </div>
          <div className="vp-metric-ring">
            <svg viewBox="0 0 36 36" width="44" height="44">
              <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke="var(--primary-lightest)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke="var(--primary)" strokeWidth="3"
                      strokeDasharray={`${progressoPct} ${100 - progressoPct}`}
                      strokeDashoffset="25"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
            </svg>
            <span className="vp-metric-ring-label">{progressoPct}%</span>
          </div>
        </div>

        {/* Data de início */}
        <div className="vp-metric-card">
          <div className="vp-metric-icon vp-metric-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="vp-metric-label">Pedido em</p>
            <p className="vp-metric-value vp-metric-value-sm">
              {formatDate(protocolo?.data_pedido)}
            </p>
          </div>
        </div>

        {/* Médico/Responsável */}
        <div className="vp-metric-card">
          <div className="vp-metric-icon vp-metric-icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="vp-metric-label">Responsável</p>
            <p className="vp-metric-value vp-metric-value-sm">
              {protocolo?.medico || 'Dr(a). Responsável'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Abas ───────────────────────────────────────────── */}
      <div className="vp-tabs-container">
        <div className="vp-tabs">
          {['detalhes', 'timeline', 'observacoes'].map((tab) => (
            <button
              key={tab}
              className={`vp-tab ${activeTab === tab ? 'vp-tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'detalhes'    && 'Detalhes'}
              {tab === 'timeline'    && 'Linha do Tempo'}
              {tab === 'observacoes' && 'Observações'}
            </button>
          ))}
        </div>
      </div>

      <main className="vp-main">

        {/* ── ABA: Detalhes ─────────────────────────────────── */}
        {activeTab === 'detalhes' && (
          <div className="vp-section-group">

            {/* Dados do protocolo */}
            <section className="vp-section" aria-label="Dados do protocolo">
              <h3 className="vp-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="var(--primary)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Informações do Protocolo
              </h3>
              <div className="vp-info-grid">
                <div className="vp-info-item">
                  <span className="vp-info-label">Especialidade</span>
                  <span className="vp-info-value">
                    {protocolo?.especialidade || 'Não informada'}
                  </span>
                </div>
                <div className="vp-info-item">
                  <span className="vp-info-label">Indicação Clínica</span>
                  <span className="vp-info-value">
                    {protocolo?.indicacao || protocolo?.descricao || 'Não informada'}
                  </span>
                </div>
                <div className="vp-info-item">
                  <span className="vp-info-label">Data do Pedido</span>
                  <span className="vp-info-value">
                    {formatDate(protocolo?.data_pedido)}
                  </span>
                </div>
                <div className="vp-info-item">
                  <span className="vp-info-label">Data da Resposta</span>
                  <span className="vp-info-value">
                    {formatDate(protocolo?.data_resposta)}
                  </span>
                </div>
                <div className="vp-info-item">
                  <span className="vp-info-label">Médico Responsável</span>
                  <span className="vp-info-value">
                    {protocolo?.medico || 'Não atribuído'}
                  </span>
                </div>
                <div className="vp-info-item">
                  <span className="vp-info-label">Status</span>
                  <span className={`vp-info-status vp-info-status-${sc.cls}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* ── Três novas informações na grade ──────────── */}

                {/* Local de realização */}
                <div className="vp-info-item">
                  <span className="vp-info-label">Local de Realização</span>
                  <span className="vp-info-value">{localRealizacao}</span>
                </div>

                {/* Data de realização */}
                <div className="vp-info-item">
                  <span className="vp-info-label">Data de Realização</span>
                  <span className="vp-info-value">{formatDate(dataRealizacao)}</span>
                </div>

                {/* Médico responsável (campo dedicado, diferente do "medico" geral) */}
                <div className="vp-info-item vp-info-item-full">
                  <span className="vp-info-label">Dr(a). Responsável pelo Protocolo</span>
                  <span className="vp-info-value vp-info-value-highlight">
                    {medicoResponsavel}
                  </span>
                </div>
              </div>
            </section>

            {/* Medicamentos */}
            <section className="vp-section" aria-label="Medicamentos">
              <h3 className="vp-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="var(--primary)" strokeWidth="2">
                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Medicamentos / Procedimentos
              </h3>
              {medicamentos.length > 0 ? (
                <div className="vp-meds-list">
                  {medicamentos.map((med, i) => (
                    <div key={i} className="vp-med-item">
                      <div className="vp-med-dot" />
                      <div className="vp-med-info">
                        <span className="vp-med-name">{med.nome}</span>
                        {med.dosagem && (
                          <span className="vp-med-dosagem">{med.dosagem}</span>
                        )}
                      </div>
                      {med.frequencia && (
                        <span className="vp-med-freq">{med.frequencia}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="vp-empty-inline">Nenhum medicamento registrado.</p>
              )}
            </section>

            {/* Barra de progresso das etapas */}
            <section className="vp-section" aria-label="Progresso das etapas">
              <h3 className="vp-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="var(--primary)" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Progresso das Etapas
              </h3>
              <div className="vp-progress-bar-wrap">
                <div className="vp-progress-bar-bg">
                  <div
                    className="vp-progress-bar-fill"
                    style={{ width: `${progressoPct}%` }}
                  />
                </div>
                <span className="vp-progress-bar-label">
                  {concluidas} de {etapas.length} etapas concluídas
                </span>
              </div>
              <div className="vp-etapas-chips">
                {etapas.map((etapa, i) => (
                  <span
                    key={i}
                    className={`vp-etapa-chip vp-etapa-${etapa.status}`}
                    title={etapa.nome}
                  >
                    {etapa.status === 'concluido'  && '✓ '}
                    {etapa.status === 'andamento'  && '▶ '}
                    {etapa.status === 'pendente'   && '○ '}
                    {etapa.nome}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── ABA: Linha do tempo ───────────────────────────── */}
        {activeTab === 'timeline' && (
          <section className="vp-section" aria-label="Linha do tempo do protocolo">
            <h3 className="vp-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="var(--primary)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Histórico de Etapas
            </h3>
            <div className="vp-timeline">
              {etapas.map((etapa, i) => (
                <div
                  key={i}
                  className={`vp-tl-item vp-tl-${etapa.status}`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Linha vertical conectora */}
                  {i < etapas.length - 1 && <div className="vp-tl-line" />}

                  {/* Ícone circular */}
                  <div className={`vp-tl-dot vp-tl-dot-${etapa.status}`}>
                    {etapa.status === 'concluido' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {etapa.status === 'andamento' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    )}
                    {etapa.status === 'pendente' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="8"/>
                      </svg>
                    )}
                  </div>

                  {/* Conteúdo da etapa */}
                  <div className="vp-tl-content">
                    <div className="vp-tl-content-top">
                      <span className="vp-tl-name">{etapa.nome}</span>
                      <span className={`vp-tl-badge vp-tl-badge-${etapa.status}`}>
                        {etapa.status === 'concluido' && 'Concluído'}
                        {etapa.status === 'andamento' && 'Em andamento'}
                        {etapa.status === 'pendente'  && 'Pendente'}
                      </span>
                    </div>
                    {etapa.data && (
                      <span className="vp-tl-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatDate(etapa.data)}
                      </span>
                    )}
                    {etapa.descricao && (
                      <p className="vp-tl-desc">{etapa.descricao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ABA: Observações ──────────────────────────────── */}
        {activeTab === 'observacoes' && (
          <div className="vp-section-group">
            {observacoes.length > 0 ? (
              observacoes.map((obs, i) => (
                <div
                  key={i}
                  className={`vp-obs-card vp-obs-${obs.tipo || 'info'}`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                  aria-label={`Observação ${obs.tipo || 'clínica'}`}
                >
                  {/* Ícone por tipo */}
                  <div className={`vp-obs-icon-wrap vp-obs-icon-${obs.tipo || 'info'}`}>
                    {obs.tipo === 'alerta' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                    {obs.tipo === 'sucesso' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    )}
                    {(!obs.tipo || obs.tipo === 'info') && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    )}
                  </div>
                  <div className="vp-obs-body">
                    {obs.titulo && (
                      <p className="vp-obs-titulo">{obs.titulo}</p>
                    )}
                    <p className="vp-obs-texto">{obs.texto}</p>
                    {obs.data && (
                      <span className="vp-obs-data">
                        {formatDate(obs.data)}
                        {obs.autor && ` · ${obs.autor}`}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="vp-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                     stroke="var(--text-muted)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <p>Nenhuma observação registrada.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// mockProtocolo — objeto JSON com as três novas informações.
// Usado como fallback quando o protocolo real não possui esses campos.
// Para testar visualmente, basta não passar essas props no objeto
// protocolo e os valores abaixo serão exibidos automaticamente.
//
// Exemplo do objeto JSON mock completo:
// {
//   local:            'UBS Vila Mariana — Sala 04, 2º andar',
//   medicoResponsavel: 'Dra. Fernanda Costa (CRM-SP 123456)',
//   dataRealizacao:   '2024-07-15',
// }
// ────────────────────────────────────────────────────────────────

/** Mock: três novas informações exibidas na tela de visualização */
const mockProtocolo = {
  // Local onde o protocolo será realizado (unidade, sala, andar)
  local: 'UBS Vila Mariana — Sala 04, 2º andar',

  // Nome completo e CRM do médico responsável pelo protocolo
  medicoResponsavel: 'Dra. Fernanda Costa (CRM-SP 123456)',

  // Data prevista de realização do protocolo (formato ISO YYYY-MM-DD)
  dataRealizacao: '2024-07-15',
};

// ────────────────────────────────────────────────────────────────
// Dados de exemplo usados quando o protocolo não possui os campos
// (útil durante o desenvolvimento e testes de UI)
// ────────────────────────────────────────────────────────────────

const defaultEtapas = [
  {
    nome: 'Triagem e avaliação inicial',
    status: 'concluido',
    data: '2024-01-10',
    descricao: 'Avaliação clínica completa realizada com sucesso.',
  },
  {
    nome: 'Solicitação de exames complementares',
    status: 'concluido',
    data: '2024-01-18',
    descricao: 'Hemograma completo, bioquímica e imagem solicitados.',
  },
  {
    nome: 'Consulta com especialista',
    status: 'andamento',
    data: '2024-02-05',
    descricao: 'Consulta com especialista agendada e em curso.',
  },
  {
    nome: 'Início do tratamento',
    status: 'pendente',
    data: null,
    descricao: 'Aguardando liberação da fase anterior.',
  },
  {
    nome: 'Reavaliação e alta',
    status: 'pendente',
    data: null,
    descricao: null,
  },
];

const defaultObservacoes = [
  {
    tipo: 'alerta',
    titulo: 'Atenção: Alergia medicamentosa',
    texto: 'Paciente apresenta hipersensibilidade à penicilina. Evitar uso de betalactâmicos sem avaliação prévia do médico responsável.',
    data: '2024-01-10',
    autor: 'Dra. Fernanda Costa',
  },
  {
    tipo: 'info',
    titulo: 'Orientação nutricional',
    texto: 'Recomendada dieta hipossódica e controle de ingestão de líquidos durante o período de tratamento. Encaminhamento à nutricionista realizado.',
    data: '2024-01-18',
    autor: 'Dr. Ricardo Melo',
  },
  {
    tipo: 'sucesso',
    titulo: 'Evolução clínica positiva',
    texto: 'Paciente apresenta boa resposta ao protocolo. Exames de controle dentro dos parâmetros esperados. Manter acompanhamento mensal.',
    data: '2024-02-05',
    autor: 'Dra. Fernanda Costa',
  },
];

const defaultMedicamentos = [
  { nome: 'Metformina 850mg',     dosagem: '850 mg',  frequencia: '2x ao dia' },
  { nome: 'Enalapril',            dosagem: '10 mg',   frequencia: '1x ao dia' },
  { nome: 'AAS (Aspirina)',       dosagem: '100 mg',  frequencia: '1x ao dia' },
  { nome: 'Sinvastatina',         dosagem: '40 mg',   frequencia: 'À noite' },
];

import { useState, useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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

  // ── Perfil de Usuário e Informações do Protocolo ─────────────
  const tipoUsuario        = protocolo?.tipoUsuario      || mockProtocolo.tipoUsuario;
  const medicosDisponiveis = protocolo?.medicosDisponiveis || mockProtocolo.medicosDisponiveis;

  const localRealizacao    = protocolo?.local            || mockProtocolo.local;
  const dataRealizacao     = protocolo?.dataRealizacao    || mockProtocolo.dataRealizacao;

  // Estado para armazenar o médico responsável selecionado
  const [selectedMedico, setSelectedMedico] = useState(
    protocolo?.medicoResponsavel || mockProtocolo.medicoResponsavel
  );

  // ── PDF Export (react-to-print) ───────────────────────────
  // printRef aponta para o componente oculto PrintableContent.
  // Ele renderiza todas as informações do protocolo em layout
  // linear (sem abas), garantindo que o PDF fique completo.
  const printRef = useRef(null);

  // handlePrint dispara o diálogo de impressão / "Salvar como PDF"
  // do próprio navegador. Não precisa de servidor nem upload.
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Protocolo_${protocolo?.especialidade || 'Medico'}_${paciente?.nome || 'Paciente'}`,
    pageStyle: `
      @page { size: A4; margin: 20mm 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <div className="vp-page">

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <header className="vp-header">
        {/* Círculos decorativos */}
        <div className="vp-header-circle vp-header-circle-1" />
        <div className="vp-header-circle vp-header-circle-2" />

        <div className="vp-header-content">
          {/* Linha topo: botão voltar + badge de status + botão PDF */}
          <div className="vp-header-top">
            <button className="vp-back-btn" onClick={onBack} aria-label="Voltar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Grupo direito: status + botão baixar PDF */}
            <div className="vp-header-top-right">
              <span className={`vp-status-badge vp-status-${sc.cls}`}>
                {sc.icon} {sc.label}
              </span>

              {/* Botão "Baixar PDF" — aciona o react-to-print */}
              <button
                className="vp-pdf-btn"
                onClick={handlePrint}
                aria-label="Baixar protocolo em PDF"
                title="Baixar PDF"
              >
                {/* Ícone de download */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Baixar PDF
              </button>
            </div>
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
              <span className="vp-proto-meta-value">{selectedMedico}</span>
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
                  {tipoUsuario === 'auditor' ? (
                    <select
                      className="vp-info-select"
                      value={selectedMedico}
                      onChange={(e) => setSelectedMedico(e.target.value)}
                      aria-label="Selecionar médico responsável"
                    >
                      {medicosDisponiveis.map(med => (
                        <option key={med} value={med}>{med}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="vp-info-value vp-info-value-highlight">
                      {selectedMedico}
                    </span>
                  )}
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

      {/* ── Área oculta para impressão / exportação em PDF ─────────
           Esta div só é visível durante o processo de impressão.
           Contém TODAS as informações do protocolo em layout
           linear, sem abas, para que o PDF fique sempre completo. */}
      <div style={{ display: 'none' }}>
        <PrintableContent
          ref={printRef}
          paciente={paciente}
          protocolo={protocolo}
          sc={sc}
          etapas={etapas}
          concluidas={concluidas}
          progressoPct={progressoPct}
          medicamentos={medicamentos}
          observacoes={observacoes}
          localRealizacao={localRealizacao}
          medicoResponsavel={selectedMedico}
          dataRealizacao={dataRealizacao}
          formatDate={formatDate}
        />
      </div>

    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// PrintableContent — layout exclusivo para o PDF

const PrintableContent = forwardRef(function PrintableContent(
  {
    paciente, protocolo, sc,
    etapas, concluidas, progressoPct,
    medicamentos, observacoes,
    localRealizacao, medicoResponsavel, dataRealizacao,
    formatDate,
  },
  ref
) {
  return (
    <div ref={ref} className="pdf-wrapper">

      {/* ── Estilos inline para impressão ───────────────────── */}
      {/* Garante formatação mesmo sem acesso ao CSS do app     */}
      <style>{`
        .pdf-wrapper {
          font-family: 'Inter', Arial, sans-serif;
          font-size: 12px;
          color: #1A202C;
          padding: 0;
          max-width: 100%;
        }
        /* Cabeçalho colorido */
        .pdf-header {
          background: linear-gradient(135deg, #0C326F 0%, #1351B4 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .pdf-title { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
        .pdf-subtitle { font-size: 12px; opacity: 0.8; margin: 0; }
        .pdf-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        /* Linha de metadados (local, médico, data) */
        .pdf-meta-row {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.25);
        }
        .pdf-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pdf-meta-label {
          font-size: 9px;
          opacity: 0.65;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pdf-meta-value { font-size: 11px; font-weight: 600; }
        /* Paciente */
        .pdf-patient-row {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #F0F4F7;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .pdf-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1351B4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .pdf-patient-name { font-size: 14px; font-weight: 700; margin: 0 0 3px; }
        .pdf-patient-detail { font-size: 11px; color: #4A5568; margin: 0; }
        /* Seções */
        .pdf-section {
          margin-bottom: 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .pdf-section-title {
          background: #F0F6FF;
          color: #0C326F;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 8px 14px;
          border-bottom: 1px solid #D4E5FF;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-section-body { padding: 12px 14px; }
        /* Grid de informações 2 colunas */
        .pdf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
        }
        .pdf-field { display: flex; flex-direction: column; gap: 2px; }
        .pdf-field-full { grid-column: 1 / -1; }
        .pdf-field-label {
          font-size: 9px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }
        .pdf-field-value { font-size: 11px; font-weight: 500; color: #1A202C; }
        .pdf-field-value-highlight { font-size: 12px; font-weight: 700; color: #1351B4; }
        /* Barra de progresso */
        .pdf-progress-bg {
          height: 6px;
          background: #E2E8F0;
          border-radius: 999px;
          overflow: hidden;
          margin: 6px 0 4px;
        }
        .pdf-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00884A, #10B981);
          border-radius: 999px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-progress-label { font-size: 10px; color: #718096; }
        /* Medicamentos */
        .pdf-med-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #F0F6FF;
          border-radius: 6px;
          border-left: 3px solid #2670E8;
          margin-bottom: 6px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-med-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1351B4;
          flex-shrink: 0;
        }
        .pdf-med-name { font-size: 11px; font-weight: 600; flex: 1; }
        .pdf-med-freq {
          font-size: 10px;
          font-weight: 600;
          color: #1351B4;
          background: #D4E5FF;
          padding: 2px 7px;
          border-radius: 999px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        /* Linha do tempo */
        .pdf-tl-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .pdf-tl-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 700;
          color: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-tl-dot-concluido { background: #10B981; }
        .pdf-tl-dot-andamento { background: #8B5CF6; }
        .pdf-tl-dot-pendente  { background: #CBD5E0; }
        .pdf-tl-body { flex: 1; }
        .pdf-tl-name { font-size: 11px; font-weight: 700; }
        .pdf-tl-date { font-size: 10px; color: #718096; }
        .pdf-tl-desc { font-size: 10px; color: #4A5568; margin-top: 2px; }
        /* Observações */
        .pdf-obs-item {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          border-left: 3px solid;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pdf-obs-alerta  { background: #FFF8F0; border-left-color: #F59E0B; }
        .pdf-obs-sucesso { background: #F0FDF4; border-left-color: #10B981; }
        .pdf-obs-info    { background: #F0F6FF; border-left-color: #2670E8; }
        .pdf-obs-titulo  { font-size: 11px; font-weight: 700; margin-bottom: 3px; }
        .pdf-obs-texto   { font-size: 10px; color: #4A5568; line-height: 1.5; }
        .pdf-obs-autor   { font-size: 9px; color: #718096; margin-top: 3px; }
        /* Rodapé */
        .pdf-footer {
          text-align: center;
          font-size: 9px;
          color: #A0AEC0;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #E2E8F0;
        }
      `}</style>

      {/* ── 1. Cabeçalho do protocolo ───────────────────────── */}
      <div className="pdf-header">
        <div className="pdf-header-row">
          <div>
            <h1 className="pdf-title">
              {protocolo?.especialidade || 'Protocolo Médico'}
            </h1>
            <p className="pdf-subtitle">
              {protocolo?.descricao || 'Protocolo de acompanhamento clínico'}
            </p>
          </div>
          <span className="pdf-badge">{sc.icon} {sc.label}</span>
        </div>

        {/* Local, médico e data em linha */}
        <div className="pdf-meta-row">
          <div className="pdf-meta-item">
            <span className="pdf-meta-label">📍 Local</span>
            <span className="pdf-meta-value">{localRealizacao}</span>
          </div>
          <div className="pdf-meta-item">
            <span className="pdf-meta-label">👤 Médico Responsável</span>
            <span className="pdf-meta-value">{medicoResponsavel}</span>
          </div>
          <div className="pdf-meta-item">
            <span className="pdf-meta-label">📅 Data de Realização</span>
            <span className="pdf-meta-value">{formatDate(dataRealizacao)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Dados do paciente ─────────────────────────────── */}
      <div className="pdf-patient-row">
        <div className="pdf-avatar">
          {paciente?.nome?.charAt(0)?.toUpperCase() || 'P'}
        </div>
        <div>
          <p className="pdf-patient-name">{paciente?.nome || 'Paciente'}</p>
          <p className="pdf-patient-detail">CNS: {paciente?.cartao_sus || '—'}</p>
          <p className="pdf-patient-detail">UBS: {paciente?.unidade || 'UBS Central'}</p>
        </div>
      </div>

      {/* ── 3. Informações gerais do protocolo ──────────────── */}
      <div className="pdf-section">
        <div className="pdf-section-title">Informações do Protocolo</div>
        <div className="pdf-section-body">
          <div className="pdf-grid">
            <div className="pdf-field">
              <span className="pdf-field-label">Especialidade</span>
              <span className="pdf-field-value">
                {protocolo?.especialidade || 'Não informada'}
              </span>
            </div>
            <div className="pdf-field">
              <span className="pdf-field-label">Indicação Clínica</span>
              <span className="pdf-field-value">
                {protocolo?.indicacao || protocolo?.descricao || 'Não informada'}
              </span>
            </div>
            <div className="pdf-field">
              <span className="pdf-field-label">Data do Pedido</span>
              <span className="pdf-field-value">{formatDate(protocolo?.data_pedido)}</span>
            </div>
            <div className="pdf-field">
              <span className="pdf-field-label">Data da Resposta</span>
              <span className="pdf-field-value">{formatDate(protocolo?.data_resposta)}</span>
            </div>
            <div className="pdf-field">
              <span className="pdf-field-label">Local de Realização</span>
              <span className="pdf-field-value">{localRealizacao}</span>
            </div>
            <div className="pdf-field">
              <span className="pdf-field-label">Data de Realização</span>
              <span className="pdf-field-value">{formatDate(dataRealizacao)}</span>
            </div>
            <div className="pdf-field pdf-field-full">
              <span className="pdf-field-label">Dr(a). Responsável pelo Protocolo</span>
              <span className="pdf-field-value pdf-field-value-highlight">
                {medicoResponsavel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Progresso das etapas ─────────────────────────── */}
      <div className="pdf-section">
        <div className="pdf-section-title">Progresso das Etapas</div>
        <div className="pdf-section-body">
          <div className="pdf-progress-bg">
            <div className="pdf-progress-fill" style={{ width: `${progressoPct}%` }} />
          </div>
          <p className="pdf-progress-label">
            {concluidas} de {etapas.length} etapas concluídas ({progressoPct}%)
          </p>
        </div>
      </div>

      {/* ── 5. Medicamentos / Procedimentos ─────────────────── */}
      {medicamentos.length > 0 && (
        <div className="pdf-section">
          <div className="pdf-section-title">Medicamentos / Procedimentos</div>
          <div className="pdf-section-body">
            {medicamentos.map((med, i) => (
              <div key={i} className="pdf-med-item">
                <div className="pdf-med-dot" />
                <span className="pdf-med-name">
                  {med.nome}{med.dosagem ? ` — ${med.dosagem}` : ''}
                </span>
                {med.frequencia && (
                  <span className="pdf-med-freq">{med.frequencia}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Linha do tempo das etapas ────────────────────── */}
      <div className="pdf-section">
        <div className="pdf-section-title">Linha do Tempo</div>
        <div className="pdf-section-body">
          {etapas.map((etapa, i) => (
            <div key={i} className="pdf-tl-item">
              <div className={`pdf-tl-dot pdf-tl-dot-${etapa.status}`}>
                {etapa.status === 'concluido' && '✓'}
                {etapa.status === 'andamento' && '▶'}
                {etapa.status === 'pendente'  && '○'}
              </div>
              <div className="pdf-tl-body">
                <div className="pdf-tl-name">{etapa.nome}</div>
                {etapa.data && (
                  <div className="pdf-tl-date">{formatDate(etapa.data)}</div>
                )}
                {etapa.descricao && (
                  <div className="pdf-tl-desc">{etapa.descricao}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Observações clínicas ──────────────────────────── */}
      {observacoes.length > 0 && (
        <div className="pdf-section">
          <div className="pdf-section-title">Observações Clínicas</div>
          <div className="pdf-section-body">
            {observacoes.map((obs, i) => (
              <div key={i} className={`pdf-obs-item pdf-obs-${obs.tipo || 'info'}`}>
                <div>
                  {obs.titulo && <p className="pdf-obs-titulo">{obs.titulo}</p>}
                  <p className="pdf-obs-texto">{obs.texto}</p>
                  {obs.data && (
                    <p className="pdf-obs-autor">
                      {formatDate(obs.data)}{obs.autor ? ` · ${obs.autor}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Rodapé ────────────────────────────────────────── */}
      <div className="pdf-footer">
        Documento gerado em {new Date().toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })} · Saúde na Mão — Sistema de Gestão de Saúde
      </div>

    </div>
  );
});

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

/** Mock: três novas informações exibidas na tela de visualização e perfil logado */
const mockProtocolo = {
  // Perfil simulado (teste trocando para 'paciente')
  tipoUsuario: 'auditor',

  // Local onde o protocolo será realizado (unidade, sala, andar)
  local: 'UBS Vila Mariana — Sala 04, 2º andar',

  // Nome completo e CRM do médico responsável pelo protocolo atualmente atribuído
  medicoResponsavel: 'Dra. Fernanda Costa (CRM-SP 123456)',

  // Lista de médicos disponíveis para seleção (apenas para o auditor)
  medicosDisponiveis: [
    'Dra. Fernanda Costa (CRM-SP 123456)',
    'Dr. Ricardo Melo (CRM-SP 654321)',
    'Dra. Amanda Silva (CRM-SP 112233)',
    'Dr. Carlos Oliveira (CRM-SP 445566)'
  ],

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

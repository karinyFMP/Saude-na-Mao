import { useState, useEffect } from 'react';
import { getProtocolos } from '../services/api';
import './Protocolos.css';

export default function Protocolos({ paciente, onBack, onViewProtocol }) {
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    loadProtocolos();
  }, [paciente.id]);

  const loadProtocolos = async () => {
    setLoading(true);
    try {
      const data = await getProtocolos(paciente.id);
      setProtocolos(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aprovado': return 'approved';
      case 'Em análise': return 'analysis';
      case 'Concluído': return 'done';
      case 'Negado': return 'denied';
      default: return 'analysis';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado': return '✓';
      case 'Em análise': return '◷';
      case 'Concluído': return '✓';
      case 'Negado': return '✕';
      default: return '◷';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const filtered = filter === 'todos'
    ? protocolos
    : protocolos.filter((p) => p.status === filter);

  const statusOptions = ['todos', 'Em análise', 'Aprovado', 'Concluído', 'Negado'];

  if (loading) {
    return (
      <div className="proto-loading">
        <div className="proto-loading-spinner" />
        <p>Carregando protocolos...</p>
      </div>
    );
  }

  return (
    <div className="protocolos-page">
      {/* Header */}
      <header className="proto-header">
        <button className="proto-back" onClick={onBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="proto-title">Protocolos</h1>
        <div style={{ width: 44 }} />
      </header>

      <main className="proto-main">
        {/* Filter chips */}
        <div className="proto-filters">
          {statusOptions.map((s) => (
            <button
              key={s}
              className={`proto-chip ${filter === s ? 'proto-chip-active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'todos' ? 'Todos' : s}
            </button>
          ))}
        </div>

        {erro && (
          <div className="proto-error">{erro}</div>
        )}

        {filtered.length === 0 ? (
          <div className="proto-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Nenhum protocolo encontrado</p>
          </div>
        ) : (
          <div className="proto-list">
            {filtered.map((proto, i) => (
              <div
                key={proto.id}
                className={`proto-card proto-card-${getStatusClass(proto.status)}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="proto-card-header">
                  <div>
                    <h3 className="proto-card-title">{proto.especialidade}</h3>
                    <p className="proto-card-desc">{proto.descricao}</p>
                  </div>
                  <span className={`proto-status proto-status-${getStatusClass(proto.status)}`}>
                    {getStatusIcon(proto.status)} {proto.status}
                  </span>
                </div>

                <div className="proto-card-footer">
                  <div className="proto-card-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Pedido: {formatDate(proto.data_pedido)}</span>
                  </div>
                  {proto.data_resposta && (
                    <div className="proto-card-date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Resposta: {formatDate(proto.data_resposta)}</span>
                    </div>
                  )}
                  {/* Botão ver detalhes */}
                  {onViewProtocol && (
                    <button
                      className="proto-view-btn"
                      onClick={() => onViewProtocol(proto)}
                      aria-label={`Ver detalhes do protocolo ${proto.especialidade}`}
                    >
                      Ver detalhes
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Progress bar for visual feedback */}
                <div className="proto-progress">
                  <div className={`proto-progress-bar proto-progress-${getStatusClass(proto.status)}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getUBS } from '../services/api';
import './UnidadesSaude.css';

export default function UnidadesSaude({ onBack }) {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      const data = await getUBS();
      setUnidades(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = unidades.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.endereco.toLowerCase().includes(search.toLowerCase()) ||
      u.tipo.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (tipo) => {
    switch (tipo) {
      case 'UBS': return 'ubs';
      case 'UPA': return 'upa';
      case 'Hospital': return 'hospital';
      default: return 'ubs';
    }
  };

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case 'UPA': return '🏥';
      case 'Hospital': return '🏨';
      default: return '🏢';
    }
  };

  if (loading) {
    return (
      <div className="ubs-loading">
        <div className="ubs-loading-spinner" />
        <p>Carregando unidades...</p>
      </div>
    );
  }

  return (
    <div className="unidades-page">
      {/* Header */}
      <header className="ubs-header">
        <button className="btn-voltar-padrao" onClick={onBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="ubs-title">Unidades de Saúde</h1>
        <div style={{ width: 44 }} />
      </header>

      <main className="ubs-main">
        {/* Search */}
        <div className="ubs-search-wrapper">
          <svg className="ubs-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="ubs-search"
            placeholder="Buscar por nome, endereço ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-search-ubs"
          />
        </div>

        {erro && <div className="ubs-error">{erro}</div>}

        {/* Stats */}
        <div className="ubs-stats">
          <div className="ubs-stat">
            <span className="ubs-stat-num">{unidades.length}</span>
            <span className="ubs-stat-label">Total</span>
          </div>
          <div className="ubs-stat">
            <span className="ubs-stat-num">{unidades.filter(u => u.tipo === 'UBS').length}</span>
            <span className="ubs-stat-label">UBS</span>
          </div>
          <div className="ubs-stat">
            <span className="ubs-stat-num">{unidades.filter(u => u.tipo === 'UPA').length}</span>
            <span className="ubs-stat-label">UPA</span>
          </div>
          <div className="ubs-stat">
            <span className="ubs-stat-num">{unidades.filter(u => u.tipo === 'Hospital').length}</span>
            <span className="ubs-stat-label">Hospitais</span>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="ubs-empty">
            <p>Nenhuma unidade encontrada</p>
          </div>
        ) : (
          <div className="ubs-list">
            {filtered.map((u, i) => (
              <div
                key={u.id}
                className={`ubs-card ubs-card-${getTypeColor(u.tipo)}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="ubs-card-icon">
                  {getTypeIcon(u.tipo)}
                </div>
                <div className="ubs-card-content">
                  <div className="ubs-card-top">
                    <h3 className="ubs-card-name">{u.nome}</h3>
                    <span className={`ubs-type ubs-type-${getTypeColor(u.tipo)}`}>
                      {u.tipo}
                    </span>
                  </div>
                  <div className="ubs-card-details">
                    <div className="ubs-card-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{u.endereco}</span>
                    </div>
                    {u.telefone && (
                      <div className="ubs-card-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>{u.telefone}</span>
                      </div>
                    )}
                    <div className="ubs-card-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>{u.horario_funcionamento}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

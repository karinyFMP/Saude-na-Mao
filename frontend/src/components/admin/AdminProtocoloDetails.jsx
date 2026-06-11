import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, Shield, User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2 
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getAdminProtocolo, updateProtocoloStatus } from '../../services/adminApi';
import './AdminProtocoloDetails.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Check if it has time component
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function AdminProtocoloDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { servidor, logoutServidor } = useAdminAuth();

  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [parecer, setParecer] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAdminProtocolo(id);
        setProtocolo(data);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do protocolo.');
        navigate('/admin/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  const handleUpdateStatus = async (novoStatus) => {
    setUpdating(true);
    try {
      await updateProtocoloStatus(id, novoStatus);
      toast.success(`Protocolo marcado como ${novoStatus}.`);
      setProtocolo(prev => ({ ...prev, status: novoStatus }));
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-details-page">
        <div className="admin-details-loading">
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
          <h2>Carregando informações...</h2>
        </div>
      </div>
    );
  }

  if (!protocolo) return null;

  return (
    <div className="admin-details-page">
      {/* Header */}

      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Painel Administrativo Restrito</span>
          </div>
        </div>
      </header>

      <main className="admin-details-main">
        <div className="admin-details-header">
          <div className="admin-details-header-left">
            <button className="admin-back-btn" onClick={() => navigate('/admin/dashboard')} title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <h2 className="admin-details-title">
              Protocolo #{protocolo.id}
            </h2>
            <div className={`admin-header-badge ${protocolo.status.replace(' ', '')}`}>
              {protocolo.status}
            </div>
          </div>

          <div className="admin-header-actions">
            {/* Botões movidos para o final da página conforme UX */}
          </div>
        </div>

        <div className="admin-details-grid">
          {/* Card 1: Paciente Info (Coluna Esquerda no Desktop) */}
          <div className="admin-details-card">
            <h3><User size={18} /> Informações do Paciente</h3>
            <div className="admin-patient-info-list">
              <div className="admin-info-item">
                <span className="admin-info-label">Nome Completo</span>
                <span className="admin-info-value">{protocolo.paciente_nome}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">CPF</span>
                <span className="admin-info-value">{protocolo.paciente_cpf}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">Cartão SUS</span>
                <span className="admin-info-value">{protocolo.cartao_sus || 'Não informado'}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">Telefone</span>
                <span className="admin-info-value">{protocolo.telefone || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Exame/Pedido Info (Coluna Direita no Desktop) */}
          <div className="admin-details-card">
            <h3><FileText size={18} /> Detalhes do Encaminhamento</h3>
            <div className="admin-protocol-info-grid" style={{ marginBottom: 24 }}>
              <div className="admin-info-item">
                <span className="admin-info-label">Especialidade / Exame</span>
                <span className="admin-info-value" style={{ color: 'var(--primary)' }}>{protocolo.especialidade}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">Unidade Solicitante</span>
                <span className="admin-info-value">{protocolo.paciente_unidade}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">Data do Pedido</span>
                <span className="admin-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} style={{color: '#64748B'}}/> {formatDate(protocolo.data_pedido)}
                </span>
              </div>
            </div>
            
            <div className="admin-info-item">
              <span className="admin-info-label">Descrição / Justificativa Médica</span>
              <div className="admin-description-box">
                {protocolo.descricao || 'Nenhuma descrição fornecida.'}
              </div>
            </div>

            {/* SEÇÃO DE PARECER E AÇÕES */}
            {protocolo.status === 'Em análise' && (
              <div className="admin-parecer-wrapper">
                <label htmlFor="parecerText" className="admin-parecer-label">
                  Parecer / Justificativa do Administrador
                </label>
                <textarea 
                  id="parecerText"
                  className="admin-parecer-textarea"
                  placeholder="Escreva a justificativa da decisão (Obrigatório para negativa)..."
                  value={parecer}
                  onChange={(e) => setParecer(e.target.value)}
                  disabled={updating}
                />

                <div className="admin-btn-group" style={{ marginTop: 16 }}>
                  <button 
                    className="admin-action-btn admin-btn-deny"
                    disabled={updating}
                    onClick={() => {
                      if (parecer.trim().length === 0) {
                        toast.error('Preencha o Parecer/Justificativa para negar o pedido.');
                        return;
                      }
                      handleUpdateStatus('Negado');
                    }}
                  >
                    {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <XCircle size={18} />}
                    Negar Pedido
                  </button>
                  <button 
                    className="admin-action-btn admin-btn-approve"
                    disabled={updating}
                    onClick={() => handleUpdateStatus('Aprovado')}
                  >
                    {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle2 size={18} />}
                    Aprovar Pedido
                  </button>
                </div>
              </div>
            )}

            {/* Ações para status já definidos */}
            {['Aprovado', 'Negado', 'Concluído'].includes(protocolo.status) && (
              <div className="admin-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className={`admin-status-readonly ${protocolo.status}`}>
                  {protocolo.status === 'Aprovado' && <CheckCircle2 size={18}/>}
                  {protocolo.status === 'Negado' && <XCircle size={18}/>}
                  {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                  {protocolo.status.toUpperCase()}
                </div>

                {protocolo.status === 'Aprovado' && (
                  <button 
                    className="admin-action-btn admin-btn-conclude"
                    style={{ flex: 'none' }}
                    disabled={updating}
                    onClick={() => handleUpdateStatus('Concluído')}
                  >
                    {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <CheckCheck size={18} />}
                    Marcar como Concluído
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

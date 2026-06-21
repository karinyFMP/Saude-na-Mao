import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, Shield, User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope
} from 'lucide-react';
import { useAuditorAuth } from '../../contexts/AuditorAuthContext';
import { getAuditorProtocolo, updateProtocoloStatus } from '../../services/auditorApi';
import './AuditorProtocoloDetails.css';

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

export default function AuditorProtocoloDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { servidor, logoutServidor } = useAuditorAuth();

  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [parecer, setParecer] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAuditorProtocolo(id);
        setProtocolo(data);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do protocolo.');
        navigate('/auditor/dashboard', { replace: true });
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
      <div className="auditor-details-page">
        <div className="auditor-details-loading">
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
          <h2>Carregando informações...</h2>
        </div>
      </div>
    );
  }

  if (!protocolo) return null;

  return (
    <div className="auditor-details-page">
      {/* Header */}

      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Painel de Auditoria Restrito</span>
          </div>
        </div>
      </header>

      <main className="auditor-details-main">
        <div className="auditor-details-header">
          <div className="auditor-details-header-left">
            <button className="auditor-back-btn" onClick={() => navigate('/auditor/dashboard')} title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <h2 className="auditor-details-title">
              Protocolo #{protocolo.id}
            </h2>
            <div className={`auditor-header-badge ${protocolo.status.replace(' ', '')}`}>
              {protocolo.status}
            </div>
          </div>

          <div className="auditor-header-actions">
            {/* Botões movidos para o final da página conforme UX */}
          </div>
        </div>

        <div className="auditor-details-grid">
          {/* Coluna Esquerda: Paciente */}
          <div className="auditor-details-card">
            <h3><User size={18} /> Informações do Paciente</h3>
            <div className="auditor-patient-info-list">
              <div className="auditor-info-item">
                <span className="auditor-info-label">Nome Completo</span>
                <span className="auditor-info-value">{protocolo.paciente_nome}</span>
              </div>
              <div className="auditor-info-item">
                <span className="auditor-info-label">CPF</span>
                <span className="auditor-info-value">{protocolo.paciente_cpf}</span>
              </div>
              <div className="auditor-info-item">
                <span className="auditor-info-label">Cartão SUS</span>
                <span className="auditor-info-value">{protocolo.cartao_sus || 'Não informado'}</span>
              </div>
              <div className="auditor-info-item">
                <span className="auditor-info-label">Telefone</span>
                <span className="auditor-info-value">{protocolo.telefone || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Médico + Encaminhamento empilhados */}
          <div className="auditor-right-col">

            {/* Card: Médico Solicitante */}
            <div className="auditor-details-card">
              <h3><Stethoscope size={18} /> Médico Solicitante</h3>
              <div className="auditor-patient-info-list">
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Nome</span>
                  <span className="auditor-info-value">
                    {protocolo.medico_solicitante_nome || 'Não informado'}
                  </span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Especialidade</span>
                  <span className="auditor-info-value" style={{ color: 'var(--primary)' }}>
                    {protocolo.medico_solicitante_especialidade || 'Não informada'}
                  </span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">CRM</span>
                  <span className="auditor-info-value">
                    {protocolo.medico_solicitante_crm || 'Não informado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Detalhes do Encaminhamento */}
            <div className="auditor-details-card">
              <h3><FileText size={18} /> Detalhes do Encaminhamento</h3>
              <div className="auditor-protocol-info-grid" style={{ marginBottom: 24 }}>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Especialidade / Exame</span>
                  <span className="auditor-info-value" style={{ color: 'var(--primary)' }}>{protocolo.especialidade}</span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Unidade Solicitante</span>
                  <span className="auditor-info-value">{protocolo.paciente_unidade}</span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Data do Pedido</span>
                  <span className="auditor-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} style={{color: '#64748B'}}/> {formatDate(protocolo.data_pedido)}
                  </span>
                </div>
              </div>
              
              <div className="auditor-info-item">
                <span className="auditor-info-label">Descrição / Justificativa Médica</span>
                <div className="auditor-description-box">
                  {protocolo.descricao || 'Nenhuma descrição fornecida.'}
                </div>
              </div>

              {/* SEÇÃO DE PARECER E AÇÕES */}
              {protocolo.status === 'Em análise' && (
                <div className="auditor-parecer-wrapper">
                  <label htmlFor="parecerText" className="auditor-parecer-label">
                    Parecer / Justificativa do Auditor
                  </label>
                  <textarea 
                    id="parecerText"
                    className="auditor-parecer-textarea"
                    placeholder="Escreva a justificativa da decisão (Obrigatório para negativa)..."
                    value={parecer}
                    onChange={(e) => setParecer(e.target.value)}
                    disabled={updating}
                  />

                  <div className="auditor-btn-group" style={{ marginTop: 16 }}>
                    <button 
                      className="auditor-action-btn auditor-btn-deny"
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
                      className="auditor-action-btn auditor-btn-approve"
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
                <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className={`auditor-status-readonly ${protocolo.status}`}>
                    {protocolo.status === 'Aprovado' && <CheckCircle2 size={18}/>}
                    {protocolo.status === 'Negado' && <XCircle size={18}/>}
                    {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                    {protocolo.status.toUpperCase()}
                  </div>

                  {protocolo.status === 'Aprovado' && (
                    <button 
                      className="auditor-action-btn auditor-btn-conclude"
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

          </div>{/* fim auditor-right-col */}
        </div>

      </main>
    </div>
  );
}

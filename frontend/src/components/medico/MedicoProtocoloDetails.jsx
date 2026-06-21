import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope, Clock
} from 'lucide-react';
import { useMedicoAuth } from '../../contexts/MedicoAuthContext';
import { getProtocoloDetalhes } from '../../services/medicoApi';

import '../auditor/AuditorProtocoloDetails.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function MedicoProtocoloDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { medico } = useMedicoAuth();

  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProtocoloDetalhes(id);
        setProtocolo(data);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do protocolo.');
        navigate('/medico/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="auditor-details-page">
        <div className="auditor-details-loading">
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <h2>Carregando informações...</h2>
        </div>
      </div>
    );
  }

  if (!protocolo) return null;

  return (
    <div className="auditor-details-page">
      <header className="dash-header-compact" style={{ 
        background: 'var(--primary-dark)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-header-left">
            <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
            <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Painel do Médico</span>
          </div>
        </div>
      </header>

      <main className="auditor-details-main">
        <div className="auditor-details-header">
          <div className="auditor-details-header-left">
            <button className="auditor-back-btn" onClick={() => navigate('/medico/dashboard')} title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <h2 className="auditor-details-title">
              Protocolo #{protocolo.id}
            </h2>
            <div className={`auditor-header-badge ${protocolo.status.replace(' ', '')}`}>
              {protocolo.status}
            </div>
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
            </div>
          </div>

          {/* Coluna Direita: Médico + Detalhes empilhados */}
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

            {/* Card: Detalhes da Solicitação */}
            <div className="auditor-details-card">
              <h3><FileText size={18} /> Detalhes da Solicitação</h3>
              <div className="auditor-protocol-info-grid" style={{ marginBottom: 24 }}>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Especialidade / Tipo</span>
                  <span className="auditor-info-value" style={{ color: 'var(--primary)' }}>
                    {protocolo.tipo_protocolo || protocolo.especialidade}
                  </span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Prioridade</span>
                  <span className="auditor-info-value">{protocolo.prioridade || 'Não informada'}</span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Data do Pedido</span>
                  <span className="auditor-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} style={{color: '#64748B'}}/> {formatDate(protocolo.data_pedido)}
                  </span>
                </div>
              </div>
              
              <div className="auditor-info-item" style={{ marginBottom: 16 }}>
                <span className="auditor-info-label">Descrição / Justificativa Médica</span>
                <div className="auditor-description-box">
                  <div style={{ marginBottom: protocolo.parecer_medico ? '12px' : '0' }}>
                    {protocolo.descricao || 'Nenhuma descrição fornecida.'}
                  </div>
                  {protocolo.parecer_medico && (
                    <div style={{ paddingTop: '12px', borderTop: '1px dashed #CBD5E1' }}>
                      <strong>Parecer:</strong> {protocolo.parecer_medico}
                    </div>
                  )}
                </div>
              </div>

              {/* Status de Resposta */}
              <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className={`auditor-status-readonly ${protocolo.status.replace(' ', '')}`}>
                  {protocolo.status === 'Em análise' && <Clock size={18}/>}
                  {protocolo.status === 'Aprovado' && <CheckCircle2 size={18}/>}
                  {protocolo.status === 'Negado' && <XCircle size={18}/>}
                  {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                  Status atual: {protocolo.status.toUpperCase()}
                </div>
              </div>
            </div>

          </div>{/* fim auditor-right-col */}
        </div>
      </main>
    </div>
  );
}

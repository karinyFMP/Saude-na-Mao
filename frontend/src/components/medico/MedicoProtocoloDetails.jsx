import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope, Clock,
  FlaskConical, ClipboardList, BadgeCheck
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

function getMockResultados(especialidade, dataExecucao) {
  const data = dataExecucao ? formatDate(dataExecucao) : new Date().toLocaleDateString('pt-BR');
  const esp = (especialidade || '').toLowerCase();
  if (esp.includes('cardio')) return {
    tipo: 'Eletrocardiograma + Ecocardiograma',
    itens: [
      { label: 'Frequência Cardíaca', valor: '72 bpm', cls: 'ok' },
      { label: 'Ritmo', valor: 'Sinusal Regular', cls: 'ok' },
      { label: 'Fração de Ejeção', valor: '58%', cls: 'ok' },
    ], data, laboratorio: 'Laboratório Cardio Diagnóstico',
  };
  if (esp.includes('oftalmo')) return {
    tipo: 'Mapeamento de Retina + Acuidade Visual',
    itens: [
      { label: 'Acuidade Visual OD', valor: '20/40', cls: 'atencao' },
      { label: 'Acuidade Visual OE', valor: '20/200', cls: 'alto' },
      { label: 'Biomicroscopia', valor: 'Opacidade bilateral', cls: 'atencao' },
    ], data, laboratorio: 'Clínica Oftalmo Visão',
  };
  return {
    tipo: 'Hemograma Completo + Exames Bioquímicos',
    itens: [
      { label: 'Hemoglobina', valor: '13,8 g/dL', cls: 'ok' },
      { label: 'Leucócitos', valor: '7.200/mm³', cls: 'ok' },
      { label: 'Glicemia em jejum', valor: '102 mg/dL', cls: 'atencao' },
    ], data, laboratorio: 'Laboratório Central de Análises',
  };
}

function getMockParecer(protocolo) {
  const data = protocolo.data_resposta ? formatDate(protocolo.data_resposta) : new Date().toLocaleDateString('pt-BR');
  return {
    texto: `Após avaliação clínica completa e análise dos exames solicitados, concluo que o quadro do paciente encontra-se dentro dos parâmetros esperados para o diagnóstico em questão.\n\nRecomendo acompanhamento ambulatorial regular e manutenção das orientações terapêuticas já prescritas.\n\nRetorno programado para 60 dias ou antes em caso de agravamento dos sintomas.`,
    medico: protocolo.medico_solicitante_nome || 'Dr(a). Especialista',
    crm: protocolo.medico_solicitante_crm || 'CRM/SP 00000',
    data,
  };
}

function isConsultaEspecialista(protocolo) {
  const tipo = (protocolo.tipo_protocolo || '').toLowerCase();
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  return tipo.includes('consulta') || (!esp.includes('clínico geral') && !esp.includes('clinico geral') && esp.length > 0);
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

  const mostrarResultados = ['Executado', 'Concluído'].includes(protocolo.status);
  const ehConsultaEsp = isConsultaEspecialista(protocolo);

  return (
    <div className="auditor-details-page">
      <header className="dash-header-compact" style={{ 
        background: 'var(--primary-dark)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <button className="btn-voltar-padrao" onClick={() => navigate('/medico/dashboard')} aria-label="Voltar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="dash-header-left">
              <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
              <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Painel do Médico</span>
            </div>
          </div>
        </div>
      </header>

      <main className="auditor-details-main">
        <div className="auditor-details-header">
          <div className="auditor-details-header-left">
            <h2 className="auditor-details-title">Protocolo #{protocolo.id}</h2>
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

          {/* Coluna Direita */}
          <div className="auditor-right-col">
            <div className="auditor-details-card">
              <h3><Stethoscope size={18} /> Médico Solicitante</h3>
              <div className="auditor-patient-info-list">
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Nome</span>
                  <span className="auditor-info-value">{protocolo.medico_solicitante_nome || 'Não informado'}</span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">Especialidade</span>
                  <span className="auditor-info-value" style={{ color: 'var(--primary)' }}>{protocolo.medico_solicitante_especialidade || 'Não informada'}</span>
                </div>
                <div className="auditor-info-item">
                  <span className="auditor-info-label">CRM</span>
                  <span className="auditor-info-value">{protocolo.medico_solicitante_crm || 'Não informado'}</span>
                </div>
              </div>
            </div>

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
                  {protocolo.descricao || 'Nenhuma descrição fornecida.'}
                  {protocolo.parecer_medico && (
                    <div style={{ paddingTop: '12px', borderTop: '1px dashed #CBD5E1', marginTop: '12px' }}>
                      <strong>Parecer:</strong> {protocolo.parecer_medico}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Read-Only */}
              <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className={`auditor-status-readonly ${protocolo.status.replace(' ', '')}`}>
                  {protocolo.status === 'Em análise' && <Clock size={18}/>}
                  {protocolo.status === 'Autorizado' && <BadgeCheck size={18}/>}
                  {protocolo.status === 'Executado' && <FlaskConical size={18}/>}
                  {protocolo.status === 'Negado' && <XCircle size={18}/>}
                  {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                  Status atual: {protocolo.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Resultado de Exames quando Executado/Concluído */}
            {mostrarResultados && (() => {
              const res = getMockResultados(protocolo.especialidade, protocolo.data_resposta);
              return (
                <div className="auditor-details-card">
                  <div className="resultado-card">
                    <div className="resultado-card-title">
                      <FlaskConical size={18} /> Resultado dos Exames — {res.tipo}
                    </div>
                    {res.itens.map((item, i) => (
                      <div key={i} className="resultado-item">
                        <span className="resultado-label">{item.label}</span>
                        <span className={`resultado-valor ${item.cls}`}>{item.valor}</span>
                      </div>
                    ))}
                    <div className="resultado-assinatura">
                      <span>{res.laboratorio}</span>
                      <span>Emitido em: {res.data}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Parecer Especialista quando Executado/Concluído e for consulta */}
            {mostrarResultados && ehConsultaEsp && (() => {
              const parecer = getMockParecer(protocolo);
              return (
                <div className="auditor-details-card">
                  <div className="parecer-card">
                    <div className="parecer-card-title">
                      <ClipboardList size={18} /> Parecer do Médico Especialista
                    </div>
                    <div className="parecer-texto">{parecer.texto}</div>
                    <div className="parecer-assinatura">
                      <span><strong>{parecer.medico}</strong> — {parecer.crm}</span>
                      <span>{parecer.data}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </main>
    </div>
  );
}

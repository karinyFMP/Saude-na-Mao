import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope, Clock,
  FlaskConical, ClipboardList, BadgeCheck
} from 'lucide-react';
import { getProtocoloDetalhesPaciente } from '../services/api';

import './auditor/AuditorProtocoloDetails.css';

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
  if (esp.includes('ortoped')) return {
    tipo: 'Raio-X + Ressonância Magnética',
    itens: [
      { label: 'Espaço articular', valor: 'Reduzido (grau II)', cls: 'atencao' },
      { label: 'Ligamento Cruzado Ant.', valor: 'Ruptura parcial', cls: 'alto' },
      { label: 'Cartilagem articular', valor: 'Preservada', cls: 'ok' },
    ], data, laboratorio: 'Centro de Diagnóstico por Imagem',
  };
  if (esp.includes('neurolog')) return {
    tipo: 'Eletroencefalograma + RM Cerebral',
    itens: [
      { label: 'Atividade cortical', valor: 'Normal', cls: 'ok' },
      { label: 'Estruturas cerebrais', valor: 'Sem alterações', cls: 'ok' },
      { label: 'Vascularização', valor: 'Fluxo preservado', cls: 'ok' },
    ], data, laboratorio: 'Instituto de Neuroimagem',
  };
  return {
    tipo: 'Hemograma Completo + Exames Bioquímicos',
    itens: [
      { label: 'Hemoglobina', valor: '13,8 g/dL', cls: 'ok' },
      { label: 'Leucócitos', valor: '7.200/mm³', cls: 'ok' },
      { label: 'Glicemia em jejum', valor: '102 mg/dL', cls: 'atencao' },
      { label: 'Creatinina', valor: '0,9 mg/dL', cls: 'ok' },
    ], data, laboratorio: 'Laboratório Central de Análises',
  };
}

function getMockParecer(protocolo) {
  const data = protocolo.data_resposta ? formatDate(protocolo.data_resposta) : new Date().toLocaleDateString('pt-BR');
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  let texto = `Após avaliação clínica completa e análise dos exames realizados, concluo que seu quadro encontra-se estável.\n\nRecomendo acompanhamento ambulatorial regular e manutenção das orientações terapêuticas já prescritas.\n\nRetorno programado para 60 dias ou antes em caso de agravamento dos sintomas.`;
  if (esp.includes('oftalmo')) {
    texto = `Os exames indicam catarata bilateral em estágio moderado-avançado, especialmente no olho esquerdo.\n\nFoi indicado procedimento cirúrgico (facoemulsificação) como tratamento definitivo. Uma solicitação de agendamento cirúrgico foi encaminhada à central de regulação.\n\nAguarde contato para agendamento. Em caso de piora súbita da visão, procure atendimento de urgência.`;
  }
  return {
    texto,
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

export default function PacienteProtocoloDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProtocoloDetalhesPaciente(id);
        setProtocolo(data);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do protocolo.');
        navigate('/protocolos', { replace: true });
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
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <button className="btn-voltar-padrao" onClick={() => navigate('/protocolos')} aria-label="Voltar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="dash-header-left">
              <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
              <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Meus Protocolos</span>
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
          {/* Coluna Esquerda: Minhas Informações */}
          <div className="auditor-details-card">
            <h3><User size={18} /> Minhas Informações</h3>
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

            {/* Card: Médico Solicitante */}
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

              {/* Status atual do protocolo */}
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

              {/* Mensagem informativa por status */}
              {protocolo.status === 'Em análise' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--status-analysis-bg)', border: '1px solid var(--status-analysis)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-analysis)' }}>
                  ⏳ Seu protocolo está sendo analisado pela equipe de auditoria. Aguarde.
                </div>
              )}
              {protocolo.status === 'Autorizado' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--status-autorizado-bg)', border: '1px solid var(--status-autorizado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-autorizado)' }}>
                  ✅ Seu protocolo foi <strong>autorizado</strong>! Em breve você receberá as instruções para realização dos exames/consulta.
                </div>
              )}
              {protocolo.status === 'Negado' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--status-negado-bg)', border: '1px solid var(--status-negado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-negado)' }}>
                  ❌ Este protocolo foi <strong>negado</strong>. Em caso de dúvidas, procure a UBS onde foi solicitado.
                </div>
              )}
              {protocolo.status === 'Executado' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--status-executado-bg)', border: '1px solid var(--status-executado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-executado)' }}>
                  🔬 Os exames foram <strong>realizados</strong>! Confira abaixo os resultados e o parecer do especialista.
                </div>
              )}
              {protocolo.status === 'Concluído' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--status-concluido-bg)', border: '1px solid var(--status-concluido)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-concluido)' }}>
                  ✔ Protocolo <strong>concluído</strong>. Guarde os resultados abaixo para referência futura.
                </div>
              )}
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

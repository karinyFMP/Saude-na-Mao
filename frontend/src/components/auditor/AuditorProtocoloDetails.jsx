import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Shield, User, Calendar, FileText, 
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope,
  FlaskConical, ClipboardList, BadgeCheck
} from 'lucide-react';
import { useAuditorAuth } from '../../contexts/AuditorAuthContext';
import { getAuditorProtocolo, updateProtocoloStatus } from '../../services/auditorApi';
import './AuditorProtocoloDetails.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Gera dados mocados de resultado de exame baseados na especialidade
function getMockResultados(especialidade, dataExecucao) {
  const data = dataExecucao ? formatDate(dataExecucao) : new Date().toLocaleDateString('pt-BR');
  const especialidadeLower = (especialidade || '').toLowerCase();

  if (especialidadeLower.includes('cardio')) {
    return {
      tipo: 'Eletrocardiograma + Ecocardiograma',
      itens: [
        { label: 'Frequência Cardíaca', valor: '72 bpm', cls: 'ok' },
        { label: 'Ritmo', valor: 'Sinusal Regular', cls: 'ok' },
        { label: 'Intervalo PR', valor: '160 ms', cls: 'ok' },
        { label: 'QRS', valor: '88 ms', cls: 'ok' },
        { label: 'Fração de Ejeção', valor: '58%', cls: 'ok' },
      ],
      data,
      laboratorio: 'Laboratório Cardio Diagnóstico',
    };
  }
  if (especialidadeLower.includes('oftalmo')) {
    return {
      tipo: 'Mapeamento de Retina + Acuidade Visual',
      itens: [
        { label: 'Acuidade Visual OD', valor: '20/40 (0.5)', cls: 'atencao' },
        { label: 'Acuidade Visual OE', valor: '20/200 (0.1)', cls: 'alto' },
        { label: 'Pressão Intraocular OD', valor: '14 mmHg', cls: 'ok' },
        { label: 'Pressão Intraocular OE', valor: '16 mmHg', cls: 'ok' },
        { label: 'Biomicroscopia', valor: 'Opacidade cristaliniana bilateral', cls: 'atencao' },
      ],
      data,
      laboratorio: 'Clínica Oftalmo Visão',
    };
  }
  if (especialidadeLower.includes('ortoped')) {
    return {
      tipo: 'Raio-X + Ressonância Magnética',
      itens: [
        { label: 'Espaço articular', valor: 'Reduzido (grau II)', cls: 'atencao' },
        { label: 'Ligamento Cruzado Ant.', valor: 'Ruptura parcial', cls: 'alto' },
        { label: 'Menisco Medial', valor: 'Lesão grau I', cls: 'atencao' },
        { label: 'Cartilagem articular', valor: 'Preservada', cls: 'ok' },
        { label: 'Edema ósseo', valor: 'Ausente', cls: 'ok' },
      ],
      data,
      laboratorio: 'Centro de Diagnóstico por Imagem',
    };
  }
  if (especialidadeLower.includes('neurolog')) {
    return {
      tipo: 'Eletroencefalograma + Ressonância Magnética Cerebral',
      itens: [
        { label: 'Atividade cortical', valor: 'Normal', cls: 'ok' },
        { label: 'Ondas alfa', valor: '10 Hz — regular', cls: 'ok' },
        { label: 'Ondas de pico', valor: 'Não detectadas', cls: 'ok' },
        { label: 'Estruturas cerebrais', valor: 'Sem alterações focais', cls: 'ok' },
        { label: 'Vascularização cerebral', valor: 'Fluxo preservado', cls: 'ok' },
      ],
      data,
      laboratorio: 'Instituto de Neuroimagem',
    };
  }
  // Genérico (hemograma, etc.)
  return {
    tipo: 'Hemograma Completo + Exames Bioquímicos',
    itens: [
      { label: 'Hemoglobina', valor: '13,8 g/dL', cls: 'ok' },
      { label: 'Leucócitos', valor: '7.200/mm³', cls: 'ok' },
      { label: 'Plaquetas', valor: '210.000/mm³', cls: 'ok' },
      { label: 'Glicemia em jejum', valor: '102 mg/dL', cls: 'atencao' },
      { label: 'Creatinina', valor: '0,9 mg/dL', cls: 'ok' },
    ],
    data,
    laboratorio: 'Laboratório Central de Análises',
  };
}

function getMockParecer(protocolo) {
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  const dataResp = protocolo.data_resposta ? formatDate(protocolo.data_resposta) : new Date().toLocaleDateString('pt-BR');

  if (esp.includes('cardio')) {
    return {
      texto: `Após análise dos exames cardiológicos realizados, verifico que o paciente apresenta função ventricular preservada com fração de ejeção dentro dos parâmetros normais.\n\nO ritmo cardíaco sinusal regular afasta arritmias de risco imediato. Recomendo manutenção da medicação atual (anti-hipertensivo) e retorno em 90 dias para reavaliação clínica.\n\nConclusão: Quadro compensado. Sem indicação de internação ou procedimento cirúrgico no momento.`,
      medico: protocolo.medico_solicitante_nome || 'Dr(a). Especialista',
      crm: protocolo.medico_solicitante_crm || 'CRM/SP 00000',
      data: dataResp,
    };
  }
  if (esp.includes('oftalmo')) {
    return {
      texto: `O paciente apresenta catarata bilateral com comprometimento significativo da acuidade visual, especialmente no olho esquerdo (20/200). O quadro clínico é consistente com catarata senil em estágio moderado-avançado.\n\nIndico procedimento cirúrgico (facoemulsificação com implante de LIO) como tratamento definitivo. Inicio pelo olho esquerdo, por ser o de maior comprometimento visual.\n\nSolicitação de agendamento cirúrgico encaminhada à central de regulação.`,
      medico: protocolo.medico_solicitante_nome || 'Dr(a). Oftalmologista',
      crm: protocolo.medico_solicitante_crm || 'CRM/SP 00000',
      data: dataResp,
    };
  }
  return {
    texto: `Após avaliação clínica completa e análise dos exames solicitados, concluo que o quadro do paciente encontra-se dentro dos parâmetros esperados para o diagnóstico em questão.\n\nRecomendo acompanhamento ambulatorial regular e manutenção das orientações terapêuticas já prescritas.\n\nRetorno programado para 60 dias ou antes em caso de agravamento dos sintomas.`,
    medico: protocolo.medico_solicitante_nome || 'Dr(a). Especialista',
    crm: protocolo.medico_solicitante_crm || 'CRM/SP 00000',
    data: dataResp,
  };
}

function isConsultaEspecialista(protocolo) {
  const tipo = (protocolo.tipo_protocolo || '').toLowerCase();
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  return tipo.includes('consulta') || (!esp.includes('clínico geral') && !esp.includes('clinico geral') && esp.length > 0);
}

// Componente de Card de Resultado de Exame
function ResultadoCard({ protocolo }) {
  const res = getMockResultados(protocolo.especialidade, protocolo.data_resposta);
  return (
    <div className="resultado-card">
      <div className="resultado-card-title">
        <FlaskConical size={18} />
        Resultado dos Exames — {res.tipo}
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
  );
}

// Componente de Parecer Médico Especialista
function ParecerCard({ protocolo }) {
  const parecer = getMockParecer(protocolo);
  return (
    <div className="parecer-card">
      <div className="parecer-card-title">
        <ClipboardList size={18} />
        Parecer do Médico Especialista
      </div>
      <div className="parecer-texto">{parecer.texto}</div>
      <div className="parecer-assinatura">
        <span><strong>{parecer.medico}</strong> — {parecer.crm}</span>
        <span>{parecer.data}</span>
      </div>
    </div>
  );
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
      setProtocolo(prev => ({ ...prev, status: novoStatus, data_resposta: new Date().toISOString().split('T')[0] }));
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

  const ehConsultaEsp = isConsultaEspecialista(protocolo);
  const mostrarResultados = ['Executado', 'Concluído'].includes(protocolo.status);

  return (
    <div className="auditor-details-page">
      <header className="dash-header-compact" style={{ 
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
        padding: '24px 0',
        boxShadow: '0 4px 15px rgba(0, 47, 108, 0.15)'
      }}>
        <div className="dash-header-compact-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <button className="btn-voltar-padrao" onClick={() => navigate('/auditor/dashboard')} aria-label="Voltar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="dash-header-left">
              <h1 className="dash-brand-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: 'white', margin: 0 }}>Saúde na Mão</h1>
              <span className="dash-brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px', color: 'white' }}>Auditoria</span>
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

              {/* AÇÕES POR STATUS */}

              {/* Status: Em análise — mostrar botões de aprovação/negação */}
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
                      onClick={() => handleUpdateStatus('Autorizado')}
                    >
                      {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle2 size={18} />}
                      Autorizar Pedido
                    </button>
                  </div>
                </div>
              )}

              {/* Status: Autorizado — mostrar badge + botão "Marcar como Executado" */}
              {protocolo.status === 'Autorizado' && (
                <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="auditor-status-readonly Autorizado">
                    <BadgeCheck size={18}/> AUTORIZADO EM {formatDate(protocolo.data_resposta)}
                  </div>
                  <button 
                    className="auditor-action-btn auditor-btn-execute"
                    style={{ flex: 'none' }}
                    disabled={updating}
                    onClick={() => handleUpdateStatus('Executado')}
                  >
                    {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <FlaskConical size={18} />}
                    Marcar como Executado
                  </button>
                </div>
              )}

              {/* Status: Executado — mostrar badge + botão "Concluir" */}
              {protocolo.status === 'Executado' && (
                <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="auditor-status-readonly Executado">
                    <FlaskConical size={18}/> EXECUTADO EM {formatDate(protocolo.data_resposta)}
                  </div>
                  <button 
                    className="auditor-action-btn auditor-btn-conclude"
                    style={{ flex: 'none' }}
                    disabled={updating}
                    onClick={() => handleUpdateStatus('Concluído')}
                  >
                    {updating ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <CheckCheck size={18} />}
                    Marcar como Concluído
                  </button>
                </div>
              )}

              {/* Status: Negado ou Concluído — mostrar badge read-only */}
              {['Negado', 'Concluído'].includes(protocolo.status) && (
                <div className="auditor-parecer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className={`auditor-status-readonly ${protocolo.status}`}>
                    {protocolo.status === 'Negado' && <XCircle size={18}/>}
                    {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                    {protocolo.status.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Card de Resultado de Exame — aparece quando Executado ou Concluído */}
            {mostrarResultados && (
              <div className="auditor-details-card">
                <ResultadoCard protocolo={protocolo} />
              </div>
            )}

            {/* Card de Parecer do Especialista — aparece quando Executado/Concluído e for consulta */}
            {mostrarResultados && ehConsultaEsp && (
              <div className="auditor-details-card">
                <ParecerCard protocolo={protocolo} />
              </div>
            )}

          </div>{/* fim auditor-right-col */}
        </div>

      </main>
    </div>
  );
}

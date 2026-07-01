import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Shield, User, Calendar, FileText,
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope,
  FlaskConical, ClipboardList, BadgeCheck, Building2
} from 'lucide-react';
import { useAuditorAuth } from '../../contexts/AuditorAuthContext';
import { getAuditorProtocolo, updateProtocoloStatus, getAnexosProtocolo, uploadAnexoProtocolo, deleteAnexoProtocolo } from '../../services/auditorApi';
import ProtocoloAnexos from '../ProtocoloAnexos';
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

/** Gera dados mocados por especialidade/procedimento */
function getMockFicha(protocolo) {
  const esp = (protocolo.especialidade || protocolo.medico_solicitante_especialidade || '').toLowerCase();
  const tipo = (protocolo.tipo_protocolo || '').toLowerCase();

  let cid = 'Z00.0';
  let procedimento = 'Consulta Médica Eletiva';
  let cnesExecutante = '2492482';
  let cnesSolicitante = '2492504';
  let unidadeExecutante = 'CENTRO DE ATENÇÃO ESPECIALIZADA À SAÚDE';
  let profissionalExecutante = protocolo.medico_solicitante_nome || 'Dr(a). Especialista';
  let risco = protocolo.prioridade || 'Eletiva';

  if (esp.includes('cardio')) {
    cid = 'I10';
    procedimento = 'Consulta em Cardiologia / Eletrocardiograma';
    unidadeExecutante = 'CENTRO ESPECIALIZADO DE CARDIOLOGIA E DIAGNÓSTICO';
    cnesExecutante = '2589031';
  } else if (esp.includes('oftalmo')) {
    cid = 'H26.9';
    procedimento = 'Consulta em Oftalmologia / Mapeamento de Retina';
    unidadeExecutante = 'CLÍNICA DE OFTALMOLOGIA VISÃO SAÚDE';
    cnesExecutante = '2589120';
  } else if (esp.includes('ortoped')) {
    cid = 'M23.2';
    procedimento = 'Consulta em Ortopedia / Ressonância Magnética Articular';
    unidadeExecutante = 'CENTRO DE DIAGNÓSTICO POR IMAGEM E ORTOPEDIA';
    cnesExecutante = '2630417';
  } else if (esp.includes('neurolog')) {
    cid = 'G40.9';
    procedimento = 'Consulta em Neurologia / Eletroencefalograma';
    unidadeExecutante = 'INSTITUTO DE NEUROLOGIA E DIAGNÓSTICO';
    cnesExecutante = '2718305';
  } else if (esp.includes('urol') || tipo.includes('urinar')) {
    cid = 'N39.0';
    procedimento = 'Consulta em Urologia / Ultrasonografia de Aparelho Urinário';
    unidadeExecutante = 'CENTRO DE ATENÇÃO ESP. À SAÚDE FRANCISCA ROMANA CHAVES';
    cnesExecutante = '2492482';
  } else if (tipo.includes('cirurgia')) {
    cid = 'K40.9';
    procedimento = 'Procedimento Cirúrgico Eletivo';
    unidadeExecutante = 'HOSPITAL REGIONAL DE REFERÊNCIA';
    cnesExecutante = '2490012';
  } else if (tipo.includes('imagem') || tipo.includes('tomografia')) {
    cid = 'R91';
    procedimento = 'Exame de Imagem / Tomografia Computadorizada';
    unidadeExecutante = 'CENTRO DE DIAGNÓSTICO POR IMAGEM';
    cnesExecutante = '2630417';
  } else if (tipo.includes('laborat') || tipo.includes('exame')) {
    cid = 'Z00.0';
    procedimento = 'Exame Laboratorial Completo / Hemograma e Bioquímica';
    unidadeExecutante = 'LABORATÓRIO CENTRAL DE ANÁLISES CLÍNICAS';
    cnesExecutante = '2498770';
  }

  const endPaciente = {
    logradouro: 'Quadra ARSE 61',
    numero: 'Lote 14',
    bairro: 'Plano Diretor Sul',
    municipio: 'Palmas - TO',
    cep: '77022-030',
  };

  const horaAtendimento = '14h00min';
  const dataHoraAtendimento = protocolo.data_resposta
    ? `${formatDate(protocolo.data_resposta)} • ${horaAtendimento}`
    : null;

  return {
    cid, risco, procedimento,
    cnesExecutante, cnesSolicitante,
    unidadeExecutante, profissionalExecutante,
    dataHoraAtendimento, endPaciente,
  };
}

function getMockResultados(especialidade, dataExecucao) {
  const data = dataExecucao ? formatDate(dataExecucao) : new Date().toLocaleDateString('pt-BR');
  const esp = (especialidade || '').toLowerCase();
  if (esp.includes('cardio')) return {
    tipo: 'Eletrocardiograma + Ecocardiograma',
    itens: [
      { label: 'Frequência Cardíaca', valor: '72 bpm', cls: 'ok' },
      { label: 'Ritmo', valor: 'Sinusal Regular', cls: 'ok' },
      { label: 'Intervalo PR', valor: '160 ms', cls: 'ok' },
      { label: 'Fração de Ejeção', valor: '58%', cls: 'ok' },
    ], data, laboratorio: 'Laboratório Cardio Diagnóstico',
  };
  if (esp.includes('oftalmo')) return {
    tipo: 'Mapeamento de Retina + Acuidade Visual',
    itens: [
      { label: 'Acuidade Visual OD', valor: '20/40 (0.5)', cls: 'atencao' },
      { label: 'Acuidade Visual OE', valor: '20/200 (0.1)', cls: 'alto' },
      { label: 'Pressão Intraocular OD', valor: '14 mmHg', cls: 'ok' },
      { label: 'Biomicroscopia', valor: 'Opacidade bilateral', cls: 'atencao' },
    ], data, laboratorio: 'Clínica Oftalmo Visão',
  };
  if (esp.includes('ortoped')) return {
    tipo: 'Raio-X + Ressonância Magnética',
    itens: [
      { label: 'Espaço articular', valor: 'Reduzido (grau II)', cls: 'atencao' },
      { label: 'Ligamento Cruzado Ant.', valor: 'Ruptura parcial', cls: 'alto' },
      { label: 'Menisco Medial', valor: 'Lesão grau I', cls: 'atencao' },
      { label: 'Cartilagem articular', valor: 'Preservada', cls: 'ok' },
    ], data, laboratorio: 'Centro de Diagnóstico por Imagem',
  };
  if (esp.includes('neurolog')) return {
    tipo: 'Eletroencefalograma + Ressonância Magnética Cerebral',
    itens: [
      { label: 'Atividade cortical', valor: 'Normal', cls: 'ok' },
      { label: 'Ondas alfa', valor: '10 Hz — regular', cls: 'ok' },
      { label: 'Estruturas cerebrais', valor: 'Sem alterações focais', cls: 'ok' },
      { label: 'Vascularização cerebral', valor: 'Fluxo preservado', cls: 'ok' },
    ], data, laboratorio: 'Instituto de Neuroimagem',
  };
  return {
    tipo: 'Hemograma Completo + Exames Bioquímicos',
    itens: [
      { label: 'Hemoglobina', valor: '13,8 g/dL', cls: 'ok' },
      { label: 'Leucócitos', valor: '7.200/mm³', cls: 'ok' },
      { label: 'Plaquetas', valor: '210.000/mm³', cls: 'ok' },
      { label: 'Glicemia em jejum', valor: '102 mg/dL', cls: 'atencao' },
      { label: 'Creatinina', valor: '0,9 mg/dL', cls: 'ok' },
    ], data, laboratorio: 'Laboratório Central de Análises',
  };
}

function getMockParecer(protocolo) {
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  const dataResp = protocolo.data_resposta ? formatDate(protocolo.data_resposta) : new Date().toLocaleDateString('pt-BR');
  if (esp.includes('cardio')) {
    return {
      texto: `Após análise dos exames cardiológicos realizados, verifico que o paciente apresenta função ventricular preservada com fração de ejeção dentro dos parâmetros normais.\n\nO ritmo cardíaco sinusal regular afasta arritmias de risco imediato. Recomendo manutenção da medicação atual (anti-hipertensivo) e retorno em 90 dias para reavaliação clínica.\n\nConclusão: Quadro compensado. Sem indicação de internação ou procedimento cirúrgico no momento.`,
      medico: protocolo.medico_solicitante_nome || 'Dr(a). Especialista',
      crm: protocolo.medico_solicitante_crm || 'CRM/TO 00000',
      data: dataResp,
    };
  }
  if (esp.includes('oftalmo')) {
    return {
      texto: `O paciente apresenta catarata bilateral com comprometimento significativo da acuidade visual, especialmente no olho esquerdo (20/200). O quadro clínico é consistente com catarata senil em estágio moderado-avançado.\n\nIndico procedimento cirúrgico (facoemulsificação com implante de LIO) como tratamento definitivo. Inicio pelo olho esquerdo, por ser o de maior comprometimento visual.\n\nSolicitação de agendamento cirúrgico encaminhada à central de regulação.`,
      medico: protocolo.medico_solicitante_nome || 'Dr(a). Oftalmologista',
      crm: protocolo.medico_solicitante_crm || 'CRM/TO 00000',
      data: dataResp,
    };
  }
  return {
    texto: `Após avaliação clínica completa e análise dos exames solicitados, concluo que o quadro do paciente encontra-se dentro dos parâmetros esperados para o diagnóstico em questão.\n\nRecomendo acompanhamento ambulatorial regular e manutenção das orientações terapêuticas já prescritas.\n\nRetorno programado para 60 dias ou antes em caso de agravamento dos sintomas.`,
    medico: protocolo.medico_solicitante_nome || 'Dr(a). Especialista',
    crm: protocolo.medico_solicitante_crm || 'CRM/TO 00000',
    data: dataResp,
  };
}

function isConsultaEspecialista(protocolo) {
  const tipo = (protocolo.tipo_protocolo || '').toLowerCase();
  const esp = (protocolo.medico_solicitante_especialidade || protocolo.especialidade || '').toLowerCase();
  return tipo.includes('consulta') || (!esp.includes('clínico geral') && !esp.includes('clinico geral') && esp.length > 0);
}

const STATUS_STYLE = {
  'Em análise': { bg: 'var(--status-analysis-bg)', color: 'var(--status-analysis)' },
  'Autorizado':  { bg: 'var(--status-autorizado-bg)', color: 'var(--status-autorizado)' },
  'Executado':   { bg: 'var(--status-executado-bg)', color: 'var(--status-executado)' },
  'Negado':      { bg: 'var(--status-negado-bg)', color: 'var(--status-negado)' },
  'Concluído':   { bg: 'var(--status-concluido-bg)', color: 'var(--status-concluido)' },
};

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
        if (data.justificativa_auditor) {
          setParecer(data.justificativa_auditor);
        }
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
      await updateProtocoloStatus(id, novoStatus, parecer);
      toast.success(`Protocolo marcado como ${novoStatus}.`);
      setProtocolo(prev => ({ 
        ...prev, 
        status: novoStatus, 
        data_resposta: new Date().toISOString().split('T')[0],
        justificativa_auditor: parecer
      }));
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

  const ficha = getMockFicha(protocolo);
  const ehConsultaEsp = isConsultaEspecialista(protocolo);
  const mostrarResultados = ['Executado', 'Concluído'].includes(protocolo.status);
  const statusStyle = STATUS_STYLE[protocolo.status] || {};
  const mostrarExecutante = ['Autorizado', 'Executado', 'Concluído'].includes(protocolo.status);

  return (
    <div className="auditor-details-page">
      {/* Header */}
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
        <div className="ficha-wrapper">

          {/* ── Chave de Confirmação ── */}
          <div className="ficha-confirmacao">
            <div>
              <div className="ficha-confirmacao-label">Chave de Confirmação</div>
              <div className="ficha-confirmacao-valor">#{String(protocolo.id).padStart(5, '0')}</div>
            </div>
            <div style={{
              padding: '6px 18px',
              borderRadius: 100,
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: statusStyle.bg,
              color: statusStyle.color,
            }}>
              {protocolo.status}
            </div>
          </div>

          {/* ── Unidade Solicitante ── */}
          <div className="ficha-section">
            <div className="ficha-section-header">
              <Building2 size={15} color="rgba(255,255,255,0.8)" />
              <h4>Unidade Solicitante</h4>
            </div>
            <div className="ficha-section-body">
              <div className="ficha-grid">
                <div className="ficha-field ficha-field--span2">
                  <span className="ficha-field-label">Unidade Solicitante</span>
                  <span className="ficha-field-value">{protocolo.paciente_unidade || 'UNIDADE DE SAÚDE DA FAMÍLIA'}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Cód. CNES</span>
                  <span className="ficha-field-value">{ficha.cnesSolicitante}</span>
                </div>
                <div className="ficha-field ficha-field--span2">
                  <span className="ficha-field-label">Op. Solicitante (Médico)</span>
                  <span className="ficha-field-value ficha-field-value--primary">
                    {protocolo.medico_solicitante_nome || '—'}
                  </span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">CRM</span>
                  <span className="ficha-field-value">{protocolo.medico_solicitante_crm || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Unidade Executante (se autorizado/executado/concluído) ── */}
          {mostrarExecutante && (
            <div className="ficha-section">
              <div className="ficha-section-header" style={{ background: 'linear-gradient(90deg, #065F46 0%, #059669 100%)' }}>
                <Stethoscope size={15} color="rgba(255,255,255,0.8)" />
                <h4>Unidade Executante</h4>
              </div>
              <div className="ficha-section-body">
                <div className="ficha-grid">
                  <div className="ficha-field ficha-field--span2">
                    <span className="ficha-field-label">Unidade Executante</span>
                    <span className="ficha-field-value ficha-field-value--primary">{ficha.unidadeExecutante}</span>
                  </div>
                  <div className="ficha-field">
                    <span className="ficha-field-label">Cód. CNES</span>
                    <span className="ficha-field-value">{ficha.cnesExecutante}</span>
                  </div>
                  <div className="ficha-field ficha-field--span2">
                    <span className="ficha-field-label">Profissional Executante</span>
                    <span className="ficha-field-value">{ficha.profissionalExecutante}</span>
                  </div>
                  {ficha.dataHoraAtendimento && (
                    <div className="ficha-field">
                      <span className="ficha-field-label">Data e Horário</span>
                      <div className="ficha-highlight-box">
                        <span className="ficha-field-value">{ficha.dataHoraAtendimento}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Dados do Paciente ── */}
          <div className="ficha-section">
            <div className="ficha-section-header">
              <User size={15} color="rgba(255,255,255,0.8)" />
              <h4>Dados do Paciente</h4>
            </div>
            <div className="ficha-section-body">
              <div className="ficha-grid">
                <div className="ficha-field ficha-field--span2">
                  <span className="ficha-field-label">Nome do Paciente</span>
                  <span className="ficha-field-value">{protocolo.paciente_nome}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">CPF</span>
                  <span className="ficha-field-value">{protocolo.paciente_cpf}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Cartão SUS</span>
                  <span className="ficha-field-value">{protocolo.cartao_sus || '—'}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Telefone</span>
                  <span className="ficha-field-value">{protocolo.telefone || '—'}</span>
                </div>
                <div className="ficha-field ficha-field--span2">
                  <span className="ficha-field-label">Logradouro</span>
                  <span className="ficha-field-value">{ficha.endPaciente.logradouro}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Número</span>
                  <span className="ficha-field-value">{ficha.endPaciente.numero}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Bairro</span>
                  <span className="ficha-field-value">{ficha.endPaciente.bairro}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">CEP</span>
                  <span className="ficha-field-value">{ficha.endPaciente.cep}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Município</span>
                  <span className="ficha-field-value">{ficha.endPaciente.municipio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dados da Solicitação ── */}
          <div className="ficha-section">
            <div className="ficha-section-header">
              <FileText size={15} color="rgba(255,255,255,0.8)" />
              <h4>Dados da Solicitação</h4>
            </div>
            <div className="ficha-section-body">
              <div className="ficha-grid ficha-grid--4">
                <div className="ficha-field">
                  <span className="ficha-field-label">Código da Solicitação</span>
                  <span className="ficha-field-value" style={{ fontFamily: 'monospace' }}>
                    {String(protocolo.id).padStart(9, '0')}
                  </span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">CID</span>
                  <span className="ficha-field-value">{protocolo.cid || ficha.cid}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Risco / Prioridade</span>
                  <span className="ficha-field-value">{ficha.risco}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Data da Solicitação</span>
                  <span className="ficha-field-value">{formatDate(protocolo.data_pedido)}</span>
                </div>
              </div>

              <hr className="ficha-divider" />

              <div className="ficha-grid">
                <div className="ficha-field ficha-field--span2">
                  <span className="ficha-field-label">Procedimentos Solicitados</span>
                  <span className="ficha-field-value ficha-field-value--primary">{protocolo.procedimentos || ficha.procedimento}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Tipo de Protocolo</span>
                  <span className="ficha-field-value">{protocolo.tipo_protocolo || protocolo.especialidade || '—'}</span>
                </div>
              </div>

              <hr className="ficha-divider" />

              <div className="ficha-field">
                <span className="ficha-field-label">Laudo / Justificativa Médica</span>
                <div className="ficha-justificativa">
                  {protocolo.descricao || 'Nenhuma descrição fornecida.'}
                </div>
              </div>

              {/* ── AÇÕES POR STATUS (Auditor) ── */}

              {/* Em análise: botões aprovar/negar */}
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

              {/* Autorizado */}
              {protocolo.status === 'Autorizado' && (
                <div className="ficha-status-block">
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

              {/* Executado */}
              {protocolo.status === 'Executado' && (
                <div className="ficha-status-block">
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

              {/* Negado ou Concluído */}
              {['Negado', 'Concluído'].includes(protocolo.status) && (
                <div className="ficha-status-block">
                  <div className={`auditor-status-readonly ${protocolo.status}`} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    {protocolo.status === 'Negado' && <XCircle size={18}/>}
                    {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                    {protocolo.status.toUpperCase()}
                  </div>
                </div>
              )}

              {protocolo.status === 'Negado' && protocolo.justificativa_auditor && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-negado-bg)', border: '1px solid var(--status-negado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-negado)' }}>
                  <strong>Sua Justificativa:</strong> {protocolo.justificativa_auditor}
                </div>
              )}
            </div>
          </div>

          {/* ── Resultado de Exames ── */}
          {mostrarResultados && (() => {
            const res = getMockResultados(protocolo.especialidade, protocolo.data_resposta);
            return (
              <div className="ficha-section">
                <div className="ficha-section-header" style={{ background: 'linear-gradient(90deg, #3730A3 0%, #6D28D9 100%)' }}>
                  <FlaskConical size={15} color="rgba(255,255,255,0.8)" />
                  <h4>Resultado dos Exames — {res.tipo}</h4>
                </div>
                <div className="ficha-section-body">
                  <div className="resultado-card" style={{ marginTop: 0, border: 'none', background: 'transparent', padding: 0 }}>
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
              </div>
            );
          })()}

          {/* ── Parecer Especialista ── */}
          {mostrarResultados && ehConsultaEsp && (() => {
            const parecerData = getMockParecer(protocolo);
            return (
              <div className="ficha-section">
                <div className="ficha-section-header" style={{ background: 'linear-gradient(90deg, #065F46 0%, #059669 100%)' }}>
                  <ClipboardList size={15} color="rgba(255,255,255,0.8)" />
                  <h4>Parecer do Médico Especialista</h4>
                </div>
                <div className="ficha-section-body">
                  <div className="ficha-justificativa">{parecerData.texto}</div>
                  <div className="parecer-assinatura" style={{ marginTop: 16 }}>
                    <span><strong>{parecerData.medico}</strong> — {parecerData.crm}</span>
                    <span>{parecerData.data}</span>
                  </div>
                </div>
              </div>
            );
          })()}



          {/* ── Anexos de Exames ── */}
          <ProtocoloAnexos
            protocoloId={protocolo.id}
            canUpload={true}
            canDelete={true}
            getAnexosFn={getAnexosProtocolo}
            uploadAnexoFn={uploadAnexoProtocolo}
            deleteAnexoFn={deleteAnexoProtocolo}
          />

        </div>
      </main>
    </div>
  );
}

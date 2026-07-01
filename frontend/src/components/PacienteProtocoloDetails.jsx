import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  User, Calendar, FileText,
  CheckCircle2, XCircle, CheckCheck, Loader2, Stethoscope, Clock,
  FlaskConical, ClipboardList, BadgeCheck, Building2, MapPin
} from 'lucide-react';
import { getProtocoloDetalhesPaciente, getAnexosProtocolo, uploadAnexoProtocolo } from '../services/api';
import ProtocoloAnexos from './ProtocoloAnexos';

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

  // Endereço do paciente (mock consistente)
  const endPaciente = {
    logradouro: 'Quadra ARSE 61',
    numero: 'Lote 14',
    bairro: 'Plano Diretor Sul',
    municipio: 'Palmas - TO',
    cep: '77022-030',
  };

  // Data/hora de atendimento (protocolo executado/autorizado)
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
    crm: protocolo.medico_solicitante_crm || 'CRM/TO 00000',
    data,
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

  const ficha = getMockFicha(protocolo);
  const mostrarResultados = ['Executado', 'Concluído'].includes(protocolo.status);
  const ehConsultaEsp = isConsultaEspecialista(protocolo);
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
        <div className="ficha-wrapper">

          {/* ── Chave de Confirmação ── */}
          <div className="ficha-confirmacao">
            <div>
              <div className="ficha-confirmacao-label">Chave de Confirmação</div>
              <div className="ficha-confirmacao-valor">#{String(protocolo.id).padStart(5, '0')}</div>
            </div>
            <div
              style={{
                padding: '6px 18px',
                borderRadius: 100,
                fontWeight: 800,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: statusStyle.bg,
                color: statusStyle.color,
              }}
            >
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
                <div className="ficha-field">
                  <span className="ficha-field-label">Telefone</span>
                  <span className="ficha-field-value">{protocolo.telefone || '—'}</span>
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

              <div className="ficha-field ficha-grid--full">
                <span className="ficha-field-label">Laudo / Justificativa</span>
                <div className="ficha-justificativa">
                  {protocolo.descricao || 'Nenhuma descrição fornecida.'}
                </div>
              </div>

              {/* Status block */}
              <div className="ficha-status-block">
                <div
                  className={`auditor-status-readonly ${protocolo.status.replace(' ', '')}`}
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {protocolo.status === 'Em análise' && <Clock size={18}/>}
                  {protocolo.status === 'Autorizado' && <BadgeCheck size={18}/>}
                  {protocolo.status === 'Executado' && <FlaskConical size={18}/>}
                  {protocolo.status === 'Negado' && <XCircle size={18}/>}
                  {protocolo.status === 'Concluído' && <CheckCheck size={18}/>}
                  Situação Atual: {protocolo.status.toUpperCase()}
                </div>
              </div>

              {/* Mensagens informativas por status */}
              {protocolo.status === 'Em análise' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-analysis-bg)', border: '1px solid var(--status-analysis)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-analysis)' }}>
                  Seu protocolo está sendo analisado pela equipe de auditoria. Aguarde.
                </div>
              )}
              {protocolo.status === 'Autorizado' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-autorizado-bg)', border: '1px solid var(--status-autorizado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-autorizado)' }}>
                  Seu protocolo foi <strong>autorizado</strong>! Em breve você receberá as instruções para realização dos exames/consulta.
                </div>
              )}
              {protocolo.status === 'Negado' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-negado-bg)', border: '1px solid var(--status-negado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-negado)' }}>
                  <p style={{ margin: '0 0 8px 0' }}>❌ Este protocolo foi <strong>negado</strong>. Em caso de dúvidas, procure a UBS onde foi solicitado.</p>
                  {protocolo.justificativa_auditor && (
                    <div style={{ borderTop: '1px solid rgba(220, 38, 38, 0.2)', paddingTop: 8, marginTop: 8 }}>
                      <strong>Justificativa do Auditor:</strong> {protocolo.justificativa_auditor}
                    </div>
                  )}
                </div>
              )}
              {protocolo.status === 'Executado' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-executado-bg)', border: '1px solid var(--status-executado)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-executado)' }}>
                  Os exames foram <strong>realizados</strong>! Confira abaixo os resultados e o parecer do especialista.
                </div>
              )}
              {protocolo.status === 'Concluído' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--status-concluido-bg)', border: '1px solid var(--status-concluido)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--status-concluido)' }}>
                  Protocolo <strong>concluído</strong>. Guarde os resultados abaixo para referência futura.
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
            const parecer = getMockParecer(protocolo);
            return (
              <div className="ficha-section">
                <div className="ficha-section-header" style={{ background: 'linear-gradient(90deg, #065F46 0%, #059669 100%)' }}>
                  <ClipboardList size={15} color="rgba(255,255,255,0.8)" />
                  <h4>Parecer do Médico Especialista</h4>
                </div>
                <div className="ficha-section-body">
                  <div className="ficha-justificativa">{parecer.texto}</div>
                  <div className="parecer-assinatura" style={{ marginTop: 16 }}>
                    <span><strong>{parecer.medico}</strong> — {parecer.crm}</span>
                    <span>{parecer.data}</span>
                  </div>
                </div>
              </div>
            );
          })()}



          {/* ── Anexos de Exames ── */}
          <ProtocoloAnexos
            protocoloId={protocolo.id}
            canUpload={true}
            canDelete={false}
            getAnexosFn={getAnexosProtocolo}
            uploadAnexoFn={uploadAnexoProtocolo}
          />

        </div>
      </main>
    </div>
  );
}

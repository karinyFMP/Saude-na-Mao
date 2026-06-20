const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'saude_na_mao_v2.db');
const db = new sqlite3.Database(DB_PATH);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function reseedProtocolos() {
  console.log('Limpando tabela de protocolos...');
  await runAsync('DELETE FROM protocolos');

  const protocolosMocados = [
    {
      paciente_id: 1,
      especialidade: 'Cardiologia',
      descricao: 'Paciente hipertenso de longa data (HA estágio II), apresentando episódios recentes de dispneia aos médios esforços e dor torácica atípica. Eletrocardiograma basal mostrou sobrecarga ventricular esquerda. Solicito ecocardiograma transtorácico para avaliação da função sistólica e diastólica, além de possível isquemia miocárdica.',
      status: 'Aprovado',
      data_pedido: '2026-04-01',
      data_resposta: '2026-04-05',
      tipo_protocolo: 'Pedido de Exame de Imagem',
      prioridade: 'Alta',
      parecer_medico: 'Risco cardiovascular elevado. O exame é imprescindível para estadiamento da doença e adequação terapêutica, visando prevenir eventos agudos maiores.',
      medico_id: 1
    },
    {
      paciente_id: 1,
      especialidade: 'Ortopedia',
      descricao: 'Paciente vítima de trauma torcional em joelho direito durante partida de futebol há 2 semanas. Apresenta falseio articular, derrame articular volumoso (+3/+4) e teste de Lachman positivo. Suspeita clínica de ruptura de Ligamento Cruzado Anterior (LCA) e possível lesão meniscal associada.',
      status: 'Em análise',
      data_pedido: '2026-04-25',
      data_resposta: null,
      tipo_protocolo: 'Encaminhamento Cirúrgico',
      prioridade: 'Eletiva',
      parecer_medico: 'A ressonância magnética é mandatória para confirmação da extensão da lesão ligamentar e programação cirúrgica ortopédica definitiva.',
      medico_id: 2
    },
    {
      paciente_id: 1,
      especialidade: 'Neurologia',
      descricao: 'Quadro de cefaleia tensional crônica refratária ao uso de analgésicos comuns e profilaxia com amitriptilina. Nas últimas semanas, evoluiu com episódios de aura visual (escotomas cintilantes) e parestesia em dimídio direito. Ausência de déficits motores focais no momento da consulta.',
      status: 'Concluído',
      data_pedido: '2026-03-10',
      data_resposta: '2026-03-20',
      tipo_protocolo: 'Encaminhamento ao Especialista',
      prioridade: 'Eletiva',
      parecer_medico: 'Devido à mudança no padrão da cefaleia e surgimento de sinais neurológicos focais transitórios, encaminho ao neurologista para descartar causas secundárias e otimizar tratamento profilático.',
      medico_id: 1
    },
    {
      paciente_id: 2,
      especialidade: 'Dermatologia',
      descricao: 'Paciente apresenta lesão pigmentada assimétrica, com bordas irregulares e coloração heterogênea (tons de marrom e preto) em região escapular esquerda, medindo cerca de 8mm de diâmetro. Relata leve prurido local. Dermatoscopia sugere rede pigmentar atípica.',
      status: 'Em análise',
      data_pedido: '2026-04-28',
      data_resposta: null,
      tipo_protocolo: 'Procedimento Ambulatorial',
      prioridade: 'Urgente',
      parecer_medico: 'Alta suspeita clínica e dermatoscópica para Melanoma Extensivo Superficial. Solicito biópsia excisional com urgência para diagnóstico histopatológico e estadiamento precoce.',
      medico_id: 4
    },
    {
      paciente_id: 2,
      especialidade: 'Gastroenterologia',
      descricao: 'Queixa de pirose retroesternal diária, regurgitação ácida e plenitude pós-prandial há 6 meses. Relata episódios esporádicos de disfagia para sólidos nas últimas duas semanas. Perda ponderal não intencional de 3kg no período. Uso prévio de IBPs sem melhora sustentada.',
      status: 'Aprovado',
      data_pedido: '2026-05-02',
      data_resposta: '2026-05-04',
      tipo_protocolo: 'Pedido de Exame Endoscópico',
      prioridade: 'Alta',
      parecer_medico: 'Presença de sintomas de alarme (disfagia e perda ponderal) em paciente com doença do refluxo gastroesofágico refratária. Endoscopia digestiva alta indicada com brevidade para afastar neoplasia ou complicações como estenose péptica.',
      medico_id: 5
    },
    {
      paciente_id: 1,
      especialidade: 'Oftalmologia',
      descricao: 'Paciente idoso relata baixa acuidade visual progressiva e indolor em ambos os olhos, pior à esquerda, ao longo do último ano. Dificuldade severa para leitura e ofuscamento noturno. Avaliação preliminar com oftalmoscópio direto mostra opacidade do cristalino bilateral.',
      status: 'Em análise',
      data_pedido: '2026-05-15',
      data_resposta: null,
      tipo_protocolo: 'Encaminhamento Cirúrgico',
      prioridade: 'Eletiva',
      parecer_medico: 'Catarata senil bilateral com impacto significativo nas atividades de vida diária. Encaminho para avaliação oftalmológica especializada visando indicação de facectomia com implante de lente intraocular.',
      medico_id: 1
    },
    {
      paciente_id: 2,
      especialidade: 'Endocrinologia',
      descricao: 'Acompanhamento de Diabetes Mellitus tipo 2 há 5 anos. Exames laboratoriais recentes revelam HbA1c de 9.5%, glicemia de jejum de 210 mg/dL e microalbuminúria positiva (150 mg/g de creatinina). Otimizada dose de metformina e introduzida gliclazida, sem alcance do alvo terapêutico.',
      status: 'Negado',
      data_pedido: '2026-04-15',
      data_resposta: '2026-04-18',
      tipo_protocolo: 'Dispensação de Medicamento Especial',
      prioridade: 'Eletiva',
      parecer_medico: 'Devido à falha secundária aos antidiabéticos orais tradicionais e nefropatia diabética incipiente, solicito liberação de inibidor de SGLT2 (Dapagliflozina) para proteção cardiorrenal e controle glicêmico.',
      medico_id: 6
    }
  ];

  console.log('Inserindo novos protocolos com descrições ricas...');
  for (const p of protocolosMocados) {
    await runAsync(
      `INSERT INTO protocolos 
      (paciente_id, especialidade, descricao, status, data_pedido, data_resposta, tipo_protocolo, prioridade, parecer_medico, medico_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.paciente_id, p.especialidade, p.descricao, p.status, p.data_pedido, p.data_resposta, p.tipo_protocolo, p.prioridade, p.parecer_medico, p.medico_id]
    );
  }
  
  console.log('Protocolos reinseridos com sucesso!');
}

reseedProtocolos().then(() => db.close()).catch(console.error);

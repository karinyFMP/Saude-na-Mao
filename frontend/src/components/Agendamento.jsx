import { useState, useEffect } from 'react';
import { getMedicos, getUBS, agendarConsulta } from '../services/api';
import './Agendamento.css';

export default function Agendamento({ paciente, onBack, onSuccess }) {
  const [medicos, setMedicos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    especialidade: 'Clínico Geral',
    medico: '',
    unidade: '',
    data: '',
    horario: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.especialidade && form.unidade) {
      getMedicos(form.especialidade, form.unidade).then(setMedicos).catch(() => {});
      setForm((prev) => ({ ...prev, medico: '' }));
    } else {
      setMedicos([]);
      setForm((prev) => ({ ...prev, medico: '' }));
    }
  }, [form.especialidade, form.unidade]);

  const loadData = async () => {
    try {
      const ubs = await getUBS();
      setUnidades(ubs);
    } catch (err) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { especialidade, medico, data, horario, unidade } = form;

    if (!especialidade || !unidade || !medico || !data || !horario) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErro('');

    try {
      await agendarConsulta({
        paciente_id: paciente.id,
        medico,
        especialidade,
        data,
        horario,
        unidade: unidade || 'UBS Central',
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate available time slots
  const timeSlots = [];
  for (let h = 7; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Min date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="agend-loading">
        <div className="agend-loading-spinner" />
        <p>Carregando formulário...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="agend-success">
        <div className="agend-success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Consulta Agendada!</h2>
        <p>Sua consulta foi registrada com sucesso. Você será redirecionado ao início.</p>
      </div>
    );
  }

  return (
    <div className="agendamento">
      {/* Header */}
      <header className="agend-header">
        <button className="agend-back" onClick={onBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="agend-title">Agendar Consulta</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* Form */}
      <main className="agend-main">
        <form className="agend-form" onSubmit={handleSubmit}>
          {/* Info card */}
          <div className="agend-info-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p>Selecione a Unidade de Saúde, médico, data e horário para sua consulta.</p>
          </div>

          {erro && (
            <div className="agend-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{erro}</span>
            </div>
          )}

          {/* Unidade */}
          <div className="agend-field">
            <label htmlFor="unidade">
              Unidade de Saúde <span className="agend-required">*</span>
            </label>
            <select
              id="unidade"
              name="unidade"
              value={form.unidade}
              onChange={handleChange}
            >
              <option value="">Selecione a Unidade de Saúde</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.nome}>{u.nome}</option>
              ))}
            </select>
          </div>

          {/* Médico */}
          <div className="agend-field">
            <label htmlFor="medico">
              Médico(a) <span className="agend-required">*</span>
            </label>
            <select
              id="medico"
              name="medico"
              value={form.medico}
              onChange={handleChange}
              disabled={!form.unidade}
            >
              <option value="">
                {form.unidade ? 'Selecione o médico Clínico Geral' : 'Selecione uma Unidade de Saúde primeiro'}
              </option>
              {medicos.map((med) => (
                <option key={med.id} value={med.nome}>
                  {med.nome} — {med.unidade_nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data e Horário — lado a lado */}
          <div className="agend-row">
            <div className="agend-field">
              <label htmlFor="data">
                Data <span className="agend-required">*</span>
              </label>
              <input
                type="date"
                id="data"
                name="data"
                value={form.data}
                onChange={handleChange}
                min={minDate}
              />
            </div>

            <div className="agend-field">
              <label htmlFor="horario">
                Horário <span className="agend-required">*</span>
              </label>
              <select
                id="horario"
                name="horario"
                value={form.horario}
                onChange={handleChange}
              >
                <option value="">Selecione</option>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="agend-submit"
            disabled={submitting}
            id="btn-agendar-submit"
          >
            {submitting ? (
              <div className="agend-spinner" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="12" y1="14" x2="12" y2="18"/>
                  <line x1="10" y1="16" x2="14" y2="16"/>
                </svg>
                Confirmar Agendamento
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

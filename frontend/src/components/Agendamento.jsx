import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Loader2, Calendar, Clock, MapPin, Stethoscope, ChevronLeft, CheckCircle2 } from 'lucide-react';

import { getMedicos, getUBS, agendarConsulta } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { agendamentoSchema } from '../schemas/agendamentoSchema';
import './Agendamento.css';

export default function Agendamento() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [medicos, setMedicos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      especialidade: 'Clínico Geral',
      medico: '',
      unidade: '',
      data: '',
      horario: '',
    },
  });

  const selectedUnidade = watch('unidade');
  const selectedEspecialidade = watch('especialidade');

  useEffect(() => {
    const loadData = async () => {
      try {
        const ubs = await getUBS();
        setUnidades(ubs);
      } catch (err) {
        toast.error('Erro ao carregar unidades de saúde.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEspecialidade && selectedUnidade) {
      getMedicos(selectedEspecialidade, selectedUnidade)
        .then(setMedicos)
        .catch(() => setMedicos([]));
      setValue('medico', ''); // Resetar médico ao mudar unidade
    } else {
      setMedicos([]);
      setValue('medico', '');
    }
  }, [selectedEspecialidade, selectedUnidade, setValue]);

  const onSubmit = async (data) => {
    if (!user) return;

    try {
      await agendarConsulta({
        paciente_id: user.id,
        medico: data.medico,
        especialidade: data.especialidade,
        data: data.data,
        horario: data.horario,
        unidade: data.unidade || 'UBS Central',
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      // O interceptor do axios exibe o erro
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
        <Loader2 className="agend-loading-spinner" size={32} />
        <p>Carregando formulário...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="agend-success">
        <div className="agend-success-icon">
          <CheckCircle2 size={64} color="white" />
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
        <button className="agend-back" onClick={() => navigate('/dashboard')} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <h1 className="agend-title">Agendar Consulta</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* Form */}
      <main className="agend-main">
        <form className="agend-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Info card */}
          <div className="agend-info-card">
            <p>Selecione a Unidade de Saúde, médico, data e horário para sua consulta de Clínico Geral.</p>
          </div>

          {/* Unidade */}
          <div className="agend-field">
            <label htmlFor="unidade">
              Unidade de Saúde <span className="agend-required">*</span>
            </label>
            <div className={`agend-input-wrapper ${errors.unidade ? 'error' : ''}`}>
              <MapPin size={18} className="agend-input-icon" />
              <select id="unidade" {...register('unidade')}>
                <option value="">Selecione a Unidade de Saúde</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.nome}>{u.nome}</option>
                ))}
              </select>
            </div>
            {errors.unidade && <span className="field-error">{errors.unidade.message}</span>}
          </div>

          {/* Médico */}
          <div className="agend-field">
            <label htmlFor="medico">
              Médico(a) <span className="agend-required">*</span>
            </label>
            <div className={`agend-input-wrapper ${errors.medico ? 'error' : ''}`}>
              <Stethoscope size={18} className="agend-input-icon" />
              <select id="medico" {...register('medico')} disabled={!selectedUnidade}>
                <option value="">
                  {selectedUnidade ? 'Selecione o médico Clínico Geral' : 'Selecione uma Unidade de Saúde primeiro'}
                </option>
                {medicos.map((med) => (
                  <option key={med.id} value={med.nome}>
                    {med.nome} — {med.unidade_nome}
                  </option>
                ))}
              </select>
            </div>
            {errors.medico && <span className="field-error">{errors.medico.message}</span>}
          </div>

          {/* Data e Horário — lado a lado */}
          <div className="agend-row">
            <div className="agend-field">
              <label htmlFor="data">
                Data <span className="agend-required">*</span>
              </label>
              <div className={`agend-input-wrapper ${errors.data ? 'error' : ''}`}>
                <Calendar size={18} className="agend-input-icon" />
                <input
                  type="date"
                  id="data"
                  min={minDate}
                  {...register('data')}
                />
              </div>
              {errors.data && <span className="field-error">{errors.data.message}</span>}
            </div>

            <div className="agend-field">
              <label htmlFor="horario">
                Horário <span className="agend-required">*</span>
              </label>
              <div className={`agend-input-wrapper ${errors.horario ? 'error' : ''}`}>
                <Clock size={18} className="agend-input-icon" />
                <select id="horario" {...register('horario')}>
                  <option value="">Selecione</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {errors.horario && <span className="field-error">{errors.horario.message}</span>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="agend-submit"
            disabled={isSubmitting}
            id="btn-agendar-submit"
          >
            {isSubmitting ? (
              <Loader2 className="agend-spinner" size={20} />
            ) : (
              'Confirmar Agendamento'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

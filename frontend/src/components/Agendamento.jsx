import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Loader2, Calendar, Clock, MapPin, Stethoscope, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

import { getMedicos, getUBS, getHorariosOcupados, agendarConsulta } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { agendamentoSchema } from '../schemas/agendamentoSchema';
import './Agendamento.css';

export default function Agendamento() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [medicos, setMedicos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
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
      medico: '',
      unidade: '',
      data: '',
      horario: '',
    },
  });

  const selectedUnidade = watch('unidade');
  const selectedMedico = watch('medico');
  const selectedData = watch('data');

  useEffect(() => {
    const loadData = async () => {
      try {
        const ubs = await getUBS();
        setUnidades(ubs);
      } catch (err) {
        toast.error('Erro ao carregar dados do formulário.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUnidade) {
      getMedicos(undefined, selectedUnidade)
        .then(setMedicos)
        .catch(() => setMedicos([]));
      setValue('medico', ''); // Resetar médico ao mudar unidade
    } else {
      setMedicos([]);
      setValue('medico', '');
    }
  }, [selectedUnidade, setValue]);

  useEffect(() => {
    if (selectedMedico && selectedData) {
      setLoadingHorarios(true);
      getHorariosOcupados(selectedMedico, selectedData)
        .then((ocupados) => {
          setHorariosOcupados(ocupados);
          // Se o horário já escolhido acabou de ficar indisponível, limpa a seleção
          const horarioAtual = watch('horario');
          if (horarioAtual && ocupados.includes(horarioAtual)) {
            setValue('horario', '');
            toast.warning('O horário selecionado ficou indisponível. Escolha outro.');
          }
        })
        .catch(() => setHorariosOcupados([]))
        .finally(() => setLoadingHorarios(false));
    } else {
      setHorariosOcupados([]);
    }
  }, [selectedMedico, selectedData]);

  const onSubmit = async (data) => {
    if (!user) return;

    const medicoSelecionado = medicos.find((m) => m.nome === data.medico);

    try {
      await agendarConsulta({
        paciente_id: user.id,
        medico: data.medico,
        especialidade: medicoSelecionado?.especialidade || 'Clínico Geral',
        data: data.data,
        horario: data.horario,
        unidade: data.unidade || 'UBS Central',
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      // Se o conflito foi por horário já ocupado, atualiza a lista na hora
      if (err?.response?.status === 409 && data.medico && data.data) {
        getHorariosOcupados(data.medico, data.data)
          .then(setHorariosOcupados)
          .catch(() => {});
        setValue('horario', '');
      }
      // O interceptor do axios já exibe a mensagem de erro
    }
  };

  // Generate available time slots, removendo os já ocupados pelo médico selecionado
  const timeSlots = [];
  for (let h = 7; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }
  const horariosDisponiveis = timeSlots.filter((t) => !horariosOcupados.includes(t));

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
        <button className="btn-voltar-padrao" onClick={() => navigate('/dashboard')} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="agend-title">Agendar Consulta</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* Form */}
      <main className="agend-main">
        <form className="agend-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Info card */}
          <div className="agend-info-card">
            <p>Selecione a Unidade de Saúde, o médico, a data e o horário para sua consulta.</p>
          </div>

          {/* Unidade */}
          <div className="agend-field">
            <label htmlFor="unidade" className={errors.unidade ? 'error-label' : ''}>
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
            {errors.unidade && <span className="field-error"><AlertCircle size={14} /> {errors.unidade.message}</span>}
          </div>

          {/* Médico */}
          <div className="agend-field">
            <label htmlFor="medico" className={errors.medico ? 'error-label' : ''}>
              Médico(a) <span className="agend-required">*</span>
            </label>
            <div className={`agend-input-wrapper ${errors.medico ? 'error' : ''}`}>
              <Stethoscope size={18} className="agend-input-icon" />
              <select id="medico" {...register('medico')} disabled={!selectedUnidade}>
                <option value="">
                  {!selectedUnidade
                    ? 'Selecione uma Unidade de Saúde primeiro'
                    : 'Selecione o médico(a)'}
                </option>
                {medicos.map((med) => (
                  <option key={med.id} value={med.nome}>
                    {med.nome} — {med.especialidade}
                  </option>
                ))}
              </select>
            </div>
            {errors.medico && <span className="field-error"><AlertCircle size={14} /> {errors.medico.message}</span>}
          </div>

          {/* Data e Horário — lado a lado */}
          <div className="agend-row">
            <div className="agend-field">
              <label htmlFor="data" className={errors.data ? 'error-label' : ''}>
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
              {errors.data && <span className="field-error"><AlertCircle size={14} /> {errors.data.message}</span>}
            </div>

            <div className="agend-field">
              <label htmlFor="horario" className={errors.horario ? 'error-label' : ''}>
                Horário <span className="agend-required">*</span>
              </label>
              <div className={`agend-input-wrapper ${errors.horario ? 'error' : ''}`}>
                <Clock size={18} className="agend-input-icon" />
                <select
                  id="horario"
                  {...register('horario')}
                  disabled={!selectedMedico || !selectedData || loadingHorarios}
                >
                  <option value="">
                    {!selectedMedico || !selectedData
                      ? 'Selecione médico e data primeiro'
                      : loadingHorarios
                      ? 'Carregando horários...'
                      : horariosDisponiveis.length === 0
                      ? 'Nenhum horário disponível'
                      : 'Selecione'}
                  </option>
                  {horariosDisponiveis.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {selectedMedico && selectedData && !loadingHorarios && horariosOcupados.length > 0 && (
                <span className="agend-hint">{horariosOcupados.length} horário(s) já reservado(s) nesse dia.</span>
              )}
              {errors.horario && <span className="field-error"><AlertCircle size={14} /> {errors.horario.message}</span>}
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

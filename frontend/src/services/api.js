import axios from 'axios';
import { toast } from 'react-toastify';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respostas para tratamento global de erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros de rede ou timeout
    if (!error.response) {
      toast.error('Erro de conexão. Verifique sua rede e o servidor.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data;

    // Erros previstos pela API
    if (status >= 400 && status < 500) {
      toast.warning(data.error || 'Requisição inválida.');
    } else if (status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    }

    return Promise.reject(error);
  }
);

// Métodos adicionais da API
export async function getDashboard(pacienteId) {
  const response = await api.get(`/dashboard/${pacienteId}`);
  return response.data;
}

export async function agendarConsulta(dados) {
  const response = await api.post('/agendar', dados);
  return response.data;
}

export async function getUBS() {
  const response = await api.get('/ubs');
  return response.data;
}

export async function getMedicos(especialidade, unidade) {
  const response = await api.get('/medicos', {
    params: { especialidade, unidade }
  });
  return response.data;
}

export async function getEspecialidades() {
  const response = await api.get('/especialidades');
  return response.data;
}

export async function cancelarConsulta(id) {
  const response = await api.delete(`/consultas/${id}`);
  return response.data;
}

export async function getProtocolos(pacienteId) {
  const response = await api.get(`/protocolos/${pacienteId}`);
  return response.data;
}

export async function getProtocoloDetalhesPaciente(id) {
  const response = await api.get(`/protocolo/${id}`);
  return response.data;
}

export async function updatePaciente(pacienteId, dados) {
  const response = await api.put(`/pacientes/${pacienteId}`, dados);
  return response.data;
}

export async function getAnexosProtocolo(protocoloId) {
  const response = await api.get(`/protocolos/${protocoloId}/anexos`);
  return response.data;
}

export async function uploadAnexoProtocolo(protocoloId, file) {
  const formData = new FormData();
  formData.append('arquivo', file);
  const response = await api.post(`/protocolos/${protocoloId}/anexos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteAnexoProtocolo(protocoloId, anexoId) {
  const response = await api.delete(`/protocolos/${protocoloId}/anexos/${anexoId}`);
  return response.data;
}

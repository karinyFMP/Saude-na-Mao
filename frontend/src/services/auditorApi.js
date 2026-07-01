import axios from 'axios';

const BASE_URL = 'https://saude-na-mao-qt2w.onrender.com/api';

// Instância dedicada para chamadas de auditoria (com token JWT)
export const auditorApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token automaticamente em chamadas de auditoria
auditorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SaudeNaMao:servidor_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export async function auditorLogin(cpf, senha) {
  const response = await auditorApi.post('/servidor/login', { cpf, senha });
  return response.data;
}

export async function getAuditorProtocolos(filtros = {}) {
  const params = {};
  if (filtros.status && filtros.status !== 'Todos') params.status = filtros.status;
  if (filtros.paciente) params.paciente = filtros.paciente;

  const response = await auditorApi.get('/auditor/protocolos', { params });
  return response.data;
}

export async function getAuditorProtocolo(id) {
  const response = await auditorApi.get(`/auditor/protocolos/${id}`);
  return response.data;
}

export async function updateProtocoloStatus(id, status, justificativa_auditor) {
  const response = await auditorApi.put(`/auditor/protocolos/${id}`, { status, justificativa_auditor });
  return response.data;
}

// --- Anexos ---
export async function getAnexosProtocolo(protocoloId) {
  const response = await auditorApi.get(`/protocolos/${protocoloId}/anexos`);
  return response.data;
}

export async function uploadAnexoProtocolo(protocoloId, file) {
  const formData = new FormData();
  formData.append('arquivo', file);
  const response = await auditorApi.post(`/protocolos/${protocoloId}/anexos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteAnexoProtocolo(protocoloId, anexoId) {
  const response = await auditorApi.delete(`/protocolos/${protocoloId}/anexos/${anexoId}`);
  return response.data;
}

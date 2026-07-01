import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Instância dedicada para chamadas do MÉDICO (com token JWT)
export const medicoApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token automaticamente em todas as chamadas do médico
medicoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SaudeNaMao:medico_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export async function medicoLogin(crm, senha) {
  const response = await medicoApi.post('/medico/login', { crm, senha });
  return response.data;
}

// --- Protocolos ---
export async function criarProtocolo(dados) {
  const response = await medicoApi.post('/medico/protocolos', dados);
  return response.data;
}

export async function getMeusProtocolos(filtros = {}) {
  const response = await medicoApi.get('/medico/protocolos', { params: filtros });
  return response.data;
}

export async function getProtocoloDetalhes(id) {
  const response = await medicoApi.get(`/medico/protocolos/${id}`);
  return response.data;
}

// --- Pacientes ---
export async function buscarPaciente(cpf) {
  const response = await medicoApi.get(`/medico/pacientes/${cpf}`);
  return response.data;
}

// --- Anexos ---
export async function getAnexosProtocolo(protocoloId) {
  const response = await medicoApi.get(`/protocolos/${protocoloId}/anexos`);
  return response.data;
}

export async function uploadAnexoProtocolo(protocoloId, file) {
  const formData = new FormData();
  formData.append('arquivo', file);
  const response = await medicoApi.post(`/protocolos/${protocoloId}/anexos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteAnexoProtocolo(protocoloId, anexoId) {
  const response = await medicoApi.delete(`/protocolos/${protocoloId}/anexos/${anexoId}`);
  return response.data;
}

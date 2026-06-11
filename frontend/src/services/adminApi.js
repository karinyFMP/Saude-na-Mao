import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Instância dedicada para chamadas administrativas (com token JWT)
export const adminApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token automaticamente em chamadas admin
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SaudeNaMao:servidor_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export async function adminLogin(cpf, senha) {
  const response = await adminApi.post('/servidor/login', { cpf, senha });
  return response.data;
}

export async function getAdminProtocolos(filtros = {}) {
  const params = {};
  if (filtros.status && filtros.status !== 'Todos') params.status = filtros.status;
  if (filtros.paciente) params.paciente = filtros.paciente;

  const response = await adminApi.get('/admin/protocolos', { params });
  return response.data;
}

export async function getAdminProtocolo(id) {
  const response = await adminApi.get(`/admin/protocolos/${id}`);
  return response.data;
}

export async function updateProtocoloStatus(id, status) {
  const response = await adminApi.put(`/admin/protocolos/${id}`, { status });
  return response.data;
}

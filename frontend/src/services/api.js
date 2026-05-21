const API_URL = 'http://localhost:3001/api';

export async function login(cpf, senha) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, senha }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');
  return data;
}

export async function register(nome, cpf, senha, cartao_sus) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      nome, 
      cpf, 
      senha, 
      cartao_sus 
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar.');
  return data;
}

export async function getDashboard(pacienteId) {
  const res = await fetch(`${API_URL}/dashboard/${pacienteId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar dados.');
  return data;
}

export async function agendarConsulta(dados) {
  const res = await fetch(`${API_URL}/agendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao agendar consulta.');
  return data;
}

export async function getUBS() {
  const res = await fetch(`${API_URL}/ubs`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar unidades.');
  return data;
}

export async function getMedicos(especialidade, unidade) {
  let url = `${API_URL}/medicos`;
  const params = new URLSearchParams();
  if (especialidade) params.append('especialidade', especialidade);
  if (unidade) params.append('unidade', unidade);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar médicos.');
  return data;
}

export async function getEspecialidades() {
  const res = await fetch(`${API_URL}/especialidades`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar especialidades.');
  return data;
}

export async function cancelarConsulta(id) {
  const res = await fetch(`${API_URL}/consultas/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao cancelar consulta.');
  return data;
}

export async function getProtocolos(pacienteId) {
  const res = await fetch(`${API_URL}/protocolos/${pacienteId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar protocolos.');
  return data;
}

export async function updatePaciente(pacienteId, dados) {
  const res = await fetch(`${API_URL}/pacientes/${pacienteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil.');
  return data;
}

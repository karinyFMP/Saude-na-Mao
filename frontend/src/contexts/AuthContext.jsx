import { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar o utilizador do localStorage ao carregar
    const storedUser = localStorage.getItem('@SaudeNaMao:user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (cpf, senha) => {
    const response = await api.post('/login', { cpf, senha });
    const { paciente } = response.data;
    setUser(paciente);
    localStorage.setItem('@SaudeNaMao:user', JSON.stringify(paciente));
  };

  const register = async (userData) => {
    const response = await api.post('/register', userData);
    const { paciente } = response.data;
    setUser(paciente);
    localStorage.setItem('@SaudeNaMao:user', JSON.stringify(paciente));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@SaudeNaMao:user');
  };

  const updateUser = (updatedPaciente) => {
    setUser(updatedPaciente);
    localStorage.setItem('@SaudeNaMao:user', JSON.stringify(updatedPaciente));
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

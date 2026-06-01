import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Agendamento from './components/Agendamento';
import Protocolos from './components/Protocolos';
import UnidadesSaude from './components/UnidadesSaude';
import Perfil from './components/Perfil';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signed ? children : <Navigate to="/login" replace />;
};

function App() {
  const { signed, user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(`/${path}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-wrapper">
      <Routes>
        <Route 
          path="/login" 
          element={signed ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard 
                paciente={user} 
                onNavigate={handleNavigate} 
                onLogout={handleLogout} 
              />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/agendamento" 
          element={
            <PrivateRoute>
              <Agendamento />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/protocolos" 
          element={
            <PrivateRoute>
              <Protocolos 
                paciente={user} 
                onBack={() => handleNavigate('dashboard')} 
              />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
            <PrivateRoute>
              <Perfil 
                paciente={user} 
                onBack={() => handleNavigate('dashboard')} 
                onUpdatePaciente={updateUser} 
              />
            </PrivateRoute>
          } 
        />
        {/* Unidades de saúde pode ser acessada publicamente ou privadamente */}
        <Route path="/unidades" element={<UnidadesSaude onBack={() => navigate(-1)} />} />

        {/* Redirecionamento default */}
        <Route path="*" element={<Navigate to={signed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;

import { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Agendamento from './components/Agendamento';
import Protocolos from './components/Protocolos';
import UnidadesSaude from './components/UnidadesSaude';
import Perfil from './components/Perfil';

function App() {
  const [page, setPage] = useState('login');
  const [paciente, setPaciente] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = (dadosPaciente) => {
    setPaciente(dadosPaciente);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setPaciente(null);
    setPage('login');
  };

  const handleNavigate = (pageName) => {
    setPage(pageName);
  };

  const handleRefreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
    setPage('dashboard');
  };

  return (
    <div className="app-wrapper">
      {page === 'login' && <Login onLogin={handleLogin} />}

      {page === 'dashboard' && paciente && (
        <Dashboard
          paciente={paciente}
          refreshKey={refreshKey}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {page === 'agendamento' && paciente && (
        <Agendamento
          paciente={paciente}
          onBack={() => handleNavigate('dashboard')}
          onSuccess={handleRefreshDashboard}
        />
      )}

      {page === 'protocolos' && paciente && (
        <Protocolos
          paciente={paciente}
          onBack={() => handleNavigate('dashboard')}
        />
      )}

      {page === 'unidades' && (
        <UnidadesSaude
          onBack={() => handleNavigate(paciente ? 'dashboard' : 'login')}
        />
      )}

      {page === 'perfil' && paciente && (
        <Perfil 
          paciente={paciente} 
          onBack={() => handleNavigate('dashboard')} 
        />
      )}
    </div>
  );
}

export default App;

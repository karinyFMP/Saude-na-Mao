import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { AuditorAuthProvider, useAuditorAuth } from './contexts/AuditorAuthContext';
import { MedicoAuthProvider, useMedicoAuth } from './contexts/MedicoAuthContext';

import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Agendamento from './components/Agendamento';
import Protocolos from './components/Protocolos';
import UnidadesSaude from './components/UnidadesSaude';
import Perfil from './components/Perfil';
import PacienteProtocoloDetails from './components/PacienteProtocoloDetails';
import AuditorLogin from './components/auditor/AuditorLogin';
import AuditorDashboard from './components/auditor/AuditorDashboard';
import AuditorProtocoloDetails from './components/auditor/AuditorProtocoloDetails';
import MedicoLogin from './components/medico/MedicoLogin';
import CadastroMedico from './components/medico/CadastroMedico';
import PainelMedico from './components/medico/PainelMedico';
import MedicoProtocoloDetails from './components/medico/MedicoProtocoloDetails';

// Componente para proteger rotas privadas do PACIENTE (sem alteração)
const PrivateRoute = ({ children }) => {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signed ? children : <Navigate to="/login" replace />;
};

// Componente para proteger rotas do SERVIDOR/AUDITOR (isolado do PrivateRoute)
const AuditorRoute = ({ children }) => {
  const { signedAuditor, loadingAuditor } = useAuditorAuth();

  if (loadingAuditor) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signedAuditor ? children : <Navigate to="/auditor/login" replace />;
};

// Componente para proteger rotas do MÉDICO (Clínico Geral e Especialista)
const MedicoRoute = ({ children }) => {
  const { signedMedico, loadingMedico } = useMedicoAuth();

  if (loadingMedico) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signedMedico ? children : <Navigate to="/medico/login" replace />;
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
        {/* ============================================================
            ROTAS DO PACIENTE — Sem alteração
            ============================================================ */}
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
          path="/protocolo/:id" 
          element={
            <PrivateRoute>
              <PacienteProtocoloDetails />
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

        {/* ============================================================
            ROTAS DO SERVIDOR — Isoladas, envolvidas no AuditorAuthProvider
            ============================================================ */}
        <Route
          path="/auditor/login"
          element={
            <AuditorAuthProvider>
              <AuditorLoginWrapper />
            </AuditorAuthProvider>
          }
        />
        <Route
          path="/auditor/dashboard"
          element={
            <AuditorAuthProvider>
              <AuditorRoute>
                <AuditorDashboard />
              </AuditorRoute>
            </AuditorAuthProvider>
          }
        />
        <Route
          path="/auditor/protocolo/:id"
          element={
            <AuditorAuthProvider>
              <AuditorRoute>
                <AuditorProtocoloDetails />
              </AuditorRoute>
            </AuditorAuthProvider>
          }
        />

        {/* ============================================================
            ROTAS DO MÉDICO — Clínico Geral e Especialista
            ============================================================ */}
        <Route
          path="/medico/login"
          element={
            <MedicoAuthProvider>
              <MedicoLoginWrapper />
            </MedicoAuthProvider>
          }
        />
        <Route
          path="/medico/cadastro"
          element={
            <MedicoAuthProvider>
              <CadastroMedico />
            </MedicoAuthProvider>
          }
        />
        <Route
          path="/medico/dashboard"
          element={
            <MedicoAuthProvider>
              <MedicoRoute>
                <PainelMedico />
              </MedicoRoute>
            </MedicoAuthProvider>
          }
        />
        <Route
          path="/medico/protocolo/:id"
          element={
            <MedicoAuthProvider>
              <MedicoRoute>
                <MedicoProtocoloDetails />
              </MedicoRoute>
            </MedicoAuthProvider>
          }
        />

        {/* Redirecionamento default */}
        <Route path="*" element={<Navigate to={signed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

// Wrapper para redirecionar servidor/auditor já logado ao acessar /auditor/login
function AuditorLoginWrapper() {
  const { signedAuditor, loadingAuditor } = useAuditorAuth();
  if (loadingAuditor) return <div className="loading-spinner">Carregando...</div>;
  return signedAuditor ? <Navigate to="/auditor/dashboard" replace /> : <AuditorLogin />;
}

// Wrapper para redirecionar médico já logado ao acessar /medico/login
function MedicoLoginWrapper() {
  const { signedMedico, loadingMedico } = useMedicoAuth();
  if (loadingMedico) return <div className="loading-spinner">Carregando...</div>;
  return signedMedico ? <Navigate to="/medico/dashboard" replace /> : <MedicoLogin />;
}

export default App;

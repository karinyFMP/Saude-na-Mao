import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';

import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Agendamento from './components/Agendamento';
import Protocolos from './components/Protocolos';
import UnidadesSaude from './components/UnidadesSaude';
import Perfil from './components/Perfil';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProtocoloDetails from './components/admin/AdminProtocoloDetails';

// Componente para proteger rotas privadas do PACIENTE (sem alteração)
const PrivateRoute = ({ children }) => {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signed ? children : <Navigate to="/login" replace />;
};

// Componente para proteger rotas do SERVIDOR (isolado do PrivateRoute)
const AdminRoute = ({ children }) => {
  const { signedAdmin, loadingAdmin } = useAdminAuth();

  if (loadingAdmin) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  return signedAdmin ? children : <Navigate to="/admin/login" replace />;
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
            ROTAS DO SERVIDOR — Isoladas, envolvidas no AdminAuthProvider
            ============================================================ */}
        <Route
          path="/admin/login"
          element={
            <AdminAuthProvider>
              <AdminLoginWrapper />
            </AdminAuthProvider>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminAuthProvider>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </AdminAuthProvider>
          }
        />
        <Route
          path="/admin/protocolo/:id"
          element={
            <AdminAuthProvider>
              <AdminRoute>
                <AdminProtocoloDetails />
              </AdminRoute>
            </AdminAuthProvider>
          }
        />

        {/* Redirecionamento default */}
        <Route path="*" element={<Navigate to={signed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

// Wrapper para redirecionar servidor já logado ao acessar /admin/login
function AdminLoginWrapper() {
  const { signedAdmin, loadingAdmin } = useAdminAuth();
  if (loadingAdmin) return <div className="loading-spinner">Carregando...</div>;
  return signedAdmin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />;
}

export default App;

import { createContext, useState, useEffect, useContext } from 'react';

export const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const [servidor, setServidor] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const storedServidor = localStorage.getItem('@SaudeNaMao:servidor');
    const storedToken = localStorage.getItem('@SaudeNaMao:servidor_token');
    if (storedServidor && storedToken) {
      setServidor(JSON.parse(storedServidor));
    }
    setLoadingAdmin(false);
  }, []);

  const loginServidor = (dadosServidor, token) => {
    setServidor(dadosServidor);
    localStorage.setItem('@SaudeNaMao:servidor', JSON.stringify(dadosServidor));
    localStorage.setItem('@SaudeNaMao:servidor_token', token);
  };

  const logoutServidor = () => {
    setServidor(null);
    localStorage.removeItem('@SaudeNaMao:servidor');
    localStorage.removeItem('@SaudeNaMao:servidor_token');
  };

  const getToken = () => localStorage.getItem('@SaudeNaMao:servidor_token');

  return (
    <AdminAuthContext.Provider value={{
      signedAdmin: !!servidor,
      servidor,
      loadingAdmin,
      loginServidor,
      logoutServidor,
      getToken,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);

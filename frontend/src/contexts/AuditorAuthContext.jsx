import { createContext, useState, useEffect, useContext } from 'react';

export const AuditorAuthContext = createContext({});

export const AuditorAuthProvider = ({ children }) => {
  const [servidor, setServidor] = useState(null);
  const [loadingAuditor, setLoadingAuditor] = useState(true);

  useEffect(() => {
    const storedServidor = localStorage.getItem('@SaudeNaMao:servidor');
    const storedToken = localStorage.getItem('@SaudeNaMao:servidor_token');
    if (storedServidor && storedToken) {
      setServidor(JSON.parse(storedServidor));
    }
    setLoadingAuditor(false);
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
    <AuditorAuthContext.Provider value={{
      signedAuditor: !!servidor,
      servidor,
      loadingAuditor,
      loginServidor,
      logoutServidor,
      getToken,
    }}>
      {children}
    </AuditorAuthContext.Provider>
  );
};

export const useAuditorAuth = () => useContext(AuditorAuthContext);

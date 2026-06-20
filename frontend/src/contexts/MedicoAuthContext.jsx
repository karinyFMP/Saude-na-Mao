import { createContext, useState, useEffect, useContext } from 'react';

export const MedicoAuthContext = createContext({});

export const MedicoAuthProvider = ({ children }) => {
  const [medico, setMedico] = useState(null);
  const [loadingMedico, setLoadingMedico] = useState(true);

  useEffect(() => {
    const storedMedico = localStorage.getItem('@SaudeNaMao:medico');
    const storedToken  = localStorage.getItem('@SaudeNaMao:medico_token');
    if (storedMedico && storedToken) {
      setMedico(JSON.parse(storedMedico));
    }
    setLoadingMedico(false);
  }, []);

  const loginMedico = (dadosMedico, token) => {
    setMedico(dadosMedico);
    localStorage.setItem('@SaudeNaMao:medico', JSON.stringify(dadosMedico));
    localStorage.setItem('@SaudeNaMao:medico_token', token);
  };

  const logoutMedico = () => {
    setMedico(null);
    localStorage.removeItem('@SaudeNaMao:medico');
    localStorage.removeItem('@SaudeNaMao:medico_token');
  };

  const getMedicoToken = () => localStorage.getItem('@SaudeNaMao:medico_token');

  return (
    <MedicoAuthContext.Provider value={{
      signedMedico: !!medico,
      medico,
      loadingMedico,
      loginMedico,
      logoutMedico,
      getMedicoToken,
    }}>
      {children}
    </MedicoAuthContext.Provider>
  );
};

export const useMedicoAuth = () => useContext(MedicoAuthContext);

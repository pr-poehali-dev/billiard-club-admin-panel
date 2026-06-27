import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthed: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem('admin_authed'));

  const login = (username: string) => {
    localStorage.setItem('admin_authed', username);
    setIsAuthed(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_authed');
    setIsAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

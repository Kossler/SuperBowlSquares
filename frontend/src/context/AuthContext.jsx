import { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { setToken as storeToken, getToken, removeToken, setUser as storeUser, getUser } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());

  const login = useCallback((userData) => {
    console.log("AuthContext login received userData:", userData);
    const newUser = {
      email: userData.email,
      isAdmin: userData.admin, // Correctly read the 'admin' property
      profiles: userData.profiles
    };
    storeToken(userData.token);
    storeUser(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    storeUser(nextUser);
    setUser(nextUser);
  }, []);

  const auth = useMemo(() => {
    return {
      user,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false,
      login,
      logout,
      updateUser
    };
  }, [user, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

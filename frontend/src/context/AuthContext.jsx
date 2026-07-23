import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Helper function to update global state upon signup/login
  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // Eventually trigger a /logout endpoint here to clear cookies
  };

  return (
    <AuthContext.Provider value={{ user, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

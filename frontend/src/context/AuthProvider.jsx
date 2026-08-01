import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { apiFetch } from "../api/client";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents flash of logged out screen

  // Check active session on app initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const data = await apiFetch.get("/api/status");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Helper function to update global state upon signup/login
  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiFetch.post("/api/logout");
    } catch (error) {
      console.error("Logout request error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, handleAuthSuccess, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

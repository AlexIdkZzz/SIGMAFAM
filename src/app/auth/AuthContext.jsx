import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
      // Mock login para demostración, lo necesito cambiar por la lógica real de autenticación
  function loginMock(role = "ADMIN") {
    setUser({
      id: 1,
      fullName: "Yael",
      email: "yael@example.com",
      role,
    });
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(() => ({ user, setUser, loginMock, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
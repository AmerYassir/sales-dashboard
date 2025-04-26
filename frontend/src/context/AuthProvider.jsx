import { createContext, useState, useEffect, use, useMemo } from "react";
import api from "../api/axios";

const AuthContext = createContext();
export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token: token,
      setToken: (newToken) => setToken(newToken),
    }),
    [token]
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
};

export default AuthProvider;

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
  const [auth, setAuth] = useState(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      // Check if token is still valid (expire is in seconds)
      if (parsedAuth.expire && parsedAuth.expire > 0) {
        return parsedAuth;
      }
    }
    return { token: null, expire: null };
  });

  // Update headers and local storage when auth changes
  useEffect(() => {
    if (auth.token) {
      api.defaults.headers.common["Authorization"] = "Bearer " + auth.token;
      localStorage.setItem("auth", JSON.stringify(auth));
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("auth");
    }
  }, [auth]);

  // Set a timeout for automatic logout when token expires
  useEffect(() => {
    if (auth.token && auth.expire && auth.expire > 0) {
      const expireTime = auth.expire * 1000; // Convert seconds to milliseconds
      const timer = setTimeout(() => {
        setAuth({ token: null, expire: null });
      }, expireTime);
      // Cleanup timeout on unmount or auth change
      return () => clearTimeout(timer);
    }
  }, [auth]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      auth,
      setAuth,
    }),
    [auth]
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
};

export default AuthProvider;

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
      if (parsedAuth.expireTimestamp && parsedAuth.expireTimestamp > Date.now()) {
        return parsedAuth;
      }
    }
    return { access_token: null, expireTimestamp: null };
  });

  const [timeLeft, setTimeLeft] = useState(null);

  // Update headers and local storage when auth changes
  useEffect(() => {
    if (auth.access_token) {
      api.defaults.headers.common["Authorization"] = "Bearer " + auth.access_token;
      localStorage.setItem("auth", JSON.stringify(auth));
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("auth");
    }
  }, [auth]);

  // Set a timer for automatic logout and track remaining time
  useEffect(() => {
    if (auth.access_token && auth.expireTimestamp) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, auth.expireTimestamp - Date.now());
        setTimeLeft(Math.round(remaining / 1000));
        if (remaining <= 0) {
          setAuth({ access_token: null, expireTimestamp: null });
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [auth]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      auth,
      setAuth,
      timeLeft,
    }),
    [auth, timeLeft]
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
};

export default AuthProvider;

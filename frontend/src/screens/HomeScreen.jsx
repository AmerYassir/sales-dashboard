import { useNavigate } from "react-router";

import { useAuth } from "../context/AuthProvider";

const HomeScreen = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuth({ token: null, expire: null });
    navigate("/login");
  };

  return (
    <div className="flex w-full h-full justify-center gap-3 items-center flex-col">
      <h1>Welcome to the Sales Dashboard</h1>
      <button onClick={handleLogout} className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs">
        Log Out
      </button>
    </div>
  );
};

export default HomeScreen;

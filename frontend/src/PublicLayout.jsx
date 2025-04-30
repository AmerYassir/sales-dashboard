import { useCallback, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

import { useAuth } from "./context/AuthProvider";

const PublicLayout = () => {
  const {
    auth: { username, access_token },
    timeLeft,
    setAuth,
  } = useAuth();
  if (!access_token) return <Navigate to="/login" />;

  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    setAuth({ access_token: null, expireTimeStamp: null });
    navigate("/login");
  };

  const formatTimeLeft = useCallback((seconds) => {
    if (seconds === null || seconds <= 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formatted = "";
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
    formatted += `${remainingSeconds}s`;

    return formatted.trim();
  }, []);

  return (
    <>
      <div className="w-full h-full p-5 relative">
        {/* Navigation Bar */}
        <nav className="flex justify-between items-center p-4 rounded-lg shadow-2xl bg-neutral-800">
          <p className="text-3xl font-extrabold">EditableJSON</p>
          <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FaUserCircle size={32} />
            </button>
            {isDropdownOpen && (
              <div className="flex flex-col items-center absolute -right-4 mt-8 w-42 rounded-lg shadow-2xl bg-neutral-800 p-2 z-10">
                <p className="m-0">{username}</p>
                <hr className="w-full my-3" style={{ color: "var(--text-primary)" }} />
                <button onClick={handleLogout} className="flex items-center px-4 py-2 w-38">
                  <FaSignOutAlt className="mr-2" /> Log Out
                </button>
              </div>
            )}
          </div>
        </nav>

        <Outlet />

        {/* Session Timer */}
        <div className="fixed bottom-0 left-0 p-4 text-sm z-10">Session ends in: {formatTimeLeft(timeLeft)}</div>
      </div>
    </>
  );
};

export default PublicLayout;

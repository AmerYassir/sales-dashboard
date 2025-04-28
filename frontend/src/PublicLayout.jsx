import { Navigate, Outlet } from "react-router";

import { useAuth } from "./context/AuthProvider";

const PublicLayout = () => {
  const {
    auth: { access_token },
  } = useAuth();
  if (!access_token) return <Navigate to="/login" />;

  return (
    <>
      <div className="w-full h-full p-5">
        <Outlet />
      </div>
    </>
  );
};

export default PublicLayout;

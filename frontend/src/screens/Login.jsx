import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import BeatLoader from "../components/BeatLoader";

import { useAuth } from "../context/AuthProvider";

const Login = () => {
  return (
    <div className="flex w-full h-full justify-center items-center p-5">
      <BeatLoader />
    </div>
  );
};

export default Login;

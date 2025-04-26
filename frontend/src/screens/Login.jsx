import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import BeatLoader from "../components/BeatLoader";

import { useAuth } from "../context/AuthProvider";
import api from "../api/axios";

const Login = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const loginData = { username: data.email, password: data.password };
      const response = await api.post("/login/", loginData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const { access_token, expire } = response.data;
      setAuth({ token: access_token, expire: expire });
      navigate("/");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        setErrorMessage(`*${error.response.data.detail}`);
      } else {
        setErrorMessage("*An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto w-full sm:max-w-full lg:max-w-1/3 p-6 rounded-lg shadow-2xl bg-neutral-800">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight">Sign in to your account</h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-full mt-6 space-y-6">
          {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              className={`block w-full rounded-md border ${errors.email ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("email", { required: "*Email address is required" })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm/6 font-medium">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              className={`block w-full rounded-md border ${errors.password ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("password", { required: "*Password is required" })}
            />
            {showPassword ? (
              <FaEye
                className="absolute inset-y-6 right-0 flex items-center pr-3 cursor-pointer text-4xl"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              />
            ) : (
              <FaEyeSlash
                className="absolute inset-y-6 right-0 flex items-center pr-3 cursor-pointer text-4xl"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              />
            )}
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs">
              {isLoading ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Sign in"}
            </button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm/6">
          Not a member?{" "}
          <Link to="/signup" className="font-semibold">
            Create a new account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { FaCheck, FaXmark, FaEye, FaEyeSlash } from "react-icons/fa6";
import BeatLoader from "../components/BeatLoader";

import { useAuth } from "../context/AuthProvider";
import api from "../api/axios";

const Signup = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const password = watch("password", "");
  const hasOnlyAllowedChars = /^[A-Za-z\d@$!%*?&]*$/.test(password);
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await api.post("/signup/", data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const expireTimestamp = Date.now() + response.data.expire * 1000; // Absolute expiration time
      setAuth({ ...response.data, expireTimestamp });
      navigate("/");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        setErrorMessage(`*${error.response.data.detail}`);
      } else {
        setErrorMessage("*An error occurred during signup");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto w-full sm:max-w-full lg:max-w-1/3 p-6 rounded-lg shadow-2xl bg-neutral-800">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight">Create an account</h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-full mt-6 space-y-6">
          {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
          <div>
            <label htmlFor="username" className="block text-sm/6 font-medium">
              Username
            </label>
            <input
              id="username"
              type="username"
              autoComplete="off"
              className={`block w-full rounded-md border ${errors.username ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("username", { required: "*Username is required" })}
            />
            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              className={`block w-full rounded-md border ${errors.email ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("email", {
                required: "*Email is required",
                pattern: { value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, message: "*Invalid email address" },
              })}
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
              {...register("password", {
                required: "*Password is required",
                pattern: {
                  value: /^[A-Za-z\d@$!%*?&]*$/,
                  message: "*Only letters, digits, and special characters (@$!%*?&) are allowed",
                },
                minLength: {
                  value: 8,
                  message: "*Password must be at least 8 characters",
                },
                validate: {
                  hasLowercase: (value) => /[a-z]/.test(value) || "*Password must contain at least one lowercase letter",
                  hasUppercase: (value) => /[A-Z]/.test(value) || "*Password must contain at least one uppercase letter",
                  hasNumber: (value) => /\d/.test(value) || "*Password must contain at least one number",
                  hasSpecialChar: (value) => /[@$!%*?&]/.test(value) || "*Password must contain at least one special character (@$!%*?&)",
                },
              })}
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
            <div>
              <ul className="mt-2 text-sm text-gray-500">
                {!hasOnlyAllowedChars && (
                  <li className="flex gap-1 items-center text-red-500">
                    <FaXmark /> Use only letters, digits, and special characters
                  </li>
                )}
                <li className={`flex gap-1 items-center ${hasMinLength ? "text-green-500" : "text-red-500"}`}>
                  {hasMinLength ? <FaCheck /> : <FaXmark />} At least 8 characters
                </li>
                <li className={`flex gap-1 items-center ${hasLowercase ? "text-green-500" : "text-red-500"}`}>
                  {hasLowercase ? <FaCheck /> : <FaXmark />} At least 1 lowercase letter
                </li>
                <li className={`flex gap-1 items-center ${hasUppercase ? "text-green-500" : "text-red-500"}`}>
                  {hasUppercase ? <FaCheck /> : <FaXmark />} At least 1 uppercase letter
                </li>
                <li className={`flex gap-1 items-center ${hasNumber ? "text-green-500" : "text-red-500"}`}>
                  {hasNumber ? <FaCheck /> : <FaXmark />} At least 1 number
                </li>
                <li className={`flex gap-1 items-center ${hasSpecialChar ? "text-green-500" : "text-red-500"}`}>
                  {hasSpecialChar ? <FaCheck /> : <FaXmark />} At least 1 special character
                </li>
              </ul>
            </div>
            {errors.password && errors.password.types && (
              <div className="mt-1 text-sm text-red-500">
                {Object.values(errors.password.types).map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
              </div>
            )}
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs">
              {isLoading ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Sign up"}
            </button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm/6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold">
            Log in to your account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

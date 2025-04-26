import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import BeatLoader from "./components/BeatLoader";

import PublicLayout from "./PublicLayout";
const Home = lazy(() => import("./screens/HomeScreen"));
const Login = lazy(() => import("./screens/Login"));
const Signup = lazy(() => import("./screens/Signup"));
const ErrorElement = lazy(() => import("./screens/ErrorElement"));

const Loading = () => (
  <div className="w-full h-full flex justify-center items-center p-5">
    <BeatLoader />
  </div>
);

const Router = () => {
  const router = createBrowserRouter([
    {
      path: "/landing",
      element: <h1>Landing Page</h1>,
    },
    {
      path: "/login",
      element: (
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      ),
      errorElement: (
        <Suspense fallback={<Loading />}>
          <ErrorElement />
        </Suspense>
      ),
    },
    {
      path: "/signup",
      element: (
        <Suspense fallback={<Loading />}>
          <Signup />
        </Suspense>
      ),
      errorElement: (
        <Suspense fallback={<Loading />}>
          <ErrorElement />
        </Suspense>
      ),
    },
    {
      path: "/",
      element: <PublicLayout />,
      errorElement: (
        <Suspense fallback={<Loading />}>
          <ErrorElement />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<Loading />}>
              <Home />
            </Suspense>
          ),
        },
      ],
    },
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};

export default Router;

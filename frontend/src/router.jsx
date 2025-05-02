import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import BeatLoader from "./components/BeatLoader";

import PublicLayout from "./PublicLayout";
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const Products = lazy(() => import("./screens/Products"));
const ProductScreen = lazy(() => import("./screens/ProductScreen"));
const Customers = lazy(() => import("./screens/Customers"));
const CustomerScreen = lazy(() => import("./screens/CustomerScreen"));
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
              <HomeScreen />
            </Suspense>
          ),
        },
        {
          path: "/products",
          element: (
            <Suspense fallback={<Loading />}>
              <Products />
            </Suspense>
          ),
        },
        {
          path: "products/:id",
          element: (
            <Suspense fallback={<Loading />}>
              <ProductScreen />
            </Suspense>
          ),
        },
        {
          index: true,
          path: "/customers",
          element: (
            <Suspense fallback={<Loading />}>
              <Customers />
            </Suspense>
          ),
        },
        {
          path: "customers/:id",
          element: (
            <Suspense fallback={<Loading />}>
              <CustomerScreen />
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

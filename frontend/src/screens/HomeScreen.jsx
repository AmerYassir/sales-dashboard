import { useState, useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import { colorSchemeDark, themeAlpine } from "ag-grid-community";
import { FaUserCircle, FaSignOutAlt, FaTh, FaTable, FaPlus } from "react-icons/fa";
import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";

import { useAuth } from "../context/AuthProvider";
import api from "../api/axios";

const HomeScreen = () => {
  const {
    auth: { username },
    timeLeft,
    setAuth,
  } = useAuth();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType") || "table");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const themeDark = themeAlpine.withPart(colorSchemeDark);

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products/");
      return response.data.products;
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (newProduct) => {
      const response = await api.post("/products/", newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setIsModalOpen(false);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

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

  const IdLinkRenderer = (props) => {
    const id = props.value;
    return <NavLink to={`/products/${id}`}>{id}</NavLink>;
  };

  const columnDefs = [
    {
      headerName: "ID",
      field: "id",
      cellRenderer: IdLinkRenderer,
      flex: 0.5,
    },
    { headerName: "Name", field: "name", flex: 1 },
    { headerName: "Description", field: "description", flex: 2 },
    { headerName: "Price", field: "price", flex: 0.5 },
    { headerName: "Stock", field: "stock", flex: 0.5 },
    { headerName: "Created At", field: "created_at", flex: 1 },
  ];

  const onRowClicked = (event) => {
    navigate(`/products/${event.data.id}`);
  };

  const addProductModal = useMemo(
    () => (
      <Modal title="Add Product" isModalOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-full mt-6 space-y-6">
          {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
          <div>
            <label htmlFor="name" className="block text-sm/6 font-medium">
              Product Name
            </label>
            <input
              id="name"
              type="text"
              className={`block w-full rounded-md border ${errors.name ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("name", { required: "*Product name is required" })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm/6 font-medium">
              Description
            </label>
            <textarea
              id="description"
              className={`block w-full rounded-md border ${errors.description ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("description", { required: "*Description is required" })}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>
          <div>
            <label htmlFor="price" className="block text-sm/6 font-medium">
              Price
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              className={`block w-full rounded-md border ${errors.price ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("price", { required: "*Price is required", valueAsNumber: true })}
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm/6 font-medium">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              className={`block w-full rounded-md border ${errors.stock ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("stock", { required: "*Stock is required", valueAsNumber: true })}
            />
            {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock.message}</p>}
          </div>
          <div>
            <button type="submit" disabled={mutation.isLoading} className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs">
              {mutation.isLoading ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Add Product"}
            </button>
          </div>
        </form>
      </Modal>
    ),
    [isModalOpen, errors, register, handleSubmit, mutation.isLoading, errorMessage]
  );

  return (
    <div className="relative h-full">
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

      {/* Main Content */}
      <main className="p-4 pb-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <BeatLoader />
          </div>
        ) : error ? (
          <div className="text-red-500">Error: {error.message}</div>
        ) : (
          <>
            {/* Toggle View Buttons */}
            <div className="flex justify-end mb-4 gap-2">
              <button
                onClick={() => {
                  setViewType("cards");
                  localStorage.setItem("viewType", "cards");
                }}
                className={viewType === "cards" ? "text-blue-500" : "text-gray-500"}
              >
                <FaTh size={24} />
              </button>
              <button
                onClick={() => {
                  setViewType("table");
                  localStorage.setItem("viewType", "table");
                }}
                className={viewType === "table" ? "text-blue-500" : "text-gray-500"}
              >
                <FaTable size={24} />
              </button>
            </div>

            {/* Product List */}
            {viewType === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-lg shadow-lg bg-neutral-800 p-4 cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    {/* <p>{product.description}</p> */}
                    {/* <p>Price: ${product.price}</p>
                    <p>Stock: {product.stock}</p> */}
                    <p>Created At: {new Date(product.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <AgGridReact columnDefs={columnDefs} rowData={products} theme={themeDark} domLayout="autoHeight" />
            )}
          </>
        )}
      </main>

      {/* Session Timer */}
      <div className="fixed bottom-0 left-0 p-4 text-sm z-10">Session ends in: {formatTimeLeft(timeLeft)}</div>

      {/* Create Product Button */}
      <div className="fixed bottom-0 right-0 p-4">
        <button onClick={() => setIsModalOpen(true)} className="rounded-lg shadow-lg">
          <FaPlus />
        </button>
      </div>

      {addProductModal}
    </div>
  );
};

export default HomeScreen;

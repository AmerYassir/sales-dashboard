import { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import { colorSchemeDark, themeAlpine } from "ag-grid-community";
import { FaTh, FaTable, FaPlus, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";

import api from "../api/axios";

const Products = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType") || "table");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [deleteProductModalOptions, setDeleteProductModalOptions] = useState({ isOpen: false, id: null });
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
  const { mutate: addProduct, isPending: addProductMutationIsPending } = useMutation({
    mutationFn: async (newProduct) => {
      const response = await api.post("/products/", newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setIsAddProductModalOpen(false);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });
  const { mutate: editProduct } = useMutation({
    mutationFn: async (editedProduct) => {
      const response = await api.put(`/products/${editedProduct.id}`, editedProduct);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["product", data.product_id]);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });
  const { mutate: deleteProduct, isPending: deleteProductMutationIsPending } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setDeleteProductModalOptions({ isOpen: false, id: null });
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setDeleteProductModalOptions({ isOpen: false, id: null });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onAddProduct = (data) => {
    addProduct(data);
  };

  const handleDelete = (id) => {
    setDeleteProductModalOptions({ isOpen: true, id });
  };

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
    { headerName: "Name", field: "name", flex: 1, editable: true },
    { headerName: "Description", field: "description", flex: 2, editable: true },
    { headerName: "Price", field: "price", flex: 0.5, editable: true },
    { headerName: "Stock", field: "stock", flex: 0.5, editable: true },
    { headerName: "Created At", field: "created_at", flex: 1 },
    {
      headerName: "",
      flex: 0.5,
      cellRenderer: (params) => (
        <div className="w-full h-full flex justify-center items-center">
          <FaTrash className="cursor-pointer text-red-500" onClick={() => handleDelete(params.data.id)} />
        </div>
      ),
    },
  ];

  const addProductModal = useMemo(
    () => (
      <Modal title="Add Product" isModalOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)}>
        <form noValidate onSubmit={handleSubmit(onAddProduct)} className="w-full mt-6 space-y-6">
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
            <button
              type="submit"
              disabled={addProductMutationIsPending}
              className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-blue-500 text-white hover:bg-blue-600"
            >
              {addProductMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Add Product"}
            </button>
          </div>
        </form>
      </Modal>
    ),
    [isAddProductModalOpen, errors, register, handleSubmit, addProductMutationIsPending, errorMessage]
  );

  const deleteProductModal = useMemo(
    () => (
      <Modal title="Delete Product" isModalOpen={deleteProductModalOptions.isOpen} onClose={() => setDeleteProductModalOptions({ isOpen: false, id: null })}>
        <p>Are you sure you want to delete this product?</p>
        <button
          type="button"
          onClick={() => deleteProduct(deleteProductModalOptions.id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-red-500 text-white hover:bg-red-600"
        >
          {deleteProductMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [deleteProductModalOptions, deleteProductMutationIsPending, setDeleteProductModalOptions]
  );

  return (
    <>
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
              products.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p>No products available</p>
                </div>
              ) : (
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
              )
            ) : (
              <AgGridReact
                columnDefs={columnDefs}
                rowData={products}
                theme={themeDark}
                domLayout="autoHeight"
                onCellEditingStopped={(event) => {
                  editProduct({ ...event.data });
                }}
                noRowsOverlayComponent={() => (
                  <div className="flex justify-center items-center h-64">
                    <p>No products available</p>
                  </div>
                )}
              />
            )}
          </>
        )}
      </main>

      {/* Create Product Button */}
      <div className="fixed bottom-0 right-0 p-4">
        <button onClick={() => setIsAddProductModalOpen(true)} className="rounded-lg shadow-lg bg-blue-500 text-white p-3 hover:bg-blue-600">
          <FaPlus />
        </button>
      </div>

      {/* Modals */}
      {addProductModal}
      {deleteProductModal}
    </>
  );
};

export default Products;

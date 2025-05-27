import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { FaEdit, FaTrash } from "react-icons/fa";

import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";
import api from "../api/axios";

const ProductScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (product) {
      reset(product);
    }
  }, [product, reset]);

  const { mutate: updateProduct, isPending: updateProductMutationIsPending } = useMutation({
    mutationFn: async (updatedProduct) => {
      const response = await api.put(`/products/${id}`, updatedProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["product", id]);
      queryClient.invalidateQueries(["products"]);
      setIsEditMode(false);
      setErrorMessage("");
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
      navigate("/");
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setIsDeleteModalOpen(false);
    },
  });

  const onSubmit = (data) => {
    updateProduct(data);
  };

  const deleteModal = useMemo(
    () => (
      <Modal title="Delete Product" isModalOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <p>Are you sure you want to delete this product?</p>
        <button
          type="button"
          onClick={() => deleteProduct(id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-red-500 text-white hover:bg-red-600"
        >
          {deleteProductMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [isDeleteModalOpen, deleteProductMutationIsPending, id]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BeatLoader />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate("/products")} className="mb-4">
        Back to Home
      </button>
      <div className="rounded-lg shadow-lg bg-neutral-800 p-4">
        {isEditMode ? (
          <h1 className="text-2xl font-bold mb-4">Edit: {product.name}</h1>
        ) : (
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <button onClick={() => setIsEditMode(true)} className="ml-4">
              <FaEdit />
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="ml-2">
              <FaTrash />
            </button>
          </div>
        )}
        <p>ID: {product.id}</p>
        <p>Created At: {new Date(product.created_at).toLocaleString()}</p>
        {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm/6 font-medium">
              Product Name
            </label>
            <input
              id="name"
              type="text"
              disabled={!isEditMode}
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
              disabled={!isEditMode}
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
              disabled={!isEditMode}
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
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.stock ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("stock", { required: "*Stock is required", valueAsNumber: true })}
            />
            {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock.message}</p>}
          </div>
          {isEditMode && (
            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  reset(product);
                  setIsEditMode(false);
                  setErrorMessage("");
                }}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProductMutationIsPending}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                {updateProductMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Save"}
              </button>
            </div>
          )}
        </form>
      </div>
      {deleteModal}
    </div>
  );
};

export default ProductScreen;

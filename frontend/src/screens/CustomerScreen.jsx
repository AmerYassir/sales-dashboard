import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { FaEdit, FaTrash } from "react-icons/fa";

import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";
import api from "../api/axios";

const CustomerScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
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
    if (customer) {
      reset(customer);
    }
  }, [customer, reset]);

  const { mutate: updateCustomer, isPending: updateCustomerMutationIsPending } = useMutation({
    mutationFn: async (updatedCustomer) => {
      const response = await api.put(`/customers/${id}`, updatedCustomer);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customer", id]);
      queryClient.invalidateQueries(["customers"]);
      setIsEditMode(false);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });

  const { mutate: deleteCustomer, isPending: deleteCustomerMutationIsPending } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      navigate("/");
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setIsDeleteModalOpen(false);
    },
  });

  const onSubmit = (data) => {
    updateCustomer(data);
  };

  const deleteModal = useMemo(
    () => (
      <Modal title="Delete Customer" isModalOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <p>Are you sure you want to delete this customer?</p>
        <button
          type="button"
          onClick={() => deleteCustomer(id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs"
        >
          {deleteCustomerMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [isDeleteModalOpen, deleteCustomerMutationIsPending, id]
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
      <button onClick={() => navigate("/customers")} className="mb-4">
        Back to Home
      </button>
      <div className="rounded-lg shadow-lg bg-neutral-800 p-4">
        {isEditMode ? (
          <h1 className="text-2xl font-bold mb-4">Edit: {customer.name}</h1>
        ) : (
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <button onClick={() => setIsEditMode(true)} className="ml-4">
              <FaEdit />
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="ml-2">
              <FaTrash />
            </button>
          </div>
        )}
        <p>ID: {customer.id}</p>
        <p>Created At: {new Date(customer.created_at).toLocaleString()}</p>
        {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm/6 font-medium">
              Customer Name
            </label>
            <input
              id="name"
              type="text"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.name ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("name", { required: "*Customer name is required" })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.email ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("email", {
                required: "*Email is required",
                pattern: { value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, message: "*Invalid email address" },
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm/6 font-medium">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.phone ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("phone", {
                required: "*Phone number is required",
                pattern: { value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, message: "*Invalid phone number" },
              })}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="address" className="block text-sm/6 font-medium">
              Address
            </label>
            <textarea
              id="address"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.address ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("address", { required: "*Address is required" })}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
          </div>
          {isEditMode && (
            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  reset(customer);
                  setIsEditMode(false);
                  setErrorMessage("");
                }}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCustomerMutationIsPending}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full"
              >
                {updateCustomerMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Save"}
              </button>
            </div>
          )}
        </form>
      </div>
      {deleteModal}
    </div>
  );
};

export default CustomerScreen;

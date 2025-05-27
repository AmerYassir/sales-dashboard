import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";
import api from "../api/axios";

const SalesOrderScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch sales order data
  const {
    data: salesOrder,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sales_order", id],
    queryFn: async () => {
      const response = await api.get(`/sales_orders/${id}`);
      return response.data;
    },
  });

  // Fetch customers for dropdown
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get("/customers/");
      return response.data.customers;
    },
  });

  // Fetch products for items dropdown
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products/");
      return response.data.products;
    },
  });

  // Fallback to empty arrays if data isn't loaded
  const customers = customersData || [];
  const products = productsData || [];

  // Define static options as in SalesOrders
  const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
  const paymentMethods = ["Cash", "Visa"];

  // Form setup with useFieldArray for items
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      items: [{ product_id: "", quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Reset form when sales order data loads
  useEffect(() => {
    if (salesOrder) {
      reset(salesOrder);
    }
  }, [salesOrder, reset]);

  const { mutate: updateSalesOrder, isPending: updateSalesOrderMutationIsPending } = useMutation({
    mutationFn: async (updatedSalesOrder) => {
      const response = await api.put(`/sales_orders/${id}`, updatedSalesOrder);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sales_order", id]);
      queryClient.invalidateQueries(["sales_orders"]);
      setIsEditMode(false);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });

  const { mutate: deleteSalesOrder, isPending: deleteSalesOrderMutationIsPending } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/sales_orders/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sales_orders"]);
      navigate("/sales_orders");
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setIsDeleteModalOpen(false);
    },
  });

  const onSubmit = (data) => {
    updateSalesOrder(data);
  };

  const deleteModal = useMemo(
    () => (
      <Modal title="Delete Sales Order" isModalOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <p>Are you sure you want to delete this sales order?</p>
        <button
          type="button"
          onClick={() => deleteSalesOrder(id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-red-500 text-white hover:bg-red-600"
        >
          {deleteSalesOrderMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [isDeleteModalOpen, deleteSalesOrderMutationIsPending, id]
  );

  if (isLoading || customersLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BeatLoader />
      </div>
    );
  }

  if (error || customersError || productsError) {
    return <div className="text-red-500">Error: {error?.message || customersError?.message || productsError?.message}</div>;
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate("/sales_orders")} className="mb-4">
        Back to Home
      </button>
      <div className="rounded-lg shadow-lg bg-neutral-800 p-4">
        {isEditMode ? (
          <h1 className="text-2xl font-bold mb-4">Edit Sales Order #{salesOrder.id}</h1>
        ) : (
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold">Sales Order #{salesOrder.id}</h1>
            <button onClick={() => setIsEditMode(true)} className="ml-4">
              <FaEdit />
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="ml-2">
              <FaTrash />
            </button>
          </div>
        )}
        {!isEditMode && (
          <div>
            <p>ID: {salesOrder.id}</p>
            <p>Created At: {new Date(salesOrder.created_at).toLocaleString()}</p>
            <p>Customer: {customers.find((c) => c.id === salesOrder.customer_id)?.name || "Unknown"}</p>
            <p>Order Status: {salesOrder.order_status}</p>
            <p>Items: {salesOrder.items.length}</p>
            <p>Shipping Address: {salesOrder.shipping_address || "N/A"}</p>
            <p>Billing Address: {salesOrder.billing_address || "N/A"}</p>
            <p>Payment Method: {salesOrder.payment_method || "N/A"}</p>
            <p>Notes: {salesOrder.notes || "N/A"}</p>
          </div>
        )}
        {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div>
            <label htmlFor="customer_id" className="block text-sm/6 font-medium">
              Customer
            </label>
            <select
              id="customer_id"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.customer_id ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("customer_id", { required: "*Customer is required", valueAsNumber: true })}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customer_id && <p className="mt-1 text-sm text-red-500">{errors.customer_id.message}</p>}
          </div>
          <div>
            <label htmlFor="order_status" className="block text-sm/6 font-medium">
              Order Status
            </label>
            <select
              id="order_status"
              disabled={!isEditMode}
              className={`block w-full rounded-md border ${errors.order_status ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("order_status", { required: "*Order Status is required" })}
            >
              <option value="">Select order status</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
            {errors.order_status && <p className="mt-1 text-sm text-red-500">{errors.order_status.message}</p>}
          </div>
          <div>
            <label className="block text-sm/6 font-medium">Items</label>
            <input
              type="hidden"
              {...register("itemsValidator", {
                validate: () => fields.length > 0 || "*At least one item is required",
              })}
            />
            {errors.itemsValidator && <p className="mt-1 text-sm text-red-500">{errors.itemsValidator.message}</p>}
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 mt-2">
                <div className="flex-1">
                  <select
                    disabled={!isEditMode}
                    className={`block w-full rounded-md border ${
                      errors.items?.[index]?.product_id ? "border-red-500" : "border-gray-300"
                    } px-3 py-1.5 text-base sm:text-sm/6`}
                    {...register(`items.${index}.product_id`, { required: "*Product is required", valueAsNumber: true })}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.product_id && <p className="mt-1 text-sm text-red-500">{errors.items[index].product_id.message}</p>}
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Quantity"
                    disabled={!isEditMode}
                    className={`block w-full rounded-md border ${
                      errors.items?.[index]?.quantity ? "border-red-500" : "border-gray-300"
                    } px-3 py-1.5 text-base sm:text-sm/6`}
                    {...register(`items.${index}.quantity`, { required: "*Quantity is required", valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity && <p className="mt-1 text-sm text-red-500">{errors.items[index].quantity.message}</p>}
                </div>
                {isEditMode && (
                  <button type="button" onClick={() => remove(index)} className="text-red-500 flex items-center">
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            {isEditMode && (
              <button type="button" onClick={() => append({ product_id: "", quantity: "" })} className="mt-2 flex items-center gap-1 text-blue-500">
                <FaPlus /> Add Item
              </button>
            )}
          </div>
          <div>
            <label htmlFor="shipping_address" className="block text-sm/6 font-medium">
              Shipping Address
            </label>
            <textarea
              id="shipping_address"
              disabled={!isEditMode}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm/6"
              {...register("shipping_address")}
            />
          </div>
          <div>
            <label htmlFor="billing_address" className="block text-sm/6 font-medium">
              Billing Address
            </label>
            <textarea
              id="billing_address"
              disabled={!isEditMode}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm/6"
              {...register("billing_address")}
            />
          </div>
          <div>
            <label htmlFor="payment_method" className="block text-sm/6 font-medium">
              Payment Method
            </label>
            <select
              id="payment_method"
              disabled={!isEditMode}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm/6"
              {...register("payment_method")}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm/6 font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              disabled={!isEditMode}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm/6"
              {...register("notes")}
            />
          </div>
          {isEditMode && (
            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  reset(salesOrder);
                  setIsEditMode(false);
                  setErrorMessage("");
                }}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSalesOrderMutationIsPending}
                className="flex justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                {updateSalesOrderMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Save"}
              </button>
            </div>
          )}
        </form>
      </div>
      {deleteModal}
    </div>
  );
};

export default SalesOrderScreen;

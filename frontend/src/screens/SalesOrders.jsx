import { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import { colorSchemeDark, themeAlpine } from "ag-grid-community";
import { FaTh, FaTable, FaPlus, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal";
import BeatLoader from "../components/BeatLoader";

import api from "../api/axios";

const SalesOrders = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType") || "table");
  const [isAddSalesOrderModalOpen, setIsAddSalesOrderModalOpen] = useState(false);
  const [deleteSalesOrderModalOptions, setDeleteSalesOrderModalOptions] = useState({ isOpen: false, id: null });
  const [errorMessage, setErrorMessage] = useState("");

  const themeDark = themeAlpine.withPart(colorSchemeDark);

  const {
    data: salesOrders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sales_orders"],
    queryFn: async () => {
      const response = await api.get("/sales_orders/");
      return response.data.sales_orders;
    },
  });

  const queryClient = useQueryClient();
  // Fetch products
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

  // Fetch customers
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

  // Use fallback empty arrays if data isn’t loaded yet
  const products = productsData || [];
  const customers = customersData || [];

  // Debugging logs
  if (productsError) console.error("Products error:", productsError);
  if (customersError) console.error("Customers error:", customersError);

  const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
  const paymentMethods = ["Cash", "Visa"];

  const { mutate: addSalesOrder, isPending: addSalesOrderMutationIsPending } = useMutation({
    mutationFn: async (newSalesOrder) => {
      const response = await api.post("/sales_orders/", newSalesOrder);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sales_orders"]);
      setIsAddSalesOrderModalOpen(false);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });
  const { mutate: editSalesOrder } = useMutation({
    mutationFn: async (editedSalesOrder) => {
      const response = await api.put(`/sales_orders/${editedSalesOrder.id}`, editedSalesOrder);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["sales_orders"]);
      queryClient.invalidateQueries(["sales_order", data.id]);
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
      setDeleteSalesOrderModalOptions({ isOpen: false, id: null });
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setDeleteSalesOrderModalOptions({ isOpen: false, id: null });
    },
  });

  const {
    register,
    handleSubmit,
    control,
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

  const onAddSalesOrder = (data) => {
    addSalesOrder(data);
  };

  const handleDelete = (id) => {
    setDeleteSalesOrderModalOptions({ isOpen: true, id });
  };

  const IdLinkRenderer = (props) => {
    const id = props.value;
    return <NavLink to={`/sales_orders/${id}`}>{id}</NavLink>;
  };

  const columnDefs = [
    {
      headerName: "ID",
      field: "id",
      cellRenderer: IdLinkRenderer,
      flex: 0.5,
    },
    { headerName: "Customer ID", field: "customer_id", flex: 1 },
    { headerName: "Order Status", field: "order_status", flex: 1, editable: true },
    {
      headerName: "Items",
      field: "items",
      flex: 1,
      valueGetter: (params) => params.data.items.length,
    },
    { headerName: "Shipping Address", field: "shipping_address", flex: 1.5 },
    { headerName: "Billing Address", field: "billing_address", flex: 1.5 },
    { headerName: "Payment Method", field: "payment_method", flex: 1 },
    { headerName: "Notes", field: "notes", flex: 1.5 },
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

  const addSalesOrderModal = useMemo(
    () => (
      <Modal title="Add Sales Order" isModalOpen={isAddSalesOrderModalOpen} onClose={() => setIsAddSalesOrderModalOpen(false)}>
        <form noValidate onSubmit={handleSubmit(onAddSalesOrder)} className="w-full mt-6 space-y-6">
          {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
          <div>
            <label htmlFor="customer_id" className="block text-sm/6 font-medium">
              Customer
            </label>
            <select
              id="customer_id"
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
                    className={`block w-full rounded-md border ${
                      errors.items?.[index]?.quantity ? "border-red-500" : "border-gray-300"
                    } px-3 py-1.5 text-base sm:text-sm/6`}
                    {...register(`items.${index}.quantity`, { required: "*Quantity is required", valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity && <p className="mt-1 text-sm text-red-500">{errors.items[index].quantity.message}</p>}
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 flex items-center">
                  <FaTrash />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => append({ product_id: "", quantity: "" })} className="mt-2 flex items-center gap-1 text-blue-500">
              <FaPlus /> Add Item
            </button>
          </div>
          <div>
            <label htmlFor="shipping_address" className="block text-sm/6 font-medium">
              Shipping Address
            </label>
            <textarea
              id="shipping_address"
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
            <textarea id="notes" className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-base sm:text-sm/6" {...register("notes")} />
          </div>
          <div>
            <button
              type="submit"
              disabled={addSalesOrderMutationIsPending}
              className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-blue-500 text-white hover:bg-blue-600"
            >
              {addSalesOrderMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Add Sales Order"}
            </button>
          </div>
        </form>
      </Modal>
    ),
    [isAddSalesOrderModalOpen, errors, register, handleSubmit, addSalesOrderMutationIsPending, errorMessage, fields, append, remove, customers, products]
  );

  const deleteSalesOrderModal = useMemo(
    () => (
      <Modal
        title="Delete Sales Order"
        isModalOpen={deleteSalesOrderModalOptions.isOpen}
        onClose={() => setDeleteSalesOrderModalOptions({ isOpen: false, id: null })}
      >
        <p>Are you sure you want to delete this sales order?</p>
        <button
          type="button"
          onClick={() => deleteSalesOrder(deleteSalesOrderModalOptions.id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-red-500 text-white hover:bg-red-600"
        >
          {deleteSalesOrderMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [deleteSalesOrderModalOptions, deleteSalesOrderMutationIsPending, setDeleteSalesOrderModalOptions]
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

            {/* Sales Order List */}
            {viewType === "cards" ? (
              salesOrders.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p>No sales orders available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {salesOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg shadow-lg bg-neutral-800 p-4 cursor-pointer hover:shadow-2xl transition-shadow"
                      onClick={() => navigate(`/sales_orders/${order.id}`)}
                    >
                      <h2 className="text-xl font-bold">Sales Order #{order.id}</h2>
                      <p>Created At: {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <AgGridReact
                columnDefs={columnDefs}
                rowData={salesOrders}
                theme={themeDark}
                domLayout="autoHeight"
                onCellEditingStopped={(event) => {
                  editSalesOrder({ ...event.data });
                }}
                noRowsOverlayComponent={() => (
                  <div className="flex justify-center items-center h-64">
                    <p>No Sales Orders available</p>
                  </div>
                )}
              />
            )}
          </>
        )}
      </main>

      {/* Create Sales Order Button */}
      <div className="fixed bottom-0 right-0 p-4">
        <button onClick={() => setIsAddSalesOrderModalOpen(true)} className="rounded-lg shadow-lg bg-blue-500 text-white p-3 hover:bg-blue-600">
          <FaPlus />
        </button>
      </div>

      {/* Modals */}
      {addSalesOrderModal}
      {deleteSalesOrderModal}
    </>
  );
};

export default SalesOrders;

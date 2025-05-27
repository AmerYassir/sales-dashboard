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

const Customers = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType") || "table");
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [deleteCustomerModalOptions, setDeleteCustomerModalOptions] = useState({ isOpen: false, id: null });
  const [errorMessage, setErrorMessage] = useState("");

  const themeDark = themeAlpine.withPart(colorSchemeDark);

  const {
    data: customers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get("/customers/");
      return response.data.customers;
    },
  });

  const queryClient = useQueryClient();
  const { mutate: addCustomer, isPending: addCustomerMutationIsPending } = useMutation({
    mutationFn: async (newCustomer) => {
      const response = await api.post("/customers/", newCustomer);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setIsAddCustomerModalOpen(false);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    },
  });
  const { mutate: editCustomer } = useMutation({
    mutationFn: async (editedCustomer) => {
      const response = await api.put(`/customers/${editedCustomer.id}`, editedCustomer);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["customer", data.id]);
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
      setDeleteCustomerModalOptions({ isOpen: false, id: null });
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.detail || "An error occurred");
      setDeleteCustomerModalOptions({ isOpen: false, id: null });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onAddCustomer = (data) => {
    addCustomer(data);
  };

  const handleDelete = (id) => {
    setDeleteCustomerModalOptions({ isOpen: true, id });
  };

  const IdLinkRenderer = (props) => {
    const id = props.value;
    return <NavLink to={`/customers/${id}`}>{id}</NavLink>;
  };

  const columnDefs = [
    {
      headerName: "ID",
      field: "id",
      cellRenderer: IdLinkRenderer,
      flex: 0.5,
    },
    { headerName: "Name", field: "name", flex: 1, editable: true },
    { headerName: "Email", field: "email", flex: 1.5, editable: true },
    { headerName: "Phone", field: "phone", flex: 1.5, editable: true },
    { headerName: "Address", field: "address", flex: 2, editable: true },
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

  const addCustomerModal = useMemo(
    () => (
      <Modal title="Add Customer" isModalOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)}>
        <form noValidate onSubmit={handleSubmit(onAddCustomer)} className="w-full mt-6 space-y-6">
          {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
          <div>
            <label htmlFor="name" className="block text-sm/6 font-medium">
              Customer Name
            </label>
            <input
              id="name"
              type="text"
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
              className={`block w-full rounded-md border ${errors.address ? "border-red-500" : "border-gray-300"} px-3 py-1.5 text-base sm:text-sm/6`}
              {...register("address", { required: "*Address is required" })}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={addCustomerMutationIsPending}
              className="flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-blue-500 text-white hover:bg-blue-600"
            >
              {addCustomerMutationIsPending ? <BeatLoader style={{ lineHeight: "1.25rem" }} /> : "Add Customer"}
            </button>
          </div>
        </form>
      </Modal>
    ),
    [isAddCustomerModalOpen, errors, register, handleSubmit, addCustomerMutationIsPending, errorMessage]
  );

  const deleteCustomerModal = useMemo(
    () => (
      <Modal title="Delete Customer" isModalOpen={deleteCustomerModalOptions.isOpen} onClose={() => setDeleteCustomerModalOptions({ isOpen: false, id: null })}>
        <p>Are you sure you want to delete this customer?</p>
        <button
          type="button"
          onClick={() => deleteCustomer(deleteCustomerModalOptions.id)}
          className="mt-4 flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold shadow-xs bg-red-500 text-white hover:bg-red-600"
        >
          {deleteCustomerMutationIsPending ? <BeatLoader /> : "Delete"}
        </button>
      </Modal>
    ),
    [deleteCustomerModalOptions, deleteCustomerMutationIsPending, setDeleteCustomerModalOptions]
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

            {/* Customer List */}
            {viewType === "cards" ? (
              customers.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p>No customers available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-lg shadow-lg bg-neutral-800 p-4 cursor-pointer hover:shadow-2xl transition-shadow"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <h2 className="text-xl font-bold">{customer.name}</h2>
                      {/* <p>{customer.description}</p> */}
                      {/* <p>Price: ${customer.price}</p>
                    <p>Stock: {customer.stock}</p> */}
                      <p>Created At: {new Date(customer.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <AgGridReact
                columnDefs={columnDefs}
                rowData={customers}
                theme={themeDark}
                domLayout="autoHeight"
                onCellEditingStopped={(event) => {
                  editCustomer({ ...event.data });
                }}
                noRowsOverlayComponent={() => (
                  <div className="flex justify-center items-center h-64">
                    <p>No customers available</p>
                  </div>
                )}
              />
            )}
          </>
        )}
      </main>

      {/* Create Customer Button */}
      <div className="fixed bottom-0 right-0 p-4">
        <button onClick={() => setIsAddCustomerModalOpen(true)} className="rounded-lg shadow-lg bg-blue-500 text-white p-3 hover:bg-blue-600">
          <FaPlus />
        </button>
      </div>

      {/* Modals */}
      {addCustomerModal}
      {deleteCustomerModal}
    </>
  );
};

export default Customers;

import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import BeatLoader from "../components/BeatLoader";
import api from "../api/axios";

const ProductScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      <button onClick={() => navigate("/")} className="mb-4">
        Back to Home
      </button>
      <div className="rounded-lg shadow-lg bg-neutral-800 p-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p>ID: {product.id}</p>
        <p>Description: {product.description}</p>
        <p>Price: ${product.price}</p>
        <p>Stock: {product.stock}</p>
        <p>Created At: {new Date(product.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ProductScreen;

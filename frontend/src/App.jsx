import { useState, useEffect } from "react";
import api from "./api/axios";

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products/");
        setProducts(response.data.products);
      } catch (err) {
        if (err.response) {
          setError(`Server error: ${err.response.status} ${err.response.data.detail}`);
        } else if (err.request) {
          setError("CORS or network error: Unable to reach the server");
        } else {
          setError(`Error: ${err.message}`);
        }
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <ul className="list-disc pl-5">
          {products.map((product) => (
            <li key={product.id} className="mb-2">
              {product.name} - ${product.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;

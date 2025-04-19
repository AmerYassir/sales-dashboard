import { useState } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch data from the API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://0.0.0.0:8000`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      setError(error.message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Sales Dashboard</h1>

      {/* Fetch button */}
      <button onClick={fetchData} disabled={isLoading}>
        {isLoading ? "Loading..." : "Fetch Data"}
      </button>

      {/* Display fetched data */}
      {data && (
        <div>
          <h2>Data:</h2>
          <p>
            <strong>Message:</strong> {data.message}
          </p>
        </div>
      )}

      {/* Display error message */}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}

export default App;

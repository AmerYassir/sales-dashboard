import { createContext, use, useState } from "react";

const DataContext = createContext();
export const useData = () => {
  const context = use(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

const DataProvider = ({ children }) => {
  const [data, setData] = useState({});

  return <DataContext value={{ data, setData }}>{children}</DataContext>;
};

export default DataProvider;

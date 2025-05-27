import { useNavigate } from "react-router";

const HomeScreen = () => {
  const navigate = useNavigate();
  const entities = [
    { name: "Products", path: "/products/" },
    { name: "Customers", path: "/customers/" },
    { name: "Sales Orders", path: "/sales_orders/" },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
      {entities.map((entity, index) => (
        <div
          key={index}
          className="rounded-lg shadow-lg bg-neutral-800 p-4 cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={() => navigate(entity.path)}
        >
          <h2 className="text-xl font-bold">{entity.name}</h2>
        </div>
      ))}
    </div>
  );
};

export default HomeScreen;

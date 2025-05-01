import { useState } from "react";
import { useRouteError } from "react-router";
import { MdError } from "react-icons/md";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";

const ErrorElement = () => {
  const error = useRouteError();
  const [showError, setShowError] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex w-full min-h-full flex-col p-5 gap-3 absolute top-1/5">
      <div className="flex flex-col items-center gap-3">
        <MdError className="text-9xl" />
        <h1 className="text-4xl">An Error Occurred</h1>
        <button type="button" className="w-full max-w-md" onClick={handleRefresh}>Refresh</button>
        <hr style={{ width: "100%", height: "2px", margin: "20px 0" }} />
      </div>
      <div className="w-full flex justify-start items-start gap-3">
        {showError ? (
          <IoIosArrowDown className="text-2xl cursor-pointer" style={{ width: "25px" }} onClick={() => setShowError(false)} />
        ) : (
          <IoIosArrowForward className="text-2xl cursor-pointer" style={{ width: "25px" }} onClick={() => setShowError(true)} />
        )}
        <div className="w-9/10 flex flex-col items-start justify-start gap-3">
          <p>{error?.message ?? "Error"}</p>
          {showError && <pre style={{ width: "100%", height: "20rem", overflow: "scroll" }}>{error?.stack ?? "An error occurred in the application"}</pre>}
        </div>
      </div>
    </div>
  );
};

export default ErrorElement;

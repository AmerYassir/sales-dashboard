import { MdError } from "react-icons/md";

const NoInternetConnection = () => {
  return (
    <div className="flex w-full h-full justify-center items-center flex-col p-5 gap-3">
      <MdError className="text-9xl" />
      <h1 className="text-2xl text-center">
        No Internet Connection.
        <br />
        Please try again later
      </h1>
    </div>
  );
};

export default NoInternetConnection;

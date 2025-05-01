import { lazy, Suspense } from "react";

import Router from "./router";
const NoInternetConnection = lazy(() => import("./screens/NoInternetConnection"));
import BeatLoader from "./components/BeatLoader";
import useInternetStatus from "./hooks/useInternetStatus.js";

function App() {
  const isOnline = useInternetStatus();

  function buildApp(isOnline) {
    if (isOnline === null) {
      return (
        <div className="flex w-full h-full justify-center items-center p-5">
          <BeatLoader />
        </div>
      );
    } else if (!isOnline) {
      return (
        <Suspense
          fallback={
            <div className="flex w-full h-full justify-center items-center p-5">
              <BeatLoader />
            </div>
          }
        >
          <NoInternetConnection />
        </Suspense>
      );
    } else {
      return <Router />;
    }
  }

  return buildApp(isOnline);
}

export default App;

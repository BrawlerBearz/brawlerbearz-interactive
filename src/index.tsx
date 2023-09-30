import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import logoImage from "./interactive/logo.gif";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

const InteractiveNFT = React.lazy(() => import("./App"));
const InteractiveCrates = React.lazy(() => import("./Crates"));

const version = "v1.3.0";

const Loading = () => {
  return (
    <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-[#]">
      <img className="w-[200px]" src={logoImage} alt="logo" />
      <div className="flex flex-col space-y-1 text-center text-white py-4">
        <h1 className="text-sm">Interactive Experience</h1>
        <span className="text-xs opacity-50">{version}</span>
      </div>
    </div>
  );
};

root.render(
  <React.StrictMode>
    <HashRouter>
      <React.Suspense fallback={<Loading />}>
        <Routes>
          <Route path="crates" element={<InteractiveCrates />}>
            <Route path=":txHash" element={<InteractiveCrates />} />
          </Route>
          <Route path=":tokenId" element={<InteractiveNFT />} />
          <Route index element={<Loading />} />
        </Routes>
      </React.Suspense>
    </HashRouter>
  </React.StrictMode>,
);

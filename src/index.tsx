import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import logoImage from "./interactive/logo.gif";
import { WalletContext } from "./context/WalletContext";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

const version = "v1.5.0";

const NFT = React.lazy(() => import("./NFT"));
const Crates = React.lazy(() => import("./Crates"));
const CratesHistory = React.lazy(() => import("./CratesHistory"));
const Bearz = React.lazy(() => import("./Bearz"));
const Crafting = React.lazy(() => import("./Crafting"));
const Consumables = React.lazy(() => import("./Consumables"));
const Connect = React.lazy(() => import("./Connect"));

const Loading = () => {
  return (
    <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-[#]">
      <img className="w-[180px]" src={logoImage} alt="logo" />
      <div className="flex flex-col space-y-1 text-center text-white py-4">
        <h1 className="text-sm">Interactive Experience</h1>
        <span className="text-xs opacity-80">{version}</span>
      </div>
    </div>
  );
};

const App = () => {
  const [wallet, setWallet] = useState(null);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        setWallet,
      }}
    >
      <Routes>
        <Route path="bearz" element={<Bearz />} />
        <Route path="crafting" element={<Crafting />} />
        <Route path="consumables" element={<Consumables />} />
        <Route path="crates/history" element={<CratesHistory />} />
        <Route path="crates" element={<Crates />}>
          <Route path=":txHash" element={<Crates />} />
        </Route>
        <Route path=":tokenId" element={<NFT />} />
        <Route index element={<Connect />} />
      </Routes>
    </WalletContext.Provider>
  );
};

root.render(
  <React.StrictMode>
    <HashRouter>
      <React.Suspense fallback={<Loading />}>
        <App />
      </React.Suspense>
    </HashRouter>
  </React.StrictMode>,
);

import React from "react";
import logoImage from "../interactive/logo.gif";

const PleaseConnectWallet = () => {
  return (
    <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
      <img className="w-[180px]" src={logoImage} alt="logo" />
      <div className="flex flex-col space-y-1 text-center text-white py-4">
        <h1 className="text-sm">Please connect wallet</h1>
      </div>
    </div>
  );
};

export default PleaseConnectWallet;

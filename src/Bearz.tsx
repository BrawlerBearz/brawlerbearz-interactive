import React from "react";
import { ToastContainer } from "react-toastify";
import ConnectButton from "./components/ConnectButton";
import SandboxWrapper from "./components/SandboxWrapper";
import { useAccount } from "wagmi";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import logoImage from "./interactive/logo.gif";
import buttonBackground from "./interactive/button.png";

const useSimulatedAccount = () => {
  return {
    address: null,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const useNFTWrapped = ({ isSimulated }) => {
  const account = !isSimulated ? useAccount() : useSimulatedAccount();

  if (isSimulated) {
    return account;
  }

  const { isLoading, owner: signer } = useSimpleAccountOwner();

  if (isLoading || !signer?.getAddress()) {
    return account;
  }

  return {
    ...account,
  };
};

const Experience = ({ isSimulated = false }) => {
  const { address, isConnected } = useNFTWrapped({
    isSimulated,
  });

  console.log({
    address,
    isConnected,
  });

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark font-primary space-y-4 text-white">
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <ConnectButton />
            {!isConnected ? (
              <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
                <img className="w-[180px]" src={logoImage} alt="logo" />
                <div className="flex flex-col space-y-1 text-center text-white py-4">
                  <h1 className="text-sm">Please connect wallet</h1>
                </div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-10">
                  <h1 className="text-lg">Your Brawler Bearz</h1>
                  <div className="flex flex-col flex-wrap gap-4">
                    Coming soon...
                  </div>
                </div>
            )}
          </div>
        )}
      </div>
      <ToastContainer
        theme="dark"
        position="bottom-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  );
};

const Bearz = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Bearz;

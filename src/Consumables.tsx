import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useAccount } from "wagmi";
import ConnectButton from "./components/ConnectButton";
import SandboxWrapper from "./components/SandboxWrapper";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import { bearzContractAddress } from "./lib/contracts";
import { ALCHEMY_KEY } from "./lib/constants";
import { getStatsByTokenId } from "./lib/blockchain";
import Loading from "./components/Loading";
import PleaseConnectWallet from "./components/PleaseConnectWallet";

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

  const isLoading = false;

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark font-primary space-y-4 text-white overflow-x-hidden">
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <ConnectButton />
            {!isConnected ? (
              <PleaseConnectWallet />
            ) : (
              <div className="flex flex-col w-full h-full items-center space-y-10">
                <h1 className="text-lg">Consumables</h1>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pb-20">
                    <span className="opacity-80">Coming soon...</span>
                  </div>
                )}
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

const Consumables = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Consumables;

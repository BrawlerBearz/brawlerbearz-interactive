import React from "react";
import {ToastContainer} from "react-toastify";
import ConnectButton from "./components/ConnectButton";
import SandboxWrapper from "./components/SandboxWrapper";
import {useAccount} from "wagmi";
import {useSimpleAccountOwner} from "./lib/useSimpleAccountOwner";

const useSimulatedAccount = () => {
    return {
        address: null,
        isConnected: true,
        isDisconnected: false,
        status: "connected",
    };
};

const useNFTWrapped = ({ isSimulated }) => {
    const account = !isSimulated
        ? useAccount()
        : useSimulatedAccount();

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
        address, isConnected
    });

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark items-center font-primary space-y-4 text-white">
        {!isSimulated && <ConnectButton />}
        <div className="flex flex-col space-y-2 items-center">Coming soon</div>
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

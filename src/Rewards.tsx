// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useAccount, useContractRead, useWalletClient } from "wagmi";
import Header from "./components/Header";
import SandboxWrapper from "./components/SandboxWrapper";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import Loading from "./components/Loading";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import { formatRelative, fromUnixTime } from "date-fns";
import classnames from "classnames";
import {
  bearzShopABI,
  bearzShopContractAddress,
  bearzSupplyCratesContractAddress,
  bearzTokenABI,
  bearzTokenContractAddress,
} from "./lib/contracts";
import { createPublicClient, formatEther, http } from "viem";
import { polygon } from "viem/chains";
import { L2_ALCHEMY_KEY } from "./lib/constants";

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
  const [balance, setBalance] = useState(null);

  const refreshBalance = async (address) => {
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(
        `https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`,
      ),
    });

    if (address) {
      const data = await polygonClient.readContract({
        address: bearzTokenContractAddress,
        abi: bearzTokenABI,
        functionName: "balanceOf",
        args: [address],
        chainId: polygon.id,
      });

      setBalance(String(data));
    }
  };
  useEffect(() => {
    refreshBalance(account?.address);
  }, [account?.address]);

  if (isLoading || !signer?.getAddress()) {
    return account;
  }

  return {
    ...account,
    balance,
    refreshBalance,
  };
};

const Experience = ({ isSimulated = false }) => {
  const { address, isConnected, balance, refreshBalance } = useNFTWrapped({
    isSimulated,
  });

  // const [{ balance }, { refreshBalance, onTransferCredits }] = useToken({
  //     account,
  //     chainId,
  // });

  const isLoading = false;
  const isLoadingBiconomy = false;

  console.log({
    balance,
  });

  return (
    <>
      <div
        className={classnames(
          "flex flex-col relative text-white items-center",
          {
            "justify-center h-screen w-screen": !isConnected,
            "h-full w-full": isConnected,
          },
        )}
      >
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <Header />
            {!isConnected && <PleaseConnectWallet />}
          </div>
        )}
        {isConnected &&
          (isLoadingBiconomy ? (
            <Loading />
          ) : (
            <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pb-20">
              <div className="flex flex-col items-center w-full h-full z-[5] space-y-4 px-6">
                <h1 className="text-xl mb-4">My Rewards</h1>
                <div className="flex flex-col space-y-4 text-sm">
                  <div className="flex flex-row items-center space-x-2">
                    <span>My Balance:</span>
                    <span>
                      {balance
                        ? parseFloat(formatEther(balance)).toFixed(6)
                        : 0}{" "}
                      $CREDIT
                    </span>
                  </div>
                  <hr />
                  <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pb-20">
                    <span className="opacity-80">Coming soon...</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

const Rewards = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Rewards;

// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { MdArrowBack as BackIcon } from "react-icons/md";
import { createPublicClient, decodeEventLog, http, parseAbiItem } from "viem";
import { mainnet } from "viem/chains";
import {
  bearzSupplyCratesABI,
  bearzSupplyCratesContractAddress,
} from "./lib/contracts";
import { ALCHEMY_KEY } from "./lib/constants";
import Header from "./components/Header";
import Loading from "./components/Loading";
import SandboxWrapper from "./components/SandboxWrapper";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import { shortenTxAddress } from "./lib/formatting";

const useCratesHistory = (address) => {
  const [state, setState] = useState({
    data: [],
    isLoading: true,
    error: null,
  });

  const onFetchHistory = async (addr) => {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    });

    const filter = await publicClient.createEventFilter({
      address: bearzSupplyCratesContractAddress,
      event: parseAbiItem(
        "event CrateItemsDropped(uint256 indexed requestId,address indexed from,uint256 randomness,uint256 crateTokenId,uint256[] itemIds)",
      ),
      fromBlock: 18187304n,
      args: {
        from: addr,
      },
    });

    const logs = await publicClient.getFilterLogs({ filter });

    logs.reverse();

    setState((prev) => ({
      ...prev,
      data: logs,
      isLoading: false,
      error: null,
    }));
  };

  useEffect(() => {
    onFetchHistory(address);
  }, [address]);

  return { ...state };
};

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

const Experience = ({ isSandboxed, isSimulated = false }) => {
  const { address, isConnected } = useNFTWrapped({ isSimulated });
  const { data, isLoading } = useCratesHistory(address);

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark font-primary space-y-4 text-white overflow-x-hidden">
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <Header />
            {!isConnected ? (
              <PleaseConnectWallet />
            ) : (
              <div className="flex flex-col w-full h-full items-center space-y-10 px-6 sm:px-10">
                <div className="flex flex-row items-center space-x-4">
                  <Link
                    to="/crates"
                    className="bg-main p-1 rounded-full text-2xl shadow-xl"
                  >
                    <BackIcon />
                  </Link>
                  <h1 className="text-lg">
                    Crates History ({data?.length || 0})
                  </h1>
                </div>
                <p className="text-sm opacity-80">
                  Click on transactions below to view replay
                </p>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div className="flex flex-col justify-center gap-8 pb-20">
                    {data.length > 0 ? (
                      data.map((tx) => {
                        const topic = decodeEventLog({
                          abi: bearzSupplyCratesABI,
                          data: tx?.data,
                          topics: tx?.topics,
                          strict: false,
                        });
                        const { itemIds } = topic?.args || {};
                        return (
                          <div
                            key={tx.transactionHash}
                            className="flex flex-col space-y-1"
                          >
                            <h2 className="text-accent">
                              Blocknumber: {String(tx.blockNumber)}
                            </h2>
                            <p className="text-sm">
                              Dropped {itemIds.length} item(s)
                            </p>
                            <Link
                              to={`/crates/${tx.transactionHash}`}
                              className="text-sm text-accent3 hover:underline"
                            >
                              {shortenTxAddress(tx.transactionHash)}
                            </Link>
                          </div>
                        );
                      })
                    ) : (
                      <p className="opacity-80">No supply crates history</p>
                    )}
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

const CratesHistory = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default CratesHistory;

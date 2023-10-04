import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useAccount } from "wagmi";
import { MdLock as LockIcon } from "react-icons/md";
import {
  GiStrongMan as TrainingIcon,
  GiJourney as QuestIcon,
} from "react-icons/gi";
import ConnectButton from "./components/ConnectButton";
import SandboxWrapper from "./components/SandboxWrapper";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import { bearzContractAddress } from "./lib/contracts";
import { ALCHEMY_KEY } from "./lib/constants";
import { getStatsByTokenId } from "./lib/blockchain";
import { formatNumber } from "./lib/formatting";
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

const useBearzNFTs = (account) => {
  const [state, setState] = useState({
    data: [],
    isLoading: true,
    error: null,
  });

  const toParams = (p) =>
    Object.keys(p)
      .map((key) => (p[key] ? key + "=" + p[key] : ""))
      .filter(Boolean)
      .join("&");

  const getAllUserNFTs = async (account, address) => {
    if (!account) return [];

    let nfts = [];

    const params = {
      owner: account,
      "contractAddresses[]": [address],
    };

    if (!params.owner) {
      return nfts;
    }

    let { ownedNfts, pageKey } = await fetch(
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}/getNFTs/?${toParams(
        params,
      )}`,
    ).then((res) => res.json());

    nfts = nfts.concat(ownedNfts);

    let currentPage = pageKey;

    // Pagination needed
    while (currentPage) {
      const { ownedNfts: partialNfts, pageKey } = await fetch(
        `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}/getNFTs/?${toParams(
          {
            ...params,
            pageKey: currentPage,
          },
        )}`,
      ).then((res) => res.json());
      currentPage = pageKey;
      nfts = nfts.concat(partialNfts);
    }
    return nfts;
  };

  const onRefresh = async (addr) => {
    const nfts = await getAllUserNFTs(addr, bearzContractAddress);
    const tokenIds = nfts.map((nft) => parseInt(nft?.id.tokenId, 16));
    const data = await Promise.all(
      tokenIds?.map((tokenId) => getStatsByTokenId(tokenId, {})),
    );
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
      data,
    }));
  };

  useEffect(() => {
    onRefresh(account);
  }, [account]);

  return {
    ...state,
    onRefresh: onRefresh.bind(null, account),
  };
};

const Experience = ({ isSimulated = false }) => {
  const { address, isConnected } = useNFTWrapped({
    isSimulated,
  });

  const { data, isLoading } = useBearzNFTs(address);

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
                <h1 className="text-lg">Your Brawler Bearz ({data.length})</h1>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pb-20">
                    {data.map((item) => {
                      const { metadata, stats, activity } = item;
                      const { end, int, lck, level, nextXpLevel, str, xp } =
                        stats || {};
                      const { isStaked, training, questing } = activity;

                      return (
                        <Link
                          key={metadata?.tokenId}
                          to={`/${metadata?.tokenId}`}
                          className="flex flex-col w-[300px] sm:w-[270px] items-center justify-center"
                        >
                          <div
                            role="button"
                            className={classnames(
                              "cursor-pointer relative flex flex-col w-full bg-dark shadow-pixel hover:shadow-pixelAccent shadow-xs overflow-hidden transition ease-in duration-200",
                              {
                                "shadow-pixelAccent": false,
                              },
                            )}
                            // onClick={() => {
                            //   setSelected((prev) => {
                            //     return {
                            //       ...prev,
                            //       [tokenId]: !prev[tokenId],
                            //     };
                            //   });
                            // }}
                          >
                            <div className="absolute top-[10px] left-[10px] bg-dark2 shadow-pixel px-2 py-1 z-[2]">
                              <div className="flex flex-row">
                                <span className="text-xs text-white">
                                  LVL {level || 0}
                                </span>
                              </div>
                            </div>
                            {(isStaked ||
                              questing?.isQuesting ||
                              training?.isTraining) && (
                              <div className="absolute top-[10px] right-[10px] bg-dark2 shadow-pixel px-2 py-1 z-[2]">
                                <div className="flex flex-row items-center justify-center space-x-2">
                                  {isStaked && (
                                    <LockIcon className="relative text-lg text-accent flex-shrink-0" />
                                  )}
                                  {questing?.isQuesting && (
                                    <QuestIcon className="relative text-lg text-accent flex-shrink-0" />
                                  )}
                                  {training?.isTraining && (
                                    <TrainingIcon className="relative text-lg text-accent flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="relative w-full z-[1]">
                              <img
                                className="object-cover w-full h-full"
                                src={metadata.image}
                                alt={metadata.dna}
                              />
                            </div>
                            <div className="flex flex-col w-full px-4 pt-2 pb-6 space-y-4">
                              <div className="flex flex-col justify-center space-y-2">
                                <h2 className="relative top-[2px] text-sm truncate">
                                  {metadata.name}
                                </h2>
                              </div>
                              <div className="flex flex-row w-full justify-between text-xs">
                                <div className="flex flex-col space-y-1 text-center">
                                  <span className="text-accent2">STR</span>
                                  <span>{str || 0}</span>
                                </div>
                                <div className="flex flex-col space-y-1 text-center">
                                  <span className="text-accent2">END</span>
                                  <span>{end || 0}</span>
                                </div>
                                <div className="flex flex-col space-y-1 text-center">
                                  <span className="text-accent2">INT</span>
                                  <span>{int || 0}</span>
                                </div>
                                <div className="flex flex-col space-y-1 text-center">
                                  <span className="text-accent2">LCK</span>
                                  <span>{lck || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1 text-center">
                                <span className="relative text-accent text-xs text-right">
                                  {formatNumber(xp)} XP
                                </span>
                                <div className="relative flex flex-row w-full">
                                  <div className="flex border border-1 border-accent bg-dark2 h-[12px] rounded-full w-full overflow-hidden">
                                    <div
                                      title={`Next Level: ${formatNumber(
                                        nextXpLevel,
                                      )} XP`}
                                      className="z-[1] bg-accent h-full rounded-full duration-300"
                                      style={{
                                        width: `${(xp / nextXpLevel) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="hidden text-[8px] text-accent relative top-[2px] left-[2px] h-[12px]">
                                    {level + 1}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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

import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { useParams } from "react-router-dom";
import {
  MdOpenInNew as ExternalIcon,
  MdWarning as WarnIcon,
  MdDownload as DownloadIcon,
} from "react-icons/md";
import { format, fromUnixTime, formatDistanceToNow } from "date-fns";
import {
  GiClothes as WardrobeIcon,
  GiStrongMan as TrainingIcon,
  GiJourney as QuestIcon,
  GiBattleAxe as BattleIcon,
} from "react-icons/gi";
import {
  FaInfoCircle as InfoIcon,
  FaExchangeAlt as ToggleIcon,
} from "react-icons/fa";
import { WagmiConfig, createConfig, useAccount } from "wagmi";
import { getWalletClient, getPublicClient, signMessage } from "@wagmi/core";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import {
  BaseSmartContractAccount,
  SimpleSmartAccountOwner,
  SimpleSmartContractAccount,
  SmartAccountProvider,
} from "@alchemy/aa-core";
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { polygon } from "viem/chains";
import {
  toHex,
  encodeFunctionData,
  createPublicClient,
  http,
  createWalletClient,
  custom,
} from "viem";
import { generateRenderingOrder } from "./lib/renderer";
import { getStatsByTokenId } from "./lib/blockchain";
import {
  shortenAddress,
  getAttributeValue,
  formatNumber,
} from "./lib/formatting";
import {
  ALCHEMY_KEY,
  WALLETCONNECT_PROJECT_ID,
  CONNECT_KIT_THEME,
  L2_ALCHEMY_KEY,
} from "./lib/constants";
import pawButton from "./interactive/paw.png";
import buttonBackground from "./interactive/button.png";
import twoDButton from "./interactive/toggle2d.png";
import pixelButton from "./interactive/togglepixel.png";
import logoImage from "./interactive/logo.gif";
import {
  bearzShopContractAddress,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
} from "./lib/contracts";

// https://docs.alchemy.com/reference/simple-account-factory-addresses
const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
  "0x15Ba39375ee2Ab563E8873C8390be6f2E2F50232";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const POLICY_ID = "0d885d06-13ce-49de-bb92-8644673da502";

const LoadingScreen = ({ children, tokenId }) => {
  const [progress, setProgress] = useState(25);
  const [metadata, setMetadata] = useState(null);

  const fetchMetadata = async (currentTokenId) => {
    const start = Math.floor(Math.random() * 30 + 20);
    setProgress(start);

    if (currentTokenId > -1 && currentTokenId < 4170) {
      const metadata = await getStatsByTokenId(currentTokenId);
      setProgress(100 - start > 70 ? Math.floor(100 - start / 2) : 90);
      setMetadata(metadata);
    }

    setTimeout(() => {
      setProgress(100);
    }, 500);
  };

  useEffect(() => {
    fetchMetadata(tokenId);
  }, [tokenId]);

  const isLoading = !metadata || progress !== 100;

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-dark">
          <img className="w-[200px]" src={logoImage} alt="logo" />
          <div className="w-[200px] h-[6px] rounded-full bg-transparent border-bg-main mt-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                transition: "width 300ms ease-in",
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      ) : (
        children({ metadata })
      )}
    </>
  );
};

const VIEWS = {
  WARDROBE: "WARDROBE",
  TRAINING: "TRAINING",
  QUESTING: "QUESTING",
  BATTLE: "BATTLE",
  ITEM: "ITEM",
};

const SubView = ({ children, title, subtitle, onBack }) => (
  <div className="w-full h-full flex flex-col text-white overflow-auto">
    <div className="flex flex-row items-center justify-between w-full px-3 tablet:px-6 pt-3 tablet:pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-sm md:text-xl font-bold truncate">{title}</h2>
        <span className="opacity-50 text-[12px]">{subtitle}</span>
      </div>
      <div className="flex flex-col space-y-1 text-right">
        <button
          className="relative flex items-center justify-center pr-6 tablet:px-10 cursor-pointer text-white opacity-50 hover:opacity-100 duration-300"
          type="button"
          onClick={onBack}
        >
          <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
            Back
          </span>
        </button>
      </div>
    </div>
    <div className="flex flex-shrink-0 w-full px-3 tablet:px-6 h-[1px] bg-white bg-opacity-50 my-4" />
    <div className="flex w-full overflow-auto my-2 md:my-4 px-3 tablet:px-6">
      {children}
    </div>
  </div>
);

const Popup = ({ children, isOpen, onClose }) => {
  return (
    <>
      <div
        className={classnames(
          "z-[10000] absolute flex shadow-xl flex-row top-0 left-0 h-full w-full bg-dark duration-300 ease-in-out",
          {
            "bg-opacity-0": !isOpen,
            "bg-opacity-50": isOpen,
          },
        )}
        onClick={onClose}
      />
      <div
        className={classnames(
          "z-[10002] absolute flex shadow-xl flex-row h-[calc(100%-70px)] w-full bg-dark rounded-tl-2xl rounded-tr-2xl duration-300 ease-in-out",
          {
            "-bottom-[100%]": !isOpen,
            "bottom-0": isOpen,
          },
        )}
      >
        {isOpen ? children : null}
      </div>
    </>
  );
};

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const useNFTWrapped = ({ isSimulated, overrideAddress }) => {
  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  // const owner: SimpleSmartAccountOwner = {
  //   signMessage: async (msg) => {
  //     console.log(msg);
  //     return signMessage({
  //       message: toHex(msg),
  //     })
  //   },
  //   getAddress: async () => account?.address,
  // };
  //
  // let provider = new AlchemyProvider({
  //   apiKey: L2_ALCHEMY_KEY,
  //   chain: polygon,
  //   entryPointAddress: ENTRY_POINT_ADDRESS,
  // }).connect(
  //     (rpcClient) =>
  //         new SimpleSmartContractAccount({
  //           entryPointAddress: ENTRY_POINT_ADDRESS,
  //           chain: polygon,
  //           factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  //           rpcClient,
  //           owner,
  //         })
  // );
  //
  // console.log({
  //   provider
  // });
  //
  // provider = provider.withAlchemyGasManager({
  //   provider: provider.rpcClient,
  //   policyId: POLICY_ID,
  //   entryPoint: ENTRY_POINT_ADDRESS,
  // });

  return {
    ...account,
    // owner,
    // actions: {
    //   onTrain: async ({ tokenIds }) => {
    //     try {
    //
    //       // const publicClient = getPublicClient({
    //       //   chainId: polygon.id
    //       // })
    //       //
    //       // const { request } = await publicClient.simulateContract({
    //       //   address: bearzStakeChildContractAddress,
    //       //   abi: bearzStakeChildABI,
    //       //   functionName: 'train',
    //       //   args: [tokenIds],
    //       //   account,
    //       // })
    //       //
    //       // console.log({
    //       //  request
    //       // });
    //       //
    //       // const walletClient = await getWalletClient({
    //       //   chainId: polygon.id
    //       // })
    //       //
    //       // await walletClient.writeContract(request)
    //
    //       // const callData = encodeFunctionData({
    //       //   abi: bearzStakeChildABI,
    //       //   functionName: 'train',
    //       //   args: [tokenIds],
    //       // })
    //       // // //
    //       // console.log({
    //       //   callData
    //       // });
    //       // //
    //       // const { hash } = await provider.sendTransaction({
    //       //   from: account.address,
    //       //   to: bearzStakeChildContractAddress,
    //       //   data: callData
    //       // });
    //       // //
    //       // console.log({
    //       //   hash
    //       // });
    //
    //       // const gasPrice = await publicClient.getGasPrice()
    //       //
    //       // console.log({
    //       //   callData,
    //       //   gasPrice
    //       // });
    //       //
    //       //
    //       //
    //       // fetch('https://polygon-mainnet.g.alchemy.com/v2/LCNPCoXan5scqbRr4KOZK8kofDifu2fz', {
    //       //   method: 'POST',
    //       //   headers: {accept: 'application/json', 'content-type': 'application/json'},
    //       //   body: JSON.stringify({
    //       //     id: 137,
    //       //     jsonrpc: '2.0',
    //       //     method: 'eth_estimateUserOperationGas',
    //       //     params: [
    //       //       {
    //       //         sender: account.address,
    //       //         nonce: '0x0',
    //       //         initCode: '0x',
    //       //         callData,
    //       //         // callGasLimit: '0xF4240',
    //       //         // verificationGasLimit: '0xF4240',
    //       //         // preVerificationGas: '0xF4240',
    //       //         // maxFeePerGas: toHex(gasPrice),
    //       //         // maxPriorityFeePerGas: toHex(gasPrice / 10n),
    //       //         signature: '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
    //       //         paymasterAndData: '0x4Fd9098af9ddcB41DA48A1d78F91F1398965addcfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c'
    //       //       },
    //       //         ENTRY_POINT_ADDRESS
    //       //     ]
    //       //   })
    //       // })
    //       //     .then(response => response.json())
    //       //     .then(response => console.log(response))
    //       //     .catch(err => console.error(err));
    //
    //       // const options = {
    //       //   method: 'POST',
    //       //   headers: {accept: 'application/json', 'content-type': 'application/json'},
    //       //   body: JSON.stringify({
    //       //     id: 1,
    //       //     jsonrpc: '2.0',
    //       //     method: 'alchemy_simulateExecution',
    //       //     params: [
    //       //       {
    //       //         from: account.address,
    //       //         to: bearzStakeChildContractAddress,
    //       //         value: '0x0',
    //       //         data: callData
    //       //       }
    //       //     ]
    //       //   })
    //       // };
    //       //
    //       // fetch('https://polygon-mainnet.g.alchemy.com/v2/LCNPCoXan5scqbRr4KOZK8kofDifu2fz', options)
    //       //     .then(response => response.json())
    //       //     .then(response => console.log(response))
    //       //     .catch(err => console.error(err));
    //
    //     } catch (error){
    //       console.log(error);
    //     }
    //   }
    // }
  };
};

const ActionMenu = ({ metadata, isSimulated }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [viewState, setViewState] = useState(null);
  const [isViewingBaseStats, setViewingBaseStats] = useState(false);
  const [viewContext, setViewContext] = useState(null);

  const {
    metadata: onChainMetadata,
    stats,
    items,
    faction,
    calculated,
    activity,
  } = metadata || {};

  const { name, ownerOf, tokenId, image } = onChainMetadata || {};

  const { level, xp, str, end, int, lck, nextXpLevel } = stats || {};

  const { address, isConnected } = useNFTWrapped({
    isSimulated,
    overrideAddress: ownerOf,
  });

  const isOwnerOfNFT = address === ownerOf;

  const actionsLive = false;

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 500);
  }, []);

  return (
    <>
      {!viewState && (
        <div className="w-full h-full flex flex-col text-white">
          <div className="flex flex-col gap-4 tablet:gap-0 tablet:flex-row tablet:items-center tablet:justify-between w-full px-3 tablet:px-6 pt-3 tablet:pt-6">
            <div className="flex flex-col gap-2">
              <h2 className="flex flex-row items-center space-x-3 text-sm md:text-xl font-bold">
                <span title={`Token: #${tokenId}, ${name}`}>{name}</span>
                {faction?.image && (
                  <img
                    className="h-[20px] w-[20px]"
                    src={faction?.image}
                    title={faction?.label}
                    alt={faction?.label}
                  />
                )}
                <a
                  className="opacity-50 hover:opacity-100 text-[20px] cursor-pointer"
                  href={image}
                  download
                >
                  <DownloadIcon />
                </a>
              </h2>
              <a
                className="inline-flex opacity-50 text-[12px] hover:underline text-accent3"
                href={`https://etherscan.io/address/${ownerOf}`}
                target="_blank"
                rel="noreferrer"
              >
                <span title={ownerOf}>{shortenAddress(ownerOf)}</span>
                <span className="ml-2 text-lg">
                  <ExternalIcon />
                </span>
              </a>
            </div>
            <div className="flex flex-col space-y-1 tablet:text-right tablet:items-end">
              <span title={`Level ${level}`} className="text-sm md:text-lg">
                Level {level}
              </span>
              <span
                title={`${formatNumber(xp)} XP`}
                className="text-xs text-accent"
              >
                {formatNumber(xp)} XP
              </span>
              <div className="relative flex flex-row w-full justify-end space-x-1">
                <div className="flex border border-1 border-accent bg-dark2 h-[12px] rounded-full w-[120px] overflow-hidden">
                  <div
                    title={`Next Level: ${formatNumber(nextXpLevel)} XP`}
                    className="z-[1] bg-accent h-full rounded-full duration-300"
                    style={{
                      width: !isMounted ? 0 : `${(xp / nextXpLevel) * 100}%`,
                    }}
                  />
                </div>
                <span className="hidden text-[8px] text-accent relative top-[2px] left-[2px] h-[12px]">
                  {level + 1}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 w-full px-3 tablet:px-6 h-[1px] bg-white bg-opacity-50 my-4" />
          <div className="flex flex-col overflow-auto px-3 tablet:px-6 pb-6">
            <div className="flex flex-col flex-shrink-0 w-full space-y-4">
              <h3 className="hidden text-xs opacity-50">Manage Brawler</h3>
              {!isSimulated && (
                <ConnectKitButton.Custom>
                  {({ isConnected, show, truncatedAddress, ensName }) => {
                    return !isConnected ? (
                      <button
                        onClick={show}
                        className="relative flex items-center justify-center w-[250px] cursor-pointer"
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          Connect
                        </span>
                      </button>
                    ) : (
                      <button
                        className="hover:underline text-xs text-accent text-left"
                        onClick={show}
                      >
                        Connected to {ensName ?? truncatedAddress}
                      </button>
                    );
                  }}
                </ConnectKitButton.Custom>
              )}
              <div className="flex flex-wrap w-full gap-2 tablet:gap-4">
                {isConnected && !isOwnerOfNFT && (
                  <div className="flex flex-row items-center text-warn py-2 space-x-2">
                    <span className="text-base">
                      <WarnIcon />
                    </span>
                    <span className="text-[10px] leading-[16px] relative top-[1px]">
                      {" "}
                      You do not own this NFT to perform actions
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-xs opacity-50">
                  {isViewingBaseStats ? "Base Stats" : "Stats"}
                </h3>
                <button
                  className="text-xl text-white opacity-50 hover:opacity-100"
                  onClick={() => {
                    setViewingBaseStats((value) => !value);
                  }}
                  title={`View ${
                    isViewingBaseStats ? "current" : "base"
                  } stats`}
                >
                  <ToggleIcon />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">STR</span>
                  <span className="text-xs md:text-lg">
                    {formatNumber(
                      isViewingBaseStats
                        ? calculated?.baseline.str
                        : calculated?.baseAggregate.str,
                    )}
                  </span>
                  {!isViewingBaseStats && calculated?.computed?.str > 0 ? (
                    <span className="text-[12px] text-accent">
                      +{formatNumber(calculated?.computed?.str)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">END</span>
                  <span className="text-xs md:text-lg">
                    {formatNumber(
                      isViewingBaseStats
                        ? calculated?.baseline.end
                        : calculated?.baseAggregate.end,
                    )}
                  </span>
                  {!isViewingBaseStats && calculated?.computed?.end > 0 ? (
                    <span className="text-[12px] text-accent">
                      +{formatNumber(calculated?.computed?.end)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">INT</span>
                  <span className="text-xs md:text-lg">
                    {formatNumber(
                      isViewingBaseStats
                        ? calculated?.baseline.int
                        : calculated?.baseAggregate.int,
                    )}
                  </span>
                  {!isViewingBaseStats && calculated?.computed?.int > 0 ? (
                    <span className="text-[12px] text-accent">
                      +{formatNumber(calculated?.computed?.int)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">LCK</span>
                  <span className="text-xs md:text-lg">
                    {formatNumber(
                      isViewingBaseStats
                        ? calculated?.baseline.lck
                        : calculated?.baseAggregate.lck,
                    )}
                  </span>
                  {!isViewingBaseStats && calculated?.computed?.lck > 0 ? (
                    <span className="text-[12px] text-accent">
                      +{formatNumber(calculated?.computed?.lck)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
              </div>
              {!metadata?.isSynced && !isViewingBaseStats && (
                <div className="flex flex-row items-center text-accent2 py-2 space-x-2">
                  <span className="text-base">
                    <InfoIcon />
                  </span>
                  <span className="text-[10px] leading-[16px] relative top-[1px]">
                    This bearz stats are not fully synced to Ethereum
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <h3 className="text-xs opacity-50">Equipped Item(s)</h3>
              {items.length > 0 ? (
                <div className="flex flex-shrink-0 items-center w-full flex-wrap gap-4">
                  {items.map((item) => (
                    <button
                      key={item?.tokenId}
                      title={item.label}
                      onClick={() => {
                        setViewContext({
                          ...item,
                          boost: calculated?.boostsByItemId?.[item?.tokenId],
                        });
                        setViewState(VIEWS.ITEM);
                      }}
                      className="flex flex-col flex-shrink-0 w-[100px] gap-2"
                    >
                      <img
                        className="h-full w-full"
                        src={item.image}
                        alt={item.label}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p>
                  <p className="text-[10px]">No equipped items</p>
                </p>
              )}
              {isConnected && isOwnerOfNFT && actionsLive && (
                <button
                  className="relative flex items-center justify-center w-[250px] cursor-pointer"
                  type="button"
                  onClick={() => {
                    setViewState(VIEWS.WARDROBE);
                  }}
                >
                  <img
                    className="object-cover h-full w-full"
                    src={buttonBackground}
                    alt="button"
                  />
                  <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                    Wardrobe
                  </span>
                </button>
              )}
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-xs opacity-50">Training</h3>
              </div>
              {!activity?.training?.isTraining ? (
                <p className="text-[10px]">Not in training</p>
              ) : (
                <div className="flex flex-col space-y-2">
                  <h3 className="text-sm text-accent">
                    XP: {formatNumber(Number(activity?.training?.training?.xp))}
                  </h3>
                  <p className="text-[10px]">
                    Training for{" "}
                    {formatDistanceToNow(
                      new Date(
                        fromUnixTime(activity?.training?.training?.startAt),
                      ),
                    )}
                  </p>
                </div>
              )}
              {isConnected && isOwnerOfNFT && actionsLive && (
                <button
                  className="relative flex items-center justify-center w-[250px] cursor-pointer"
                  type="button"
                  onClick={() => {
                    setViewState(VIEWS.TRAINING);
                  }}
                >
                  <img
                    className="object-cover h-full w-full"
                    src={buttonBackground}
                    alt="button"
                  />
                  <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                    Train
                  </span>
                </button>
              )}
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-xs opacity-50">Questing</h3>
              </div>
              {!activity?.questing?.isQuesting ? (
                <p className="text-[10px]">Not on a quest</p>
              ) : (
                <div className="flex flex-col space-y-2">
                  <h3 className="text-sm text-accent">
                    {activity?.questing?.currentQuest?.name}
                  </h3>
                  <p className="text-[10px]">
                    Started:{" "}
                    {format(
                      new Date(
                        fromUnixTime(activity?.questing?.quest?.startAt),
                      ),
                      "yyyy-MM-dd hh:mm aaaa",
                    )}
                  </p>
                  <p className="text-[10px]">
                    Ends:{" "}
                    {format(
                      new Date(fromUnixTime(activity?.questing?.quest?.endAt)),
                      "yyyy-MM-dd hh:mm aaaa",
                    )}
                  </p>
                </div>
              )}
              {isConnected && isOwnerOfNFT && actionsLive && (
                <button
                  className="relative flex items-center justify-center w-[250px] cursor-pointer"
                  type="button"
                  onClick={() => {
                    setViewState(VIEWS.QUESTING);
                  }}
                >
                  <img
                    className="object-cover h-full w-full"
                    src={buttonBackground}
                    alt="button"
                  />
                  <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                    Quest
                  </span>
                </button>
              )}
            </div>
            {isSimulated && (
              <p className="text-[10px] opacity-50 py-2">
                Note: We have detected you are in an environment that cannot
                connect a wallet. The experience will run in a <u>simulated</u>{" "}
                mode. You can make changes but no real transactions will take
                place.
              </p>
            )}
          </div>
        </div>
      )}
      {viewState === VIEWS.ITEM && viewContext && (
        <SubView
          title={viewContext?.name}
          subtitle="Detailed View"
          onBack={() => {
            setViewState(null);
            setViewContext(null);
          }}
        >
          <div className="flex flex-col w-full items-center space-y-4">
            <div className="flex flex-col flex-shrink-0 w-full space-y-4">
              <h3 className="text-xs opacity-50">Stats</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">STR</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.atk)}%
                  </span>
                  {viewContext?.boost?.str > 0 && (
                    <span className="text-xs text-accent">
                      +{formatNumber(viewContext?.boost?.str)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">END</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.def)}%
                  </span>
                  {viewContext?.boost?.end > 0 && (
                    <span className="text-xs text-accent">
                      +{formatNumber(viewContext?.boost?.end)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">INT</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.intel)}%
                  </span>
                  {viewContext?.boost?.int > 0 && (
                    <span className="text-xs text-accent">
                      +{formatNumber(viewContext?.boost?.int)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs opacity-50 text-accent3">LCK</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.luck)}%
                  </span>
                  {viewContext?.boost?.lck > 0 && (
                    <span className="text-xs text-accent">
                      +{formatNumber(viewContext?.boost?.lck)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col flex-shrink-0 w-full space-y-2 items-center justify-center">
              <img
                className="w-[200px] h-auto py-4"
                src={viewContext?.image}
                alt={viewContext?.name}
              />
            </div>
            {viewContext?.openseaUrl && (
              <a
                className="relative flex text-xs text-left py-4 opacity-50 hover:opacity-100 hover:underline"
                href={viewContext?.openseaUrl}
                target="_blank"
                rel="noreferrer"
              >
                View OpenSea
              </a>
            )}
          </div>
        </SubView>
      )}
      {viewState === VIEWS.WARDROBE && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <WardrobeIcon />
              </span>
              <span>Wardrobe</span>
            </div>
          }
          subtitle={name}
          onBack={() => {
            setViewState(null);
          }}
        >
          Coming soon
        </SubView>
      )}
      {viewState === VIEWS.TRAINING && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <TrainingIcon />
              </span>
              <span>Training</span>
            </div>
          }
          subtitle={name}
          onBack={() => {
            setViewState(null);
          }}
        >
          Coming soon
        </SubView>
      )}
      {viewState === VIEWS.QUESTING && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <QuestIcon />
              </span>
              <span>Questing</span>
            </div>
          }
          subtitle={name}
          onBack={() => {
            setViewState(null);
          }}
        >
          Coming soon
        </SubView>
      )}
      {viewState === VIEWS.BATTLE && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <BattleIcon />
              </span>
              <span>Battle</span>
            </div>
          }
          subtitle={name}
          onBack={() => {
            setViewState(null);
          }}
        >
          asdas
        </SubView>
      )}
    </>
  );
};

const ImageRenderer = ({ images }) => {
  return (
    <div className="max-h-[2048px] relative h-full w-full max-w-[2048px]">
      {images.map((imageURL, index) => (
        <img
          key={`${imageURL}_${index}`}
          src={imageURL || ""}
          className="h-full w-full absolute top-0 left-0"
          style={{ zIndex: images.length + index }}
          alt="Layered image"
        />
      ))}
    </div>
  );
};

const Header = ({
  isSynthEnabled = false,
  isShowingPixel = true,
  onToggleMenu = null,
  onTogglePixel = null,
}) => {
  return (
    <div className="absolute top-0 flex flex-row items-center justify-between w-full min-h-[50px] z-[10001] px-3">
      {onToggleMenu ? (
        <button
          onClick={onToggleMenu}
          className="h-[40px] w-[40px] opacity-50 hover:opacity-80 bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl duration-300"
        >
          <img
            src={pawButton}
            className="h-full w-full p-[9px]"
            alt="paw menu icon"
          />
        </button>
      ) : (
        <div />
      )}
      {isSynthEnabled && onTogglePixel && (
        <button onClick={onTogglePixel}>
          <img
            src={!isShowingPixel ? twoDButton : pixelButton}
            className="h-[57px] w-[104px]"
            alt="enabler icon"
          />
        </button>
      )}
    </div>
  );
};

const FullExperience = ({
  metadata,
  images,
  isSynthEnabled,
  isShowingPixel,
  onTogglePixel,
  isSimulated,
}) => {
  const [isShowingMenu, setIsShowingMenu] = useState(false);
  return (
    <div className="relative h-full w-full">
      <Header
        onToggleMenu={() => {
          setIsShowingMenu((value) => !value);
        }}
        isSynthEnabled={isSynthEnabled}
        isShowingPixel={isShowingPixel}
        onTogglePixel={onTogglePixel}
      />
      <ImageRenderer images={images} />
      <Popup
        isOpen={isShowingMenu}
        onClose={() => {
          setIsShowingMenu(false);
        }}
      >
        <ActionMenu metadata={metadata} isSimulated={isSimulated} />
      </Popup>
    </div>
  );
};

const MobileFullExperience = ({
  metadata,
  images,
  isSynthEnabled,
  isShowingPixel,
  onTogglePixel,
  isSimulated,
}) => {
  return (
    <div className="relative h-full w-full">
      <Header
        isSynthEnabled={isSynthEnabled}
        isShowingPixel={isShowingPixel}
        onTogglePixel={onTogglePixel}
      />
      <div className="aspect-square">
        <ImageRenderer images={images} />
      </div>
      <ActionMenu metadata={metadata} isSimulated={isSimulated} />
    </div>
  );
};

const Experience = ({ metadata, isSandboxed, isSimulated = false }) => {
  const [isShowingPixel, setIsShowingPixel] = useState(false);

  const { images, isSynthEnabled } = generateRenderingOrder({
    dna: metadata?.metadata?.dna,
    isShowingPixel,
  });

  const onTogglePixel = () => {
    setIsShowingPixel((value) => !value);
  };

  return (
    <div className="h-screen w-screen bg-dark font-primary">
      <div className="hidden tablet:flex max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
        <FullExperience
          metadata={metadata}
          isSimulated={isSimulated}
          isShowingPixel={isShowingPixel}
          images={images}
          isSynthEnabled={isSynthEnabled}
          onTogglePixel={onTogglePixel}
        />
      </div>
      {isSandboxed ? (
        <div className="flex tablet:hidden max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
          <FullExperience
            metadata={metadata}
            isSimulated={isSimulated}
            isShowingPixel={isShowingPixel}
            images={images}
            isSynthEnabled={isSynthEnabled}
            onTogglePixel={onTogglePixel}
          />
        </div>
      ) : (
        <div className="flex tablet:hidden relative h-full w-full overflow-auto">
          <MobileFullExperience
            metadata={metadata}
            isSimulated={isSimulated}
            isShowingPixel={isShowingPixel}
            images={images}
            isSynthEnabled={isSynthEnabled}
            onTogglePixel={onTogglePixel}
          />
        </div>
      )}
    </div>
  );
};

const NFTViewer = ({ isSandboxed, metadata }) => {
  return isSandboxed ? (
    <Experience metadata={metadata} isSandboxed={isSandboxed} isSimulated />
  ) : (
    <WagmiConfig
      config={createConfig(
        getDefaultConfig({
          alchemyId: ALCHEMY_KEY, // or infuraId
          walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
          appName: "Brawler Bearz: Interactive Experience",
          appDescription: "A mini-dapp for managing your brawler bear",
        }),
      )}
    >
      <ConnectKitProvider
        customTheme={CONNECT_KIT_THEME}
        options={{
          embedGoogleFonts: true,
          walletConnectName: "Other Wallets",
        }}
      >
        <Experience
          metadata={metadata}
          isSandboxed={isSandboxed}
          isSimulated={false}
        />
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

const InteractiveNFT = () => {
  const { tokenId } = useParams();
  const isSandboxed =
    window.location !== window.parent.location ||
    window.self !== window.top ||
    window.frameElement;
  return (
    <LoadingScreen tokenId={tokenId}>
      {({ metadata }) => (
        <NFTViewer metadata={metadata} isSandboxed={isSandboxed} />
      )}
    </LoadingScreen>
  );
};

export default InteractiveNFT;

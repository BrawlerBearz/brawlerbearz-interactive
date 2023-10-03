// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import classnames from "classnames";
import { useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  MdOpenInNew as ExternalIcon,
  MdWarning as WarnIcon,
  MdError as ErrorIcon,
  MdDownload as DownloadIcon,
  MdRefresh as RefreshIcon,
  MdOpenInNew as OpenWindowIcon,
  MdChevronRight as ArrowRightIcon,
  MdChevronLeft as ArrowLeftIcon,
  MdCamera as CameraIcon,
  MdUndo as UndoIcon,
} from "react-icons/md";
import { format, fromUnixTime, formatDistanceToNow, isAfter } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import {
  GiClothes as WardrobeIcon,
  GiJourney as QuestIcon,
  GiBattleAxe as BattleIcon,
  GiWorld as WorldIcon,
} from "react-icons/gi";
import {
  FaSkull as SkullIcon,
  FaInfoCircle as InfoIcon,
  FaExchangeAlt as ToggleIcon,
} from "react-icons/fa";
import { orderBy, last } from "lodash";
import {
  WagmiConfig,
  createConfig,
  useAccount,
  useContractReads,
  useContractRead,
} from "wagmi";
import {
  getWalletClient,
  getPublicClient,
  waitForTransaction,
} from "@wagmi/core";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import { Bundler } from "@biconomy/bundler";
import {
  BiconomySmartAccount,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { ChainId } from "@biconomy/core-types";
import { mainnet, polygon } from "viem/chains";
import {
  encodeFunctionData,
  createPublicClient,
  http,
  formatEther,
} from "viem";
import { generateRenderingOrder } from "./lib/renderer";
import { BEARZ_SHOP_IMAGE_URI, getStatsByTokenId } from "./lib/blockchain";
import { shortenAddress, formatNumber } from "./lib/formatting";
import {
  WALLETCONNECT_PROJECT_ID,
  CONNECT_KIT_THEME,
  L2_ALCHEMY_KEY,
} from "./lib/constants";
import pawButton from "./interactive/paw.png";
import buttonBackground from "./interactive/button.png";
import twoDButton from "./interactive/toggle2d.png";
import pixelButton from "./interactive/togglepixel.png";
import logoImage from "./interactive/logo.gif";
import neocityMap from "./interactive/map/neocity.png";
import neocityShop from "./interactive/map/shop.png";
import {
  bearzQuestABI,
  bearzQuestContractAddress,
  bearzShopABI,
  bearzShopContractAddress,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
  bearzTokenABI,
  bearzTokenContractAddress,
} from "./lib/contracts";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";

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

  const onRefresh = async () => {
    const metadata = await getStatsByTokenId(tokenId);
    setMetadata(metadata);
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
        children({ metadata, onRefresh })
      )}
    </>
  );
};

const VIEWS = {
  NEOCITY: "NEOCITY",
  WARDROBE: "WARDROBE",
  QUESTING: "QUESTING",
  BATTLE: "BATTLE",
  ITEM: "ITEM",
};

const SubView = ({ children, childClassName, title, subtitle, onBack }) => (
  <div className="w-full h-full flex flex-col text-white">
    <div className="flex flex-row items-center justify-between w-full px-3 tablet:px-6 py-3 tablet:pt-6">
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
    <div className="flex flex-shrink-0 w-full px-3 tablet:px-6 h-[1px] bg-white bg-opacity-50" />
    <div
      className={classnames(
        "flex w-full h-full tablet:overflow-auto px-2 tablet:px-4",
        childClassName,
      )}
    >
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
            "bg-opacity-0 pointer-events-none": !isOpen,
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

const useNFTWrapped = ({ isSimulated, overrideAddress, onRefresh }) => {
  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  if (isSimulated) {
    return account;
  }

  const { isLoading, owner: signer } = useSimpleAccountOwner();

  if (isLoading || !signer?.getAddress()) {
    return account;
  }

  const biconomyAccount = new BiconomySmartAccount({
    signer,
    chainId: ChainId.POLYGON_MAINNET,
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`,
    paymaster: new BiconomyPaymaster({
      paymasterUrl:
        "https://paymaster.biconomy.io/api/v1/137/pQ4YfSfVI.5f85bc99-110a-4594-9629-5f5c5ddacded",
    }),
    bundler: new Bundler({
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/137/BB897hJ89.dd7fopYh-iJkl-jI89-af80-6877f74b7Fcg",
      chainId: ChainId.POLYGON_MAINNET,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    }),
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const checkSmartWalletAssociation = async ({ smartAccount }) => {
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(
        `https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`,
      ),
    });

    const smartAccountAddress = await smartAccount.getSmartAccountAddress();

    // Check if smart wallet is enabled already and associated to leverage
    const smartWalletAssociated = await polygonClient.readContract({
      address: bearzStakeChildContractAddress,
      abi: bearzStakeChildABI,
      functionName: "operatorAccess",
      args: [smartAccountAddress],
    });

    // Set up smart wallet association if different than expected
    if (
      smartWalletAssociated.toLowerCase() !== smartAccount.owner.toLowerCase()
    ) {
      toast.info(
        `Setting up smart wallet permissions for EOA: ${smartAccount.owner}`,
      );

      const publicClient = getPublicClient({
        chainId: polygon.id,
      });

      const { request } = await publicClient.simulateContract({
        address: bearzStakeChildContractAddress,
        abi: bearzStakeChildABI,
        functionName: "associateOperatorAsOwner",
        args: [smartAccountAddress],
        account: {
          address: signer.getAddress(),
        },
      });

      const walletClient = await getWalletClient({
        chainId: polygon.id,
      });

      const hash = await walletClient.writeContract(request);

      const receipt = await waitForTransaction({
        hash,
      });

      toast.success(
        `Created smart wallet: ${smartAccountAddress}...continuing...`,
      );
    }
  };

  return {
    ...account,
    actions: {
      onQuest: async ({ tokenIds, questTypeIds, tokenAmount }) => {
        try {
          const smartAccount = await biconomyAccount.init();

          await checkSmartWalletAssociation({ smartAccount });

          const callData = encodeFunctionData({
            abi: bearzStakeChildABI,
            functionName: "quest",
            args: [tokenIds, questTypeIds, tokenAmount],
          });

          const partialUserOp = await smartAccount.buildUserOp([
            {
              to: bearzStakeChildContractAddress,
              data: callData,
            },
          ]);

          const { paymasterAndData } =
            await smartAccount.paymaster.getPaymasterAndData(partialUserOp, {
              mode: PaymasterMode.SPONSORED,
            });

          partialUserOp.paymasterAndData = paymasterAndData;

          const userOpResponse = await smartAccount.sendUserOp(partialUserOp);

          await toast.promise(userOpResponse.wait(), {
            pending: "Packing up to go out on quest...",
            success: "Bear left to go on quest.",
            error: "There was an error",
          });

          onRefresh();
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        }
      },
      onStopTraining: async ({ tokenIds }) => {
        try {
          const smartAccount = await biconomyAccount.init();

          await checkSmartWalletAssociation({ smartAccount });

          const callData = encodeFunctionData({
            abi: bearzStakeChildABI,
            functionName: "stopTraining",
            args: [tokenIds],
          });

          const partialUserOp = await smartAccount.buildUserOp([
            {
              to: bearzStakeChildContractAddress,
              data: callData,
            },
          ]);

          const { paymasterAndData } =
            await smartAccount.paymaster.getPaymasterAndData(partialUserOp, {
              mode: PaymasterMode.SPONSORED,
            });

          partialUserOp.paymasterAndData = paymasterAndData;

          const userOpResponse = await smartAccount.sendUserOp(partialUserOp);

          await toast.promise(userOpResponse.wait(), {
            pending: "Calling bear on the intercom...please wait...",
            success: "Bear left training.",
            error: "There was an error",
          });

          onRefresh();
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        }
      },
      onStartTraining: async ({ tokenIds }) => {
        try {
          const smartAccount = await biconomyAccount.init();

          await checkSmartWalletAssociation({ smartAccount });

          const callData = encodeFunctionData({
            abi: bearzStakeChildABI,
            functionName: "train",
            args: [tokenIds],
          });

          const partialUserOp = await smartAccount.buildUserOp([
            {
              to: bearzStakeChildContractAddress,
              data: callData,
            },
          ]);

          const { paymasterAndData } =
            await smartAccount.paymaster.getPaymasterAndData(partialUserOp, {
              mode: PaymasterMode.SPONSORED,
            });

          partialUserOp.paymasterAndData = paymasterAndData;

          const userOpResponse = await smartAccount.sendUserOp(partialUserOp);

          await toast.promise(userOpResponse.wait(), {
            pending: "Time to train!",
            success: "Bear is in training.",
            error: "There was an error",
          });

          onRefresh();
        } catch (error) {
          console.log(error);
          toast.error("There was an error. Please try again!");
        }
      },
    },
  };
};

const useQuests = ({ address }) => {
  const { data, isLoading } = useContractReads({
    contracts: [
      {
        address: bearzStakeChildContractAddress,
        abi: bearzStakeChildABI,
        chainId: polygon.id,
        functionName: "getAllQuests",
      },
      {
        address: bearzQuestContractAddress,
        abi: bearzQuestABI,
        chainId: polygon.id,
        functionName: "getClaimableRewards",
        args: [address],
      },
      {
        address: bearzTokenContractAddress,
        abi: bearzTokenABI,
        chainId: polygon.id,
        functionName: "balanceOf",
        args: [address],
      },
    ],
  });

  return [
    {
      isLoading,
      quests: orderBy(
        data?.[0]?.result,
        (quest) => fromUnixTime(quest?.activeUntil),
        "desc",
      ),
      rewards: data?.[1]?.result,
      balance: formatEther(data?.[2]?.result ?? 0n),
    },
  ];
};

const SelectedQuestView = ({ quest }) => {
  const { data: items, isLoading } = useContractRead({
    address: bearzShopContractAddress,
    abi: bearzShopABI,
    chainId: mainnet.id,
    functionName: "getMetadataBatch",
    args: [quest?.itemIds],
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-full space-y-4">
      <h3 className="text-lg text-accent">{quest?.name}</h3>
      <p className="opacity-90 pb-4">{quest?.description}</p>
      <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <h3 className="text-sm opacity-50">Duration</h3>
            <span className="text-sm">
              {Number(quest.duration) / 86400} day(s)
            </span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm opacity-50">Cooldown</h3>
            <span className="text-sm">
              {Number(quest.cooldownPeriod) / 86400} day(s)
            </span>
          </div>
        </div>
        <h3 className="text-sm opacity-50 pt-4">Item(s)</h3>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <img className="w-[100px]" src={logoImage} alt="logo" />
            <span className="text-white opacity-50 text-sm">Loading...</span>
          </div>
        ) : (
          <div className="flex flex-shrink-0 items-center w-full flex-wrap gap-4">
            {quest?.itemIds.map((item, index) => {
              const isValidItem = Number(item) !== 0;

              const metadata = isValidItem ? items?.[index] : {};

              const currentRarity =
                index === quest?.rarities.length - 1
                  ? Number(quest?.rarities[index]) - 1
                  : Number(quest?.rarities[index]);

              const dropRarity =
                (index === 0
                  ? Number(currentRarity)
                  : Number(currentRarity) -
                    Number(quest?.rarities[index - 1])) / 100;

              return (
                <div key={item} className="flex flex-col space-y-2">
                  {isValidItem ? (
                    <div
                      title={metadata.name}
                      className="flex flex-col flex-shrink-0 w-[100px] gap-2"
                    >
                      <img
                        className="h-full w-full"
                        src={`${BEARZ_SHOP_IMAGE_URI}${item}.png`}
                        alt={metadata.name}
                      />
                    </div>
                  ) : (
                    <div
                      key={`NONE_${index}`}
                      className="flex flex-col items-center bg-main border border-[1px] border-white rounded-md justify-center space-y-2 p-4 text-center flex flex-col flex-shrink-0 w-[100px] h-[140px] gap-2"
                    >
                      <SkullIcon className="relative h-[60px] w-[60px] object-contain" />
                      <span className="text-[10px] opacity-50">Nothing</span>
                    </div>
                  )}
                  <span className="text-[10px] text-center">{dropRarity}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const QuestingView = ({ address, name, onBack }) => {
  const [{ isLoading, quests, rewards, balance }] = useQuests({ address });
  const [selectedQuest, setSelectedQuest] = useState(null);
  return (
    <SubView
      title={
        <div className="flex flex-row items-center space-x-3">
          <span className="text-2xl">
            <QuestIcon />
          </span>
          <span>Questing</span>
        </div>
      }
      subtitle={selectedQuest?.questType ?? name}
      onBack={() => {
        if (selectedQuest) {
          setSelectedQuest(null);
        } else {
          onBack();
        }
      }}
    >
      <div className="flex flex-col w-full h-full py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <img className="w-[100px]" src={logoImage} alt="logo" />
            <span className="text-white opacity-50 text-sm">Loading...</span>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 w-full">
            {selectedQuest ? (
              <SelectedQuestView quest={selectedQuest} />
            ) : (
              <div className="flex flex-col flex-shrink-0 w-full space-y-4">
                <h3 className="hidden text-sm opacity-50">Recent Quests</h3>
                {quests?.length > 0 ? (
                  <div className="flex flex-shrink-0 items-center w-full flex-wrap gap-2">
                    {quests.map((quest) => {
                      const activeDate = new Date(
                        fromUnixTime(quest?.activeUntil),
                      );
                      const isActive = isAfter(activeDate, new Date());

                      return (
                        <div
                          key={quest.id}
                          className="min-h-[80px] flex flex-row space-x-2 w-full justify-between"
                        >
                          <div className="flex flex-col flex-grow-1 space-y-2 truncate">
                            <h3
                              className="text-base text-accent"
                              role="button"
                              onClick={() => {
                                setSelectedQuest(quest);
                              }}
                            >
                              {quest?.name}
                            </h3>
                            <p className="text-xs opacity-90 truncate">
                              {quest?.description}
                            </p>
                            <span className="text-xs opacity-50">
                              {isActive ? "Ends in " : "Ended "}
                              {formatDistanceToNow(
                                new Date(fromUnixTime(quest?.activeUntil)),
                              )}
                              {isActive ? "" : " ago"}
                            </span>
                          </div>
                          <div className="flex flex-shrink-0 items-center justify-center w-[60px] min-h-[80px]">
                            <button
                              className="text-4xl text-accent"
                              onClick={() => {
                                setSelectedQuest(quest);
                              }}
                            >
                              <ArrowRightIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>
                    <p className="text-xs">No recent quests</p>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SubView>
  );
};

const ActionMenu = ({
  metadata,
  isSimulated,
  onRefresh,
  onWardrobeExperience,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const { address, balance, isConnected, actions } = useNFTWrapped({
    isSimulated,
    overrideAddress: ownerOf,
    onRefresh,
  });

  const isOwnerOfNFT = address?.toLowerCase() === ownerOf?.toLowerCase();

  const actionsLive = true;

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
            <div className="flex flex-col gap-2 pt-2 tablet:pt-0">
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
                <button
                  className={classnames(
                    "opacity-50 hover:opacity-100 text-[20px] cursor-pointer ",
                    {
                      "animate-spin": isRefreshing,
                    },
                  )}
                  onClick={async () => {
                    try {
                      setIsRefreshing(true);
                      await fetch(
                        `https://bearzbot.herokuapp.com/refresh?tokenId=${tokenId}`,
                      ).then((res) => res.json());
                    } catch (e) {
                      console.log(e);
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                >
                  <RefreshIcon />
                </button>
                {isSimulated && (
                  <a
                    className="opacity-50 hover:opacity-100 text-[20px] cursor-pointer"
                    href={`https://brawlerbearz.eth.limo/#/${tokenId}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Right-click + 'Open in new tab'"
                  >
                    <OpenWindowIcon />
                  </a>
                )}
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
                className="text-sm text-accent"
              >
                {formatNumber(xp)} XP
              </span>
              <div className="relative flex flex-row w-full tablet:justify-end space-x-1">
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
          <div className="flex flex-col tablet:overflow-auto px-3 tablet:px-6 pb-6">
            <div className="flex flex-col flex-shrink-0 w-full space-y-2">
              <h3 className="hidden text-sm opacity-50">Manage Brawler</h3>
              {!isSimulated && (
                <div className="flex flex-col flex-shrink-0 w-full justify-center items-center">
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
                          className="hover:underline text-[12px] text-accent text-left"
                          onClick={show}
                        >
                          Connected to {ensName ?? truncatedAddress}
                        </button>
                      );
                    }}
                  </ConnectKitButton.Custom>
                </div>
              )}
              {isConnected && !isOwnerOfNFT && (
                <div className="flex flex-wrap w-full">
                  <div className="flex flex-row w-full items-center justify-center text-center text-warn py-1 space-x-2">
                    <span className="text-base">
                      <WarnIcon />
                    </span>
                    <span className="text-xs leading-[16px] relative top-[1px]">
                      {" "}
                      You do not own this NFT to perform actions
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-sm opacity-50">
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
                  <span className="text-sm opacity-50 text-accent3">STR</span>
                  <span className="text-sm md:text-lg">
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
                  <span className="text-sm opacity-50 text-accent3">END</span>
                  <span className="text-sm md:text-lg">
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
                  <span className="text-sm opacity-50 text-accent3">INT</span>
                  <span className="text-sm md:text-lg">
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
                  <span className="text-sm opacity-50 text-accent3">LCK</span>
                  <span className="text-sm md:text-lg">
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
                <div className="flex flex-row items-center text-accent2 py-2 space-x-2 justify-center">
                  <span className="text-base">
                    <InfoIcon />
                  </span>
                  <span className="text-sm leading-[16px] relative top-[1px]">
                    This bearz stats are not fully synced to Ethereum
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <h3 className="text-sm opacity-50">Equipped Item(s)</h3>
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
                  <p className="text-sm">No equipped items</p>
                </p>
              )}
              {actionsLive && (
                <button
                  className="relative flex items-center justify-center w-[250px] cursor-pointer"
                  type="button"
                  onClick={onWardrobeExperience}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full items-center gap-4">
              <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm opacity-50">Training</h3>
                </div>
                {!activity?.training?.isTraining &&
                actionsLive &&
                isConnected &&
                isOwnerOfNFT ? (
                  <>
                    <p className="text-sm">Not training</p>
                    <button
                      className="relative flex items-center justify-center w-[250px] cursor-pointer"
                      type="button"
                      onClick={async () => {
                        await actions?.onStartTraining({
                          tokenIds: [tokenId],
                        });
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
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm text-accent">
                      XP:{" "}
                      {formatNumber(Number(activity?.training?.training?.xp))}
                    </h3>
                    <p className="text-sm">
                      Training for{" "}
                      {formatDistanceToNow(
                        new Date(
                          fromUnixTime(activity?.training?.training?.startAt),
                        ),
                      )}
                    </p>
                    {isConnected && isOwnerOfNFT && actionsLive && (
                      <button
                        className="relative flex items-center justify-center w-[250px] cursor-pointer pt-2"
                        type="button"
                        onClick={async () => {
                          await actions?.onStopTraining({
                            tokenIds: [tokenId],
                          });
                        }}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          End Training
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-sm opacity-50">Questing</h3>
                </div>
                {!activity?.questing?.isQuesting ? (
                  <p className="text-sm">Not on a quest</p>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm text-accent">
                      {activity?.questing?.currentQuest?.name}
                    </h3>
                    <p className="text-sm">
                      Started:{" "}
                      {format(
                        new Date(
                          fromUnixTime(activity?.questing?.quest?.startAt),
                        ),
                        "yyyy-MM-dd hh:mm aaaa",
                      )}
                    </p>
                    <p className="text-sm">
                      Ends:{" "}
                      {format(
                        new Date(
                          fromUnixTime(activity?.questing?.quest?.endAt),
                        ),
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
            </div>
            <div className="hidden flex flex-col flex-shrink-0 w-full my-4 space-y-4">
              <h3 className="text-sm opacity-50">Game</h3>
              {isConnected && actionsLive && (
                <button
                  className="relative flex items-center justify-center w-[250px] cursor-pointer"
                  type="button"
                  onClick={() => {
                    setViewState(VIEWS.NEOCITY);
                  }}
                >
                  <img
                    className="object-cover h-full w-full"
                    src={buttonBackground}
                    alt="button"
                  />
                  <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                    Neo City
                  </span>
                </button>
              )}
            </div>
            {isSimulated && (
              <p className="text-sm text-warn pt-6 pb-2">
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
          <div className="flex flex-col w-full items-center space-y-4 py-4">
            <div className="flex flex-col flex-shrink-0 w-full space-y-4">
              <h3 className="text-sm opacity-50">Stats</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm opacity-50 text-accent3">STR</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.atk)}%
                  </span>
                  {viewContext?.boost?.str > 0 ? (
                    <span className="text-sm text-accent">
                      +{formatNumber(viewContext?.boost?.str)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm opacity-50 text-accent3">END</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.def)}%
                  </span>
                  {viewContext?.boost?.end > 0 ? (
                    <span className="text-sm text-accent">
                      +{formatNumber(viewContext?.boost?.end)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm opacity-50 text-accent3">INT</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.intel)}%
                  </span>
                  {viewContext?.boost?.int > 0 ? (
                    <span className="text-sm text-accent">
                      +{formatNumber(viewContext?.boost?.int)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm opacity-50 text-accent3">LCK</span>
                  <span className="text-sm md:text-lg">
                    {formatNumber(viewContext?.luck)}%
                  </span>
                  {viewContext?.boost?.lck > 0 ? (
                    <span className="text-sm text-accent">
                      +{formatNumber(viewContext?.boost?.lck)}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
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
                className="relative flex text-sm text-left py-4 opacity-50 hover:opacity-100 hover:underline"
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
          <div className="flex flex-col w-full items-center space-y-4 py-10 opacity-50">
            Coming Soon
          </div>
        </SubView>
      )}
      {viewState === VIEWS.QUESTING && (
        <QuestingView
          address={address}
          name={name}
          onBack={() => setViewState(null)}
        />
      )}
      {viewState === VIEWS.NEOCITY && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <WorldIcon />
              </span>
              <span>Neo City</span>
            </div>
          }
          subtitle={name}
          onBack={() => {
            setViewState(null);
          }}
          childClassName="!p-0"
        >
          <div className="flex flex-col items-center justify-center z-[1] mx-auto h-full w-full">
            <div className="relative flex flex-col items-center justify-center w-full mx-auto aspect-square overflow-hidden">
              <img
                className="absolute top-0 left-0 w-full"
                src={neocityMap}
                alt="neo city map"
              />
              {/* Shop */}
              <button
                onClick={() => {
                  window.alert("test");
                }}
              >
                <div className="absolute top-[275px] left-[384px] w-[180px] h-[96px] z-[2] scale-[58%] cursor-pointer shadow-xs hover:shadow-hl">
                  <div className="shadow-xs hover:shadow-inhl">
                    <div className="absolute top-[123px] left-[89px] bg-accent h-[9px] w-[9px] animate-ping duration-500" />
                    <img
                      className="w-full h-full"
                      src={neocityShop}
                      alt="neo city shop"
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>
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

const STATIC_LAYERS = {
  SKIN: "SKIN",
  EYES: "EYES",
  OUTFIT: "OUTFIT",
  MOUTH: "MOUTH",
};

const LAYERS = {
  BACKGROUND: "BACKGROUND",
  WEAPON: "WEAPON",
  HEAD: "HEAD",
  ARMOR: "ARMOR",
  FACE_ARMOR: "FACE_ARMOR",
  EYEWEAR: "EYEWEAR",
  MISC: "MISC",
};

const selectedToItemIds = (currentImages, isShowingPixel) => {
  if (isShowingPixel) {
    return {
      BACKGROUND: [
        0, 7, 8, 19, 21, 22, 23, 40, 67, 70, 74, 77, 81, 92, 93, 101, 102, 103,
        120, 142, 152, 153, 154, 155, 166, 169, 184, 200, 210, 212, 221, 226,
        242, 252, 255, 265, 266, 267, 268, 276, 277, 286,
      ],
      HEAD: [
        0, 9, 32, 41, 42, 49, 53, 55, 58, 62, 64, 73, 82, 83, 98, 99, 104, 108,
        113, 115, 119, 121, 124, 131, 132, 133, 134, 135, 140, 143, 145, 149,
        157, 158, 164, 165, 191, 206, 208, 215, 216, 230, 235, 236, 237, 238,
        244, 253, 258, 260, 261, 278, 280, 283, 284,
      ],
      ARMOR: [
        0, 1, 4, 34, 35, 37, 38, 43, 44, 48, 52, 54, 57, 61, 63, 71, 75, 76, 84,
        87, 95, 96, 97, 105, 106, 107, 109, 110, 111, 112, 114, 116, 117, 122,
        123, 127, 128, 129, 130, 141, 144, 146, 147, 148, 150, 151, 170, 178,
        180, 186, 190, 193, 194, 196, 198, 205, 209, 214, 219, 224, 228, 229,
        232, 233, 239, 243, 245, 248, 249, 250, 251, 257, 259, 262, 263, 269,
        271, 272, 275,
      ],
      FACE_ARMOR: [0, 15, 91, 171, 172, 187, 188, 195, 270, 287],
      EYEWEAR: [
        0, 5, 39, 47, 60, 68, 72, 80, 85, 88, 100, 126, 136, 138, 156, 162, 167,
        181, 199, 218, 241, 247, 256, 264,
      ],
      MISC: [
        0, 10, 11, 12, 13, 14, 20, 24, 51, 59, 69, 78, 79, 89, 125, 137, 160,
        168, 182, 183, 201, 202, 203, 207, 220, 225, 240, 273, 274, 279, 281,
        285,
      ],
      WEAPON: [
        0, 2, 3, 6, 16, 17, 18, 25, 26, 27, 28, 29, 30, 31, 33, 36, 45, 46, 50,
        56, 65, 86, 90, 94, 139, 159, 163, 173, 174, 175, 176, 177, 189, 192,
        204, 213, 217, 222, 223, 227, 231, 234, 246, 254, 282, 288, 289,
      ],
    };
  }

  const { path } =
    currentImages.find((item) => item.typeOf === STATIC_LAYERS.SKIN) || {};
  const skinPng = last(path?.split("/"))?.replace(".png", "");

  const skinToSpecialTrait = {
    "Black Bear": 4002,
    Brown: 4003,
    "Brown Panda": 4004,
    "Chocolate Striped": 4005,
    "Green Chalk": 4006,
    Grey: 4007,
    "Grey Tiger": 4008,
    Mash: 4009,
    Metal: 4010,
    Negative: 4011,
    "Negative Tiger": 4012,
    Orange: 4013,
    Panda: 4014,
    Plasma: 4015,
    "Polar Bear": 4016,
    Ripper: 4017,
    "Sun Breaker": 4018,
    Tan: 4019,
    "Tan Tiger": 4020,
    Tiger: 4021,
    Toxic: 4022,
  };

  return {
    BACKGROUND: [
      0, 7, 8, 19, 21, 22, 23, 40, 67, 70, 74, 77, 81, 92, 93, 101, 102, 103,
      120, 142, 152, 153, 154, 155, 166, 169, 184, 200, 210, 212, 221, 226, 242,
      252, 255,
    ],
    HEAD: [
      0, 9, 32, 41, 42, 49, 53, 55, 58, 62, 64, 73, 82, 83, 98, 99, 104, 108,
      113, 115, 119, 121, 124, 131, 132, 133, 134, 135, 140, 143, 145, 149, 157,
      158, 164, 165, 191, 206, 208, 215, 216, 230, 235, 236, 237, 238, 244, 253,
      258,
    ],
    ARMOR: [
      0, 1, 4, 34, 35, 37, 38, 43, 44, 48, 52, 54, 57, 61, 63, 71, 75, 76, 84,
      87, 95, 96, 97, 105, 106, 107, 109, 110, 111, 112, 114, 116, 117, 122,
      123, 127, 128, 129, 130, 141, 144, 146, 147, 148, 150, 151, 170, 178, 180,
      186, 190, 193, 194, 196, 198, 205, 209, 214, 219, 224, 228, 229, 232, 233,
      239, 243, 245, 248, 249, 250, 251, 257, 259,
    ],
    FACE_ARMOR: [0, 15, 91, 171, 172, 187, 188, 195],
    EYEWEAR: [
      0, 5, 39, 47, 60, 68, 72, 80, 85, 88, 100, 126, 136, 138, 156, 162, 167,
      181, 199, 218, 241, 247, 256,
    ],
    MISC: [
      0,
      skinToSpecialTrait[skinPng],
      4000,
      4001,
      10,
      11,
      12,
      13,
      14,
      20,
      24,
      50,
      51,
      59,
      69,
      78,
      79,
      89,
      125,
      137,
      160,
      168,
      182,
      183,
      201,
      202,
      203,
      207,
      220,
      225,
      240,
    ],
    WEAPON: [
      0, 2, 3, 6, 16, 17, 18, 25, 26, 27, 28, 29, 30, 31, 33, 36, 45, 46, 50,
      56, 65, 86, 90, 94, 139, 159, 163, 173, 174, 175, 176, 177, 189, 192, 204,
      213, 217, 222, 223, 227, 231, 234, 246, 254,
    ],
  };
};

const hasFaceArmorAndHead = (selected, images) =>
  selected === LAYERS.FACE_ARMOR &&
  images.findIndex((item) => item.typeOf === LAYERS.HEAD) > -1;

const applyRenderingRules = (images) => {
  const normalizedImages = images.filter((item) => item.path);
  const hasHead =
    normalizedImages.findIndex((item) => item.typeOf === LAYERS.HEAD) > -1;
  const hasFaceArmor =
    normalizedImages.findIndex((item) => item.typeOf === LAYERS.FACE_ARMOR) >
    -1;
  if (hasFaceArmor && hasHead) {
    return normalizedImages.filter((item) => item.typeOf !== LAYERS.HEAD);
  }

  const layerOrder = [
    LAYERS.BACKGROUND,
    LAYERS.WEAPON,
    STATIC_LAYERS.SKIN,
    LAYERS.ARMOR,
    STATIC_LAYERS.OUTFIT,
    STATIC_LAYERS.EYES,
    LAYERS.EYEWEAR,
    STATIC_LAYERS.MOUTH,
    LAYERS.FACE_ARMOR,
    LAYERS.HEAD,
    LAYERS.MISC,
  ];

  return orderBy(
    normalizedImages,
    (image) => layerOrder.indexOf(image.typeOf),
    "asc",
  );
};

const hasConflictWithAnotherLayer = (selected, images) => {
  return hasFaceArmorAndHead(selected, images);
};

const isInvalidWithAnotherLayer = (selected, images) => {
  // TODO
  return false;
  // return (
  //   selected === LAYERS.HEAD &&
  //   images.findIndex((item) => item.typeOf === LAYERS.FACE_ARMOR) > -1
  // );
};

const ImageRenderer = ({
  isShowingPixel,
  images,
  isEditing,
  selected,
  onChange,
  onSelect,
}) => {
  return isEditing ? (
    <div className="relative h-full w-full">
      <img
        src={
          images?.[0]?.path ||
          `${process.env.PUBLIC_URL}/placeholders/None.${
            isShowingPixel ? "gif" : "png"
          }`
        }
        className="h-full w-full absolute top-0 left-0"
        style={{ zIndex: 0 }}
        alt="Background image"
      />
      <div
        className={classnames("absolute top-0 left-0 z-[1]", {
          "w-[calc(100%-80px)] h-[calc(100%-80px)] z-[1] ml-[40px]": !selected,
          "w-[calc(100%-200px)] h-[calc(100%-200px)] z-[1] ml-[100px]":
            selected,
        })}
      >
        {applyRenderingRules(images.slice(1)).map(({ path }, index) => (
          <LazyLoadImage
            key={`${path}_${index}`}
            src={path || ""}
            effect="opacity"
            className="h-full w-full absolute top-0 left-0"
            style={{ zIndex: images.length + index }}
            alt="Layered image"
          />
        ))}
      </div>
      <div
        className={classnames(
          "z-[1] absolute flex shadow-xl flex-row h-[140px] pt-4 mb-[80px] w-full bg-dark border-t-[5px] border-accent duration-300 ease-in-out",
          {
            "-bottom-[100%]": !selected,
            "bottom-0": selected,
          },
        )}
      >
        {selected ? (
          <div className="flex flex-row items-center space-x-4 min-w-full h-full text-sm overflow-x-auto pb-4">
            {selectedToItemIds(images, isShowingPixel)[selected].map(
              (itemId) => {
                const wontShow = isInvalidWithAnotherLayer(selected, images);
                const hasConflict = hasConflictWithAnotherLayer(
                  selected,
                  images,
                );
                const isNone = itemId === 0;
                const path = `${process.env.PUBLIC_URL}/${
                  isShowingPixel ? "layers" : "layers2d"
                }/Dynamic/${itemId}.${isShowingPixel ? "gif" : "png"}`;
                const isSelectedItem =
                  images.findIndex(
                    (item) =>
                      item.typeOf === selected &&
                      String(item.id) === String(itemId),
                  ) > -1;
                return (
                  <div
                    key={`${isShowingPixel ? "pixel_" : "2d_"}${itemId}`}
                    className={classnames(
                      "relative flex-shrink-0 relative rounded-md overflow-hidden h-[90px] w-[90px] hover:border-accent hover:border-[3px] duration-100 ease-in-out",
                      {
                        "border-accent border-[3px]": isSelectedItem,
                      },
                    )}
                  >
                    {selected !== LAYERS.BACKGROUND && (
                      <div className="h-full w-full bg-main bg-opacity-50 z-[1] pointer-events-none absolute top-0 left-0" />
                    )}
                    {isNone ? (
                      <div
                        src={path}
                        className="absolute top-0 left-0 h-full w-full flex items-center justify-center z-[2] rounded-md border border-1 border-white"
                        role="button"
                        onClick={() => {
                          onChange(selected, {
                            id: 0,
                            typeOf: selected,
                            path: null,
                          });
                        }}
                      >
                        <span className="text-white text-sm opacity-50">
                          None
                        </span>
                      </div>
                    ) : (
                      <>
                        <LazyLoadImage
                          src={path}
                          height={85}
                          width={85}
                          className="absolute top-0 left-0 h-full w-full object-contain z-[2]"
                          alt={`Item: ${itemId}`}
                          role="button"
                          onClick={() => {
                            onChange(selected, {
                              id: itemId,
                              typeOf: selected,
                              path,
                            });
                          }}
                        />
                        {wontShow ? (
                          <div className="opacity-100 text-error text-base absolute top-[4px] right-[4px] text-xl z-[3]">
                            <ErrorIcon />
                          </div>
                        ) : hasConflict ? (
                          <div className="opacity-100 text-warn text-base absolute top-[4px] right-[4px] text-xl z-[3]">
                            <WarnIcon />
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              },
            )}
          </div>
        ) : null}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[80px] bg-dark z-[2]">
        <div className="flex flex-row items-center space-x-2 min-w-full h-full text-sm overflow-x-auto">
          {Object.keys(LAYERS).map((item) => (
            <button
              key={item}
              className={classnames(
                "flex flex-shrink-0 items-center px-4 h-full duration-300",
                {
                  "opacity-100 text-accent": item === selected,
                  "opacity-50 hover:opacity-80 text-white": item !== selected,
                },
              )}
              onClick={() => {
                onSelect(item);
              }}
            >
              {LAYERS[item]?.replace(/_/gi, " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="relative max-h-[2048px] max-w-[2048px] h-full w-full">
      {applyRenderingRules(images).map(({ path }, index) => (
        <img
          key={`${path}_${index}`}
          src={path || ""}
          className="h-full w-full absolute top-0 left-0"
          style={{ zIndex: images.length + index }}
          alt="Layered image"
        />
      ))}
    </div>
  );
};

const WardrobeHeader = ({
  tokenId,
  isSynthEnabled = false,
  isShowingPixel = true,
  onClose = null,
  onUndo,
  onReset,
  onTogglePixel = null,
  images,
}) => {
  const [inPictureMode, setInPictureMode] = useState(false);
  const canUndo = images.length > 1;
  return (
    <div
      className={classnames(
        "absolute top-0 flex flex-row items-center justify-between w-full min-h-[50px] z-[10001] px-3",
        {
          hidden: inPictureMode,
        },
      )}
    >
      <div className="flex flex-row items-center space-x-2">
        <button
          onClick={onClose}
          className="flex flex-row space-x-2 items-center justify-center opacity-50 hover:opacity-80 duration-300"
        >
          <div className="flex items-center justify-center h-[40px] w-[40px] bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl">
            <span className="text-2xl text-white">
              <ArrowLeftIcon />
            </span>
          </div>
          <h2 className="hidden pl-2 text-white text-sm">Exit Wardrobe</h2>
        </button>
        <button
          onClick={() => {
            setInPictureMode(true);
          }}
          className="hidden flex flex-row space-x-2 items-center justify-center opacity-50 hover:opacity-80 duration-300"
        >
          <div className="flex items-center justify-center h-[40px] w-[40px] bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl">
            <span className="text-2xl text-white">
              <CameraIcon />
            </span>
          </div>
          <h2 className="hidden pl-2 text-white text-sm">Take Picture</h2>
        </button>
        <button
          className="flex flex-row space-x-2 items-center justify-center opacity-50 hover:opacity-80 duration-300"
          onClick={async () => {
            const baseURL = process.env.REACT_APP_PREVIEW_URL;

            const current = last(images);

            const dynamicBackgroundId =
              current.find((item) => item.typeOf === "BACKGROUND")?.id || 0;

            const dynamicArmorId =
              current.find((item) => item.typeOf === "ARMOR")?.id || 0;

            const dynamicEyewearId =
              current.find((item) => item.typeOf === "EYEWEAR")?.id || 0;

            const dynamicFaceArmorId =
              current.find((item) => item.typeOf === "FACE_ARMOR")?.id || 0;

            const dynamicHeadId =
              current.find((item) => item.typeOf === "HEAD")?.id || 0;

            const dynamicMiscId =
              current.find((item) => item.typeOf === "MISC")?.id || 0;

            const dynamicWeaponId =
              current.find((item) => item.typeOf === "WEAPON")?.id || 0;

            const previewURL = `${baseURL}?tokenId=${tokenId}&dynamicBackgroundId=${dynamicBackgroundId}&dynamicArmorId=${dynamicArmorId}&dynamicEyewearId=${dynamicEyewearId}&dynamicFaceArmorId=${dynamicFaceArmorId}&dynamicHeadId=${dynamicHeadId}&dynamicMiscId=${dynamicMiscId}&dynamicWeaponId=${dynamicWeaponId}&is2D=${
              isShowingPixel ? "0" : "1"
            }`;

            const data = await fetch(previewURL).then((res) => res.json());

            // Download image
            if (data.preview) {
              const image = await fetch(data.preview);
              const imageBlog = await image.blob();
              const imageURL = URL.createObjectURL(imageBlog);
              const link = document.createElement("a");
              link.href = imageURL;
              link.download = `BrawlerBearzPreview_${new Date().getTime()}.${
                isShowingPixel ? "gif" : "png"
              }`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        >
          <div className="flex items-center justify-center h-[40px] w-[40px] bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl">
            <span className="text-2xl text-white">
              <DownloadIcon />
            </span>
          </div>
          <h2 className="hidden pl-2 text-white text-sm">Download</h2>
        </button>
        {onReset && (
          <button
            title="Reset"
            className="flex flex-row space-x-2 items-center justify-center opacity-50 hover:opacity-80 duration-300"
            onClick={onReset}
          >
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl">
              <span className="text-2xl text-white">
                <RefreshIcon />
              </span>
            </div>
            <h2 className="hidden pl-2 text-white text-sm">Reset</h2>
          </button>
        )}
        {canUndo && (
          <button
            title="Undo"
            className="flex flex-row space-x-2 items-center justify-center opacity-50 hover:opacity-80 duration-300"
            onClick={onUndo}
          >
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl">
              <span className="text-2xl text-white">
                <UndoIcon />
              </span>
            </div>
            <h2 className="hidden pl-2 text-white text-sm">Undo</h2>
          </button>
        )}
      </div>
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
  images: defaultImages,
  isSynthEnabled,
  isShowingPixel,
  onTogglePixel,
  isSimulated,
  onRefresh,
}) => {
  const [isShowingMenu, setIsShowingMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState([defaultImages]);
  const [selected, setSelected] = useState(null);

  const onReset = useCallback(() => {
    setImages([defaultImages]);
  }, [defaultImages]);

  useEffect(() => {
    setImages([defaultImages]);
  }, [isShowingPixel]);

  const swapOutImageType = (typeOf, replacement) => {
    setImages((prev) => {
      const nextImages = [...last(prev)];
      const foundIndex = nextImages.findIndex((item) => item.typeOf === typeOf);
      const isRemoving = replacement?.id === 0;

      // Swap it out
      if (foundIndex > -1) {
        if (isRemoving) {
          // Bring defaults back
          if (typeOf === LAYERS.HEAD) {
            // Reapply head
            const originalHead = defaultImages.find(
              (d) => d.typeOf === LAYERS.HEAD,
            );
            if (originalHead) {
              replacement = originalHead;
            }
          } else if (typeOf === LAYERS.BACKGROUND) {
            // Reapply background
            const originalBackground = defaultImages.find(
              (d) => d.typeOf === LAYERS.BACKGROUND,
            );
            if (originalBackground) {
              replacement = originalBackground;
            }
          } else if (typeOf === LAYERS.ARMOR) {
            // Reapply outfit
            const originalOutfit = defaultImages.find(
              (d) => d.typeOf === LAYERS.ARMOR,
            );
            if (originalOutfit) {
              replacement = originalOutfit;
            }
          }
        }

        nextImages.splice(foundIndex, 1, replacement);
        return [...prev, nextImages?.filter((item) => item.path)];
      }

      // Add new
      return [
        ...prev,
        [...nextImages, replacement]?.filter((item) => item.path),
      ];
    });
  };

  const onUndo = useCallback(() => {
    setImages((prev) => prev.slice(0, prev.length - 1));
  }, [images]);

  const onClose = () => {
    setIsShowingMenu(false);
  };

  const onCloseEditor = () => {
    setIsEditing(false);
  };

  return (
    <div className="relative h-full w-full">
      {isEditing ? (
        <WardrobeHeader
          tokenId={metadata?.metadata?.tokenId}
          onReset={onReset}
          onUndo={onUndo}
          onClose={onCloseEditor}
          isSynthEnabled={isSynthEnabled}
          isShowingPixel={isShowingPixel}
          onTogglePixel={onTogglePixel}
          images={images}
        />
      ) : (
        <Header
          onToggleMenu={() => {
            setIsShowingMenu((value) => !value);
          }}
          isSynthEnabled={isSynthEnabled}
          isShowingPixel={isShowingPixel}
          onTogglePixel={onTogglePixel}
        />
      )}
      <ImageRenderer
        images={last(images)}
        isEditing={isEditing}
        isShowingPixel={isShowingPixel}
        selected={selected}
        onSelect={setSelected}
        onChange={swapOutImageType}
      />
      <Popup isOpen={isShowingMenu} onClose={onClose}>
        <ActionMenu
          metadata={metadata}
          isSimulated={isSimulated}
          onRefresh={onRefresh}
          onWardrobeExperience={() => {
            onClose();
            setIsEditing(true);
          }}
        />
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
  onRefresh,
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
      <ActionMenu
        metadata={metadata}
        isSimulated={isSimulated}
        onRefresh={onRefresh}
      />
    </div>
  );
};

const Experience = ({
  metadata,
  onRefresh,
  isSandboxed,
  isSimulated = false,
}) => {
  const [isShowingPixel, setIsShowingPixel] = useState(true);

  const { images, isSynthEnabled } = generateRenderingOrder({
    dna: metadata?.metadata?.dna,
    isShowingPixel,
  });

  const onTogglePixel = () => {
    setIsShowingPixel((value) => !value);
  };

  useEffect(() => {
    if (isSynthEnabled) {
      setIsShowingPixel(false);
    }
  }, [isSynthEnabled]);

  return (
    <>
      <div className="h-screen w-screen bg-dark font-primary">
        <div className="hidden tablet:flex max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
          <FullExperience
            metadata={metadata}
            isSimulated={isSimulated}
            isShowingPixel={isShowingPixel}
            images={images}
            isSynthEnabled={isSynthEnabled}
            onTogglePixel={onTogglePixel}
            onRefresh={onRefresh}
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
              onRefresh={onRefresh}
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
              onRefresh={onRefresh}
            />
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

const NFTViewer = ({ isSandboxed, metadata, onRefresh }) => {
  return isSandboxed ? (
    <Experience
      metadata={metadata}
      isSandboxed={isSandboxed}
      onRefresh={onRefresh}
      isSimulated
    />
  ) : (
    <WagmiConfig
      config={createConfig(
        getDefaultConfig({
          autoConnect: true,
          alchemyId: L2_ALCHEMY_KEY, // or infuraId
          walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
          appName: "Brawler Bearz: Interactive Experience",
          appDescription: "A mini-dapp for managing your brawler bear",
          chains: [mainnet, polygon],
        }),
      )}
    >
      <ConnectKitProvider
        customTheme={CONNECT_KIT_THEME}
        options={{
          embedGoogleFonts: true,
          walletConnectName: "Other Wallets",
          hideNoWalletCTA: true,
        }}
      >
        <Experience
          metadata={metadata}
          onRefresh={onRefresh}
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
      {({ metadata, onRefresh }) => (
        <NFTViewer
          metadata={metadata}
          isSandboxed={isSandboxed}
          onRefresh={onRefresh}
        />
      )}
    </LoadingScreen>
  );
};

export default InteractiveNFT;

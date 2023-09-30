// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import useSound from "use-sound";
import {
  WagmiConfig,
  createConfig,
  useAccount,
  useWalletClient,
  useWaitForTransaction,
} from "wagmi";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import { mainnet } from "viem/chains";
import { Biconomy } from "@biconomy/mexa";
import {
  createPublicClient,
  http,
  decodeAbiParameters,
  parseAbiParameters,
  decodeEventLog,
} from "viem";
import { keyBy, shuffle } from "lodash";
import { providers, Contract } from "ethers";
import {
  ALCHEMY_KEY,
  WALLETCONNECT_PROJECT_ID,
  CONNECT_KIT_THEME,
} from "./lib/constants";
import logoImage from "./interactive/logo.gif";
import buttonBackground from "./interactive/button.png";
import opening_part1 from "./interactive/crates/v2/opening_part1_slower.gif";
import opening_part1a from "./interactive/crates/v2/opening_part1a.gif";
import cardback from "./interactive/crates/elements/cardback.png";
import ultra from "./interactive/crates/elements/ultra.png";
import legendary from "./interactive/crates/elements/legendary.png";
import epic from "./interactive/crates/elements/epic.png";
import rare from "./interactive/crates/elements/rare.png";
import common from "./interactive/crates/elements/common.png";
import upArrow from "./interactive/crates/elements/up_arrow.png";
import downArrow from "./interactive/crates/elements/down_arrow.png";
import burningCrate from "./interactive/crates/burning.gif";
import thudSoundEffect from "./interactive/sounds/thud.wav";
import rocketLandingSoundEffect from "./interactive/sounds/landing.wav";
import wooshEffect from "./interactive/sounds/woosh.wav";
import startEffect from "./interactive/sounds/start.mp3";
import lootEffect from "./interactive/sounds/loot.wav";
import rollEffect from "./interactive/sounds/roll.wav";
import revealEffect from "./interactive/sounds/reveal.wav";
import slideEffect from "./interactive/sounds/slide.wav";

import {
  bearzShopABI,
  bearzShopContractAddress,
  bearzSupplyCratesContractAddress,
  bearzSupplyCratesABI,
} from "./lib/contracts";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";

const placeholderTypes = {
  COMMON: common,
  RARE: rare,
  EPIC: epic,
  LEGENDARY: legendary,
  ULTRA: ultra,
};

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const getUserCrates = async (address, tokenIds) => {
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  const [balances, items, configs] = await Promise.all([
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "balanceOfBatch",
      args: [tokenIds.map((_) => address), tokenIds],
    }),
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "getMetadataBatch",
      args: [tokenIds],
    }),
    ethClient.readContract({
      address: bearzSupplyCratesContractAddress,
      abi: bearzSupplyCratesABI,
      functionName: "configurationOf",
      args: [tokenIds],
    }),
  ]);

  const parsedConfig = configs?.reduce((acc, bytes) => {
    try {
      const [crateId, name, quantity, itemIds] = decodeAbiParameters(
        parseAbiParameters(
          "uint16 crateId, string name, uint16 quantity, uint16[] itemIds",
        ),
        bytes,
      );
      acc.push({
        crateId,
        name,
        quantity,
        itemIds,
      });
      return acc;
    } catch (e) {
      console.log(e);
      return acc;
    }
  }, []);

  const lookupItems = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      item: items[index],
    })),
    "tokenId",
  );

  const lookupConfigs = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      config: parsedConfig[index],
    })),
    "tokenId",
  );

  const lookupBalances = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      balance: balances[index],
    })),
    "tokenId",
  );

  return tokenIds.reduce((acc, tokenId) => {
    acc[tokenId] = {
      ...lookupItems[tokenId],
      ...lookupConfigs[tokenId],
      ...lookupBalances[tokenId],
    };
    return acc;
  }, {});
};

const CRATE_TOKEN_IDS = [290];

let biconomy: any;

function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  return provider.getSigner(account.address);
}

function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  );
}

const useSupplyCrates = ({ isSimulated, overrideAddress }) => {
  const [landing, { stop: stopLanding, sound: landingSound }] = useSound(
    rocketLandingSoundEffect,
    {
      volume: 0.5,
    },
  );

  const [thud, { stop: stopThud, sound: thudSound }] = useSound(
    thudSoundEffect,
    {
      volume: 1,
    },
  );

  const [woosh, { stop: stopWoosh, sound: wooshSound }] = useSound(
    wooshEffect,
    {
      playbackRate: 0.5,
      volume: 0.5,
    },
  );

  const [start, { stop: stopStart, sound: startSound }] = useSound(
    startEffect,
    {
      volume: 0.5,
      interrupt: true,
    },
  );

  const [loot, { stop: stopLoot, sound: lootSound }] = useSound(lootEffect, {
    volume: 0.5,
    interrupt: true,
  });

  const [roll, { stop: stopRoll, sound: rollSound }] = useSound(rollEffect, {
    volume: 0.3,
    interrupt: true,
  });

  const [reveal, { stop: stopReveal, sound: revealSound }] = useSound(
    revealEffect,
    {
      volume: 0.5,
      interrupt: true,
    },
  );

  const [slide, { stop: stopSlide, sound: slideSound }] = useSound(
    slideEffect,
    {
      volume: 0.3,
      interrupt: true,
    },
  );

  const params = useParams();
  const navigate = useNavigate();

  const [isLoadingBiconomy, setIsLoadingBiconomy] = useState(true);
  const [crates, setCrates] = useState(null);
  const [txHash, setTxHash] = useState(params?.txHash);
  const [isOpening, setOpening] = useState(false);

  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  const { isLoading } = useSimpleAccountOwner();
  const signer = useEthersSigner();

  useEffect(() => {
    (async function () {
      if (account?.address && signer?.provider && !biconomy) {
        biconomy = new Biconomy(new providers.Web3Provider(window.ethereum), {
          apiKey: "DZgKduUcK.58f69cf0-6070-482c-85a6-17c5e2f24d83",
          debug: true,
          contractAddresses: [bearzSupplyCratesContractAddress],
          strictMode: true,
        });

        setCrates(await getUserCrates(account?.address, CRATE_TOKEN_IDS));

        biconomy
          .onEvent(biconomy.READY, async () => {
            setIsLoadingBiconomy(false);
          })
          .onEvent(biconomy.ERROR, (error, message) => {
            console.log(error);
            toast.error(message);
          });
      }
    })();
  }, [account?.address, signer?.provider]);

  if (isSimulated || isLoading || !signer?.provider) {
    return account;
  }

  return {
    ...account,
    isLoadingBiconomy,
    sounds: {
      landing,
      stopLanding,
      landingSound,
      thud,
      stopThud,
      thudSound,
      woosh,
      stopWoosh,
      wooshSound,
      start,
      stopStart,
      startSound,
      loot,
      stopLoot,
      lootSound,
      roll,
      stopRoll,
      rollSound,
      reveal,
      stopReveal,
      revealSound,
      slide,
      stopSlide,
      slideSound,
    },
    data: {
      crates,
      txHash,
      isOpening,
    },
    actions: {
      onExitTxHash: () => {
        setTxHash(null);
        navigate("/crates");
      },
      onOpenCrate: async ({ crateTokenId, openAmount }) => {
        try {
          const provider = new providers.Web3Provider(biconomy);

          const feeData = await provider.getFeeData();

          const contract = new Contract(
            bearzSupplyCratesContractAddress,
            bearzSupplyCratesABI,
            provider.getSigner(account.address),
          );

          const gasLimit = await contract.estimateGas.open(
            crateTokenId,
            openAmount,
          );

          setOpening(true);

          const tx = await contract.open(crateTokenId, openAmount, {
            gasLimit: gasLimit.mul(100).div(80),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          });

          setTxHash(tx.hash);

          navigate(`/crates/${tx.hash}`);
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setOpening(false);
        }
      },
    },
  };
};

const DROPPED_STATUS = {
  WAITING: "WAITING",
  READY: "READY",
  OPENING: "OPENING",
  REELS: "REELS",
  SKIP: "SKIP",
  SPIN_REELS: "SPIN_REELS",
  REVEALED: "REVEALED",
  REVEALED_ALL: "REVEALED_ALL",
};

const ReadyAndOpen = ({ sounds, status, setStatus }) => {
  useEffect(() => {
    if (status.event === DROPPED_STATUS.READY) {
      setTimeout(() => {
        sounds?.landing();
        sounds?.landingSound.fade(0.5, 0, 2500);
      }, 300);

      setTimeout(() => {
        sounds?.woosh();
        sounds?.wooshSound.fade(0.5, 0, 2000);
      }, 2400);

      setTimeout(() => {
        sounds?.thud();
      }, 3000);
    }

    if (status.event === DROPPED_STATUS.OPENING) {
      sounds?.stopLanding();
      sounds?.stopThud();
      sounds?.loot();

      setTimeout(() => {
        sounds?.lootSound.fade(0.5, 0, 1000);
      }, 2000);

      setTimeout(() => {
        setStatus((prev) => ({
          ...prev,
          event: DROPPED_STATUS.REELS,
        }));
      }, 3000);
    }
  }, [status.event]);

  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center">
      <img
        key={status.event === DROPPED_STATUS.READY ? "READY" : "NOT_READY"}
        src={
          status.event === DROPPED_STATUS.READY ? opening_part1 : opening_part1a
        }
        className="absolute top-0 left-0 w-full h-[calc(100%-200px)] object-contain z-[1] scale-[150%] md:scale-100"
        alt="ready animation"
        style={{
          transition: "opacity 1s linear",
          opacity: 0.9,
          ...(status.event === DROPPED_STATUS.OPENING
            ? {
                opacity: 1,
              }
            : status.event === DROPPED_STATUS.READY
            ? {}
            : {}),
        }}
      />
      {status.event === DROPPED_STATUS.READY && (
        <div className="flex flex-row items-center text-accent animate-pulse justify-center space-x-10 absolute bottom-[50px] z-[2]">
          <button
            onClick={() => {
              sounds?.start();
              setStatus((prev) => ({
                ...prev,
                event: DROPPED_STATUS.OPENING,
              }));
            }}
            className="relative flex items-center justify-center w-[250px] cursor-pointer"
          >
            <img
              className="object-cover h-full w-full"
              src={buttonBackground}
              alt="button"
            />
            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
              Open
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

const crateRarities = {
  290: {
    "1": 0.05069493050694931,
    "2": 0.0928907109289071,
    "3": 0.11818818118188182,
    "4": 0.19968003199680032,
    "5": 0.2425757424257574,
    "6": 0.0974902509749025,
    "7": 0.09659034096590341,
    "8": 0.0476952304769523,
    "9": 0.05419458054194581,
  },
};

const ITEM_WIDTH = 80;
const SPIN_DURATION = 11;

const Reels = ({ status, sounds, setStatus, onClose }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedState, setRevealedState] = useState([]);

  const { context } = status || {};

  const [shuffledCrateItems, setShuffled] = useState(
    shuffle(context?.crateItems),
  );

  const [spinState, setSpinState] = useState({
    x: 0,
    y: 0,
    landingPosition: 0,
    duration: SPIN_DURATION,
  });

  useEffect(() => {
    if (!isMounted) {
      setTimeout(() => {
        setIsMounted(true);
      }, 300);
    }
  }, [isMounted]);

  const onHandleNext = useCallback(() => {
    sounds?.slide();
    setActiveIndex((prev) => (prev + 1) % revealedState?.length);
  }, [revealedState]);

  const onHandleSpin = (spinIndex) => {
    sounds?.roll();

    const selectedTokenId = context?.droppedItems?.[spinIndex]?.tokenId;
    const order = shuffledCrateItems.map((item) => item.tokenId);
    const position =
      order.indexOf(selectedTokenId) -
      Math.floor(shuffledCrateItems.length / 2);

    const rows = 12; // Pass by sets
    const card = ITEM_WIDTH; // 8px spacing + base item width
    const spinByDistance = rows * order.length * card;

    let landingPosition = spinByDistance + position * card;

    const offset = Math.floor(Math.random() * ITEM_WIDTH) - ITEM_WIDTH / 2;
    landingPosition += offset;

    const object = {
      x: Math.floor(Math.random() * 50) / 100,
      y: Math.floor(Math.random() * 20) / 100,
    };

    setSpinState({
      ...object,
      landingPosition: landingPosition * -1,
      duration: SPIN_DURATION,
    });

    setActiveIndex(spinIndex);

    setTimeout(() => {
      sounds?.stopRoll();

      setSpinState({
        x: null,
        y: null,
        landingPosition: (position * card + offset + order.length * card) * -1,
        duration: 0,
      });

      // Reveal card
      setRevealedState((prev) => {
        prev[spinIndex].isRevealed = true;
        sounds?.reveal();
        return [...prev];
      });
    }, SPIN_DURATION * 1000);
  };

  useEffect(() => {
    setRevealedState(
      context?.droppedItems?.map((item) => ({
        ...item,
        isRevealed: false,
        imageSrc: `https://allofthethings.s3.amazonaws.com/brawlerbearzshop/${item?.tokenId}.png`,
      })),
    );

    // Perform first spin
    setTimeout(() => {
      onHandleSpin(activeIndex);
    }, 1000);
  }, [context?.droppedItems?.length]);

  const isDone = revealedState.every((item) => item.isRevealed);

  return (
    <div className="relative flex flex-col space-y-2 items-center justify-center h-full w-full">
      <div
        className="relative flex flex-row w-full h-[250px] z-[1] items-center justify-center space-y-10"
        style={{
          transition: "opacity 1s ease-in, transform 0.5s ease-in",
          transform: "translateY(500px)",
          opacity: 0,
          ...(isMounted
            ? {
                transform: "translateY(-120px)",
                opacity: 1,
              }
            : {}),
        }}
      >
        {revealedState?.map((item, index) => {
          return (
            <img
              key={`${item?.tokenId}_${index}`}
              src={item?.isRevealed ? item.imageSrc : cardback}
              className="absolute w-[177px] h-[250px] object-contain z-[1] transition-all duration-300"
              alt={item?.isRevealed ? item?.name : "card back"}
              style={{
                left: "calc(50% - 88px)",
                zIndex: revealedState.length - index,
                top: -20 * index,
                transform: "scale(1)",
                ...(activeIndex === index
                  ? {
                      zIndex: 999,
                      transform: "scale(1.1)",
                    }
                  : {}),
              }}
            />
          );
        })}
      </div>
      <div
        className="relative bg-[#142b42] h-[90px] rounded-md overflow-hidden mx-auto left-[-180px] md:left-0"
        style={{
          transition: "opacity 1s ease-in",
          transform: "translateY(100px)",
          boxShadow: "inset 0 0 4px #1e151c",
          opacity: 0,
          width: shuffledCrateItems.length * ITEM_WIDTH,
          ...(isMounted
            ? {
                opacity: 1,
                transform: "translateY(-60px)",
              }
            : {}),
        }}
      >
        <div className="relative w-full h-full overflow-x-hidden">
          <img
            src={upArrow}
            className="absolute bottom-0 left-[50%] w-[36px] h-[24px] z-[2]"
            style={{
              transform: "translate(-50%,0%)",
            }}
          />
          <img
            src={downArrow}
            className="absolute top-0 left-[50%] w-[36px] h-[24px] z-[2]"
            style={{
              transform: "translate(-50%,0%)",
            }}
          />
          <div
            className="absolute top-0 left-0 flex flex-row h-full whitespace-nowrap"
            style={{
              width: shuffledCrateItems.length * ITEM_WIDTH,
              transitionTimingFunction: spinState.x
                ? `cubic-bezier(0,${spinState.x},${spinState.y},1)`
                : "",
              transitionDuration: spinState.duration
                ? `${spinState.duration}s`
                : "",
              transform: `translate3d(${
                spinState.landingPosition || 0
              }px, 0px, 0px)`,
            }}
          >
            {new Array(29).fill(0).map((item, index) => {
              return shuffledCrateItems.map((item, crateIndex) => (
                <div
                  key={`${index}_${crateIndex}`}
                  className="flex flex-shrink-0 w-[80px] h-full p-1"
                >
                  <img
                    src={item.placeholderSrc}
                    className="object-contain w-full h-full"
                    alt={item.rarity}
                  />
                </div>
              ));
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 absolute bottom-[50px] z-[2]">
        {isDone ? (
          <>
            <button
              onClick={onClose}
              className="relative flex items-center justify-center w-[200px] cursor-pointer"
            >
              <img
                className="object-cover h-full w-full"
                src={buttonBackground}
                alt="button"
              />
              <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                Close
              </span>
            </button>
            <button
              onClick={() =>
                setStatus({ event: DROPPED_STATUS.REVEALED_ALL, context: null })
              }
              className="relative flex items-center justify-center w-[200px] cursor-pointer"
            >
              <img
                className="object-cover h-full w-full"
                src={buttonBackground}
                alt="button"
              />
              <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                Summary
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() =>
                setStatus({ event: DROPPED_STATUS.REVEALED_ALL, context: null })
              }
              className="relative flex items-center justify-center w-[200px] cursor-pointer"
            >
              <img
                className="object-cover h-full w-full"
                src={buttonBackground}
                alt="button"
              />
              <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                Skip
              </span>
            </button>
            <button
              onClick={onHandleNext}
              className="relative flex items-center justify-center w-[200px] cursor-pointer"
              disabled={spinState?.duration !== 0}
            >
              <img
                className="object-cover h-full w-full"
                src={buttonBackground}
                alt="button"
              />
              <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                Next
              </span>
            </button>
            {!revealedState?.[activeIndex]?.isRevealed && (
              <button
                onClick={() => {
                  onHandleSpin(activeIndex);
                }}
                className="relative flex items-center justify-center w-[200px] cursor-pointer"
                disabled={spinState?.duration !== 0}
              >
                <img
                  className="object-cover h-full w-full"
                  src={buttonBackground}
                  alt="button"
                />
                <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                  Spin
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const WaitingForCrate = ({ onClose }) => (
  <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
    <div className="flex flex-col text-center text-white py-4 items-center justify-center space-y-4">
      <img
        src={burningCrate}
        className="h-[245px] w-[179px]"
        alt="burning card"
      />
      <p className="text-accent text-sm">Redeeming supply crate...</p>
      <button
        onClick={onClose}
        className="relative flex items-center justify-center w-[250px] cursor-pointer"
      >
        <img
          className="object-cover h-full w-full"
          src={buttonBackground}
          alt="button"
        />
        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
          Close
        </span>
      </button>
    </div>
  </div>
);

const SummaryView = ({ status, sounds, setStatus, onClose }) => {
  console.log(status);
  const { context } = status;
  return (
    <div className="flex flex-col space-y-2 items-center justify-between w-full h-full">
      <header className="flex flex-col items-center justify-center h-[100px] flex-shrink-0 space-y-2">
        <h1 className="text-xl text-accent">Drop Summary</h1>
        <p className="text-sm">You were dropped {context?.droppedItems?.length} item(s)</p>
      </header>
      <div className="flex flex-wrap flex-row items-center justify-center gap-6 h-full overflow-auto p-6">
        {context?.droppedItems?.map(item => (
            <div className="flex flex-col space-y-2 w-[225px]">
              <img src={`https://allofthethings.s3.amazonaws.com/brawlerbearzshop/${item?.tokenId}.png`} className="w-full" />
              <span className="hidden text-xs text-center">{item?.name}</span>
            </div>
        ))}
      </div>
      <footer className="flex flex-row items-center justify-center h-[80px] flex-shrink-0">
        <button
            onClick={onClose}
            className="relative flex items-center justify-center w-[250px] cursor-pointer"
        >
          <img
              className="object-cover h-full w-full"
              src={buttonBackground}
              alt="button"
          />
          <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
          Close
        </span>
        </button>
      </footer>
    </div>
  );
};

const DroppedView = ({ crates, txHash, onClose, sounds }) => {
  const [status, setStatus] = useState({
    event: DROPPED_STATUS.WAITING,
    context: null,
  });

  const { data, isLoading } = useWaitForTransaction({
    hash: txHash,
  });

  useEffect(() => {
    if (!txHash) {
      onClose();
    }

    if (!isLoading) {
      (async function () {
        try {
          const topic = decodeEventLog({
            abi: bearzSupplyCratesABI,
            data: data?.logs?.[3]?.data,
            topics: data?.logs?.[3]?.topics,
            strict: false,
          });

          let { crateTokenId, itemIds, randomness } = topic?.args || {};

          crateTokenId = Number(crateTokenId);

          const ethClient = createPublicClient({
            chain: mainnet,
            transport: http(
              `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
            ),
          });

          const crateItemIds = crates?.[crateTokenId]?.config?.itemIds || [];

          const [crateMetadata, droppedMetadata] = await Promise.all([
            ethClient.readContract({
              address: bearzShopContractAddress,
              abi: bearzShopABI,
              functionName: "getMetadataBatch",
              args: [crateItemIds],
            }),
            ethClient.readContract({
              address: bearzShopContractAddress,
              abi: bearzShopABI,
              functionName: "getMetadataBatch",
              args: [itemIds],
            }),
          ]);

          const rarities = crateRarities[crateTokenId] || {};

          setTimeout(() => {
            setStatus({
              event: DROPPED_STATUS.READY,
              context: {
                ...(crates?.[crateTokenId] ?? {}),
                crateItems: crateItemIds.map((tokenId, index) => {
                  const metadata = crateMetadata[index];
                  return {
                    tokenId,
                    placeholderSrc:
                      placeholderTypes?.[metadata.rarity] ||
                      placeholderTypes.COMMON,
                    imageSrc: `https://allofthethings.s3.amazonaws.com/brawlerbearzshop/${tokenId}.png`,
                    percent: rarities[String(tokenId)],
                    ...metadata,
                  };
                }),
                droppedItems: itemIds.map((tokenId, index) => ({
                  tokenId: Number(tokenId),
                  ...(droppedMetadata?.[index] || {}),
                })),
                randomness,
              },
            });
          }, 1000);
        } catch (e) {
          console.log(e);
          toast.error(
            "There was an error loading the crate drop from the transaction hash!",
          );
          onClose();
        }
      })();
    }
  }, [isLoading, txHash, data?.logs]);

  return (
    <div className="fixed top-0 left-0 z-[99999] h-full w-full bg-[#08111b] items-center justify-center">
      <SummaryView
          sounds={sounds}
          status={status}
          setStatus={setStatus}
          onClose={onClose}
      />
      {/*{(() => {*/}
      {/*  switch (status.event) {*/}
      {/*    case DROPPED_STATUS.WAITING:*/}
      {/*      return <WaitingForCrate sounds={sounds} onClose={onClose} />;*/}
      {/*    case DROPPED_STATUS.READY:*/}
      {/*    case DROPPED_STATUS.OPENING:*/}
      {/*      return (*/}
      {/*        <ReadyAndOpen*/}
      {/*          sounds={sounds}*/}
      {/*          status={status}*/}
      {/*          setStatus={setStatus}*/}
      {/*        />*/}
      {/*      );*/}
      {/*    case DROPPED_STATUS.REELS:*/}
      {/*    case DROPPED_STATUS.SPIN_REELS:*/}
      {/*      return (*/}
      {/*        <Reels*/}
      {/*          sounds={sounds}*/}
      {/*          status={status}*/}
      {/*          setStatus={setStatus}*/}
      {/*          onClose={onClose}*/}
      {/*        />*/}
      {/*      );*/}
      {/*    case DROPPED_STATUS.REVEALED_ALL:*/}
      {/*      return (*/}
      {/*        <SummaryView*/}
      {/*          sounds={sounds}*/}
      {/*          status={status}*/}
      {/*          setStatus={setStatus}*/}
      {/*          onClose={onClose}*/}
      {/*        />*/}
      {/*      );*/}
      {/*  }*/}
      {/*})()}*/}
    </div>
  );
};

const CratesView = ({ isSimulated }) => {
  const { address, data, isLoadingBiconomy, actions, sounds } = useSupplyCrates(
    {
      isSimulated,
      overrideAddress: null,
    },
  );

  const navigate = useNavigate();

  return (
    <div className="flex flex-col relative h-full w-full text-white items-center">
      {!isSimulated && (
        <div className="flex flex-row flex-shrink-0 w-full justify-center items-center h-[80px]">
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
      {isLoadingBiconomy ? (
        <p>Loading gas station network...</p>
      ) : (
        <div className="flex flex-col space-y-4">
          {data?.isOpening ? (
            <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-[#]">
              <img className="w-[200px]" src={logoImage} alt="logo" />
              <div className="flex flex-col space-y-1 text-center text-white py-4">
                <h1 className="text-sm">
                  Check your wallet for transaction...
                </h1>
              </div>
            </div>
          ) : data?.txHash ? (
            <DroppedView
              crates={data?.crates}
              txHash={data?.txHash}
              sounds={sounds}
              onClose={() => {
                actions?.onExitTxHash();
                navigate("/crates");
              }}
            />
          ) : (
            <div className="flex flex-col space-y-4">
              <span>
                Balance: {String(data?.crates?.[290]?.balance || 0)} crates
              </span>
              <button
                onClick={() => {
                  sounds?.start();
                  actions?.onOpenCrate({ crateTokenId: 290, openAmount: 1 });
                }}
              >
                Open crate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <CratesView isSimulated={isSimulated} />
    </div>
  );
};

const MobileFullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <CratesView isSimulated={isSimulated} />
    </div>
  );
};

const Experience = ({ isSandboxed, isSimulated = false }) => {
  return (
    <>
      <div className="h-screen w-screen bg-dark font-primary">
        <div className="hidden tablet:flex max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
          <FullExperience isSimulated={isSimulated} />
        </div>
        {isSandboxed ? (
          <div className="flex tablet:hidden max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
            <FullExperience isSimulated={isSimulated} />
          </div>
        ) : (
          <div className="flex tablet:hidden relative h-full w-full overflow-auto">
            <MobileFullExperience isSimulated={isSimulated} />
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

const NFTViewer = ({ isSandboxed }) => {
  return isSandboxed ? (
    <Experience isSandboxed={isSandboxed} isSimulated />
  ) : (
    <WagmiConfig
      config={createConfig(
        getDefaultConfig({
          autoConnect: true,
          alchemyId: ALCHEMY_KEY,
          walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
          appName: "Brawler Bearz: Interactive Experience",
          appDescription: "A mini-dapp for managing your brawler bear",
          chains: [mainnet],
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
        <Experience isSandboxed={isSandboxed} isSimulated={false} />
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

const InteractiveCrates = () => {
  const isSandboxed =
    window.location !== window.parent.location ||
    window.self !== window.top ||
    window.frameElement;
  return <NFTViewer isSandboxed={isSandboxed} />;
};

export default InteractiveCrates;

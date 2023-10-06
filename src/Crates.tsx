// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate, Link } from "react-router-dom";
import useSound from "use-sound";
import classnames from "classnames";
import {
  useAccount,
  useWalletClient,
  useWaitForTransaction,
  useContractRead,
} from "wagmi";
import { mainnet } from "viem/chains";
import { Biconomy } from "@biconomy/mexa";
import {
  MdArrowBack as BackIcon,
  MdHistory as HistoryIcon,
} from "react-icons/md";
import {
  createPublicClient,
  http,
  decodeAbiParameters,
  parseAbiParameters,
  decodeEventLog,
} from "viem";
import { keyBy, shuffle, runInContext } from "lodash";
import seedrandom from 'seedrandom'
import { providers, Contract } from "ethers";
import ConnectButton from "./components/ConnectButton";
import { ALCHEMY_KEY } from "./lib/constants";
import logoImage from "./interactive/logo.gif";
import buttonBackground from "./interactive/button.png";
import opening_part1 from "./interactive/crates/v2/opening_part1_slower.gif";
import opening_part1a from "./interactive/crates/v2/opening_part1a.gif";
import cardback from "./interactive/crates/elements/cardback.png";
import ultra from "./interactive/crates/elements/ultra.png";
import legendary from "./interactive/crates/elements/legendary.png";
import epic from "./interactive/crates/elements/epic.png";
import rare from "./interactive/crates/elements/rare.png";
import consumable from "./interactive/crates/elements/consumable.png";
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
import winnerEffect from "./interactive/sounds/winner.wav";

import {
  bearzShopABI,
  bearzShopContractAddress,
  bearzSupplyCratesContractAddress,
  bearzSupplyCratesABI, bearzQuickSaleAddress, bearzQuickSaleABI,
} from "./lib/contracts";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import Loading from "./components/Loading";
import SandboxWrapper from "./components/SandboxWrapper";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import { BEARZ_SHOP_IMAGE_URI } from "./lib/blockchain";

const placeholderTypes = {
  CONSUMABLE: consumable,
  COMMON: common,
  RARE: rare,
  EPIC: epic,
  LEGENDARY: legendary,
  ULTRA: ultra,
};

const crateRarities = {
  290: {
    "22": 0.0006662225183211193,
    "300": 0.046635576282478344,
    "301": 0.005329780146568954,
    "302": 0.005329780146568954,
    "303": 0.009993337774816789,
    "304": 0.009327115256495669,
    "305": 0.011992005329780146,
    "306": 0.02731512325116589,
    "307": 0.02798134576948701,
    "308": 0.03530979347101932,
    "309": 0.034643570952698204,
    "310": 0.03530979347101932,
    "311": 0.046635576282478344,
    "312": 0.05263157894736842,
    "313": 0.05063291139240506,
    "314": 0.04730179880079947,
    "315": 0.04397068620919387,
    "316": 0.04530313124583611,
    "317": 0.05263157894736842,
    "318": 0.04930046635576282,
    "319": 0.056628914057295136,
    "320": 0.046635576282478344,
    "321": 0.051299133910726186,
    "322": 0.05729513657561625,
    "323": 0.04930046635576282,
    "324": 0.051299133910726186,
    "325": 0.04930046635576282,
  },
};

const crateEstimates = {
  290: {
    freqs: {
      "22": 1,
      "300": 70,
      "301": 8,
      "302": 8,
      "303": 15,
      "304": 14,
      "305": 18,
      "306": 41,
      "307": 42,
      "308": 53,
      "309": 52,
      "310": 53,
      "311": 70,
      "312": 79,
      "313": 76,
      "314": 71,
      "315": 66,
      "316": 68,
      "317": 79,
      "318": 74,
      "319": 85,
      "320": 70,
      "321": 77,
      "322": 86,
      "323": 74,
      "324": 77,
      "325": 74,
    },
    probabilities: [
      17, 256, 42, 59, 68, 76, 85, 170, 204, 221, 238, 255, 85, 69, 223, 138,
      53, 181, 96, 208, 123, 226, 141, 235, 150, 236, 237,
    ],
    alias: [
      13, 0, 16, 18, 20, 22, 24, 25, 26, 26, 26, 26, 1, 12, 13, 14, 15, 16, 17,
      18, 19, 20, 21, 22, 23, 24, 25,
    ],
  },
};

const ITEM_WIDTH = 80;

const SPIN_DURATION = 11;

const seedLodash = (seed: number | string) => {
  // take a snapshot of the current Math.random() fn
  const orig = Math.random
  // replace Math.random with the seeded random
  seedrandom(seed, { global: true })
  // runInContext() creates a new lodash instance using the seeded Math.random()
  // the context is a snapshot of the state of the global javascript environment, i.e. Math.random() updated to the seedrandom instance
  const lodash = runInContext()
  // restore the original Math.random() fn
  Math.random = orig
  // return the lodash instance with the seeded Math.random()
  return lodash
}

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
      volume: 0.8,
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
    volume: 0.2,
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

  const [winner, { stop: stopWinner, sound: winnerSound }] = useSound(
    winnerEffect,
    {
      volume: 1,
      interrupt: true,
    },
  );

  const params = useParams();
  const navigate = useNavigate();

  const [isLoadingBiconomy, setIsLoadingBiconomy] = useState(true);
  const [crates, setCrates] = useState(null);
  const [txHash, setTxHash] = useState(params?.txHash);
  const [isApproving, setApproving] = useState(false);

  const [isOpening, setOpening] = useState(false);
  const [openingContext, setOpeningContext] = useState(null);

  const [isBuying, setBuying] = useState(false);
  const [buyingContext, setBuyingContext] = useState(null);

  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  const { isLoading } = useSimpleAccountOwner();
  const signer = useEthersSigner();

  const { data: isApproved, refetch } = useContractRead({
    address: bearzShopContractAddress,
    abi: bearzShopABI,
    functionName: "isApprovedForAll",
    args: [account?.address, bearzSupplyCratesContractAddress],
  });

  const onRefresh = async (address) => {
    setCrates(await getUserCrates(address, CRATE_TOKEN_IDS));
  };

  useEffect(() => {
    (async function () {
      if (
        (account?.address && signer?.provider && !biconomy) ||
        (biconomy && biconomy?.status !== biconomy?.READY)
      ) {
        biconomy = new Biconomy(new providers.Web3Provider(window.ethereum), {
          apiKey: "DZgKduUcK.58f69cf0-6070-482c-85a6-17c5e2f24d83",
          debug: false,
          contractAddresses: [bearzSupplyCratesContractAddress],
          strictMode: true,
        });

        biconomy
          .onEvent(biconomy.READY, async () => {
            setIsLoadingBiconomy(false);
          })
          .onEvent(biconomy.ERROR, (error, message) => {
            console.log(error);
            toast.error(message);
          });
      } else {
        setIsLoadingBiconomy(false);
      }

      if (account?.address) {
        await onRefresh(account?.address);
      }
    })();
  }, [account?.address, signer?.provider]);

  if (isSimulated || isLoading || !signer?.provider) {
    return account;
  }

  return {
    ...account,
    isLoadingBiconomy,
    isApproving,
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
      winner,
      stopWinner,
      winnerSound,
    },
    data: {
      crates,
      txHash,
      isOpening,
      isApproved,
      openingContext,
      isBuying,
      buyingContext
    },
    actions: {
      onRefresh: onRefresh.bind(null, account?.address),
      onExitTxHash: async () => {
        setTxHash(null);
        navigate("/crates");
        await onRefresh(account?.address);
      },
      onApproveCrate: async () => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzShopContractAddress,
            bearzShopABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.setApprovalForAll(
            bearzSupplyCratesContractAddress,
            true,
          );

          setApproving(true);

          const tx = await contract.setApprovalForAll(
            bearzSupplyCratesContractAddress,
            true,
            {
              gasLimit: gasLimit.mul(100).div(80),
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            },
          );

          await tx.wait();
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setApproving(false);
          refetch();
        }
      },
      onBuyCrates: async ({ amount }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
              bearzQuickSaleAddress,
              bearzQuickSaleABI,
              signer,
          );

          const ethPrice = await contract.ethPrice();

          const gasLimit = await contract.estimateGas.buy(
              amount,
              {
                value: ethPrice.mul(amount)
              }
          );

          setBuying(true);
          setBuyingContext(`Check wallet for transaction...`);

          const tx = await contract.buy(amount, {
            value: ethPrice.mul(amount),
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
          });

          setBuyingContext(`Buying ${amount} crate(s)...`);

          await tx.wait();

          navigate(`/crates`)

          toast.success(`Successfully bought ${amount} crate(s)!`);

          return true;

        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setBuying(false);
          setBuyingContext(null);
        }
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
          setOpeningContext(`Check wallet for transaction...`);

          const tx = await contract.open(crateTokenId, openAmount, {
            gasLimit: gasLimit.mul(100).div(80),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          });

          setTxHash(tx.hash);
          setOpeningContext(`Burning ${openAmount} crate(s)...`);

          navigate(`/crates/${tx.hash}`);
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setOpening(false);
          setOpeningContext(null);
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

    const offset = Math.floor(Math.random() * (ITEM_WIDTH * .8)) - (ITEM_WIDTH / 2);
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
        imageSrc: `${process.env.PUBLIC_URL}/cards/${item?.tokenId}.png`,
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
                top: -25 - (3 * (index + 1)),
                transform: "scale(1)",
                ...(activeIndex === index
                  ? {
                      zIndex: 999,
                      transform: "scale(1.3)",
                      top: -25,
                    }
                  : {}),
              }}
            />
          );
        })}
      </div>
      <div className="absolute flex items-center justify-center" style={{
        transition: "opacity 0.75s ease-in",
        opacity: 0,
        ...(isMounted
            ? {
              opacity: 1,
              transform: "translateY(130px)",
            }
            : {}),
      }}>
        <div
            className="relative bg-[#142b42] h-[90px] rounded-md overflow-hidden mx-auto"
            style={{
              boxShadow: "inset 0 0 4px #1e151c",
              width: shuffledCrateItems.length * ITEM_WIDTH,
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
              {new Array(20).fill(0).map((item, index) => {
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
                setStatus((prev) => ({
                  ...prev,
                  event: DROPPED_STATUS.REVEALED_ALL,
                }))
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
                setStatus((prev) => ({
                  ...prev,
                  event: DROPPED_STATUS.REVEALED_ALL,
                }))
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
            {revealedState?.length > 1 && (
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
            )}
            {spinState?.duration === 0 &&
              !revealedState?.[activeIndex]?.isRevealed && (
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
      <p className="text-accent text-sm">Burning supply crate(s)...</p>
      <p className="text-warn text-sm max-w-xl text-center">
        Note: Multiple crates will drop all items in one opening!
      </p>
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
  const { context } = status;

  useEffect(() => {
    // Kill all other sounds
    sounds?.stopRoll();

    // Run winner sound
    setTimeout(() => {
      sounds?.winner();
    }, 100);
  }, []);

  return (
    <div className="flex flex-col space-y-2 items-center justify-between w-full h-full">
      <header className="flex flex-col items-center justify-center h-[100px] flex-shrink-0 space-y-2">
        <h1 className="text-xl text-accent">Drop Summary</h1>
        <p className="text-sm">
          You were dropped {context?.droppedItems?.length} item(s)
        </p>
      </header>
      <div className="flex flex-wrap flex-row items-center justify-center gap-6 h-full overflow-auto p-6">
        {context?.droppedItems?.map((item) => (
          <div className="flex flex-col space-y-2 w-[225px]">
            <img
              src={`${process.env.PUBLIC_URL}/cards/${item?.tokenId}.png`}
              className="w-full"
            />
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

          console.log({
            crateItemIds,
            crateMetadata, itemIds, droppedMetadata
          })

          const rarities = crateRarities[crateTokenId] || {};
          const deterministicLodash = seedLodash(randomness);

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
                    imageSrc: `${process.env.PUBLIC_URL}/cards/${tokenId}.png`,
                    percent: rarities[String(tokenId)],
                    ...metadata,
                  };
                }),
                droppedItems: deterministicLodash.shuffle(itemIds.map((tokenId, index) => ({
                  tokenId: Number(tokenId),
                  ...(droppedMetadata?.[index] || {}),
                }))),
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
      {(() => {
        switch (status.event) {
          case DROPPED_STATUS.WAITING:
            return <WaitingForCrate onClose={onClose} />;
          case DROPPED_STATUS.READY:
          case DROPPED_STATUS.OPENING:
            return (
              <ReadyAndOpen
                sounds={sounds}
                status={status}
                setStatus={setStatus}
              />
            );
          case DROPPED_STATUS.REELS:
          case DROPPED_STATUS.SPIN_REELS:
            return (
              <Reels
                sounds={sounds}
                status={status}
                setStatus={setStatus}
                onClose={onClose}
              />
            );
          case DROPPED_STATUS.REVEALED_ALL:
            return (
              <SummaryView
                sounds={sounds}
                status={status}
                setStatus={setStatus}
                onClose={onClose}
              />
            );
        }
      })()}
    </div>
  );
};

const CratesView = ({ isSimulated }) => {
  const [viewCrateId, setViewCrateId] = useState(null);
  const [amountToBuy, setAmountToBuy] = useState(1);
  const [amountToOpen, setAmountToOpen] = useState(1);
  const { isConnected } = useAccount();

  const { data, isLoadingBiconomy, actions, sounds, isApproving } =
    useSupplyCrates({
      isSimulated,
      overrideAddress: null,
    });

  const navigate = useNavigate();

  return (
    <div
      className={classnames("flex flex-col relative text-white items-center", {
        "justify-center h-screen w-screen": !isConnected,
        "h-full w-full": isConnected,
      })}
    >
      {!isSimulated && (
        <div className="flex flex-col h-full w-full">
          <ConnectButton />
          {!isConnected && <PleaseConnectWallet />}
        </div>
      )}
      {isConnected &&
        (isLoadingBiconomy ? (
          <Loading />
        ) : (
          <div className="flex flex-col h-screen w-screen space-y-4">
            {viewCrateId && (
              <div className="fixed top-0 left-0 h-full w-full z-[99999] bg-dark overflow-auto">
                <div className="absolute top-0 left-0 flex flex-row flex-shrink-0 w-full justify-between items-center h-[65px] px-4 sm:px-10 text-white z-[2]">
                  <button
                    className="bg-main p-1 rounded-full text-3xl shadow-xl"
                    onClick={() => {
                      setViewCrateId(null);
                    }}
                  >
                    <BackIcon />
                  </button>
                </div>
                <div className="flex flex-col space-y-6 py-[65px]">
                  <div className="flex flex-col flex-shrink-0 items-center justify-center w-full gap-4 px-6 md:px-10">
                    <h1 className="text-white text-2xl">
                      {data?.crates?.[viewCrateId]?.item?.name}
                    </h1>
                    <p className="text-white text-sm opacity-80">
                      {data?.crates?.[viewCrateId]?.item?.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap w-full h-full gap-6 overflow-x-auto">
                    <div className="flex flex-col w-full h-full items-center justify-center space-y-2">
                      <p className="text-center text-sm text-accent">
                        Price: 0.02ETH
                      </p>
                      <img
                        className="h-[250px]"
                        src={`${BEARZ_SHOP_IMAGE_URI}${viewCrateId}.png`}
                        alt={String(viewCrateId)}
                      />
                      <div className="flex flex-col space-y-1">
                        <div className="flex flex-row items-center justify-center space-x-2 mt-3">
                          <select
                            className="flex text-right h-[34px] px-1 rounded-full bg-main border-dark border-[1px] text-white cursor-pointer z-[1]"
                            value={amountToBuy}
                            onChange={(e) => {
                              setAmountToBuy(e.target.value);
                            }}
                            disabled={data?.isBuying}
                          >
                            {new Array(Number(100)).fill(0).map((i, index) => (
                              <option key={index} value={index + 1}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              sounds?.start();

                              const success = await actions?.onBuyCrates({
                                amount: amountToBuy,
                              });

                              if(success){
                                setViewCrateId(null);
                                actions?.onRefresh();
                              }

                            }}
                            className="relative flex items-center justify-center h-[36px] cursor-pointer z-[1]"
                            disabled={data?.isBuying}
                          >
                            <img
                              className="object-cover h-full w-full"
                              src={buttonBackground}
                              alt="button"
                            />
                            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                              {data?.isBuying ? 'Buying...' : 'Buy'}
                            </span>
                          </button>
                        </div>
                        {data?.buyingContext && (
                            <p className="text-center text-warn text-sm py-2">{data?.buyingContext}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-4 items-center justify-center mx-auto overflow-x-hidden">
                      <Link
                          to={`https://bearzaar.brawlerbearz.club/collections/0xbd24a76f4135f930f5c49f6c30e0e30a61b97537/networks/mainnet/tokens/${viewCrateId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-white text-sm text-center"
                      >
                        Buy with credit card at the Bearzaar
                      </Link>
                      <h3 className="text-center">Drop rate(s)</h3>
                      <div className="flex flex-shrink-0 bg-[#21171f] bg-opacity-80 w-full gap-4 py-6 px-6 md:px-10 overflow-x-auto whitespace-nowrap px-6 md:px-10">
                        {data?.crates?.[viewCrateId]?.config?.itemIds?.map(
                            (itemId) => {
                              const rarities = crateRarities?.[viewCrateId];
                              const dropRarity = (rarities?.[itemId] || 0) * 100;
                              return (
                                  <div
                                      key={itemId}
                                      className="flex flex-col space-y-2 w-[100px]"
                                  >
                                    <div className="flex flex-col flex-shrink-0 w-[100px] gap-2">
                                      <img
                                          className="h-full w-full"
                                          src={`${BEARZ_SHOP_IMAGE_URI}${itemId}.png`}
                                          alt={itemId}
                                      />
                                    </div>
                                    <span className="text-[10px] text-center">
                                {dropRarity?.toFixed(2)}%
                              </span>
                                  </div>
                              );
                            },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {data?.isOpening ? (
              <div className="font-primary flex flex-col items-center h-full w-full z-[1]">
                <img className="w-[200px]" src={logoImage} alt="logo" />
                <div className="flex flex-col space-y-1 text-center text-white py-4">
                  <h1 className="text-sm">
                    {data?.openingContext ||
                      "Check your wallet for transaction..."}
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
            ) : data?.crates ? (
              <div className="flex flex-col items-center justify-center space-y-10">
                <div className="flex flex-row items-center space-x-4">
                  <h1 className="text-lg">Your Supply Crates</h1>
                  <Link
                    to="/crates/history"
                    className="bg-main p-1 rounded-full text-2xl shadow-xl"
                  >
                    <HistoryIcon />
                  </Link>
                </div>
                {!data?.isApproved && (
                  <div className="flex flex-col items-center space-y-4 max-w-xl text-center px-2 border-b-[2px] border-white border-opacity-20 pb-10">
                    <p className="text-xs text-warn">
                      Note: You need to approve burning supply crate cards.
                    </p>
                    <span className="text-xs text-white opacity-80">
                      This is a 1-time operation to allow the contract to burn
                      crate cards on your behalf.
                    </span>
                    <button
                      onClick={() => {
                        actions?.onApproveCrate();
                      }}
                      className="relative flex items-center justify-center w-[280px] cursor-pointer z-[1] mt-6"
                    >
                      <img
                        className="object-cover h-full w-full"
                        src={buttonBackground}
                        alt="button"
                      />
                      <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                        {isApproving ? "Approving..." : "Approve"}
                      </span>
                    </button>
                  </div>
                )}
                <div className="flex flex-col flex-wrap gap-4">
                  {Object.keys(data?.crates || {}).map((tokenId) => {
                    const crate = data?.crates[tokenId];
                    return (
                      <div
                        key={tokenId}
                        className="relative flex flex-col items-center justify-center w-[270px]"
                      >
                        <div className="relative flex w-full h-full">
                          <img
                              src={`${process.env.PUBLIC_URL}/cards/${tokenId}.png`}
                              className="w-full z-[2]"
                          />
                          <div className="absolute flex items-center justify-center border-white border-[3px] top-[-22px] right-[-22px] h-[45px] w-[45px] bg-[#887d8d] shadow-xl rounded-full text-white text-xs z-[2]">
                            <span>x{String(crate?.balance || 0)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-3 my-4">
                          {data?.isApproved && (
                              <div className="flex flex-row items-center justify-center space-x-2">
                                {/*<select*/}
                                {/*    className="flex text-right h-[36px] px-2 rounded-full bg-main border-dark border-[1px] text-white cursor-pointer z-[1]"*/}
                                {/*    value={amountToOpen}*/}
                                {/*    onChange={(e) => {*/}
                                {/*      setAmountToOpen(e.target.value);*/}
                                {/*    }}*/}
                                {/*>*/}
                                {/*  {new Array(Number(crate?.balance))*/}
                                {/*      .fill(0)*/}
                                {/*      .map((i, index) => (*/}
                                {/*          <option key={index} value={index + 1}>*/}
                                {/*            {index + 1}*/}
                                {/*          </option>*/}
                                {/*      ))}*/}
                                {/*</select>*/}
                                <button
                                    onClick={async () => {
                                      sounds?.start();
                                      await actions?.onOpenCrate({
                                        crateTokenId: tokenId,
                                        openAmount: 1,
                                      });
                                    }}
                                    className="relative flex items-center justify-center w-full cursor-pointer z-[1]"
                                >
                                  <img
                                      className="object-cover h-full w-full"
                                      src={buttonBackground}
                                      alt="button"
                                  />
                                  <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                                Burn & Open
                              </span>
                                </button>
                              </div>
                          )}
                          <button
                              onClick={() => {
                                setViewCrateId(tokenId);
                              }}
                              className="relative flex items-center justify-center w-full cursor-pointer z-[1]"
                          >
                            <img
                                className="object-cover h-full w-full"
                                src={buttonBackground}
                                alt="button"
                            />
                            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                                View & Buy more
                              </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ))}
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
        <div className="hidden tablet:flex max-w-screen relative mx-auto max-h-screen overflow-hidden">
          <FullExperience isSimulated={isSimulated} />
        </div>
        {isSandboxed ? (
          <div className="flex tablet:hidden max-w-screen relative mx-auto max-h-screen overflow-hidden">
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

const InteractiveCrates = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default InteractiveCrates;

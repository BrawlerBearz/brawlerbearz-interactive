// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useAccount, useContractRead, useWalletClient } from "wagmi";
import {
  createPublicClient,
  decodeAbiParameters,
  http,
  parseAbiParameters,
} from "viem";
import { mainnet } from "viem/chains";
import useSound from "use-sound";
import { Biconomy } from "@biconomy/mexa";
import { keyBy } from "lodash";
import { providers, Contract } from "ethers";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ALCHEMY_KEY } from "../lib/constants";
import {
  bearzQuickSaleABI,
  bearzQuickSaleAddress,
  bearzShopABI,
  bearzShopContractAddress,
  bearzSupplyCratesABI,
  bearzSupplyCratesContractAddress,
} from "../lib/contracts";
import { useSimpleAccountOwner } from "../lib/useSimpleAccountOwner";
import rocketLandingSoundEffect from "../interactive/sounds/landing.wav";
import thudSoundEffect from "../interactive/sounds/thud.wav";
import wooshEffect from "../interactive/sounds/woosh.wav";
import startEffect from "../interactive/sounds/start.mp3";
import lootEffect from "../interactive/sounds/loot.wav";
import rollEffect from "../interactive/sounds/roll.wav";
import revealEffect from "../interactive/sounds/reveal.wav";
import slideEffect from "../interactive/sounds/slide.wav";
import winnerEffect from "../interactive/sounds/winner.wav";
import { getNetwork, switchNetwork } from "@wagmi/core";

let biconomy: any;

const CRATE_TOKEN_IDS = [290, 364];

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

  const { data: isPaused, refetch: refreshPaused } = useContractRead({
    address: bearzQuickSaleAddress,
    abi: bearzQuickSaleABI,
    functionName: "isPaused",
    args: [],
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
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        biconomy = new Biconomy(new providers.Web3Provider(window.ethereum), {
          apiKey: "DZgKduUcK.58f69cf0-6070-482c-85a6-17c5e2f24d83",
          debug: false,
          contractAddresses: [bearzSupplyCratesContractAddress],
          strictMode: false,
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
      buyingContext,
      canBuy: !isPaused,
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

          const gasLimit = await contract.estimateGas.buy(amount, {
            value: ethPrice.mul(amount),
          });

          setBuying(true);
          setBuyingContext(`Check wallet for transaction...`);

          const tx = await contract.buy(amount, {
            value: ethPrice.mul(amount),
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
          });

          setBuyingContext(`Buying ${amount} crate(s)...`);

          await tx.wait();

          navigate(`/crates`);

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

export default useSupplyCrates;

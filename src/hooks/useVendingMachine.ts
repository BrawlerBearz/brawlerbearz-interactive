// @ts-nocheck
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAccount, useContractRead, useWalletClient } from "wagmi";
import { groupBy } from "lodash";
import { Contract, providers, ethers } from "ethers";
import { toast } from "react-toastify";
import { Biconomy } from "@biconomy/mexa";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useSimpleAccountOwner } from "../lib/useSimpleAccountOwner";
import {
  bearzShopABI,
  bearzShopContractAddress,
  bearzVendingMachineABI,
  bearzVendingMachineContractAddress,
} from "../lib/contracts";
import { ALCHEMY_KEY } from "../lib/constants";
import { getNetwork, switchNetwork } from "@wagmi/core";
import useSound from "use-sound";
import startEffect from "../interactive/sounds/start.mp3";
import slideEffect from "../interactive/sounds/slide.wav";
import clickEffect from "../interactive/sounds/vending_button.wav";
import flapEffect from "../interactive/sounds/vending_flap.wav";
import humEffect from "../interactive/sounds/vending_hum.wav";
import processEffect from "../interactive/sounds/vending_process.wav";
import { BEARZ_SHOP_IMAGE_URI } from "../lib/blockchain";
import winnerEffect from "../interactive/sounds/winner.wav";

const CONSUMABLE_TOKEN_IDS = [325];

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

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

const getConfigData = (configs, nftLookup) =>
  configs?.reduce((acc, bytes) => {
    try {
      const [
        vendId,
        isERC721,
        contractAddress,
        ticketItemId,
        tokenId,
        inCount,
        outCount,
        quantity,
      ] = ethers.utils.defaultAbiCoder.decode(
        [
          "uint256",
          "bool",
          "address",
          "uint32",
          "uint32",
          "uint64",
          "uint64",
          "uint64",
        ],
        bytes,
        false,
      );
      acc.push({
        vendId: vendId?.toNumber(),
        isERC721,
        contractAddress,
        ticketItemId: ticketItemId,
        tokenId: tokenId,
        inCount: inCount?.toNumber(),
        outCount: outCount?.toNumber(),
        quantity: quantity?.toNumber(),
        imageSrc:
          contractAddress === "0x0000000000000000000000000000000000000000"
            ? `${BEARZ_SHOP_IMAGE_URI}${tokenId}.png`
            : nftLookup[contractAddress]?.find(
                (item) => String(item.tokenId) === String(tokenId),
              )?.image?.pngUrl,
      });
      return acc;
    } catch (e) {
      console.log(e);
      return acc;
    }
  }, []);

const getVendingMachine = async (address) => {
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  const [balances, items, vendingMachine, nftLookup = {}] = await Promise.all([
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "balanceOf",
      args: [address, CONSUMABLE_TOKEN_IDS],
    }),
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "getMetadataBatch",
      args: [CONSUMABLE_TOKEN_IDS],
    }),
    ethClient.readContract({
      address: bearzVendingMachineContractAddress,
      abi: bearzVendingMachineABI,
      functionName: "vendingState",
      args: [],
    }),
    fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?contractAddresses[]=0x556697Ca91476B811f37A851dD2e53ae4c6024dB&contractAddresses[]=0x5bc0f0911034d23c90c96945d9c072596ee64ed5&owner=${bearzVendingMachineContractAddress}&withMetadata=true&pageSize=100`,
    )
      .then((response) => response.json())
      .catch((e) => []),
  ]);

  return {
    balances,
    items,
    vendingMachine: getConfigData(
      vendingMachine,
      groupBy(nftLookup?.ownedNfts || [], "contract.address"),
    ),
  };
};

const useVendingMachine = ({ isSimulated, overrideAddress }) => {
  const params = useParams();
  const navigate = useNavigate();

  const [start, { stop: stopStart, sound: startSound }] = useSound(
    startEffect,
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

  const [hum, { stop: stopHum, sound: humSound }] = useSound(humEffect, {
    volume: 0.1,
    interrupt: true,
  });

  const [click, { stop: stopClick, sound: clickSound }] = useSound(
    clickEffect,
    {
      volume: 0.5,
      interrupt: true,
    },
  );

  const [flap, { stop: stopFlap, sound: flapSound }] = useSound(flapEffect, {
    volume: 0.3,
    interrupt: true,
  });

  const [process, { stop: stopProcess, sound: processSound }] = useSound(
    processEffect,
    {
      volume: 0.6,
      interrupt: true,
    },
  );

  const [winner, { stop: stopWinner, sound: winnerSound }] = useSound(
    winnerEffect,
    {
      volume: 0.8,
      interrupt: true,
    },
  );

  const [isLoadingBiconomy, setIsLoadingBiconomy] = useState(true);
  const [vendingMachine, setVendingMachine] = useState(null);
  const [isApproving, setApproving] = useState(false);
  const [txHash, setTxHash] = useState(params?.txHash);

  const [isVending, setVending] = useState(false);
  const [openingContext, setOpeningContext] = useState(null);

  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  const { isLoading } = useSimpleAccountOwner();
  const signer = useEthersSigner();

  const { data: isApproved, refetch } = useContractRead({
    address: bearzShopContractAddress,
    abi: bearzShopABI,
    functionName: "isApprovedForAll",
    args: [account?.address, bearzVendingMachineContractAddress],
  });

  const { data: isPaused } = useContractRead({
    address: bearzVendingMachineContractAddress,
    abi: bearzVendingMachineABI,
    functionName: "isPaused",
    args: [],
  });

  const onRefresh = async (address) => {
    if (address) {
      setVendingMachine(await getVendingMachine(address));
    }
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
          contractAddresses: [bearzVendingMachineContractAddress],
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
      hum,
      stopHum,
      click,
      stopClick,
      start,
      stopStart,
      slide,
      stopSlide,
      flap,
      stopFlap,
      process,
      stopProcess,
      winner,
      stopWinner,
    },
    data: {
      ...(vendingMachine ?? {}),
      txHash,
      isVending,
      isApproved,
      openingContext,
      canVend: !isPaused,
    },
    actions: {
      onRefresh: onRefresh.bind(null, account?.address),
      onExitTxHash: async () => {
        setTxHash(null);
        navigate("/vending-machine");
        await onRefresh(account?.address);
      },
      onApproveTicketBurn: async () => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzShopContractAddress,
            bearzShopABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.setApprovalForAll(
            bearzVendingMachineContractAddress,
            true,
          );

          setApproving(true);

          const tx = await contract.setApprovalForAll(
            bearzVendingMachineContractAddress,
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
      onVend: async ({ vendId }) => {
        try {
          const provider = new providers.Web3Provider(biconomy);

          const feeData = await provider.getFeeData();

          const contract = new Contract(
            bearzVendingMachineContractAddress,
            bearzVendingMachineABI,
            provider.getSigner(account.address),
          );

          const gasLimit = await contract.estimateGas.vend(vendId);

          setVending(true);
          setOpeningContext(`Check wallet for transaction...`);

          const tx = await contract.vend(vendId, {
            gasLimit: gasLimit.mul(100).div(60),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          });

          setTxHash(tx.hash);
          setOpeningContext(`Burning ticket(s)...`);

          navigate(`/vending-machine/${tx.hash}`);
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setVending(false);
          setOpeningContext(null);
        }
      },
    },
  };
};

export default useVendingMachine;

import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAccount, useContractRead, useWalletClient } from "wagmi";
import { keyBy } from "lodash";
import { Contract, providers } from "ethers";
import { toast } from "react-toastify";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useSimpleAccountOwner } from "../lib/useSimpleAccountOwner";
import {
  bearzConsumableABI,
  bearzConsumableContractAddress,
  bearzQuickSale2ABI,
  bearzQuickSale2Address,
  bearzShopABI,
  bearzShopContractAddress,
} from "../lib/contracts";
import { ALCHEMY_KEY } from "../lib/constants";

const CONSUMABLE_TOKEN_IDS = [300];

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
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

const getUserConsumables = async (address, tokenIds) => {
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  const [balances, items] = await Promise.all([
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
  ]);

  const lookupItems = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      item: items[index],
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
      ...lookupBalances[tokenId],
    };
    return acc;
  }, {});
};

const useConsumables = ({ isSimulated, overrideAddress }) => {
  const navigate = useNavigate();

  const [consumables, setConsumables] = useState(null);
  const [isApproving, setApproving] = useState(false);

  const [isConsuming, setIsConsuming] = useState(false);
  const [consumingContext, setConsumingContext] = useState(null);

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
    args: [account?.address, bearzConsumableContractAddress],
  });

  const onRefresh = async (address) => {
    setConsumables(await getUserConsumables(address, CONSUMABLE_TOKEN_IDS));
  };

  useEffect(() => {
    (async function () {
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
    isApproving,
    data: {
      consumables,
      isConsuming,
      isApproved,
      consumingContext,
      isBuying,
      buyingContext,
    },
    actions: {
      onRefresh: onRefresh.bind(null, account?.address),
      onApproveConsumable: async () => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzShopContractAddress,
            bearzShopABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.setApprovalForAll(
            bearzConsumableContractAddress,
            true,
          );

          setApproving(true);

          const tx = await contract.setApprovalForAll(
            bearzConsumableContractAddress,
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
      onBuyConsumables: async ({ amount }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzQuickSale2Address,
            bearzQuickSale2ABI,
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

          setBuyingContext(`Buying ${amount} consumable(s)...`);

          await tx.wait();

          navigate(`/consumables`);

          toast.success(`Successfully bought ${amount} consumable(s)!`);

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setBuying(false);
          setBuyingContext(null);
        }
      },
      onConsume: async ({ tokenId, itemTokenId }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzConsumableContractAddress,
            bearzConsumableABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.consume(
            tokenId,
            itemTokenId,
            true,
          );

          setIsConsuming(true);
          setConsumingContext(`Check wallet for transaction...`);

          const tx = await contract.consume(tokenId, itemTokenId, true, {
            gasLimit: gasLimit.mul(100).div(80),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          });

          setConsumingContext(`Consuming...`);

          await toast.promise(tx.wait(), {
            pending: "Burning consumable(s)...",
            success: `Successfully applied consumable to ${tokenId}!`,
            error: "There was an error",
          });

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setIsConsuming(false);
          setConsumingContext(null);
        }
      },
    },
  };
};

export default useConsumables;

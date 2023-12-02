// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Contract, providers } from "ethers";
import { toast } from "react-toastify";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useSimpleAccountOwner } from "../lib/useSimpleAccountOwner";
import { bearzBattlePass } from "../lib/contracts";
import { ALCHEMY_KEY } from "../lib/constants";

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

const getBattlePasses = async () => {
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  const [proPrice, entryPrice, liveAt, isLive] = await Promise.all([
    ethClient.readContract({
      ...bearzBattlePass?.season4?.[mainnet.id],
      functionName: "proPrice",
    }),
    ethClient.readContract({
      ...bearzBattlePass?.season4?.[mainnet.id],
      functionName: "entryPrice",
    }),
    ethClient.readContract({
      ...bearzBattlePass?.season4?.[mainnet.id],
      functionName: "liveAt",
    }),
    ethClient.readContract({
      ...bearzBattlePass?.season4?.[mainnet.id],
      functionName: "isLive",
    }),
  ]);

  return {
    "1": {
      balances: 0,
      liveAt,
      isLive,
      item: {
        name: "Pro Pass",
        description: "5 entries, Supply Crate, & Neo Tickets",
        price: proPrice,
        imageSrc: `${process.env.PUBLIC_URL}/battlePass/1.png`,
      },
    },
    "2": {
      balances: 0,
      liveAt,
      isLive,
      item: {
        name: "Entry Pass",
        description: "2 entries",
        price: entryPrice,
        imageSrc: `${process.env.PUBLIC_URL}/battlePass/2.png`,
      },
    },
  };
};

const useBattlePasses = ({ isSimulated, overrideAddress }) => {
  const [battlePasses, setBattlePasses] = useState(null);
  const [isBuying, setBuying] = useState(false);
  const [buyingContext, setBuyingContext] = useState(null);

  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  const { isLoading } = useSimpleAccountOwner();
  const signer = useEthersSigner();

  const onRefresh = async () => {
    setBattlePasses(await getBattlePasses());
  };

  useEffect(() => {
    (async function () {
      await onRefresh();
    })();
  }, [account?.address, signer?.provider]);

  if (isSimulated || isLoading || !signer?.provider) {
    return account;
  }

  return {
    ...account,
    data: {
      battlePasses,
      isBuying,
      buyingContext,
    },
    actions: {
      onRefresh,
      onBuyPro: async ({ amount }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzBattlePass?.season4?.[mainnet.id]?.address,
            bearzBattlePass?.season4?.[mainnet.id]?.abi,
            signer,
          );

          const ethPrice = await contract.proPrice();

          const gasLimit = await contract.estimateGas.proPassMint(amount, {
            value: ethPrice.mul(amount),
          });

          setBuying(true);
          setBuyingContext(`Check wallet for transaction...`);

          const tx = await contract.proPassMint(amount, {
            value: ethPrice.mul(amount),
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
          });

          setBuyingContext(`Buying ${amount} battle pass...`);

          await tx.wait();

          toast.success(
            `Successfully bought ${amount} battle pass! Check supply crates :)`,
          );

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setBuying(false);
          setBuyingContext(null);
        }
      },
      onBuyEntry: async ({ amount }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzBattlePass?.season4?.[mainnet.id]?.address,
            bearzBattlePass?.season4?.[mainnet.id]?.abi,
            signer,
          );

          const ethPrice = await contract.entryPrice();

          const gasLimit = await contract.estimateGas.entryPassMint(amount, {
            value: ethPrice.mul(amount),
          });

          setBuying(true);
          setBuyingContext(`Check wallet for transaction...`);

          const tx = await contract.entryPassMint(amount, {
            value: ethPrice.mul(amount),
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
          });

          setBuyingContext(`Buying ${amount} battle pass entries...`);

          await tx.wait();

          toast.success(`Successfully bought ${amount} battle pass entries!`);

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setBuying(false);
          setBuyingContext(null);
        }
      },
    },
  };
};

export default useBattlePasses;

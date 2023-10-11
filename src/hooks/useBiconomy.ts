// @ts-nocheck
import React, { useRef, useEffect, useState, useCallback } from "react";
import { providers } from "ethers";
import { Biconomy } from "@biconomy/mexa";
import { useWalletClient } from "wagmi";
import { mainnet, polygon } from "viem/chains";
import { createWalletClient, custom, http, toHex } from "viem";
import { L2_ALCHEMY_KEY } from "../lib/constants";

export function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  console.log(network);
  const provider = new providers.Web3Provider(transport, network);
  return provider.getSigner(account.address);
}

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient({ chainId: 137 });
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  );
}

const useBiconomy = ({
  account,
  debug,
  contractAddresses,
  strictMode,
  chainId,
}) => {
  const initializeBiconomy = () =>
    new Promise((resolve, reject) => {
      const client = createWalletClient({
        chain: polygon,
        transport: custom(window.ethereum),
      });

      const biconomy = new Biconomy(
        new providers.Web3Provider(client.transport, {
          chainId: client?.chain.id,
          name: client?.chain.name,
          ensAddress: client?.chain.contracts?.ensRegistry?.address,
        }),
        {
          apiKey: "EcGNLWNDy.2d90a928-747a-402e-8b15-f5c28bd4e8a7",
          debug: true,
          contractAddresses,
          strictMode,
        },
      );

      biconomy
        .onEvent(biconomy.READY, () => {
          resolve(new providers.Web3Provider(biconomy));
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          reject(message);
        });
    });

  return {
    initializeBiconomy,
  };
};

export default useBiconomy;

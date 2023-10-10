import { ChainId } from "@biconomy/core-types";
import { ALCHEMY_KEY, L2_ALCHEMY_KEY } from "./constants";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import { Bundler } from "@biconomy/bundler";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";

export const biconomyConfiguration = (signer, chainId) =>
  ({
    [ChainId.MAINNET]: {
      signer,
      chainId: ChainId.MAINNET,
      rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      paymaster: new BiconomyPaymaster({
        paymasterUrl:
          "https://paymaster.biconomy.io/api/v1/1/rtXq6jgwR.494442c9-9a97-4599-a187-6f8782a4689d",
      }),
      bundler: new Bundler({
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7HjkIo-190d-hjUi-af80-6877f74b8f44",
        chainId: ChainId.MAINNET,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      }),
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    },
    [ChainId.POLYGON_MAINNET]: {
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
    },
  })[chainId];

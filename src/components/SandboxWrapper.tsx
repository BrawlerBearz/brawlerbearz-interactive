import React from "react";
import { createConfig, WagmiConfig } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { mainnet } from "viem/chains";
import {
  ALCHEMY_KEY,
  CONNECT_KIT_THEME,
  WALLETCONNECT_PROJECT_ID,
} from "../lib/constants";

const SandboxWrapper = ({ isSandboxed, Component }) => {
  return isSandboxed ? (
    <Component isSandboxed={isSandboxed} isSimulated />
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
        <Component isSandboxed={isSandboxed} isSimulated={false} />
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

export default SandboxWrapper;

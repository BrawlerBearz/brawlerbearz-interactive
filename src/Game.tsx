// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Header from "./components/Header";
import SandboxWrapper from "./components/SandboxWrapper";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import classnames from "classnames";
import type { EventPayloadData } from "@discord/embedded-app-sdk";
import { useLocation, useSearchParams } from "react-router-dom";
import discordSdk from "./lib/discord/discordSdk";
import initializeSDK from "./lib/discord/discordSdk";

const useSimulatedAccount = () => {
  return {
    address: null,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const useNFTWrapped = ({ isSimulated }) => {
  const account = !isSimulated ? useAccount() : useSimulatedAccount();

  if (isSimulated) {
    return account;
  }

  const { isLoading, owner: signer } = useSimpleAccountOwner();

  if (isLoading || !signer?.getAddress()) {
    return account;
  }

  return {
    ...account,
  };
};

const Experience = ({ isSimulated = false }) => {
  const { address, isConnected, balance, refreshBalance } = useNFTWrapped({
    isSimulated,
  });

  const location = useLocation();

  const [currentUser, setCurrentUser] =
    useState<EventPayloadData<"CURRENT_USER_UPDATE"> | null>(null);

  let discordSdk;

  const handleCurrentUserUpdate = (
    currentUserEvent: EventPayloadData<"CURRENT_USER_UPDATE">
  ) => {
    setCurrentUser(currentUserEvent);
  };

  const setup = async (params) => {
    discordSdk = await initializeSDK({ params });

    const { channelId } = discordSdk;

    if (!channelId) return;

    discordSdk.subscribe("CURRENT_USER_UPDATE", handleCurrentUserUpdate);

    return () => {
      discordSdk.unsubscribe("CURRENT_USER_UPDATE", handleCurrentUserUpdate);
    };
  };

  useEffect(() => {
    setup(location.search);
  }, [location.search]);

  return (
    <>
      <div
        className={classnames(
          "flex flex-col relative text-white items-center",
          {
            "justify-center h-screen w-screen": !isConnected,
            "h-full w-full": isConnected,
          }
        )}
      >
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <Header />
            {!isConnected && <PleaseConnectWallet />}
          </div>
        )}
        {isConnected && (
          <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pb-20">
            <div className="flex flex-col items-center w-full h-full z-[5] space-y-4 px-6">
              <h1 className="text-xl mb-4">Testing</h1>
              <p>{JSON.stringify(currentUser, null, 2)}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Game = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Game;

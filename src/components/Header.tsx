// @ts-nocheck
import React, { useContext, useEffect } from "react";
import { ConnectKitButton } from "connectkit";
import { Link } from "react-router-dom";
import pawIcon from "../interactive/pawicon_white.png";
import { WalletContext } from "../context/WalletContext";
import { useSimpleAccountOwner } from "../lib/useSimpleAccountOwner";
import { BiconomySmartAccount } from "@biconomy/account";
import { biconomyConfiguration } from "../lib/biconomy";

export const CustomConnect = ({
  isConnected,
  show,
  truncatedAddress,
  ensName,
  chain,
}) => {
  const { wallet, setWallet } = useContext(WalletContext);
  const { isLoading, owner: signer } = useSimpleAccountOwner();
  const signerAddress = signer?.getAddress();

  const checkSmartWalletStatus = async () => {
    const config = biconomyConfiguration(signer, chain.id);
    const biconomyAccount = new BiconomySmartAccount(config);
    const smartAccount = await biconomyAccount.init();
    setWallet({
      displayName: ensName ?? truncatedAddress,
      owner: smartAccount.owner,
      smartWallet: await smartAccount.getSmartAccountAddress(0),
    });
  };

  useEffect(() => {
    if (!isLoading && signerAddress) {
      checkSmartWalletStatus();
    }
  }, [isLoading, signerAddress]);

  return !isConnected ? (
    <button
      onClick={show}
      className="w-full max-w-[200px] relative flex items-center justify-center cursor-pointer px-2 py-2 text-center text-accent animate-pulse"
    >
      Connect Wallet
    </button>
  ) : (
    <button
      className="flex flex-row items-center justify-end hover:underline text-xs text-accent text-center"
      onClick={show}
    >
      <span className="hidden sm:flex pr-1">Connected to</span>
      {wallet?.displayName}
    </button>
  );
};

const Header = ({ showMenu = true }) => {
  return (
    <div className="flex flex-row flex-shrink-0 w-full justify-between items-center h-[65px] px-4 sm:px-10 text-white z-[2]">
      {showMenu ? (
        <Link to="/" className="flex flex-row items-center space-x-4">
          <img
            className="object-contain h-[25px] w-[25px] sm:h-[35px] sm:w-[35px]"
            src={pawIcon}
            alt="Menu icon"
          />
          <span className="hidden sm:flex">Menu</span>
        </Link>
      ) : null}
      <ConnectKitButton.Custom>
        {(props) => <CustomConnect {...props} />}
      </ConnectKitButton.Custom>
    </div>
  );
};

export default Header;

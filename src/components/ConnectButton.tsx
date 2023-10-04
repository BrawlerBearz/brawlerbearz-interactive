import React from "react";
import { ConnectKitButton } from "connectkit";
import { Link } from "react-router-dom";
import buttonBackground from "../interactive/button.png";
import pawIcon from "../interactive/pawicon_white.png";

const ConnectButton = ({ showMenu = true }) => {
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
        {({ isConnected, show, truncatedAddress, ensName }) => {
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
              {ensName ?? truncatedAddress}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
};

export default ConnectButton;

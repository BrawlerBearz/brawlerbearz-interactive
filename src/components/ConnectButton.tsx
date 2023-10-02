import React from "react";
import { ConnectKitButton } from "connectkit";
import { Link } from "react-router-dom";
import buttonBackground from "../interactive/button.png";
import pawIcon from "../interactive/pawicon_white.png";

const ConnectButton = () => {
  return (
    <div className="flex flex-row flex-shrink-0 w-full justify-between items-center h-[65px] px-10 text-white">
      <Link to="/" className="flex flex-row items-center space-x-4">
        <img
          className="object-contain h-[35px] w-[35px]"
          src={pawIcon}
          alt="Menu icon"
        />
        <span>Menu</span>
      </Link>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName }) => {
          return !isConnected ? (
            <button
              onClick={show}
              className="relative flex items-center justify-center w-[250px] cursor-pointer"
            >
              <img
                className="object-cover h-full w-full"
                src={buttonBackground}
                alt="button"
              />
              <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                Connect
              </span>
            </button>
          ) : (
            <button
              className="hover:underline text-[12px] text-accent text-left"
              onClick={show}
            >
              Connected to {ensName ?? truncatedAddress}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
};

export default ConnectButton;

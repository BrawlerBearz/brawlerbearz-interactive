import React from "react";
import { ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";
import buttonBackground from "./interactive/button.png";
import logoImage from "./interactive/logo.gif";
import ConnectButton from "./components/ConnectButton";
import SandboxWrapper from "./components/SandboxWrapper";

const Experience = ({ isSandboxed, isSimulated = false }) => {
  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark items-center font-primary space-y-4">
        {!isSimulated && <ConnectButton showMenu={false} />}
        <div className="flex flex-col space-y-2 items-center">
          <img className="w-[180px] my-3" src={logoImage} alt="logo" />
          <Link
            to="/bearz"
            className="relative flex items-center justify-center w-[280px] cursor-pointer text-white"
          >
            <img
              className="object-cover h-full w-full"
              src={buttonBackground}
              alt="button"
            />
            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
              My Bearz
            </span>
          </Link>
          <Link
            to="/crates"
            className="relative flex items-center justify-center w-[280px] cursor-pointer text-white"
          >
            <img
              className="object-cover h-full w-full"
              src={buttonBackground}
              alt="button"
            />
            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
              Supply Crates
            </span>
          </Link>
          <Link
            to="https://bearzaar.brawlerbearz.club/"
            target="_blank"
            rel="noreferrer"
            className="relative flex items-center justify-center w-[280px] cursor-pointer text-white"
          >
            <img
              className="object-cover h-full w-full"
              src={buttonBackground}
              alt="button"
            />
            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
              Bearzaar
            </span>
          </Link>
        </div>
      </div>
      <ToastContainer
        theme="dark"
        position="bottom-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  );
};

const Connect = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Connect;

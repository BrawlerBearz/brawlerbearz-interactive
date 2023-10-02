import React from "react";
import logoImage from "../interactive/logo.gif";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <img className="w-[200px] mt-10" src={logoImage} alt="logo" />
      <span>Loading...</span>
    </div>
  );
};

export default Loading;

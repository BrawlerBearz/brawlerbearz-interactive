import { createContext } from "react";

export const WalletContext = createContext({
  wallet: null,
  setWallet: null,
});

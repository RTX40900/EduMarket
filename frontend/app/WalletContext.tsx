import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";

interface WalletContextProps {
  web3: Web3 | undefined;
  accountAddress: string | undefined;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextProps>({
  web3: undefined,
  accountAddress: undefined,
  isConnected: false,
  connectWallet: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [accountAddress, setAccountAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (typeof window.ethereum !== "undefined") {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
      }
    })();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        setAccountAddress(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <WalletContext.Provider value={{ web3, accountAddress, isConnected, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useAccount, useDisconnect } from 'wagmi';

interface Web3ProviderProps {
  children: React.ReactNode;
  onConnect: (address: string) => void;
}

const Web3Provider: React.FC<Web3ProviderProps> = ({ children, onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Handle wallet connection separately since onConnect is no longer in useAccount parameters
  useEffect(() => {
    if (address && isConnected) {
      onConnect(address);
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully connected.",
      });
    }
  }, [address, isConnected, onConnect]);

  // Expose the wallet connection methods to child components
  const contextValue = {
    connectWallet: () => {
      // This is handled by RainbowKit's ConnectButton
      console.log("Use RainbowKit's ConnectButton to connect wallet");
    },
    disconnectWallet: () => {
      disconnect();
    },
    isLoading,
    walletAddress: address,
    isConnected
  };

  // Add this to the window for child components to access
  useEffect(() => {
    // @ts-ignore
    window.web3Context = contextValue;
  }, [isLoading, address, isConnected]);

  return <>{children}</>;
};

export default Web3Provider;

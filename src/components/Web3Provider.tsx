
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useAccount, useDisconnect } from 'wagmi';
import Web3 from 'web3';

interface Web3ProviderProps {
  children: React.ReactNode;
  onConnect: (address: string) => void;
}

const Web3Provider: React.FC<Web3ProviderProps> = ({ children, onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);
  
  // Initialize Web3 instance when connected
  useEffect(() => {
    if (isConnected && window.ethereum) {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);
      console.log("Web3 initialized with provider:", window.ethereum);
    } else {
      setWeb3Instance(null);
    }
  }, [isConnected]);

  // Handle wallet connection
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
    isConnected,
    web3: web3Instance
  };

  // Add this to the window for child components to access
  useEffect(() => {
    // @ts-ignore
    window.web3Context = contextValue;
  }, [isLoading, address, isConnected, web3Instance]);

  return <>{children}</>;
};

export default Web3Provider;

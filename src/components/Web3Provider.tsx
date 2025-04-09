
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

// Add this interface to properly type window.ethereum
interface WindowWithEthereum extends Window {
  ethereum?: any;
}

interface Web3ProviderProps {
  children: React.ReactNode;
  onConnect: (address: string) => void;
}

const Web3Provider: React.FC<Web3ProviderProps> = ({ children, onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const windowWithEthereum = window as WindowWithEthereum;
      
      if (windowWithEthereum.ethereum) {
        try {
          const accounts = await windowWithEthereum.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            onConnect(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking existing connection', error);
        }
      }
    };
    
    checkExistingConnection();
  }, [onConnect]);

  // Check if MetaMask or WalletConnect is installed/available
  const checkIfWalletIsInstalled = () => {
    // Use the typed window
    const windowWithEthereum = window as WindowWithEthereum;
    return windowWithEthereum.ethereum !== undefined;
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (isConnected) return; // Already connected
    
    if (!checkIfWalletIsInstalled()) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask or another Web3 wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const windowWithEthereum = window as WindowWithEthereum;
      
      // Actually try to connect to MetaMask if it exists
      if (windowWithEthereum.ethereum) {
        const accounts = await windowWithEthereum.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          setIsConnected(true);
          onConnect(address);
          
          toast({
            title: "Wallet connected",
            description: "Your wallet has been successfully connected.",
          });
          return;
        }
      }
      
      // If we reach here, the connection failed despite ethereum being available
      throw new Error("Failed to connect to wallet");
      
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the wallet connection methods to child components
  const contextValue = {
    connectWallet,
    isLoading,
    checkIfWalletIsInstalled,
    walletAddress,
    isConnected
  };

  // Add this to the window for child components to access
  useEffect(() => {
    // @ts-ignore
    window.web3Context = contextValue;
  }, [contextValue]);

  return <>{children}</>;
};

export default Web3Provider;

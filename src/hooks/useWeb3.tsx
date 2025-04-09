
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { useAccount } from 'wagmi';

export const useWeb3 = () => {
  const { address, isConnected } = useAccount();
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (isConnected && window.ethereum) {
        try {
          // Request access to the user's accounts
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create new Web3 instance
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          setIsReady(true);
          console.log("Web3 initialized successfully");
        } catch (error) {
          console.error("Error initializing Web3:", error);
          setIsReady(false);
        }
      } else {
        setWeb3(null);
        setIsReady(false);
      }
    };

    initWeb3();

    // Handle account changes
    const handleAccountsChanged = () => {
      if (window.ethereum) {
        initWeb3();
      }
    };

    // Handle network changes
    const handleChainChanged = () => {
      if (window.ethereum) {
        window.location.reload();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isConnected]);

  return { web3, isReady, address };
};

export default useWeb3;

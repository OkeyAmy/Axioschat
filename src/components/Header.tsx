
import React from 'react';
import { Button } from "@/components/ui/button";

const Header = () => {
  // Get the web3 context from the window (in a real app, you would use React Context)
  const getWeb3Context = () => {
    // @ts-ignore
    return window.web3Context || { connectWallet: () => {}, isLoading: false };
  };

  const { connectWallet, isLoading } = getWeb3Context();

  return (
    <header className="border-b bg-card">
      <div className="container max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg">Web3 Chat Nexus</h1>
        </div>
        <Button 
          onClick={connectWallet} 
          disabled={isLoading}
          variant="secondary"
          size="sm"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
};

export default Header;

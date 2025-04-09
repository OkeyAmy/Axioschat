
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
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            NovachatV2
          </h1>
        </div>
        <Button 
          onClick={connectWallet} 
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="hover:bg-primary/10"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
};

export default Header;

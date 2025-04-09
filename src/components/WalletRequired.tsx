
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const WalletRequired = () => {
  // Get the web3 context from the window (in a real app, you would use React Context)
  const getWeb3Context = () => {
    // @ts-ignore
    return window.web3Context || { connectWallet: () => {}, checkIfWalletIsInstalled: () => false, isLoading: false };
  };

  const { connectWallet, checkIfWalletIsInstalled, isLoading } = getWeb3Context();
  const walletInstalled = checkIfWalletIsInstalled();

  return (
    <Card className="w-full max-w-md mx-auto border shadow-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="text-primary" size={24} />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          You need to connect a Web3 wallet to use the AI chat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {walletInstalled 
            ? "Click the button below to connect your wallet and get started."
            : "You need to install a Web3 wallet like MetaMask to continue."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {walletInstalled ? (
          <Button onClick={connectWallet} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <Button
            as="a" 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Install MetaMask
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletRequired;

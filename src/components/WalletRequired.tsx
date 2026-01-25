"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "./ThirdwebProviderWrapper";

/**
 * WalletRequired Component
 * 
 * Displays a card prompting the user to connect their wallet.
 * Uses Thirdweb's ConnectButton for wallet connection.
 */
const WalletRequired = () => {
  const account = useActiveAccount();
  const isConnected = !!account;

  return (
    <Card className="w-full max-w-md mx-auto border shadow-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="text-primary" size={24} />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Please connect your Web3 wallet to interact with blockchain functions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Connect your wallet to send transactions, swap tokens, and interact with smart contracts.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {!isConnected && (
          <ConnectButton
            client={thirdwebClient}
            connectButton={{
              label: "Connect Wallet",
            }}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletRequired;

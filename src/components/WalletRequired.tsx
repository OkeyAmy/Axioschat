"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Wallet, ExternalLink, Terminal, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  setMneeAddress,
  isValidMneeAddress,
  shortenAddress,
} from "@/services/mneeService";

/**
 * WalletRequired Component
 * 
 * Displays a card prompting the user to connect their MNEE wallet.
 */
const WalletRequired = () => {
  const [inputAddress, setInputAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!inputAddress.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter your MNEE wallet address.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMneeAddress(inputAddress.trim())) {
      toast({
        title: "Invalid Address Format",
        description: "MNEE addresses should start with '1' and be 26-35 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      setMneeAddress(inputAddress.trim());
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${shortenAddress(inputAddress.trim())}`,
      });
      // Force page refresh to update state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto border shadow-lg bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/20">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Wallet className="text-white" size={32} />
        </div>
        <CardTitle className="text-2xl">Connect Your MNEE Wallet</CardTitle>
        <CardDescription className="text-base">
          Enter your MNEE wallet address to start using AxiosChat
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Wallet Address</label>
          <div className="flex gap-2">
            <Input
              placeholder="1YourMNEEAddressHere..."
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !inputAddress.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            MNEE addresses start with "1" and are 26-35 characters long
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Don't have a wallet?
            </span>
          </div>
        </div>

        {/* CLI Instructions */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
          <h4 className="font-medium flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Create a wallet with MNEE CLI
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">1. Install MNEE CLI</p>
                <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded block mt-1">
                  npm install -g @mnee/cli
                </code>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">2. Create a new wallet</p>
                <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded block mt-1">
                  mnee create
                </code>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">3. View your address</p>
                <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded block mt-1">
                  mnee address
                </code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3">
        <a
          href="https://docs.mnee.io/dev-tools/mnee-cli"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View MNEE CLI Documentation
          </Button>
        </a>
        
        <p className="text-xs text-center text-muted-foreground">
          MNEE is a stablecoin on the BSV blockchain. Get sandbox tokens at{' '}
          <a
            href="https://sandbox.mnee.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
          >
            sandbox.mnee.net
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default WalletRequired;

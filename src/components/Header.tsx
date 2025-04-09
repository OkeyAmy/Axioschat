
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Wallet, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const Header = () => {
  // Get the web3 context from the window (in a real app, you would use React Context)
  const getWeb3Context = () => {
    // @ts-ignore
    return window.web3Context || { 
      connectWallet: () => {}, 
      isLoading: false, 
      walletAddress: null, 
      isConnected: false 
    };
  };

  const { connectWallet, isLoading, walletAddress, isConnected } = getWeb3Context();
  const { theme, setTheme } = useTheme();
  
  const formattedAddress = walletAddress ? 
    `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
    '';

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            NovachatV2
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          
          {isConnected ? (
            <Button 
              variant="outline"
              size="sm"
              className="bg-primary/10 flex items-center gap-2 cursor-default"
            >
              <Check size={16} className="text-green-500" />
              {formattedAddress}
            </Button>
          ) : (
            <Button 
              onClick={connectWallet} 
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="hover:bg-primary/10 flex items-center gap-2"
            >
              <Wallet size={16} />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

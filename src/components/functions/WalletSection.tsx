
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, DollarSign, ArrowDownUp, Settings, Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FunctionCard } from "./FunctionCard";
import { toast } from "@/components/ui/use-toast";
import { useWeb3 } from "@/hooks/useWeb3";
import { useConfig, useSwitchChain } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, zora } from "wagmi/chains";
import { cn } from "@/lib/utils";

interface WalletSectionProps {
  currentChain: number;
  setCurrentChain: (chainId: number) => void;
}

// Fixed type for chains array
const availableChains = [mainnet, polygon, optimism, arbitrum, base, zora];

const WalletSection: React.FC<WalletSectionProps> = ({ currentChain, setCurrentChain }) => {
  const { web3, isReady, address } = useWeb3();
  const [balance, setBalance] = useState<string>("0");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    fetchBalance();
  }, [web3, address, currentChain]);

  const fetchBalance = async () => {
    if (web3 && address) {
      try {
        setBalanceLoading(true);
        const balance = await web3.eth.getBalance(address);
        setBalance(web3.utils.fromWei(balance, 'ether'));
        setBalanceLoading(false);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("Error");
        setBalanceLoading(false);
      }
    }
  };

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = parseInt(networkId);
    setCurrentChain(chainId);
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunctionCard
        title="Wallet Balance"
        description="Check your current balance across different chains"
        icon={DollarSign}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Balance</p>
              <p className="text-2xl font-bold">
                {balanceLoading ? "Loading..." : `${parseFloat(balance).toFixed(4)} ETH`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBalance}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <Select
              value={currentChain?.toString()}
              onValueChange={handleNetworkSwitch}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                {availableChains.map((chainOption) => (
                  <SelectItem key={chainOption.id} value={chainOption.id.toString()}>
                    {chainOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FunctionCard>

      <FunctionCard
        title="Network Settings"
        description="Configure blockchain network settings"
        icon={Settings}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Network</Label>
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-3 h-3 rounded-full",
                currentChain === mainnet.id ? "bg-green-500" :
                currentChain === polygon.id ? "bg-purple-500" :
                currentChain === optimism.id ? "bg-red-500" :
                currentChain === arbitrum.id ? "bg-blue-500" :
                currentChain === base.id ? "bg-blue-600" :
                currentChain === zora.id ? "bg-pink-500" : "bg-gray-500"
              )} />
              <span>{availableChains.find(c => c.id === currentChain)?.name || "Unknown"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Switch Network</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableChains.map((chainOption) => (
                <Button
                  key={chainOption.id}
                  variant={currentChain === chainOption.id ? "default" : "outline"}
                  size="sm"
                  className={currentChain === chainOption.id ? "bg-primary" : ""}
                  onClick={() => handleNetworkSwitch(chainOption.id.toString())}
                >
                  {chainOption.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </FunctionCard>
    </div>
  );
};

export default WalletSection;


import React from "react";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import { DollarSign, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FunctionCard from "./FunctionCard";

interface WalletBalanceCardProps {
  currentChain: number | undefined;
  setCurrentChain: (chainId: number) => void;
}

const WalletBalanceCard = ({ currentChain, setCurrentChain }: WalletBalanceCardProps) => {
  const { address } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = parseInt(networkId);
    setCurrentChain(chainId);
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  return (
    <FunctionCard 
      title="Wallet Balance" 
      description="Check your current balance across different chains" 
      icon={DollarSign}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Balance</p>
            <p className="text-2xl font-bold">{balanceLoading ? "Loading..." : 
              `${balanceData?.formatted || "0"} ${balanceData?.symbol || ""}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchBalance()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>Network</Label>
          <Select 
            defaultValue={currentChain?.toString()} 
            onValueChange={handleNetworkSwitch}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              {chains.map((chainOption) => (
                <SelectItem key={chainOption.id} value={chainOption.id.toString()}>
                  {chainOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FunctionCard>
  );
};

export default WalletBalanceCard;

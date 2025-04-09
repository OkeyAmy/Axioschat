
import React from "react";
import { Settings } from "lucide-react";
import { useSwitchChain } from "wagmi";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FunctionCard from "./FunctionCard";

interface NetworkSettingsCardProps {
  currentChain: number | undefined;
  setCurrentChain: (chainId: number) => void;
}

const NetworkSettingsCard = ({ currentChain, setCurrentChain }: NetworkSettingsCardProps) => {
  const { chains, switchChain } = useSwitchChain();

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = parseInt(networkId);
    setCurrentChain(chainId);
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  return (
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
              currentChain === 1 ? "bg-green-500" :
              currentChain === 11155111 ? "bg-blue-500" :
              currentChain === 8453 ? "bg-blue-600" :
              currentChain === 137 ? "bg-purple-500" : "bg-gray-500"
            )} />
            <span>{chains.find(c => c.id === currentChain)?.name || "Unknown"}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Switch Network</Label>
          <div className="grid grid-cols-2 gap-2">
            {chains.map((chainOption) => (
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
  );
};

export default NetworkSettingsCard;


import React, { useState } from "react";
import { FileCode, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FunctionCard from "./FunctionCard";
import { isValidEthereumAddress, getAddressLink } from "./utils";

interface ContractExplorerCardProps {
  currentChain: number | undefined;
}

const ContractExplorerCard = ({ currentChain }: ContractExplorerCardProps) => {
  const [contractAddress, setContractAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [contractData, setContractData] = useState<any>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError("Address is required");
      return false;
    } 
    if (!isValidEthereumAddress(address)) {
      setAddressError("Invalid Ethereum address");
      return false;
    }
    setAddressError("");
    return true;
  };

  const searchContract = async () => {
    if (!validateAddress(contractAddress)) return;
    
    setIsContractLoading(true);
    
    setTimeout(() => {
      setContractData({
        address: contractAddress,
        name: "Sample Token",
        symbol: "SMPL",
        totalSupply: "1,000,000,000",
        decimals: 18,
        owner: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        functions: [
          { name: "transfer", inputs: ["address to", "uint256 amount"], outputs: ["bool"] },
          { name: "balanceOf", inputs: ["address account"], outputs: ["uint256"] },
          { name: "approve", inputs: ["address spender", "uint256 amount"], outputs: ["bool"] },
        ]
      });
      setIsContractLoading(false);
    }, 1500);
  };

  return (
    <FunctionCard 
      title="Contract Explorer" 
      description="Interact with deployed smart contracts" 
      icon={FileCode}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contract-address">Contract Address</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="contract-address" 
              placeholder="0x..." 
              value={contractAddress} 
              onChange={(e) => {
                setContractAddress(e.target.value);
                validateAddress(e.target.value);
              }} 
            />
            <Button 
              variant="outline" 
              disabled={!contractAddress || !!addressError || isContractLoading}
              onClick={searchContract}
            >
              {isContractLoading ? 
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : 
                "Search"
              }
            </Button>
          </div>
          {addressError && <p className="text-destructive text-xs">{addressError}</p>}
        </div>
        
        {contractData && (
          <div className="space-y-4 border rounded-md p-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <h3 className="font-medium">{contractData.name}</h3>
                <span className="text-sm">{contractData.symbol}</span>
              </div>
              <div className="text-xs text-muted-foreground break-all">
                {contractData.address}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Supply</p>
                <p>{contractData.totalSupply}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Decimals</p>
                <p>{contractData.decimals}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contract Functions</h4>
              <div className="space-y-2">
                {contractData.functions.map((fn: any, idx: number) => (
                  <div key={idx} className="border rounded p-2 text-xs">
                    <p className="font-medium">{fn.name}</p>
                    <p className="text-muted-foreground mt-1">
                      Inputs: {fn.inputs.join(", ")}
                    </p>
                    <p className="text-muted-foreground">
                      Outputs: {fn.outputs.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <a 
                href={getAddressLink(contractData.address, currentChain || 1)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-xs flex items-center"
              >
                View on Explorer <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>
    </FunctionCard>
  );
};

export default ContractExplorerCard;

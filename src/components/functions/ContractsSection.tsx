
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FunctionCard } from "./FunctionCard";
import { FileCode, ExternalLink } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import { getContractInfo, getContractUrl } from "@/utils/blockchain";
import { toast } from "@/components/ui/use-toast";

interface ContractsSectionProps {
  currentChain: number;
}

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const ContractsSection: React.FC<ContractsSectionProps> = ({ currentChain }) => {
  const { web3 } = useWeb3();
  const [contractAddress, setContractAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [contractData, setContractData] = useState<any>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [sourceCode, setSourceCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    
    function set(uint256 newValue) public {
        value = newValue;
    }
    
    function get() public view returns (uint256) {
        return value;
    }
}`);

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
    if (!web3) {
      toast({
        title: "Error",
        description: "Web3 not initialized",
        variant: "destructive",
      });
      return;
    }

    setIsContractLoading(true);

    try {
      const info = await getContractInfo(web3, contractAddress);
      setContractData(info);
    } catch (error: any) {
      console.error("Error fetching contract:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch contract information",
        variant: "destructive",
      });
    } finally {
      setIsContractLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
                disabled={!contractAddress || !!addressError || isContractLoading || !web3}
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
                  href={getContractUrl(currentChain, contractData.address)}
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

      <FunctionCard
        title="Contract Deployment"
        description="Deploy new smart contracts to the blockchain"
        icon={FileCode}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-source">Contract Source Code (Solidity)</Label>
            <Textarea
              id="contract-source"
              placeholder="// SPDX-License-Identifier: MIT..."
              className="min-h-[200px] font-mono text-xs"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Compiler Settings</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="solidity-version" className="text-xs">Solidity Version</Label>
                <Select defaultValue="0.8.20">
                  <SelectTrigger id="solidity-version">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8.20">0.8.20</SelectItem>
                    <SelectItem value="0.8.19">0.8.19</SelectItem>
                    <SelectItem value="0.8.17">0.8.17</SelectItem>
                    <SelectItem value="0.8.0">0.8.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="optimization" className="text-xs">Optimization</Label>
                <Select defaultValue="enabled">
                  <SelectTrigger id="optimization">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              toast({
                title: "Contract Deployment",
                description: "Contract deployment feature requires a compiler. Please visit Remix IDE for full deployment functionality.",
              });
            }}
          >
            Compile & Deploy
          </Button>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              Note: Contract deployment requires gas fees. Make sure you have enough ETH in your wallet.
            </p>
          </div>
        </div>
      </FunctionCard>
    </div>
  );
};

export default ContractsSection;

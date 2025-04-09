
import React from "react";
import { FileCode } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import FunctionCard from "./FunctionCard";

interface ContractDeploymentCardProps {
  currentChain: number | undefined;
  chains: any[];
}

const ContractDeploymentCard = ({ currentChain, chains }: ContractDeploymentCardProps) => {
  return (
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
            placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    
    function set(uint256 newValue) public {
        value = newValue;
    }
    
    function get() public view returns (uint256) {
        return value;
    }
}"
            className="min-h-[200px] font-mono text-xs"
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
        >
          Compile & Deploy
        </Button>
        
        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs text-muted-foreground">
            Note: Contract deployment requires gas fees. Make sure you have enough {chains.find(c => c.id === currentChain)?.name} ETH in your wallet.
          </p>
        </div>
      </div>
    </FunctionCard>
  );
};

export default ContractDeploymentCard;

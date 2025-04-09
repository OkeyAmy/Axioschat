
import React, { useState } from "react";
import { Repeat, ArrowUpDown, ExternalLink, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import FunctionCard from "./FunctionCard";
import { TransactionStatus, UNISWAP_ROUTER_ADDRESSES, getTxLink } from "./utils";

interface UniswapCardProps {
  currentChain: number | undefined;
  addTransaction: (tx: any) => void;
}

const UniswapCard = ({ currentChain, addTransaction }: UniswapCardProps) => {
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("eth");
  const [toToken, setToToken] = useState("usdc");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");

  const handleSwap = async () => {
    try {
      setTxStatus("pending");
      toast({
        title: "Swap Initiated",
        description: `Preparing to swap ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
      });
      
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        setTxStatus("success");
        
        const newTx = {
          hash: fakeHash,
          type: "Swap",
          value: `${swapAmount} ${fromToken.toUpperCase()} → ${toToken.toUpperCase()}`,
          to: UNISWAP_ROUTER_ADDRESSES[currentChain || 1],
          timestamp: new Date().toLocaleString(),
          status: "success" as TransactionStatus,
        };
        
        addTransaction(newTx);
        
        toast({
          title: "Swap Executed",
          description: `Successfully swapped ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <FunctionCard 
      title="Uniswap Token Swap" 
      description="Swap tokens using Uniswap protocol" 
      icon={Repeat}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>From</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder="0.0" 
              value={swapAmount} 
              onChange={(e) => setSwapAmount(e.target.value)} 
            />
            <Select 
              defaultValue={fromToken}
              onValueChange={setFromToken}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="dai">DAI</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="wbtc">WBTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-center my-2">
          <Button variant="ghost" size="icon" onClick={() => {
            const temp = fromToken;
            setFromToken(toToken);
            setToToken(temp);
          }}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>To</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder="0.0" 
              value={swapAmount ? (Number(swapAmount) * 1500).toString() : ""} 
              disabled 
            />
            <Select 
              defaultValue={toToken}
              onValueChange={setToToken}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="dai">DAI</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="wbtc">WBTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Exchange Rate:</span>
            <span>1 {fromToken.toUpperCase()} ≈ 1500 {toToken.toUpperCase()}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Router Address:</span>
            <span className="truncate max-w-[180px]">
              {UNISWAP_ROUTER_ADDRESSES[currentChain || 1]?.substring(0, 6)}...
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Slippage Tolerance:</span>
            <span>0.5%</span>
          </div>
        </div>
        
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!swapAmount || fromToken === toToken || txStatus === "pending"}
          onClick={handleSwap}
        >
          {txStatus === "pending" ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Processing Swap...</span>
            </div>
          ) : "Swap Tokens"}
        </Button>
        
        {transactionHash && txStatus === "success" && (
          <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                <p className="text-xs font-mono break-all">{transactionHash}</p>
              </div>
              <a 
                href={getTxLink(transactionHash, currentChain || 1)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-xs flex items-center"
              >
                View <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-2">
              <CheckCircle2 size={12} className="mr-1" />
              Swap successful
            </div>
          </div>
        )}
      </div>
    </FunctionCard>
  );
};

export default UniswapCard;

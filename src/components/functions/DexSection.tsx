
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunctionCard } from "./FunctionCard";
import { Repeat, ArrowUpDown, ExternalLink, CheckCircle2, Share2 } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import { getTxUrl, swapTokensOnUniswap } from "@/utils/blockchain";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mainnet, polygon, optimism, arbitrum, base, zora } from "wagmi/chains";

interface DexSectionProps {
  currentChain: number;
}

type TransactionStatus = "pending" | "success" | "failed" | "none";

// Uniswap router addresses for each chain
const UNISWAP_ROUTER_ADDRESSES: Record<number, string> = {
  [mainnet.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  [polygon.id]: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
  [optimism.id]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3
  [arbitrum.id]: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap
  [base.id]: "0x2626664c2603336E57B271c5C0b26F421741e481", // BaseSwap
  [zora.id]: "0x5F52B9d1C0853DA6Facebook30574f1F801c34B729c", // ZoraSwap
};

// Token data with addresses per chain
const tokenData = {
  eth: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  usdc: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  dai: { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  usdt: { name: "Tether", symbol: "USDT", decimals: 6 },
  wbtc: { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
};

const tokenAddresses: Record<number, Record<string, string>> = {
  [mainnet.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    wbtc: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  [polygon.id]: {
    eth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    dai: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    wbtc: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  },
  // Add other chains as needed
};

// Default to mainnet tokens if chain not supported
const getTokenAddress = (chainId: number, token: string): string => {
  return tokenAddresses[chainId]?.[token] || tokenAddresses[mainnet.id][token];
};

const DexSection: React.FC<DexSectionProps> = ({ currentChain }) => {
  const { web3, address } = useWeb3();
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("eth");
  const [toToken, setToToken] = useState("usdc");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");
  const [slippageTolerance, setSlippageTolerance] = useState("0.5");
  
  // Calculate estimated output
  const calculateEstimatedOutput = (): string => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return "0";
    
    // This would normally come from a price oracle or AMM calculation
    // Using fixed rates for demo purposes
    const rates: Record<string, Record<string, number>> = {
      eth: { usdc: 1500, dai: 1500, usdt: 1500, wbtc: 0.06 },
      usdc: { eth: 0.00066, dai: 1, usdt: 1, wbtc: 0.00004 },
      dai: { eth: 0.00066, usdc: 1, usdt: 1, wbtc: 0.00004 },
      usdt: { eth: 0.00066, usdc: 1, dai: 1, wbtc: 0.00004 },
      wbtc: { eth: 16.7, usdc: 25000, dai: 25000, usdt: 25000 }
    };
    
    if (fromToken === toToken) return swapAmount;
    
    const rate = rates[fromToken]?.[toToken] || 0;
    return (parseFloat(swapAmount) * rate).toString();
  };

  const handleSwap = async () => {
    if (!web3 || !address) {
      toast({
        title: "Error",
        description: "Web3 not initialized or wallet not connected",
        variant: "destructive",
      });
      return;
    }

    try {
      setTxStatus("pending");
      toast({
        title: "Swap Initiated",
        description: `Preparing to swap ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
      });

      const routerAddress = UNISWAP_ROUTER_ADDRESSES[currentChain] || UNISWAP_ROUTER_ADDRESSES[mainnet.id];
      const isFromETH = fromToken === "eth";
      const isToETH = toToken === "eth";
      
      // Create token path for the swap
      const path = [];
      if (isFromETH) {
        path.push(getTokenAddress(currentChain, "eth")); // Using WETH address
      } else {
        path.push(getTokenAddress(currentChain, fromToken));
      }
      
      if (isToETH) {
        path.push(getTokenAddress(currentChain, "eth")); // Using WETH address
      } else {
        path.push(getTokenAddress(currentChain, toToken));
      }
      
      // Calculate minimum amount out with slippage
      const amountOut = calculateEstimatedOutput();
      const slippagePercent = parseFloat(slippageTolerance) / 100;
      const minAmountOut = (parseFloat(amountOut) * (1 - slippagePercent)).toString();
      
      // Execute the swap
      const txHash = await swapTokensOnUniswap(
        web3,
        address,
        routerAddress,
        swapAmount,
        web3.utils.toWei(minAmountOut, 'ether'), // Convert to wei
        path,
        30, // 30 minute deadline
        isFromETH
      );

      setTransactionHash(txHash);
      setTxStatus("success");

      toast({
        title: "Swap Executed",
        description: `Successfully swapped ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Swap error:", error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: error.message || "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
                value={fromToken}
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
            <Label>To (Estimated)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="0.0"
                value={calculateEstimatedOutput()}
                disabled
              />
              <Select
                defaultValue={toToken}
                value={toToken}
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

          <div className="space-y-2">
            <Label>Slippage Tolerance (%)</Label>
            <Input
              type="number"
              placeholder="0.5"
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(e.target.value)}
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span>1 {fromToken.toUpperCase()} ≈ {
                fromToken === toToken ? '1' : 
                calculateEstimatedOutput() && swapAmount ? 
                (parseFloat(calculateEstimatedOutput()) / parseFloat(swapAmount)).toFixed(4) : 
                '0'
              } {toToken.toUpperCase()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Router Address:</span>
              <span className="truncate max-w-[180px]">
                {UNISWAP_ROUTER_ADDRESSES[currentChain] || UNISWAP_ROUTER_ADDRESSES[mainnet.id]?.substring(0, 6)}...
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Slippage Tolerance:</span>
              <span>{slippageTolerance}%</span>
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!swapAmount || fromToken === toToken || txStatus === "pending" || !web3 || !address}
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
                  href={getTxUrl(currentChain, transactionHash)}
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

      <FunctionCard
        title="Liquidity Pools"
        description="Provide or remove liquidity from Uniswap pools"
        icon={Share2}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Active Liquidity Positions</h3>
            <div className="bg-muted/50 p-4 rounded-md text-center">
              <p className="text-muted-foreground">You have no active liquidity positions</p>
              <Button variant="outline" size="sm" className="mt-2">
                Create New Position
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Popular Liquidity Pools</h3>
            <div className="grid gap-2">
              {[
                { pair: "ETH/USDC", apr: "4.2%", tvl: "$1.2B" },
                { pair: "ETH/DAI", apr: "3.8%", tvl: "$890M" },
                { pair: "WBTC/ETH", apr: "5.1%", tvl: "$620M" }
              ].map((pool) => (
                <div key={pool.pair} className="flex items-center justify-between p-3 bg-background border rounded-md">
                  <div>
                    <p className="font-medium">{pool.pair}</p>
                    <p className="text-xs text-muted-foreground">TVL: {pool.tvl}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-medium">{pool.apr} APR</p>
                    <Button variant="outline" size="sm" className="mt-1">Add</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FunctionCard>
    </div>
  );
};

export default DexSection;

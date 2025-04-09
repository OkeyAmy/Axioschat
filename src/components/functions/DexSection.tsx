
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, DollarSign, RefreshCw, RotateCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { swapTokens, addLiquidity, getPairInfo, getTokenAllowance, approveToken } from '@/utils/blockchain';
import useWeb3 from '@/hooks/useWeb3';
import useTransactionQueue from '@/hooks/useTransactionQueue';

// Common token addresses for various networks
const commonTokens: Record<string, Record<string, { symbol: string, address: string }>> = {
  "1": { // Ethereum Mainnet
    "ETH": { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    "WETH": { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    "USDC": { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    "USDT": { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    "DAI": { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  },
  "11155111": { // Sepolia Testnet
    "ETH": { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    "WETH": { symbol: "WETH", address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9" },
    "USDC": { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" },
    "DAI": { symbol: "DAI", address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" },
  },
  "137": { // Polygon
    "MATIC": { symbol: "MATIC", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    "WMATIC": { symbol: "WMATIC", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" },
    "USDC": { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    "WETH": { symbol: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" },
  },
};

const DexSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3();
  const { addTransaction } = useTransactionQueue();
  
  const [fromToken, setFromToken] = useState<string>(chainId === 137 ? "MATIC" : "ETH");
  const [toToken, setToToken] = useState<string>("USDC");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.5");
  const [deadline, setDeadline] = useState<string>("20"); // minutes
  
  const [tokenAAmount, setTokenAAmount] = useState<string>("");
  const [tokenBAmount, setTokenBAmount] = useState<string>("");
  const [tokenA, setTokenA] = useState<string>(chainId === 137 ? "WMATIC" : "WETH");
  const [tokenB, setTokenB] = useState<string>("USDC");
  
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState<boolean>(false);
  const [isLoadingPair, setIsLoadingPair] = useState<boolean>(false);
  const [pairInfo, setPairInfo] = useState<any>(null);
  
  // Get available tokens based on current chain
  const availableTokens = chainId && commonTokens[chainId.toString()]
    ? Object.values(commonTokens[chainId.toString()])
    : Object.values(commonTokens["1"]); // Default to Ethereum tokens
  
  // Reset selected tokens when chain changes
  useEffect(() => {
    if (chainId) {
      // Set default tokens based on chain
      if (chainId === 137) {
        setFromToken("MATIC");
        setTokenA("WMATIC");
      } else {
        setFromToken("ETH");
        setTokenA("WETH");
      }
      setToToken("USDC");
      setTokenB("USDC");
      setPairInfo(null);
    }
  }, [chainId]);
  
  const fetchPairInfo = async () => {
    if (!web3 || !isReady || !address) return;
    
    const chainKey = chainId?.toString() || "1";
    if (!commonTokens[chainKey]) return;
    
    const tokenAAddress = commonTokens[chainKey][tokenA]?.address;
    const tokenBAddress = commonTokens[chainKey][tokenB]?.address;
    
    if (!tokenAAddress || !tokenBAddress) return;
    
    setIsLoadingPair(true);
    
    try {
      const result = await getPairInfo(
        web3,
        address,
        tokenAAddress,
        tokenBAddress,
        String(chainId)
      );
      
      setPairInfo(result);
      
      toast({
        title: "Pair Info Loaded",
        description: `LP Token Address: ${result.pairAddress.slice(0, 6)}...${result.pairAddress.slice(-4)}`,
      });
    } catch (error) {
      console.error("Error fetching pair info:", error);
      
      toast({
        title: "Failed to Load Pair",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      setPairInfo(null);
    } finally {
      setIsLoadingPair(false);
    }
  };
  
  const checkAllowanceAndApprove = async (tokenSymbol: string, tokenAmount: string, spender: string): Promise<boolean> => {
    if (!web3 || !isReady || !address || !chainId) return false;
    
    const chainKey = chainId.toString();
    if (!commonTokens[chainKey]) return false;
    
    const tokenAddress = commonTokens[chainKey][tokenSymbol]?.address;
    if (!tokenAddress || tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      // Native token (ETH/MATIC) doesn't need approval
      return true;
    }
    
    try {
      const allowance = await getTokenAllowance(
        web3,
        address,
        tokenAddress,
        spender
      );
      
      const requiredAmount = web3.utils.toWei(tokenAmount, 'ether');
      
      if (BigInt(allowance) >= BigInt(requiredAmount)) {
        return true;
      }
      
      // Need to approve
      const receipt = await approveToken(
        web3,
        address,
        tokenAddress,
        spender,
        requiredAmount
      );
      
      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash,
          from: address,
          to: tokenAddress,
          value: "0",
          chainId: String(chainId),
          type: "approve",
          status: "confirmed",
          method: "approve",
          timestamp: Date.now()
        });
        
        toast({
          title: "Token Approved",
          description: `Successfully approved ${tokenSymbol} for trading`,
        });
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error approving token:", error);
      
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve token for trading",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const handleSwap = async () => {
    if (!web3 || !isReady || !address || !chainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to swap tokens.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSwapping(true);
    
    try {
      const chainKey = chainId.toString();
      if (!commonTokens[chainKey]) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }
      
      const fromTokenData = commonTokens[chainKey][fromToken];
      const toTokenData = commonTokens[chainKey][toToken];
      
      if (!fromTokenData || !toTokenData) {
        throw new Error("Invalid token selection");
      }
      
      // For DEX swaps, we need to approve router to spend tokens first (except native token)
      if (fromTokenData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Assuming router address is consistent for each chain or we have a map somewhere
        const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 router for Ethereum
        
        const approved = await checkAllowanceAndApprove(fromToken, fromAmount, routerAddress);
        if (!approved) {
          throw new Error("Failed to approve token for swapping");
        }
      }
      
      const receipt = await swapTokens(
        web3,
        address,
        fromTokenData.address,
        toTokenData.address,
        web3.utils.toWei(fromAmount, 'ether'),
        slippage,
        deadline
      );
      
      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash,
          from: address,
          to: receipt.to || "",
          value: fromTokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? web3.utils.toWei(fromAmount, 'ether') : "0",
          chainId: String(chainId),
          type: "swap",
          status: "confirmed",
          method: "swap",
          timestamp: Date.now()
        });
        
        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken} to ${toToken}`,
        });
        
        // Reset form
        setFromAmount("");
        setToAmount("");
      }
    } catch (error) {
      console.error("Error swapping tokens:", error);
      
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to swap tokens",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };
  
  const handleAddLiquidity = async () => {
    if (!web3 || !isReady || !address || !chainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add liquidity.",
        variant: "destructive",
      });
      return;
    }
    
    if (!tokenAAmount || !tokenBAmount || parseFloat(tokenAAmount) <= 0 || parseFloat(tokenBAmount) <= 0) {
      toast({
        title: "Invalid amounts",
        description: "Please enter valid amounts for both tokens.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingLiquidity(true);
    
    try {
      const chainKey = chainId.toString();
      if (!commonTokens[chainKey]) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }
      
      const tokenAData = commonTokens[chainKey][tokenA];
      const tokenBData = commonTokens[chainKey][tokenB];
      
      if (!tokenAData || !tokenBData) {
        throw new Error("Invalid token selection");
      }
      
      // For adding liquidity, we need to approve router to spend tokens
      const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 router for Ethereum
      
      // Approve token A if not native token
      if (tokenAData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const approvedA = await checkAllowanceAndApprove(tokenA, tokenAAmount, routerAddress);
        if (!approvedA) {
          throw new Error(`Failed to approve ${tokenA} for adding liquidity`);
        }
      }
      
      // Approve token B if not native token
      if (tokenBData.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        const approvedB = await checkAllowanceAndApprove(tokenB, tokenBAmount, routerAddress);
        if (!approvedB) {
          throw new Error(`Failed to approve ${tokenB} for adding liquidity`);
        }
      }
      
      const receipt = await addLiquidity(
        web3,
        address,
        tokenAData.address,
        tokenBData.address,
        web3.utils.toWei(tokenAAmount, 'ether'),
        web3.utils.toWei(tokenBAmount, 'ether'),
        slippage,
        deadline
      );
      
      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash,
          from: address,
          to: receipt.to || "",
          value: (tokenAData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" || tokenBData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") 
            ? (tokenAData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? web3.utils.toWei(tokenAAmount, 'ether') : web3.utils.toWei(tokenBAmount, 'ether'))
            : "0",
          chainId: String(chainId),
          type: "liquidity",
          status: "confirmed",
          method: "addLiquidity",
          timestamp: Date.now()
        });
        
        toast({
          title: "Liquidity Added",
          description: `Successfully added ${tokenAAmount} ${tokenA} and ${tokenBAmount} ${tokenB} to the pool`,
        });
        
        // Refresh pair info
        fetchPairInfo();
        
        // Reset form
        setTokenAAmount("");
        setTokenBAmount("");
      }
    } catch (error) {
      console.error("Error adding liquidity:", error);
      
      toast({
        title: "Failed to Add Liquidity",
        description: error instanceof Error ? error.message : "Failed to add liquidity to the pool",
        variant: "destructive",
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };
  
  const switchTokens = () => {
    const tempFromToken = fromToken;
    const tempFromAmount = fromAmount;
    
    setFromToken(toToken);
    setFromAmount(toAmount);
    
    setToToken(tempFromToken);
    setToAmount(tempFromAmount);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Decentralized Exchange
        </CardTitle>
        <CardDescription>
          Swap tokens and provide liquidity to pools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="swap">
          <TabsList className="grid grid-cols-2 mb-4 w-full sm:w-[300px]">
            <TabsTrigger value="swap">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="liquidity">
              <DollarSign className="h-4 w-4 mr-2" />
              Liquidity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="swap" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <div className="flex gap-2">
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem 
                          key={token.symbol} 
                          value={token.symbol}
                          disabled={token.symbol === toToken}
                        >
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={switchTokens}
                  className="rounded-full h-8 w-8"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex gap-2">
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem 
                          key={token.symbol} 
                          value={token.symbol}
                          disabled={token.symbol === fromToken}
                        >
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.0"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slippage Tolerance (%)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Deadline (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleSwap}
                disabled={!isReady || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
              >
                {isSwapping ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Swapping...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Swap {fromToken} for {toToken}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="liquidity" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Token A</Label>
                  <Select value={tokenA} onValueChange={setTokenA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem 
                          key={token.symbol} 
                          value={token.symbol}
                          disabled={token.symbol === tokenB}
                        >
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Token B</Label>
                  <Select value={tokenB} onValueChange={setTokenB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem 
                          key={token.symbol} 
                          value={token.symbol}
                          disabled={token.symbol === tokenA}
                        >
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={fetchPairInfo}
                disabled={!isReady || isLoadingPair || tokenA === tokenB}
              >
                {isLoadingPair ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Pair Information
                  </>
                )}
              </Button>
              
              {pairInfo && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pair Address:</span>
                    <span className="text-sm font-medium">{pairInfo.pairAddress.slice(0, 6)}...{pairInfo.pairAddress.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Liquidity:</span>
                    <span className="text-sm font-medium">${parseFloat(pairInfo.reserveUSD || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{tokenA} Balance:</span>
                    <span className="text-sm font-medium">{parseFloat(pairInfo.reserve0 || "0").toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{tokenB} Balance:</span>
                    <span className="text-sm font-medium">{parseFloat(pairInfo.reserve1 || "0").toFixed(6)}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>{tokenA} Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={tokenAAmount}
                  onChange={(e) => setTokenAAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{tokenB} Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={tokenBAmount}
                  onChange={(e) => setTokenBAmount(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slippage Tolerance (%)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Deadline (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleAddLiquidity}
                disabled={!isReady || isAddingLiquidity || !tokenAAmount || !tokenBAmount || parseFloat(tokenAAmount) <= 0 || parseFloat(tokenBAmount) <= 0}
              >
                {isAddingLiquidity ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Adding Liquidity...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Liquidity
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Note: DEX functionality requires sufficient balance and approval for token usage.</p>
      </CardFooter>
    </Card>
  );
};

export default DexSection;

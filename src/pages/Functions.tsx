
import { useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";
import { useConfig, useSwitchChain } from "wagmi";
import { mainnet, sepolia, base, polygon } from "wagmi/chains";
import { parseEther } from "viem";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { ArrowUpDown, RefreshCw, Wallet, Zap, Settings, DollarSign, Share2, Key, Lock, FileCode, Repeat, ArrowLeftRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import WalletRequired from "@/components/WalletRequired";
import { cn } from "@/lib/utils";

const Functions = () => {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { chains, switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const [currentChain, setCurrentChain] = useState<number | undefined>(mainnet.id);

  const [transferAmount, setTransferAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("balance");
  const [transactionHash, setTransactionHash] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("eth");
  const [toToken, setToToken] = useState("usdc");

  // Balance query
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const handleTransfer = async () => {
    try {
      toast({
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ETH to ${transferAddress}`,
      });
      
      // Simulate transaction success (in a real app, this would call the wallet SDK)
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${transferAmount} ETH to ${transferAddress}`,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwap = async () => {
    try {
      toast({
        title: "Swap Initiated",
        description: `Preparing to swap ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
      });
      
      // Simulate swap success (in a real app, this would call Uniswap SDK)
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        
        toast({
          title: "Swap Executed",
          description: `Successfully swapped ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = parseInt(networkId);
    setCurrentChain(chainId);
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  const FunctionCard = ({ title, description, icon: Icon, children }: { 
    title: string; 
    description: string; 
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <Card className="w-full shadow-sm transition-all hover:shadow-md border border-border/50 animate-in fade-in-50 slide-in-from-bottom-5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
            Web3 Functions
          </h1>
          <p className="text-muted-foreground">
            Interact with blockchain networks and smart contracts directly from your wallet
          </p>
        </div>
        
        {!isConnected ? (
          <WalletRequired />
        ) : (
          <div className="grid gap-6">
            <Tabs defaultValue="wallet" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="wallet" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Transactions</span>
                </TabsTrigger>
                <TabsTrigger value="dex" className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>DEX</span>
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <span>Contracts</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="wallet" className="space-y-6">
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
                  
                  <FunctionCard 
                    title="Send Tokens" 
                    description="Transfer tokens to another address" 
                    icon={Share2}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input 
                          id="recipient" 
                          placeholder="0x..." 
                          value={transferAddress} 
                          onChange={(e) => setTransferAddress(e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="amount" 
                            type="number" 
                            placeholder="0.0" 
                            value={transferAmount} 
                            onChange={(e) => setTransferAmount(e.target.value)} 
                          />
                          <Select defaultValue="eth">
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Token" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eth">ETH</SelectItem>
                              <SelectItem value="usdc">USDC</SelectItem>
                              <SelectItem value="dai">DAI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!transferAddress || !transferAmount}
                        onClick={handleTransfer}
                      >
                        Send Transaction
                      </Button>
                      
                      {transactionHash && (
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
                          <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                          <p className="text-xs font-mono break-all">{transactionHash}</p>
                        </div>
                      )}
                    </div>
                  </FunctionCard>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FunctionCard 
                    title="Transaction History" 
                    description="View your recent transactions" 
                    icon={RefreshCw}
                  >
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Transaction history will appear here</p>
                      <Button variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
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
                            currentChain === sepolia.id ? "bg-blue-500" :
                            currentChain === base.id ? "bg-blue-600" :
                            currentChain === polygon.id ? "bg-purple-500" : "bg-gray-500"
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
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="min-h-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Send, sign, and track blockchain transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Transaction Features Coming Soon</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mt-2">
                        Advanced transaction features will be available in the next update. Stay tuned!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dex" className="min-h-[400px]">
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
                          <span>Slippage Tolerance:</span>
                          <span>0.5%</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!swapAmount || fromToken === toToken}
                        onClick={handleSwap}
                      >
                        Swap Tokens
                      </Button>
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
              </TabsContent>
              
              <TabsContent value="contracts" className="min-h-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Smart Contracts</CardTitle>
                    <CardDescription>Interact with deployed smart contracts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Contract Interactions Coming Soon</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mt-2">
                        Smart contract interaction features will be available in the next update. Stay tuned!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Functions;


import { useState, useEffect } from "react";
import { useAccount, useBalance, useConnect, useDisconnect, useConfig, useSwitchChain } from "wagmi";
import { mainnet, sepolia, base, polygon } from "wagmi/chains";
import { parseEther, formatEther } from "viem";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { ArrowUpDown, RefreshCw, Wallet, Zap, Settings, DollarSign, Share2, Key, Lock, FileCode, Repeat, ArrowLeftRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import WalletRequired from "@/components/WalletRequired";
import { cn } from "@/lib/utils";

// Transaction status
type TransactionStatus = "pending" | "success" | "failed" | "none";

// Simple function to validate Ethereum address
const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Function to get explorer URL based on chainId
const getExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
      return "https://etherscan.io";
    case sepolia.id:
      return "https://sepolia.etherscan.io";
    case base.id:
      return "https://basescan.org";
    case polygon.id:
      return "https://polygonscan.com";
    default:
      return "https://etherscan.io";
  }
};

// Sample token data for demonstration
const tokenData = {
  eth: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  usdc: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  dai: { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  usdt: { name: "Tether", symbol: "USDT", decimals: 6 },
  wbtc: { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
};

// Sample token addresses by chain
const tokenAddresses: Record<number, Record<string, string>> = {
  [mainnet.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    wbtc: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  [sepolia.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    dai: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
    usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    wbtc: "0xCA063A2AB07491eE991dCecb456D1265f842b568",
  },
  [base.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    dai: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    usdt: "0x4260e52248BEAf8cEC68f2910F1E41c4428dBc17",
    wbtc: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
  },
  [polygon.id]: {
    eth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    dai: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    wbtc: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  },
};

// Recent transactions sample data (for demo)
const generateSampleTxs = (chainId: number, address: string | undefined) => {
  if (!address) return [];
  
  const explorerUrl = getExplorerUrl(chainId);
  
  return [
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Transfer",
      value: "0.1 ETH",
      to: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Swap",
      value: "100 USDC → 0.05 ETH",
      to: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - 7200000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Approve",
      value: "Unlimited USDC",
      to: tokenAddresses[chainId]?.usdc || "",
      timestamp: new Date(Date.now() - 86400000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
  ];
};

// Simple Uniswap V2 ABI (excerpt)
const UNISWAP_ROUTER_ABI = [
  {
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForETH",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Uniswap Router addresses by chain
const UNISWAP_ROUTER_ADDRESSES: Record<number, string> = {
  [mainnet.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  [sepolia.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // For demo - same as mainnet
  [base.id]: "0x2626664c2603336E57B271c5C0b26F421741e481", // Baseswap
  [polygon.id]: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
};

const Functions = () => {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { chains, switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const [currentChain, setCurrentChain] = useState<number | undefined>(mainnet.id);

  // Transaction form states
  const [transferAmount, setTransferAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("eth");
  const [toToken, setToToken] = useState("usdc");
  
  // Contract search state
  const [contractAddress, setContractAddress] = useState("");
  const [contractData, setContractData] = useState<any>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  
  // Transaction history
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Balance query
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
  });

  // Update transactions when chain or address changes
  useEffect(() => {
    if (isConnected && address && currentChain) {
      loadRecentTransactions();
    }
  }, [currentChain, address, isConnected]);

  // Load recent transactions from the blockchain
  const loadRecentTransactions = () => {
    setIsLoadingTxs(true);
    
    // In a real app, this would fetch from chain explorer API
    // For demo, we'll use sample data after a timeout
    setTimeout(() => {
      setRecentTxs(generateSampleTxs(currentChain || mainnet.id, address));
      setIsLoadingTxs(false);
    }, 1000);
  };

  // Validate Ethereum address
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

  // Handle send transaction
  const handleTransfer = async () => {
    if (!validateAddress(transferAddress)) return;
    
    try {
      setTxStatus("pending");
      toast({
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ETH to ${transferAddress}`,
      });
      
      // Simulate transaction success (in a real app, this would call the wallet SDK)
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        setTxStatus("success");
        
        // Add to recent transactions
        setRecentTxs([{
          hash: fakeHash,
          type: "Transfer",
          value: `${transferAmount} ETH`,
          to: transferAddress,
          timestamp: new Date().toLocaleString(),
          status: "success" as TransactionStatus,
        }, ...recentTxs]);
        
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${transferAmount} ETH to ${transferAddress}`,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: "Failed to send transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle token swap
  const handleSwap = async () => {
    try {
      setTxStatus("pending");
      toast({
        title: "Swap Initiated",
        description: `Preparing to swap ${swapAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
      });
      
      // In a real implementation, this would create the actual transaction
      // with proper Uniswap contract calls
      
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        setTxStatus("success");
        
        // Add to recent transactions
        setRecentTxs([{
          hash: fakeHash,
          type: "Swap",
          value: `${swapAmount} ${fromToken.toUpperCase()} → ${toToken.toUpperCase()}`,
          to: UNISWAP_ROUTER_ADDRESSES[currentChain || mainnet.id],
          timestamp: new Date().toLocaleString(),
          status: "success" as TransactionStatus,
        }, ...recentTxs]);
        
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

  // Handle contract search
  const searchContract = async () => {
    if (!validateAddress(contractAddress)) return;
    
    setIsContractLoading(true);
    
    // In a real app, this would query the blockchain
    setTimeout(() => {
      // Simulate contract data for demo
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

  // Handle network switch
  const handleNetworkSwitch = (networkId: string) => {
    const chainId = parseInt(networkId);
    setCurrentChain(chainId);
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  // Generate transaction link
  const getTxLink = (hash: string) => {
    const explorerUrl = getExplorerUrl(currentChain || mainnet.id);
    return `${explorerUrl}/tx/${hash}`;
  };

  // Generate address link
  const getAddressLink = (address: string) => {
    const explorerUrl = getExplorerUrl(currentChain || mainnet.id);
    return `${explorerUrl}/address/${address}`;
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
                          onChange={(e) => {
                            setTransferAddress(e.target.value);
                            validateAddress(e.target.value);
                          }} 
                        />
                        {addressError && <p className="text-destructive text-xs">{addressError}</p>}
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
                        disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending"}
                        onClick={handleTransfer}
                      >
                        {txStatus === "pending" ? (
                          <div className="flex items-center">
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            <span>Processing...</span>
                          </div>
                        ) : "Send Transaction"}
                      </Button>
                      
                      {transactionHash && txStatus === "success" && (
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                              <p className="text-xs font-mono break-all">{transactionHash}</p>
                            </div>
                            <a 
                              href={getTxLink(transactionHash)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-xs flex items-center"
                            >
                              View <ExternalLink size={12} className="ml-1" />
                            </a>
                          </div>
                          <div className="flex items-center text-xs text-emerald-600 mt-2">
                            <CheckCircle2 size={12} className="mr-1" />
                            Transaction successful
                          </div>
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
                    {isLoadingTxs ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : recentTxs.length > 0 ? (
                      <div className="space-y-3">
                        {recentTxs.map((tx, index) => (
                          <div key={index} className="border rounded-md p-3 text-sm">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium">{tx.type}</div>
                              <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Value:</span>
                                <span>{tx.value}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">To:</span>
                                <a 
                                  href={getAddressLink(tx.to)} 
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  className="text-primary hover:underline truncate max-w-[180px]"
                                >
                                  {tx.to.substring(0, 8)}...{tx.to.substring(tx.to.length - 6)}
                                </a>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={cn(
                                  "flex items-center",
                                  tx.status === "success" ? "text-emerald-600" : 
                                  tx.status === "pending" ? "text-amber-500" : "text-destructive"
                                )}>
                                  {tx.status === "success" && <CheckCircle2 size={12} className="mr-1" />}
                                  {tx.status === "success" ? "Success" : 
                                   tx.status === "pending" ? "Pending" : "Failed"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t flex justify-between items-center">
                              <div className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                                {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                              </div>
                              <a 
                                href={getTxLink(tx.hash)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 text-xs flex items-center"
                              >
                                View on Explorer <ExternalLink size={12} className="ml-1" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent transactions found</p>
                        <Button variant="outline" className="mt-4" onClick={loadRecentTransactions}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
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
              
              <TabsContent value="transactions" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FunctionCard 
                    title="Recent Transactions" 
                    description="Track and verify your recent transactions" 
                    icon={ArrowUpDown}
                  >
                    {isLoadingTxs ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : recentTxs.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {recentTxs.map((tx, index) => (
                          <div key={index} className="border rounded-md p-3 text-sm">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium">{tx.type}</div>
                              <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Value:</span>
                                <span>{tx.value}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">To:</span>
                                <a 
                                  href={getAddressLink(tx.to)} 
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  className="text-primary hover:underline truncate max-w-[180px]"
                                >
                                  {tx.to.substring(0, 8)}...{tx.to.substring(tx.to.length - 6)}
                                </a>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={cn(
                                  "flex items-center",
                                  tx.status === "success" ? "text-emerald-600" : 
                                  tx.status === "pending" ? "text-amber-500" : "text-destructive"
                                )}>
                                  {tx.status === "success" && <CheckCircle2 size={12} className="mr-1" />}
                                  {tx.status === "success" ? "Success" : 
                                   tx.status === "pending" ? "Pending" : "Failed"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t flex justify-between items-center">
                              <div className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                                {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                              </div>
                              <a 
                                href={getTxLink(tx.hash)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 text-xs flex items-center"
                              >
                                View on Explorer <ExternalLink size={12} className="ml-1" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent transactions found</p>
                        <Button variant="outline" className="mt-4" onClick={loadRecentTransactions}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </FunctionCard>
                  
                  <FunctionCard 
                    title="Transaction Builder" 
                    description="Customize and send transactions" 
                    icon={Share2}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tx-to">Recipient Address</Label>
                        <Input 
                          id="tx-to" 
                          placeholder="0x..." 
                          value={transferAddress} 
                          onChange={(e) => {
                            setTransferAddress(e.target.value);
                            validateAddress(e.target.value);
                          }} 
                        />
                        {addressError && <p className="text-destructive text-xs">{addressError}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tx-value">Value (ETH)</Label>
                        <Input 
                          id="tx-value" 
                          type="number" 
                          placeholder="0.0" 
                          value={transferAmount} 
                          onChange={(e) => setTransferAmount(e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tx-data">Transaction Data (Hex)</Label>
                        <Input 
                          id="tx-data" 
                          placeholder="0x..." 
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional: Include data for contract interactions
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending"}
                        onClick={handleTransfer}
                      >
                        {txStatus === "pending" ? (
                          <div className="flex items-center">
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            <span>Processing...</span>
                          </div>
                        ) : "Send Transaction"}
                      </Button>
                      
                      {transactionHash && txStatus === "success" && (
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                              <p className="text-xs font-mono break-all">{transactionHash}</p>
                            </div>
                            <a 
                              href={getTxLink(transactionHash)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-xs flex items-center"
                            >
                              View <ExternalLink size={12} className="ml-1" />
                            </a>
                          </div>
                          <div className="flex items-center text-xs text-emerald-600 mt-2">
                            <CheckCircle2 size={12} className="mr-1" />
                            Transaction successful
                          </div>
                        </div>
                      )}
                    </div>
                  </FunctionCard>
                </div>
              </TabsContent>
              
              <TabsContent value="dex" className="space-y-6">
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
                          <span>Router Address:</span>
                          <span className="truncate max-w-[180px]">
                            {UNISWAP_ROUTER_ADDRESSES[currentChain || mainnet.id]?.substring(0, 6)}...
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
                              href={getTxLink(transactionHash)} 
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
              </TabsContent>
              
              <TabsContent value="contracts" className="min-h-[400px]">
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
                              href={getAddressLink(contractData.address)} 
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Functions;

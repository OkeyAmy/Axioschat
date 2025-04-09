
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FunctionCard } from "./FunctionCard";
import { ArrowUpDown, ExternalLink, CheckCircle2, RefreshCw, Share2, Settings, X } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import { getAddressUrl, getTxUrl, sendTransaction, fetchRecentTransactions, getRecommendedGasPrice } from "@/utils/blockchain";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface TransactionsSectionProps {
  currentChain: number;
}

type TransactionStatus = "pending" | "success" | "failed" | "none";

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const TransactionsSection: React.FC<TransactionsSectionProps> = ({ currentChain }) => {
  const { web3, address } = useWeb3();
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [txData, setTxData] = useState("");
  const [addressError, setAddressError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  
  // Gas settings
  const [gasPrice, setGasPrice] = useState<string>("");
  const [gasLimit, setGasLimit] = useState<string>("");
  const [recommendedGasPrice, setRecommendedGasPrice] = useState<string>("");
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(20);
  const [isEditingGas, setIsEditingGas] = useState(false);
  const [useEIP1559, setUseEIP1559] = useState(false);
  const [maxFeePerGas, setMaxFeePerGas] = useState<string>("");
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<string>("");

  useEffect(() => {
    if (web3 && address) {
      loadRecentTransactions();
      loadRecommendedGasPrice();
    }
  }, [web3, address, currentChain]);

  const loadRecommendedGasPrice = async () => {
    if (!web3) return;
    
    try {
      const recommended = await getRecommendedGasPrice(web3, currentChain);
      setRecommendedGasPrice(recommended);
      
      // Convert to Gwei for UI
      const gweiValue = parseFloat(web3.utils.fromWei(recommended, 'gwei'));
      setGasPriceGwei(gweiValue);
      setGasPrice(recommended);
      
      // Set EIP-1559 values
      setMaxFeePerGas(web3.utils.toWei((gweiValue * 1.5).toString(), 'gwei'));
      setMaxPriorityFeePerGas(web3.utils.toWei("1.5", 'gwei'));
    } catch (error) {
      console.error("Error getting recommended gas price:", error);
    }
  };

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

  const loadRecentTransactions = async () => {
    if (!web3 || !address) return;
    
    setIsLoadingTxs(true);
    
    try {
      const txs = await fetchRecentTransactions(web3, address);
      
      if (txs && txs.length > 0) {
        setRecentTxs(txs);
      } else {
        // If no transactions found, let's display a message but not reset to empty array
        toast({
          title: "No Transactions Found",
          description: "We couldn't find any recent transactions for this address."
        });
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load recent transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTxs(false);
    }
  };

  const handleTransaction = async () => {
    if (!validateAddress(transferAddress)) return;
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
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ETH to ${transferAddress}`,
      });

      // Prepare transaction options
      const txOptions: any = {
        from: address,
        to: transferAddress,
        value: transferAmount,
        data: txData || undefined
      };
      
      // Add gas parameters from user input
      if (gasLimit) {
        txOptions.gasLimit = gasLimit;
      }
      
      if (useEIP1559) {
        txOptions.maxFeePerGas = maxFeePerGas;
        txOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;
      } else if (gasPrice) {
        txOptions.gasPrice = gasPrice;
      }

      const txHash = await sendTransaction(web3, txOptions);

      setTransactionHash(txHash);
      setTxStatus("success");

      // Add to recent transactions
      const newTx = {
        hash: txHash,
        type: "Custom Transaction",
        value: `${transferAmount} ETH`,
        to: transferAddress,
        from: address,
        timestamp: new Date().toLocaleString(),
        status: "success" as TransactionStatus,
      };
      
      setRecentTxs([newTx, ...recentTxs]);

      toast({
        title: "Transaction Sent",
        description: `Successfully sent transaction to ${transferAddress}`,
      });
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: error.message || "Failed to send transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGasPriceChange = (value: number[]) => {
    if (!web3) return;
    
    setGasPriceGwei(value[0]);
    const newGasPrice = web3.utils.toWei(value[0].toString(), 'gwei');
    setGasPrice(newGasPrice);
    
    // Update EIP-1559 values based on gas price
    setMaxFeePerGas(web3.utils.toWei((value[0] * 1.5).toString(), 'gwei'));
  };

  const GasSettings = () => (
    <div className="space-y-4 p-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Gas Settings</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadRecommendedGasPrice}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
      </div>
      
      <div className="p-3 bg-muted/50 rounded-md text-xs">
        <p>Current network: {
          currentChain === 1 ? "Ethereum" :
          currentChain === 137 ? "Polygon" :
          currentChain === 10 ? "Optimism" :
          currentChain === 42161 ? "Arbitrum" :
          currentChain === 8453 ? "Base" :
          currentChain === 7777777 ? "Zora" : "Unknown"
        }</p>
        <p className="mt-1">Recommended gas price: {
          web3 ? parseFloat(web3.utils.fromWei(recommendedGasPrice, 'gwei')).toFixed(2) : "0"
        } Gwei</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <Label htmlFor="gas-type" className="text-xs">Gas Price Type</Label>
            <div className="text-xs text-muted-foreground">
              {useEIP1559 ? "EIP-1559 (Dynamic Fee)" : "Legacy (Fixed Price)"}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs" 
            onClick={() => setUseEIP1559(!useEIP1559)}
          >
            {useEIP1559 ? "Switch to Legacy Gas" : "Switch to EIP-1559"}
          </Button>
        </div>
        
        {useEIP1559 ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="max-fee" className="text-xs">Max Fee (Gwei)</Label>
                <div className="text-xs font-mono">
                  {web3 ? parseFloat(web3.utils.fromWei(maxFeePerGas, 'gwei')).toFixed(2) : "0"}
                </div>
              </div>
              <Input
                id="max-fee"
                type="text"
                value={web3 ? parseFloat(web3.utils.fromWei(maxFeePerGas, 'gwei')).toFixed(2) : "0"}
                onChange={(e) => {
                  if (web3) {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setMaxFeePerGas(web3.utils.toWei(value.toString(), 'gwei'));
                    }
                  }
                }}
                className="text-xs h-8"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="priority-fee" className="text-xs">Priority Fee (Gwei)</Label>
                <div className="text-xs font-mono">
                  {web3 ? parseFloat(web3.utils.fromWei(maxPriorityFeePerGas, 'gwei')).toFixed(2) : "0"}
                </div>
              </div>
              <Input
                id="priority-fee"
                type="text"
                value={web3 ? parseFloat(web3.utils.fromWei(maxPriorityFeePerGas, 'gwei')).toFixed(2) : "0"}
                onChange={(e) => {
                  if (web3) {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setMaxPriorityFeePerGas(web3.utils.toWei(value.toString(), 'gwei'));
                    }
                  }
                }}
                className="text-xs h-8"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="gas-price" className="text-xs">Gas Price (Gwei)</Label>
              <div className="text-xs font-mono">{gasPriceGwei.toFixed(2)}</div>
            </div>
            <div className="pt-2">
              <Slider
                defaultValue={[gasPriceGwei]}
                min={1}
                max={200}
                step={0.1}
                onValueChange={handleGasPriceChange}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="gas-limit" className="text-xs">Gas Limit</Label>
            <div className="text-xs text-muted-foreground">Optional</div>
          </div>
          <Input
            id="gas-limit"
            type="text"
            placeholder="21000"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            className="text-xs h-8"
          />
          <p className="text-xs text-muted-foreground">Default: 21000 for ETH transfers</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunctionCard
        title="Recent Transactions"
        description="Track and verify your recent transactions"
        icon={ArrowUpDown}
      >
        <div className="flex justify-between items-center mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRecentTransactions}
            className="flex items-center gap-1"
            disabled={isLoadingTxs || !web3 || !address}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
          
          <a
            href={address ? getAddressUrl(currentChain, address) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-primary hover:text-primary/80 text-xs flex items-center",
              !address && "pointer-events-none opacity-50"
            )}
          >
            <span>View All on Explorer</span>
            <ExternalLink size={12} className="ml-1" />
          </a>
        </div>
        
        {isLoadingTxs ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : recentTxs.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentTxs.map((tx, index) => (
              <div key={index} className="border rounded-md p-3 text-sm">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">
                    {tx.from?.toLowerCase() === address?.toLowerCase() ? "Outgoing" : "Incoming"}
                  </div>
                  <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span>{tx.value} ETH</span>
                  </div>
                  {tx.from && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">From:</span>
                      <a
                        href={getAddressUrl(currentChain, tx.from)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[180px]"
                      >
                        {tx.from.substring(0, 8)}...{tx.from.substring(tx.from.length - 6)}
                      </a>
                    </div>
                  )}
                  {tx.to && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">To:</span>
                      <a
                        href={getAddressUrl(currentChain, tx.to)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[180px]"
                      >
                        {tx.to.substring(0, 8)}...{tx.to.substring(tx.to.length - 6)}
                      </a>
                    </div>
                  )}
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
                    href={getTxUrl(currentChain, tx.hash)}
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
            <Textarea
              id="tx-data"
              placeholder="0x..."
              value={txData}
              onChange={(e) => setTxData(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Include data for contract interactions
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span>Gas Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Gas Settings</DialogTitle>
                </DialogHeader>
                <GasSettings />
              </DialogContent>
            </Dialog>
            
            <div className="text-xs text-right">
              <div className="text-muted-foreground">Gas Price: {
                useEIP1559 
                  ? `EIP-1559 (Max: ${web3 ? parseFloat(web3.utils.fromWei(maxFeePerGas, 'gwei')).toFixed(2) : "0"} Gwei)`
                  : `${gasPriceGwei.toFixed(2)} Gwei`
              }</div>
              {gasLimit && <div className="text-muted-foreground">Gas Limit: {gasLimit}</div>}
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending" || !web3}
            onClick={handleTransaction}
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
                Transaction successful
              </div>
            </div>
          )}
        </div>
      </FunctionCard>
    </div>
  );
};

export default TransactionsSection;

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  History,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Copy,
  Check,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMneeAddress,
  setMneeAddress,
  getMneeBalance,
  getMneeTransactionHistory,
  formatBalance,
  shortenAddress,
  isValidMneeAddress,
  isWalletConnected,
  type MNEEBalanceResult,
  type MNEETransaction,
} from "@/services/mneeService";

interface TransactionHistoryPanelProps {
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

const TransactionHistoryPanel: React.FC<TransactionHistoryPanelProps> = ({
  onCollapseChange,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [walletAddress, setWalletAddress] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [balance, setBalance] = useState<MNEEBalanceResult | null>(null);
  const [transactions, setTransactions] = useState<MNEETransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved wallet address on mount
  useEffect(() => {
    const savedAddress = getMneeAddress();
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setInputAddress(savedAddress);
    }
  }, []);

  // Fetch balance when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      fetchTransactions();
    }
  }, [walletAddress]);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoadingBalance(true);
    setError(null);
    
    try {
      const result = await getMneeBalance(walletAddress);
      setBalance(result);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to load balance');
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const history = await getMneeTransactionHistory(10, walletAddress);
      setTransactions(history);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = () => {
    if (!inputAddress.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a wallet address.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMneeAddress(inputAddress.trim())) {
      toast({
        title: "Invalid Address Format",
        description: "MNEE addresses should start with '1' and be 26-35 characters long.",
        variant: "destructive",
      });
      return;
    }

    setMneeAddress(inputAddress.trim());
    setWalletAddress(inputAddress.trim());
    toast({
      title: "Wallet Connected",
      description: `Connected to ${shortenAddress(inputAddress.trim())}`,
    });
  };

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    if (walletAddress) {
      fetchBalance();
      fetchTransactions();
    }
  };

  const handleCollapseChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange?.(collapsed);
  };

  const getTransactionType = (tx: MNEETransaction): 'sent' | 'received' => {
    return tx.senders.includes(walletAddress) ? 'sent' : 'received';
  };

  if (isCollapsed) {
    return (
      <div className="h-full border rounded-lg flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCollapseChange(false)}
          className="h-full w-full rounded-none flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Wallet & History
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!walletAddress || loading}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseChange(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Wallet Connection Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Connect Wallet</span>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter MNEE address (1...)"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                onClick={handleConnectWallet}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                {walletAddress ? 'Update' : 'Connect'}
              </Button>
            </div>
          </div>

          {/* Connected Wallet & Balance */}
          {walletAddress && (
            <div className="space-y-3">
              {/* Balance Card */}
              <div
                onClick={handleCopyAddress}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200",
                  "bg-gradient-to-br from-emerald-100/80 to-teal-100/80",
                  "dark:from-emerald-900/40 dark:to-teal-900/40",
                  "border border-emerald-200/50 dark:border-emerald-700/30",
                  "hover:shadow-md hover:scale-[1.02]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAddress();
                    }}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {loadingBalance ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : balance ? (
                    `${formatBalance(balance.decimalAmount)} MNEE`
                  ) : (
                    '-- MNEE'
                  )}
                </div>
                
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <span>{shortenAddress(walletAddress)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">(click to copy)</span>
                </div>
              </div>

              {/* MNEE CLI Info */}
              <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-blue-700 dark:text-blue-300">Get an MNEE Wallet</p>
                    <p className="text-muted-foreground mt-1">
                      Install MNEE CLI: <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">npm install -g @mnee/cli</code>
                    </p>
                    <p className="text-muted-foreground">
                      Create wallet: <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">mnee create</code>
                    </p>
                    <a
                      href="https://docs.mnee.io/dev-tools/mnee-cli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      View Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* Transaction History */}
          {walletAddress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Recent Transactions
                </span>
                {transactions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {transactions.length}
                  </Badge>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const type = getTransactionType(tx);
                    return (
                      <div
                        key={tx.txid}
                        className={cn(
                          "p-2 rounded-lg border transition-all duration-200",
                          "hover:shadow-sm cursor-pointer",
                          type === 'received'
                            ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30"
                            : "bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/30"
                        )}
                        onClick={() => {
                          navigator.clipboard.writeText(tx.txid);
                          toast({
                            title: "Transaction ID Copied",
                            description: "Copied to clipboard",
                          });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {type === 'received' ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-orange-600" />
                            )}
                            <div>
                              <div className="text-xs font-medium">
                                {type === 'received' ? 'Received' : 'Sent'}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {shortenAddress(tx.txid, 8)}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={type === 'received' ? 'default' : 'secondary'}
                            className={cn(
                              "text-[10px]",
                              type === 'received'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300"
                            )}
                          >
                            {tx.height > 0 ? `Block ${tx.height}` : 'Pending'}
                          </Badge>
                        </div>
                        {tx.blkTime && (
                          <div className="text-[10px] text-muted-foreground mt-1 pl-6">
                            {new Date(tx.blkTime * 1000).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Not Connected State */}
          {!walletAddress && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No Wallet Connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your MNEE wallet address above to view your balance and transaction history.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TransactionHistoryPanel;









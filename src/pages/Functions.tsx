
import { useState, useEffect } from "react";
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";
import { mainnet, sepolia, base, polygon } from "wagmi/chains";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpDown, ArrowLeftRight, FileCode } from "lucide-react";
import WalletRequired from "@/components/WalletRequired";
import { generateSampleTxs } from "@/components/functions/utils";
import WalletTab from "@/components/functions/WalletTab";
import TransactionsTab from "@/components/functions/TransactionsTab";
import DexTab from "@/components/functions/DexTab";
import ContractsTab from "@/components/functions/ContractsTab";

const Functions = () => {
  const { address, isConnected } = useAccount();
  const { chains } = useSwitchChain();
  const [currentChain, setCurrentChain] = useState<number | undefined>(mainnet.id);
  
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  useEffect(() => {
    if (isConnected && address && currentChain) {
      loadRecentTransactions();
    }
  }, [currentChain, address, isConnected]);

  const loadRecentTransactions = () => {
    setIsLoadingTxs(true);
    
    setTimeout(() => {
      setRecentTxs(generateSampleTxs(currentChain || mainnet.id, address));
      setIsLoadingTxs(false);
    }, 1000);
  };

  const addTransaction = (tx: any) => {
    setRecentTxs([tx, ...recentTxs]);
  };

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
              
              <TabsContent value="wallet">
                <WalletTab 
                  currentChain={currentChain}
                  setCurrentChain={setCurrentChain}
                  recentTxs={recentTxs}
                  isLoadingTxs={isLoadingTxs}
                  loadRecentTransactions={loadRecentTransactions}
                  addTransaction={addTransaction}
                />
              </TabsContent>
              
              <TabsContent value="transactions">
                <TransactionsTab 
                  recentTxs={recentTxs}
                  isLoadingTxs={isLoadingTxs}
                  loadRecentTransactions={loadRecentTransactions}
                  currentChain={currentChain}
                  addTransaction={addTransaction}
                />
              </TabsContent>
              
              <TabsContent value="dex">
                <DexTab 
                  currentChain={currentChain}
                  addTransaction={addTransaction}
                />
              </TabsContent>
              
              <TabsContent value="contracts" className="min-h-[400px]">
                <ContractsTab 
                  currentChain={currentChain}
                  chains={chains}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Functions;

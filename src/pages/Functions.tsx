
import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { mainnet } from "wagmi/chains";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpDown, ArrowLeftRight, FileCode } from "lucide-react";
import WalletRequired from "@/components/WalletRequired";
import WalletSection from "@/components/functions/WalletSection";
import TransferSection from "@/components/functions/TransferSection";
import TransactionsSection from "@/components/functions/TransactionsSection";
import DexSection from "@/components/functions/DexSection";
import ContractsSection from "@/components/functions/ContractsSection";
import TransactionQueue from "@/components/TransactionQueue";
import { TransactionQueueProvider } from "@/hooks/useTransactionQueue";

// Define prop interfaces for the components
interface ChainProps {
  currentChain: number;
}

interface ChainSectionProps extends ChainProps {
  setCurrentChain: (chainId: number) => void;
}

const Functions = () => {
  const { isConnected } = useAccount();
  const networkChainId = useChainId() || mainnet.id;
  const [currentChain, setCurrentChain] = useState<number>(mainnet.id);

  // Sync the current chain with the network chain when it changes
  useEffect(() => {
    if (networkChainId) {
      setCurrentChain(networkChainId);
    }
  }, [networkChainId]);
  
  // Make current chain available globally
  useEffect(() => {
    // Expose the transaction queue to the window object for potential access from the chat
    if (window.web3Context) {
      window.web3Context.currentChain = currentChain;
    }
  }, [currentChain]);

  return (
    <TransactionQueueProvider>
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
                  <WalletSection 
                    currentChain={currentChain} 
                    setCurrentChain={setCurrentChain} 
                  />
                  <TransferSection currentChain={currentChain} />
                </TabsContent>
                
                <TabsContent value="transactions" className="space-y-6">
                  <TransactionsSection />
                </TabsContent>
                
                <TabsContent value="dex" className="space-y-6">
                  <DexSection />
                </TabsContent>
                
                <TabsContent value="contracts" className="min-h-[400px]">
                  <ContractsSection />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
        
        {/* Transaction Queue Component */}
        <TransactionQueue chainId={currentChain} />
      </div>
    </TransactionQueueProvider>
  );
};

export default Functions;

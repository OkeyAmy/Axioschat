
import React from "react";
import WalletBalanceCard from "./WalletBalanceCard";
import SendTokensCard from "./SendTokensCard";
import TransactionHistoryCard from "./TransactionHistoryCard";
import NetworkSettingsCard from "./NetworkSettingsCard";

interface WalletTabProps {
  currentChain: number | undefined;
  setCurrentChain: (chainId: number) => void;
  recentTxs: any[];
  isLoadingTxs: boolean;
  loadRecentTransactions: () => void;
  addTransaction: (tx: any) => void;
}

const WalletTab = ({
  currentChain,
  setCurrentChain,
  recentTxs,
  isLoadingTxs,
  loadRecentTransactions,
  addTransaction
}: WalletTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <WalletBalanceCard
          currentChain={currentChain}
          setCurrentChain={setCurrentChain}
        />
        
        <SendTokensCard
          currentChain={currentChain}
          addTransaction={addTransaction}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <TransactionHistoryCard
          recentTxs={recentTxs}
          isLoadingTxs={isLoadingTxs}
          loadRecentTransactions={loadRecentTransactions}
          currentChain={currentChain}
        />
        
        <NetworkSettingsCard
          currentChain={currentChain}
          setCurrentChain={setCurrentChain}
        />
      </div>
    </div>
  );
};

export default WalletTab;

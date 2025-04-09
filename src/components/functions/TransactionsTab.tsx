
import React from "react";
import TransactionHistoryCard from "./TransactionHistoryCard";
import TransactionBuilderCard from "./TransactionBuilderCard";

interface TransactionsTabProps {
  recentTxs: any[];
  isLoadingTxs: boolean;
  loadRecentTransactions: () => void;
  currentChain: number | undefined;
  addTransaction: (tx: any) => void;
}

const TransactionsTab = ({
  recentTxs,
  isLoadingTxs,
  loadRecentTransactions,
  currentChain,
  addTransaction
}: TransactionsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <TransactionHistoryCard
          recentTxs={recentTxs}
          isLoadingTxs={isLoadingTxs}
          loadRecentTransactions={loadRecentTransactions}
          currentChain={currentChain}
        />
        
        <TransactionBuilderCard
          currentChain={currentChain}
          addTransaction={addTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionsTab;

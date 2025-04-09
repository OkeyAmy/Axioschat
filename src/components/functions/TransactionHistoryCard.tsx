
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import FunctionCard from "./FunctionCard";
import TransactionItem from "./TransactionItem";

interface TransactionHistoryCardProps {
  recentTxs: any[];
  isLoadingTxs: boolean;
  loadRecentTransactions: () => void;
  currentChain: number | undefined;
}

const TransactionHistoryCard = ({ 
  recentTxs, 
  isLoadingTxs, 
  loadRecentTransactions,
  currentChain 
}: TransactionHistoryCardProps) => {
  return (
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
            <TransactionItem 
              key={index} 
              tx={tx} 
              chainId={currentChain || 1} 
            />
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
  );
};

export default TransactionHistoryCard;


import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionStatus } from "./utils";
import { getAddressLink, getTxLink } from "./utils";

interface TransactionItemProps {
  tx: {
    hash: string;
    type: string;
    value: string;
    to: string;
    timestamp: string;
    status: TransactionStatus;
  };
  chainId: number;
}

const TransactionItem = ({ tx, chainId }: TransactionItemProps) => {
  return (
    <div className="border rounded-md p-3 text-sm">
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
            href={getAddressLink(tx.to, chainId)} 
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
          href={getTxLink(tx.hash, chainId)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 text-xs flex items-center"
        >
          View on Explorer <ExternalLink size={12} className="ml-1" />
        </a>
      </div>
    </div>
  );
};

export default TransactionItem;

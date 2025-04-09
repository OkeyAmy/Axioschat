
import React, { useEffect } from 'react';
import { useTransactionQueue } from '@/hooks/useTransactionQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { getTxUrl } from '@/utils/blockchain';
import { cn } from '@/lib/utils';

interface TransactionQueueProps {
  chainId: number;
}

const TransactionQueue: React.FC<TransactionQueueProps> = ({ chainId }) => {
  const { 
    queue, 
    removeFromQueue, 
    executeNext, 
    isProcessing 
  } = useTransactionQueue();

  // Auto-execute next transaction when queue changes
  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      const pendingTx = queue.find(tx => tx.status === 'pending');
      if (pendingTx) {
        executeNext();
      }
    }
  }, [queue, isProcessing, executeNext]);

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {queue.map((tx) => (
        <Card key={tx.id} className={cn(
          "shadow-lg border transition-colors",
          tx.status === 'success' && "border-emerald-500/20 bg-emerald-500/5",
          tx.status === 'failed' && "border-red-500/20 bg-red-500/5",
          tx.status === 'processing' && "border-amber-500/20 bg-amber-500/5",
          tx.status === 'pending' && "border-muted/20 bg-card/95"
        )}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {tx.status === 'processing' && (
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                )}
                {tx.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {tx.status === 'failed' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {tx.status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20" />
                )}
                <span className="font-medium text-sm">{tx.type}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => removeFromQueue(tx.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {tx.description}
            </p>
            
            {tx.error && (
              <p className="text-xs text-red-500 mt-1">
                {tx.error}
              </p>
            )}
            
            {tx.txHash && (
              <div className="mt-2 pt-2 border-t border-border/30 flex justify-end">
                <a
                  href={getTxUrl(chainId, tx.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90 text-xs flex items-center"
                >
                  View on Explorer
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransactionQueue;


import { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QueuedTransaction } from '@/utils/blockchain';
import { toast } from '@/components/ui/use-toast';

interface TransactionQueueContextProps {
  queue: QueuedTransaction[];
  addToQueue: (transaction: Omit<QueuedTransaction, 'id' | 'status'>) => string;
  removeFromQueue: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<QueuedTransaction>) => void;
  clearQueue: () => void;
  executeNext: () => Promise<void>;
  isProcessing: boolean;
}

const TransactionQueueContext = createContext<TransactionQueueContextProps | undefined>(undefined);

export const TransactionQueueProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<QueuedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = useCallback((transaction: Omit<QueuedTransaction, 'id' | 'status'>): string => {
    const id = uuidv4();
    setQueue(prev => [...prev, { id, status: 'pending', ...transaction }]);
    toast({
      title: "Transaction Queued",
      description: transaction.description,
    });
    return id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<QueuedTransaction>) => {
    setQueue(prev => 
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const executeNext = useCallback(async () => {
    const pendingTx = queue.find(tx => tx.status === 'pending');
    if (!pendingTx || isProcessing) return;
    
    setIsProcessing(true);
    updateTransaction(pendingTx.id, { status: 'processing' });
    
    try {
      await pendingTx.execute();
      updateTransaction(pendingTx.id, { status: 'success' });
      toast({
        title: "Transaction Successful",
        description: pendingTx.description,
      });
      
      // Auto-remove successful transactions after 30 seconds
      setTimeout(() => {
        removeFromQueue(pendingTx.id);
      }, 30000);
    } catch (error: any) {
      console.error("Transaction execution error:", error);
      updateTransaction(pendingTx.id, { 
        status: 'failed', 
        error: error.message || "Transaction failed" 
      });
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to execute transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [queue, isProcessing, updateTransaction, removeFromQueue]);

  return (
    <TransactionQueueContext.Provider value={{
      queue,
      addToQueue,
      removeFromQueue,
      updateTransaction,
      clearQueue,
      executeNext,
      isProcessing
    }}>
      {children}
    </TransactionQueueContext.Provider>
  );
};

export const useTransactionQueue = () => {
  const context = useContext(TransactionQueueContext);
  if (context === undefined) {
    throw new Error('useTransactionQueue must be used within a TransactionQueueProvider');
  }
  return context;
};


import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import useWeb3 from "@/hooks/useWeb3";
import { fetchRecentTransactions } from "@/utils/blockchain";

interface ChatHistoryProps {
  onSelectChat: (chatId: number, messages: Array<{ role: string; content: string }>) => void;
  onNewChat: () => void;
  activeChat: number | null;
  currentChain: number;
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectChat, 
  onNewChat, 
  activeChat, 
  currentChain,
  onCollapseChange,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { web3, address, isReady } = useWeb3();
  
  // Mock conversations for demo
  const mockHistory = [
    {
      id: 1,
      title: "Smart Contract Creation",
      last_message: "How do I create an ERC-20 token?",
      timestamp: "2023-12-01T10:00:00Z",
      chain_id: 1,
      messages: [
        { role: "user", content: "How do I create an ERC-20 token?" },
        { role: "assistant", content: "To create an ERC-20 token, you need to implement the standard ERC-20 interface..." }
      ]
    },
    {
      id: 2,
      title: "Gas Optimization",
      last_message: "What are the best practices for optimizing gas usage in Solidity?",
      timestamp: "2023-12-02T14:30:00Z",
      chain_id: 1,
      messages: [
        { role: "user", content: "What are the best practices for optimizing gas usage in Solidity?" },
        { role: "assistant", content: "There are several approaches to optimize gas usage in Solidity contracts..." }
      ]
    },
    {
      id: 3,
      title: "DeFi Integration",
      last_message: "How can I integrate my dApp with Uniswap?",
      timestamp: "2023-12-03T09:15:00Z",
      chain_id: 1,
      messages: [
        { role: "user", content: "How can I integrate my dApp with Uniswap?" },
        { role: "assistant", content: "To integrate with Uniswap, you can use their SDK or interact directly with their contracts..." }
      ]
    }
  ];

  useEffect(() => {
    // Set initial history
    setHistory(mockHistory);
  }, []);
  
  useEffect(() => {
    // Filter history by chain id
    if (currentChain) {
      setFilteredHistory(history.filter(chat => chat.chain_id === currentChain));
    } else {
      setFilteredHistory(history);
    }
  }, [currentChain, history]);

  useEffect(() => {
    if (defaultCollapsed !== isCollapsed) {
      setIsCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (isReady && web3 && address) {
        try {
          const txs = await fetchRecentTransactions(web3, address, currentChain);
          setTransactions(txs);
        } catch (error) {
          console.error("Error fetching transactions:", error);
          setTransactions([]);
        }
      }
    };
    
    fetchTransactions();
  }, [isReady, web3, address, currentChain]);

  const handleCollapseChange = (newCollapsedState: boolean) => {
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  return (
    <div className="h-full transition-all duration-300">
      {isCollapsed ? (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleCollapseChange(false)}
          className="h-full w-full rounded-lg border flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </Button>
      ) : (
        <div className="h-full flex flex-col border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Chat History</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCollapseChange(true)}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-3 flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={onNewChat}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="shrink-0 h-9 w-9"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Recent Conversations</p>
          </div>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {filteredHistory.map((chat) => (
                <div 
                  key={chat.id}
                  className={cn(
                    "p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                    activeChat === chat.id && "bg-muted"
                  )}
                  onClick={() => onSelectChat(chat.id, chat.messages)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">{chat.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {chat.last_message}
                  </p>
                </div>
              ))}
              
              {filteredHistory.length === 0 && (
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t">
            <div className="text-xs text-muted-foreground">
              <p>Pending Transactions</p>
              {transactions.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {transactions.slice(0, 2).map((tx, index) => (
                    <p key={index} className="text-xs truncate">{tx.hash}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-1">No pending transactions</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;

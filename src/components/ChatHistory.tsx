import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, RotateCcw, ChevronRight, ChevronLeft, Clock, Search, Calendar, Filter, ArrowDownUp, MessageCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import useWeb3 from "@/hooks/useWeb3";
import { fetchRecentTransactions } from "@/utils/blockchain";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface ChatHistoryProps {
  onSelectChat: (chatId: number, messages: Array<{ role: string; content: string }>) => void;
  onNewChat: () => void;
  activeChat: number | null;
  currentChain: number;
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

// Chat history storage key
const CHAT_HISTORY_KEY = "axioschat_history";

// Helper function to load chat history from localStorage
const loadChatHistory = (): any[] => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
  return [];
};

// Helper function to save chat history to localStorage
const saveChatHistory = (history: any[]) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { web3, address, isReady } = useWeb3();

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = loadChatHistory();
    setHistory(savedHistory);
  }, []);
  
  useEffect(() => {
    // Filter history by chain id and search query
    let filtered = history;
    
    if (currentChain) {
      filtered = filtered.filter(chat => chat.chain_id === currentChain);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.title.toLowerCase().includes(query) || 
        chat.last_message.toLowerCase().includes(query)
      );
    }
    
    setFilteredHistory(filtered);
  }, [currentChain, history, searchQuery]);

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
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a'); // Today: show time only
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  if (isCollapsed) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleCollapseChange(false)}
        className="h-full w-full rounded-lg border flex items-center justify-center"
      >
        <ChevronRight size={16} />
      </Button>
    );
  }

  return (
    <div className="h-full flex flex-col border rounded-lg bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Chat History
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseChange(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 h-9 bg-background text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-3 flex gap-2 border-b">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md shadow-indigo-500/10"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className="shrink-0 h-9 w-9"
          title="Refresh conversations"
          onClick={() => setHistory(loadChatHistory())}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="px-3 py-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Recent Conversations
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Filter">
            <Filter className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Sort">
            <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <AnimatePresence initial={false}>
            {filteredHistory.map((chat, index) => (
              <motion.div 
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200 group",
                  "border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50",
                  "hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-950/30 dark:hover:to-purple-950/30",
                  "hover:shadow-md",
                  activeChat === chat.id 
                    ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-sm border-indigo-200 dark:border-indigo-800/50" 
                    : "bg-card/40"
                )}
                onClick={() => onSelectChat(chat.id, chat.messages)}
              >
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium text-sm truncate transition-colors",
                    activeChat === chat.id ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  )}>
                    {chat.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full flex items-center">
                    <CalendarDays className="h-2.5 w-2.5 mr-1" />
                    {formatDate(chat.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {chat.last_message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredHistory.length === 0 && (
            <div className="text-center p-8">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No conversations found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search or start a new chat</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onNewChat}>
                <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> New Chat
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {transactions.length > 0 && (
        <div className="p-3 border-t bg-muted/20">
          <div className="text-xs">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Recent Transactions
              </p>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-2">
              {transactions.slice(0, 2).map((tx, index) => (
                <div key={index} className="flex items-center gap-2 overflow-hidden p-2 rounded-md bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="truncate text-[10px] font-mono text-muted-foreground">{tx.hash}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;

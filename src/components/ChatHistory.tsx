
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquare, Trash, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data for chat history
const sampleChatHistory = [
  { 
    id: 1, 
    title: "Smart contract deployment", 
    date: "Today",
    messages: [
      { role: "user", content: "How do I deploy a smart contract on Ethereum?" },
      { role: "assistant", content: "To deploy a smart contract on Ethereum, you'll need to use a development framework like Hardhat or Truffle. First, write your contract in Solidity, then compile it and deploy using the framework's deployment scripts. You'll need ETH in your wallet to pay for gas fees." }
    ]
  },
  { 
    id: 2, 
    title: "Gas optimization", 
    date: "Yesterday",
    messages: [
      { role: "user", content: "How can I optimize gas usage in my smart contract?" },
      { role: "assistant", content: "There are several ways to optimize gas in your smart contract: use mappings instead of arrays when possible, batch operations, minimize on-chain storage, use bytes32 instead of string, and remove unused variables." }
    ]
  },
  { 
    id: 3, 
    title: "NFT minting strategies", 
    date: "Apr 7",
    messages: [
      { role: "user", content: "What's the best approach for minting 10,000 NFTs?" },
      { role: "assistant", content: "For large NFT collections, consider lazy minting where the actual minting happens at purchase time. Alternatively, use batch minting functions to mint multiple NFTs in a single transaction to save gas. ERC721A is a gas-optimized implementation worth considering." }
    ]
  },
  { 
    id: 4, 
    title: "Uniswap integration", 
    date: "Apr 5",
    messages: [
      { role: "user", content: "How do I integrate with Uniswap from my dApp?" },
      { role: "assistant", content: "To integrate with Uniswap, you can use their SDK or interact directly with their smart contracts. For the SDK approach, install @uniswap/sdk and @uniswap/sdk-core, then use them to fetch prices, calculate optimal paths, and execute swaps through your dApp." }
    ]
  },
];

interface ChatHistoryProps {
  onSelectChat: (chatId: number, messages: Array<{ role: string; content: string }>) => void;
  onNewChat: () => void;
  activeChat: number | null;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectChat, 
  onNewChat,
  activeChat 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-card border rounded-lg p-4 h-full flex flex-col transition-all duration-300",
      isCollapsed ? "w-14" : "w-full"
    )}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && <h3 className="text-sm font-medium">Chat History</h3>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <Button 
          variant="outline" 
          className={cn(
            "mb-4 transition-all duration-300",
            isCollapsed ? "w-full p-2 justify-center" : "w-full justify-start"
          )} 
          onClick={onNewChat}
        >
          {isCollapsed ? <Plus size={16} /> : <>
            <MessageSquare className="mr-2" size={16} />
            New Chat
          </>}
        </Button>
        
        <CollapsibleContent className="space-y-1">
          <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
            <div className="space-y-1 pr-2">
              {sampleChatHistory.map((chat) => (
                <Button
                  key={chat.id}
                  variant={activeChat === chat.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => onSelectChat(chat.id, chat.messages)}
                >
                  <div className="flex items-center w-full">
                    <MessageSquare className="mr-2 flex-shrink-0" size={14} />
                    <div className="truncate flex-1">
                      <span className="block truncate">{chat.title}</span>
                      <span className="text-xs text-muted-foreground">{chat.date}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChatHistory;

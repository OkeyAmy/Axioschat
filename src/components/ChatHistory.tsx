
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquare, ChevronRight, Plus, ArrowLeftCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data for chat history
const sampleChatHistory = [
  { 
    id: 1, 
    title: "Smart contract deployment", 
    date: "Today",
    messages: [
      { role: "user", content: "How do I deploy a smart contract on Ethereum?" },
      { role: "assistant", content: "To deploy a smart contract on Ethereum, you'll need to use a development framework like Hardhat or Truffle. First, write your contract in Solidity, then compile it and deploy using the framework's deployment scripts. You'll need ETH in your wallet to pay for gas fees." },
      { role: "user", content: "What about gas costs?" },
      { role: "assistant", content: "Gas costs vary based on network congestion and contract complexity. For a simple contract, expect to pay around 0.01-0.05 ETH on mainnet. You can reduce costs by deploying to Layer 2 solutions like Optimism or Arbitrum, or testnets like Sepolia for testing purposes." }
    ]
  },
  { 
    id: 2, 
    title: "Gas optimization", 
    date: "Yesterday",
    messages: [
      { role: "user", content: "How can I optimize gas usage in my smart contract?" },
      { role: "assistant", content: "There are several ways to optimize gas in your smart contract: use mappings instead of arrays when possible, batch operations, minimize on-chain storage, use bytes32 instead of string, and remove unused variables." },
      { role: "user", content: "Any specific examples for storage optimization?" },
      { role: "assistant", content: "Yes! For storage optimization: 1) Pack multiple small variables into a single storage slot, 2) Use uint8/uint16 instead of uint256 when smaller values are sufficient, 3) Make frequently accessed variables 'memory' instead of 'storage', 4) Use events for historical data that doesn't need to be accessed on-chain." }
    ]
  },
  { 
    id: 3, 
    title: "NFT minting strategies", 
    date: "Apr 7",
    messages: [
      { role: "user", content: "What's the best approach for minting 10,000 NFTs?" },
      { role: "assistant", content: "For large NFT collections, consider lazy minting where the actual minting happens at purchase time. Alternatively, use batch minting functions to mint multiple NFTs in a single transaction to save gas. ERC721A is a gas-optimized implementation worth considering." },
      { role: "user", content: "Tell me more about ERC721A" },
      { role: "assistant", content: "ERC721A is an improved implementation of the ERC721 standard created by Azuki. It significantly reduces gas costs for minting multiple NFTs in a single transaction by optimizing how token ownership data is stored. Instead of updating storage for each token individually, it uses a clever storage pattern that only updates once per batch mint operation." }
    ]
  },
  { 
    id: 4, 
    title: "Uniswap integration", 
    date: "Apr 5",
    messages: [
      { role: "user", content: "How do I integrate with Uniswap from my dApp?" },
      { role: "assistant", content: "To integrate with Uniswap, you can use their SDK or interact directly with their smart contracts. For the SDK approach, install @uniswap/sdk and @uniswap/sdk-core, then use them to fetch prices, calculate optimal paths, and execute swaps through your dApp." },
      { role: "user", content: "Can you show me code for swapping tokens?" },
      { role: "assistant", content: "Here's a simplified example of swapping tokens with Uniswap v3:\n\n```solidity\n// SPDX-License-Identifier: GPL-2.0-or-later\npragma solidity ^0.8.0;\n\nimport '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';\n\ncontract UniswapExample {\n    ISwapRouter public immutable swapRouter;\n    \n    constructor(ISwapRouter _swapRouter) {\n        swapRouter = _swapRouter;\n    }\n    \n    function swapExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256 amountOut) {\n        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);\n        IERC20(tokenIn).approve(address(swapRouter), amountIn);\n        \n        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({\n            tokenIn: tokenIn,\n            tokenOut: tokenOut,\n            fee: 3000, // 0.3%\n            recipient: msg.sender,\n            deadline: block.timestamp + 15,\n            amountIn: amountIn,\n            amountOutMinimum: 0,\n            sqrtPriceLimitX96: 0\n        });\n        \n        amountOut = swapRouter.exactInputSingle(params);\n        return amountOut;\n    }\n}\n```" }
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
      "bg-gradient-to-br from-sidebar-accent/30 to-sidebar-background border rounded-lg h-full flex flex-col transition-all duration-300 shadow-sm",
      isCollapsed ? "w-14" : "w-full"
    )}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && <h3 className="text-sm font-medium">Chat History</h3>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto transition-transform duration-300">
              {isCollapsed ? <ChevronRight size={16} /> : <ArrowLeftCircle size={16} />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="px-4 mb-4">
          <Button 
            variant="outline" 
            className={cn(
              "w-full justify-start bg-secondary/30 hover:bg-secondary/50 border-secondary/20 transition-all duration-300 animate-in slide-in-from-left-4",
              isCollapsed ? "w-auto p-2 justify-center" : ""
            )} 
            onClick={onNewChat}
          >
            {isCollapsed ? <Plus size={16} /> : <>
              <MessageSquare className="mr-2" size={16} />
              New Chat
            </>}
          </Button>
        </div>
        
        <CollapsibleContent className="space-y-1">
          <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
            <div className="space-y-1 px-4 pr-2">
              {sampleChatHistory.map((chat) => (
                <Button
                  key={chat.id}
                  variant={activeChat === chat.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left transition-all duration-200",
                    activeChat === chat.id ? "bg-secondary/50" : "hover:bg-secondary/30",
                    "animate-in slide-in-from-left duration-300"
                  )}
                  style={{ animationDelay: `${chat.id * 50}ms` }}
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

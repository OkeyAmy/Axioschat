
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash } from "lucide-react";

// Mock data for chat history (in real app, would come from props)
const mockChatHistory = [
  { id: 1, title: "Smart contract deployment", date: "Today" },
  { id: 2, title: "Gas optimization", date: "Yesterday" },
  { id: 3, title: "NFT minting strategies", date: "Apr 7" },
  { id: 4, title: "Uniswap integration", date: "Apr 5" },
];

interface ChatHistoryProps {
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  activeChat: number | null;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectChat, 
  onNewChat,
  activeChat 
}) => {
  return (
    <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={onNewChat}
        >
          <MessageSquare className="mr-2" size={16} />
          New Chat
        </Button>
      </div>
      
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Chat History</h3>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {mockChatHistory.map((chat) => (
            <Button
              key={chat.id}
              variant={activeChat === chat.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => onSelectChat(chat.id)}
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
    </div>
  );
};

export default ChatHistory;

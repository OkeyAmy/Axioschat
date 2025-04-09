
import React from 'react';
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: { role: string; content: string }[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium">Start a conversation</h3>
        <p className="text-muted-foreground mt-2">Select a chat from the sidebar or start a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex max-w-[80%] rounded-lg px-4 py-3",
            message.role === "user"
              ? "ml-auto bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;

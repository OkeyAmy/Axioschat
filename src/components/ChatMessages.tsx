import type React from "react"
import { cn } from "@/lib/utils"
import { Code, User, Bot, Sparkles, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useState, useEffect, useRef } from "react"
// Import framer-motion components with error handling
let motion = { div: 'div' };
let AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Try to load framer-motion, but fallback to regular components if it fails
try {
  const framerMotion = require('framer-motion');
  motion = framerMotion.motion;
  AnimatePresence = framerMotion.AnimatePresence;
} catch (error) {
  console.warn('Failed to load framer-motion, using fallback components:', error);
}

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

// Import SyntaxHighlighter with fallback
let SyntaxHighlighter: any = ({ children }: { children: React.ReactNode }) => <pre>{children}</pre>;
let vscDarkPlus = {};

try {
  const syntaxHighlighter = require('react-syntax-highlighter');
  const prismStyles = require('react-syntax-highlighter/dist/esm/styles/prism');
  SyntaxHighlighter = syntaxHighlighter.Prism;
  vscDarkPlus = prismStyles.vscDarkPlus;
} catch (error) {
  console.warn('Failed to load syntax highlighter, using fallback component:', error);
}

interface ChatMessagesProps {
  messages: { role: string; content: string }[]
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }, [messages]);

  // Error boundary effect
  useEffect(() => {
    const handleError = () => {
      setHasError(true);
      console.error('Caught error in ChatMessages component');
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Simple message rendering without animations
  const renderSimpleMessages = () => {
    return (
      <div className="flex flex-col space-y-6 p-4 w-full">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
              "group flex items-start gap-3 max-w-[94%] md:max-w-[80%]",
              message.role === "user" ? "ml-auto" : "",
            )}
          >
            {message.role !== "user" && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
            </div>
          )}
            
            <div className={cn(
              "rounded-2xl px-5 py-3 shadow-md",
              message.role === "user"
                ? "bg-indigo-500 text-white font-medium rounded-tr-sm"
                : "bg-gray-100 dark:bg-gray-800 rounded-tl-sm",
            )}>
          <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  }

  if (hasError) {
    // Fallback UI if there's an error
    return renderSimpleMessages();
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div 
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
          <Sparkles className="h-10 w-10 text-white relative z-10" />
        </div>
        <h3 
          className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
        >
          Start a conversation
        </h3>
        <p 
          className="text-muted-foreground mt-2 max-w-md"
        >
          Ask me anything about blockchain, crypto, web3, or NFTs. I'm here to help you explore the decentralized world.
        </p>
    </div>
  )
  }

  const copyToClipboard = (text: string, index: number) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
        duration: 2000,
      });
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Using simpler UI to make it more robust
  return renderSimpleMessages();
}

export default ChatMessages

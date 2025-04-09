
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import WalletRequired from "@/components/WalletRequired";
import ChatHistory from "@/components/ChatHistory";
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel";
import { useAccount } from "wagmi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Chat = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isLocalAI, setIsLocalAI] = useState(false);
  const [localAIEndpoint, setLocalAIEndpoint] = useState("http://localhost:11434/api/generate");
  
  const { address, isConnected } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initialQuestion = searchParams.get("question");
    if (initialQuestion && isConnected) {
      handleSubmit(undefined, initialQuestion);
      // Clear the query parameter
      navigate("/chat", { replace: true });
    }
  }, [searchParams, isConnected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, predefinedInput?: string) => {
    if (e) e.preventDefault();
    
    const userMessage = predefinedInput || input.trim();
    if (!userMessage || isLoading) return;
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      if (isLocalAI) {
        // Call Ollama endpoint
        try {
          const response = await fetch(localAIEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3.1',
              prompt: userMessage,
              stream: false
            }),
          });

          if (!response.ok) {
            throw new Error(`Error connecting to Ollama: ${response.status}`);
          }

          const data = await response.json();
          
          setMessages(prev => [
            ...prev, 
            { 
              role: "assistant", 
              content: data.response || "Sorry, I couldn't generate a response." 
            }
          ]);
        } catch (error) {
          console.error("Ollama error:", error);
          toast({
            title: "Local AI Error",
            description: "Failed to connect to Ollama. Make sure it's running locally.",
            variant: "destructive",
          });
          
          setMessages(prev => [
            ...prev, 
            { 
              role: "assistant", 
              content: "Error connecting to local AI. Please check that Ollama is running." 
            }
          ]);
        }
      } else {
        // Simulate response
        setTimeout(() => {
          setMessages(prev => [
            ...prev, 
            { 
              role: "assistant", 
              content: `This is a simulated response to: "${userMessage}". In a complete implementation, this would come from the Flock Web3 Agent Model.` 
            }
          ]);
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuestion = (question: string) => {
    setInput(question);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChat(null);
  };

  const handleSelectChat = (chatId: number, chatMessages: Array<{ role: string; content: string }>) => {
    setActiveChat(chatId);
    // Cast the roles to "user" | "assistant" to match our state type
    const typedMessages = chatMessages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    setMessages(typedMessages);
    
    toast({
      title: "Chat Loaded",
      description: `Loaded chat #${chatId}`,
    });
  };

  const MessageItem = ({ message, index }: { message: { role: "user" | "assistant"; content: string }, index: number }) => (
    <div 
      className={`flex gap-3 ${message.role === "assistant" ? "bg-muted/50 p-4 rounded-md" : "py-4"} message-slide-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex-shrink-0 pt-1">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User size={18} />
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );

  const toggleLocalAI = () => {
    setIsLocalAI(!isLocalAI);
    toast({
      title: isLocalAI ? "Using Cloud AI" : "Using Local AI",
      description: isLocalAI 
        ? "Switched to cloud-based AI responses" 
        : "Switched to local Ollama with llama3.1. Make sure Ollama is running.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {!isConnected ? (
          <WalletRequired />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-3 hidden md:block">
              <ChatHistory 
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                activeChat={activeChat}
              />
            </div>
            
            <div className="lg:col-span-6">
              <Card className="w-full h-full border shadow-md flex flex-col bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles size={18} className="text-primary" />
                      </div>
                      <CardTitle>NovachatV2 Web3 Assistant</CardTitle>
                      {isLocalAI && (
                        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20">
                          Local AI
                        </Badge>
                      )}
                    </div>
                    {address && (
                      <CardDescription className="mt-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Connected wallet: {address.substring(0, 6)}...{address.substring(address.length - 4)}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleLocalAI}
                    className="ml-auto"
                    title={isLocalAI ? "Switch to Cloud AI" : "Switch to Local AI"}
                  >
                    <Settings size={18} />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[calc(100%-2rem)]">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Bot size={48} className="text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                          Ask questions about Web3, smart contracts, or get assistance with blockchain tasks.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <MessageItem key={index} message={message} index={index} />
                        ))}
                        {isLoading && (
                          <div className="flex gap-3 bg-muted/50 p-4 rounded-md message-slide-in">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Sparkles size={18} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex space-x-2 items-center">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none min-h-[50px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isLoading || !input.trim()}
                        className="h-[50px] w-[50px]"
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </Card>
            </div>
            
            <div className="lg:col-span-3 hidden md:block">
              <SuggestedPromptsPanel onSelectQuestion={handleSelectQuestion} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;

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
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

const Chat = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isLocalAI, setIsLocalAI] = useState(false);
  const [localAIEndpoint, setLocalAIEndpoint] = useState("http://localhost:11434/api/generate");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  const { address, isConnected } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialQuestion = searchParams.get("question");
    if (initialQuestion && isConnected) {
      handleSubmit(undefined, initialQuestion);
      navigate("/chat", { replace: true });
    }
  }, [searchParams, isConnected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleChatHistoryCollapse = (mutation: MutationRecord) => {
      if (mutation.target && (mutation.target as HTMLElement).classList.contains('w-14')) {
        setLeftPanelCollapsed(true);
      } else {
        setLeftPanelCollapsed(false);
      }
    };

    const handlePromptsPanelCollapse = (mutation: MutationRecord) => {
      if (mutation.target && (mutation.target as HTMLElement).classList.contains('w-14')) {
        setRightPanelCollapsed(true);
      } else {
        setRightPanelCollapsed(false);
      }
    };

    const chatHistoryObserver = new MutationObserver((mutations) => {
      mutations.forEach(handleChatHistoryCollapse);
    });
    
    const promptsPanelObserver = new MutationObserver((mutations) => {
      mutations.forEach(handlePromptsPanelCollapse);
    });

    const chatHistoryPanel = document.querySelector('[data-sidebar="chat-history"]');
    if (chatHistoryPanel) {
      chatHistoryObserver.observe(chatHistoryPanel, { attributes: true, attributeFilter: ['class'] });
    }

    const promptsPanel = document.querySelector('[data-sidebar="prompts-panel"]');
    if (promptsPanel) {
      promptsPanelObserver.observe(promptsPanel, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      chatHistoryObserver.disconnect();
      promptsPanelObserver.disconnect();
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent, predefinedInput?: string) => {
    if (e) e.preventDefault();
    
    const userMessage = predefinedInput || input.trim();
    if (!userMessage || isLoading) return;
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      if (isLocalAI) {
        try {
          const response = await fetch(localAIEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3.2:latest',
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
            description: "Failed to connect to Ollama. Make sure it's running locally on port 11434.",
            variant: "destructive",
          });
          
          setMessages(prev => [
            ...prev, 
            { 
              role: "assistant", 
              content: "Error connecting to local AI. Please check that Ollama is running on port 11434." 
            }
          ]);
        }
      } else {
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
      className={`flex gap-3 ${message.role === "assistant" ? "bg-accent/10 p-4 rounded-md" : "py-4"} animate-in fade-in-50 slide-in-from-bottom-5`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex-shrink-0 pt-1">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
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
        : "Switched to local Ollama with llama3.2:latest. Make sure Ollama is running on port 11434.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {!isConnected ? (
          <WalletRequired />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-3 hidden md:block" data-sidebar="chat-history">
              <ChatHistory 
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                activeChat={activeChat}
              />
            </div>
            
            <div className={cn(
              "transition-all duration-300",
              leftPanelCollapsed && rightPanelCollapsed ? "lg:col-span-12" : 
              (leftPanelCollapsed || rightPanelCollapsed) ? "lg:col-span-9" : "lg:col-span-6"
            )}>
              <Card className="w-full h-full border shadow-md flex flex-col bg-card/80 backdrop-blur-sm animate-in fade-in-50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <Sparkles size={20} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                          NovachatV2 Web3 Assistant
                        </CardTitle>
                        {address && (
                          <CardDescription className="mt-1 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLocalAI && (
                      <Badge variant="outline" className="mr-2 bg-green-500/10 text-green-500 border-green-500/20 animate-in slide-in-from-right-4">
                        Local AI
                      </Badge>
                    )}
                    <Button
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleLocalAI}
                      className="ml-auto transition-colors hover:bg-secondary/20"
                      title={isLocalAI ? "Switch to Cloud AI" : "Switch to Local AI"}
                    >
                      <Settings size={18} className="text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea 
                    ref={scrollAreaRef} 
                    className="h-[calc(100%-2rem)] px-4 pt-4"
                    style={{ maxHeight: "calc(100vh - 20rem)" }}
                  >
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in-50">
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
                          <div className="flex gap-3 bg-accent/10 p-4 rounded-md animate-in fade-in-50 slide-in-from-bottom-5">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
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
                <CardFooter className="pt-4 pb-4 border-t bg-gradient-to-r from-primary/5 to-accent/5">
                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none min-h-[50px] border-secondary/30 focus:border-primary/30 transition-all duration-300 bg-background/50"
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
                        className="h-[50px] w-[50px] transition-all duration-300 bg-primary/90 hover:bg-primary"
                      >
                        <Send size={18} className="animate-in fade-in-50" />
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </Card>
            </div>
            
            <div className="lg:col-span-3 hidden md:block" data-sidebar="prompts-panel">
              <SuggestedPromptsPanel onSelectQuestion={handleSelectQuestion} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;

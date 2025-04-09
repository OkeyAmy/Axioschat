
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import WalletRequired from "@/components/WalletRequired";
import LandingPage from "@/components/LandingPage";
import ChatHistory from "@/components/ChatHistory";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import { useAccount } from "wagmi";

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [initialQuestion, setInitialQuestion] = useState("");
  
  const { address, isConnected } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion && showChat) {
      if (isConnected) {
        handleSubmit(undefined, initialQuestion);
        setInitialQuestion("");
      }
    }
  }, [initialQuestion, isConnected, showChat]);

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
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: `This is a simulated response to: "${userMessage}". In a complete implementation, this would come from the Flock Web3 Agent Model.` 
          }
        ]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleQuestionFromLanding = (question: string) => {
    setInitialQuestion(question);
    setShowChat(true);
  };

  const handleSelectQuestion = (question: string) => {
    setInput(question);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChat(null);
  };

  const handleSelectChat = (chatId: number) => {
    setActiveChat(chatId);
    toast({
      title: "Chat Selected",
      description: `Loading chat #${chatId}`,
    });
    setMessages([
      { role: "user", content: "Tell me about smart contracts" },
      { role: "assistant", content: "Smart contracts are self-executing contracts with the terms directly written into code. They run on blockchain networks like Ethereum." }
    ]);
  };

  const MessageItem = ({ message }: { message: { role: "user" | "assistant"; content: string } }) => (
    <div className={`flex gap-3 ${message.role === "assistant" ? "bg-muted/50 p-4 rounded-md" : "py-4"}`}>
      <div className="flex-shrink-0 pt-1">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={18} className="text-primary" />
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {!showChat ? (
          <LandingPage 
            onGetStarted={() => setShowChat(true)} 
            onAskQuestion={handleQuestionFromLanding}
          />
        ) : !isConnected ? (
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
              <Card className="w-full h-full border shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle>NovachatV2</CardTitle>
                  {address && (
                    <CardDescription>
                      Connected wallet: {address.substring(0, 6)}...{address.substring(address.length - 4)}
                    </CardDescription>
                  )}
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
                          <MessageItem key={index} message={message} />
                        ))}
                        {isLoading && (
                          <div className="flex gap-3 bg-muted/50 p-4 rounded-md">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot size={18} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">Thinking...</p>
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
              <SuggestedQuestions onSelectQuestion={handleSelectQuestion} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

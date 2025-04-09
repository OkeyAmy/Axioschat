
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Web3Provider from "@/components/Web3Provider";
import Header from "@/components/Header";
import WalletRequired from "@/components/WalletRequired";

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate AI response - in a real app, this would call your API
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: `This is a simulated response to: "${userMessage}". In a complete implementation, this would come from a Hugging Face Web3 Agent Model.` 
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
    <Web3Provider onConnect={(address) => { setWalletConnected(true); setWalletAddress(address); }}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
          {!walletConnected ? (
            <WalletRequired />
          ) : (
            <Card className="w-full mx-auto border shadow-md">
              <CardHeader>
                <CardTitle>Web3 AI Chat</CardTitle>
                <CardDescription>
                  Connected wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
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
          )}
        </main>
      </div>
    </Web3Provider>
  );
};

export default Index;

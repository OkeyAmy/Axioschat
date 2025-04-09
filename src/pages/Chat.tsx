
import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import ChatHistory from "@/components/ChatHistory";
import ChatMessages from "@/components/ChatMessages";
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import WalletRequired from "@/components/WalletRequired";
import { ArrowRight, Bot, MessageSquare, RotateCcw } from "lucide-react";
import { mainnet } from "wagmi/chains";
import TransactionQueue from "@/components/TransactionQueue";
import useApiKeys from "@/hooks/useApiKeys";
import ModelSelector from "@/components/ModelSelector";
import { callFlockWeb3, createDefaultWeb3Tools, FlockWeb3Request } from "@/services/replicateProxyService";

type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

const Chat = () => {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [useLocalAI, setUseLocalAI] = useState(false); // Default to false since local doesn't work easily
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(window.innerWidth < 1200);
  const [isPromptsPanelCollapsed, setIsPromptsPanelCollapsed] = useState(window.innerWidth < 1400);
  const [currentChain, setCurrentChain] = useState(mainnet.id);
  
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434");
  const [showEndpointSettings, setShowEndpointSettings] = useState(false);
  const { apiKeys, updateApiKey, isLoaded } = useApiKeys();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsPromptsPanelCollapsed(true);
      }
      if (window.innerWidth < 1200) {
        setIsHistoryPanelCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      let aiResponse: string;
      
      if (useLocalAI) {
        try {
          const response = await fetch(`${localEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2',
              messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMessage.content }],
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Error from local API: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          aiResponse = data.message?.content || "No response from local model";
        } catch (error) {
          console.error("Error from local API:", error);
          aiResponse = "Error connecting to local AI model. Please check if the server is running at " + localEndpoint;
        }
      } else {
        if (!apiKeys.replicate) {
          aiResponse = "Please provide a Replicate API key in the settings to use the Flock Web3 model.";
        } else {
          const flockRequest: FlockWeb3Request = {
            query: userMessage.content,
            tools: createDefaultWeb3Tools(),
            temperature: 0.7,
            top_p: 0.9,
            max_new_tokens: 3000
          };
          
          aiResponse = await callFlockWeb3(flockRequest);
        }
      }
      
      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse,
        id: Date.now().toString(),
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setLoading(false);
      
      toast({
        title: "Response received",
        description: "The AI has responded to your message.",
      });
    } catch (error) {
      console.error("Error getting response:", error);
      setLoading(false);
      
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get a response from the AI."}`,
        id: Date.now().toString(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };
  
  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All chat messages have been removed.",
    });
  };

  const handleSelectChat = (chatId: number, chatMessages: Array<{ role: string; content: string }>) => {
    setActiveChat(chatId);
    const formattedMessages = chatMessages.map((msg, index) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      id: `history-${chatId}-${index}`
    }));
    setMessages(formattedMessages);
  };

  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
  };

  // Calculate content area width based on panel states
  const getContentWidth = () => {
    const baseClasses = "flex flex-col rounded-lg border h-full max-h-full overflow-hidden transition-all duration-300";
    
    // Both panels are expanded
    if (!isHistoryPanelCollapsed && !isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-1");
    }
    
    // One panel is collapsed
    if (isHistoryPanelCollapsed !== isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-[2]");
    }
    
    // Both panels are collapsed
    return cn(baseClasses, "flex-[4]");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 container px-0 md:px-4 py-4 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <WalletRequired />
          </div>
        ) : (
          <div className="grid grid-cols-[auto_1fr_auto] gap-0 md:gap-2 lg:gap-4 h-full max-h-full">
            {/* History Panel */}
            <div className={cn(
              "transition-all duration-300 h-full max-h-full overflow-hidden",
              isHistoryPanelCollapsed ? "w-10" : "w-[280px] md:w-[320px]"
            )}>
              <ChatHistory 
                onSelectChat={handleSelectChat} 
                onNewChat={handleNewChat}
                activeChat={activeChat}
                currentChain={currentChain}
                onCollapseChange={setIsHistoryPanelCollapsed}
                defaultCollapsed={isHistoryPanelCollapsed}
              />
            </div>
            
            {/* Main Chat Area */}
            <div className={getContentWidth()}>
              <div className="border-b px-4 py-2 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">
                    {activeChat ? "Conversation" : "New Chat"}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  className="text-xs h-8"
                  disabled={messages.length === 0}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Clear
                </Button>
              </div>
                
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                      <Bot size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">How can I help you today?</h3>
                    <p className="text-muted-foreground text-sm mt-2 max-w-md">
                      Ask me anything about blockchain, smart contracts, or web3 development. I'm here to assist!
                    </p>
                  </div>
                ) : (
                  <ChatMessages messages={messages.map(m => ({ role: m.role, content: m.content }))} />
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t p-3 md:p-4 flex-shrink-0">
                <ModelSelector 
                  useLocalAI={useLocalAI}
                  onUseLocalAIChange={setUseLocalAI}
                  showSettings={showEndpointSettings}
                  onShowSettingsChange={setShowEndpointSettings}
                  localEndpoint={localEndpoint}
                  onLocalEndpointChange={setLocalEndpoint}
                  replicateApiKey={apiKeys.replicate}
                  onReplicateApiKeyChange={(key) => updateApiKey('replicate', key)}
                  className="mb-3"
                />
                
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <div className="flex-1 flex border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      placeholder="Ask anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 px-3 py-2 border-0 focus-visible:ring-0 focus-visible:ring-transparent h-10"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !input.trim()} className="h-10 whitespace-nowrap">
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span className="hidden sm:inline-block mr-2">Ask Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Suggested Prompts Panel */}
            <div className={cn(
              "transition-all duration-300 h-full max-h-full overflow-hidden",
              isPromptsPanelCollapsed ? "w-10" : "w-[260px] lg:w-[300px]"
            )}>
              <SuggestedPromptsPanel 
                onSelectQuestion={handleSuggestedQuestion}
                onCollapseChange={setIsPromptsPanelCollapsed}
                defaultCollapsed={isPromptsPanelCollapsed}
              />
            </div>
          </div>
        )}
        
        {/* Transaction Queue */}
        <TransactionQueue chainId={currentChain} />
      </main>
    </div>
  );
};

export default Chat;

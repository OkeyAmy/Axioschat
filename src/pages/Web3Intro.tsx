
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Coins, 
  ExternalLink, 
  GanttChart, 
  Lightbulb, 
  LinkIcon, 
  Lock, 
  Send, 
  Settings,
  Shuffle, 
  Wallet,
  X
} from 'lucide-react';
import SuggestedPromptsPanel from '@/components/SuggestedPromptsPanel';
import TransactionQueue from '@/components/TransactionQueue';
import ApiKeyInput from '@/components/ApiKeyInput';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import useApiKeys from '@/hooks/useApiKeys';
import { callFlockWeb3, createDefaultWeb3Tools, FlockWeb3Request } from '@/services/replicateService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type DeFiSection = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  concepts: Array<{
    title: string;
    description: string;
    resources: Array<{
      name: string;
      url: string;
      description: string;
    }>;
  }>;
  suggestedQuestions: string[];
};

const Web3Intro: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Welcome to Web3 Intro! What would you like to learn about DeFi today?' },
  ]);
  const [activeSection, setActiveSection] = useState('intro');
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(window.innerWidth < 1400);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useLocalAI, setUseLocalAI] = useState(true);
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434");
  const [showEndpointSettings, setShowEndpointSettings] = useState(false);
  const { apiKeys, updateApiKey } = useApiKeys();

  // Shared functionality with Chat component
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const userMessage = { role: 'user', content: messageInput };
    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsProcessing(true);
    
    try {
      let aiResponse = '';
      const currentSection = defiSections.find(section => section.id === activeSection);
      
      if (useLocalAI) {
        // Use local Llama 3.2 API
        try {
          const response = await fetch(`${localEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2',
              messages: [
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { 
                  role: 'user', 
                  content: `${messageInput}\n\nContext: We are discussing ${currentSection?.name || 'DeFi'}. ${currentSection?.description || ''}`
                }
              ],
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Error from local API: ${response.statusText}`);
          }
          
          const data = await response.json();
          aiResponse = data.message?.content || "No response from local model";
        } catch (error) {
          console.error("Error calling local model:", error);
          aiResponse = `I couldn't connect to the local model. ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      } else {
        // Use Flock Web3 model via Replicate
        if (!apiKeys.replicate) {
          aiResponse = "Please provide a Replicate API key in the settings to use the Flock Web3 model.";
        } else {
          const contextInfo = currentSection 
            ? `We are discussing ${currentSection.name}. ${currentSection.description}`
            : 'We are discussing DeFi (Decentralized Finance) in general.';
          
          const flockRequest: FlockWeb3Request = {
            query: `${messageInput}\n\nContext: ${contextInfo}`,
            tools: createDefaultWeb3Tools(),
            temperature: 0.7,
            top_p: 0.9,
            max_new_tokens: 3000
          };
          
          aiResponse = await callFlockWeb3(flockRequest);
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`
        }
      ]);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = defiSections.find(s => s.id === sectionId);
    if (section) {
      const aiMessage = { 
        role: 'assistant', 
        content: `Let's explore ${section.name}. ${section.description}`
      };
      setMessages([aiMessage]);
    }
  };

  const handleSelectQuestion = (question: string) => {
    setMessageInput(question);
  };

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsSuggestionsCollapsed(true);
      }
      if (window.innerWidth < 1200) {
        setIsHistoryCollapsed(true);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // DeFi sections data
  const defiSections: DeFiSection[] = [
    {
      id: 'intro',
      name: 'Introduction to DeFi',
      icon: Lightbulb,
      description: 'DeFi (Decentralized Finance) is an ecosystem of financial applications built on blockchain networks. It aims to recreate traditional financial systems in a decentralized way, removing intermediaries.',
      concepts: [
        {
          title: 'What is DeFi?',
          description: 'DeFi stands for Decentralized Finance and refers to financial applications built on blockchain technologies, typically using smart contracts.',
          resources: [
            {
              name: 'Ethereum.org DeFi Page',
              url: 'https://ethereum.org/en/defi/',
              description: 'Official Ethereum explanation of DeFi'
            }
          ]
        },
        {
          title: 'Key Principles',
          description: 'Permissionless, transparent, and non-custodial are the core principles of DeFi.',
          resources: [
            {
              name: 'Finematics',
              url: 'https://finematics.com/',
              description: 'Educational website about DeFi'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'What are the main benefits of DeFi?',
        'How is DeFi different from traditional finance?',
        'What are the risks associated with DeFi?'
      ]
    },
    {
      id: 'lending',
      name: 'Lending & Borrowing',
      icon: LinkIcon,
      description: 'Lending and borrowing platforms allow users to lend their cryptocurrencies and earn interest or borrow assets by providing collateral.',
      concepts: [
        {
          title: 'Overcollateralization',
          description: 'Most DeFi loans require users to deposit more value than they borrow as security.',
          resources: [
            {
              name: 'Aave',
              url: 'https://aave.com/',
              description: 'Decentralized lending platform'
            },
            {
              name: 'Compound',
              url: 'https://compound.finance/',
              description: 'Algorithmic money market protocol'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'How do interest rates work in DeFi lending?',
        'What happens if my collateral value drops?',
        'What is a liquidation in DeFi lending?'
      ]
    },
    {
      id: 'dex',
      name: 'Decentralized Exchanges',
      icon: Shuffle,
      description: 'Decentralized exchanges (DEXs) allow users to trade cryptocurrencies directly from their wallets without the need for an intermediary.',
      concepts: [
        {
          title: 'Automated Market Makers',
          description: 'AMMs use liquidity pools and mathematical formulas to determine asset prices instead of order books.',
          resources: [
            {
              name: 'Uniswap',
              url: 'https://uniswap.org/',
              description: 'Automated market maker DEX'
            },
            {
              name: 'PancakeSwap',
              url: 'https://pancakeswap.finance/',
              description: 'DEX on BNB Chain'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'What is impermanent loss?',
        'How do liquidity pools work?',
        'What is slippage in trading?'
      ]
    },
    {
      id: 'staking',
      name: 'Staking & Yield Farming',
      icon: Lock,
      description: 'Staking involves locking up cryptocurrencies to support network operations and earn rewards. Yield farming involves strategically providing liquidity to maximize returns.',
      concepts: [
        {
          title: 'Proof of Stake',
          description: 'A consensus mechanism where validators are selected based on the amount of cryptocurrency they hold and are willing to "stake".',
          resources: [
            {
              name: 'Lido',
              url: 'https://lido.fi/',
              description: 'Liquid staking solution'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'What is the difference between staking and yield farming?',
        'How are staking rewards calculated?',
        'What is liquid staking?'
      ]
    },
    {
      id: 'nft',
      name: 'NFTs & Marketplaces',
      icon: BarChart3,
      description: 'Non-Fungible Tokens (NFTs) represent ownership of unique items. NFT marketplaces facilitate buying, selling, and trading of these digital assets.',
      concepts: [
        {
          title: 'Digital Ownership',
          description: 'NFTs prove ownership of digital assets on the blockchain.',
          resources: [
            {
              name: 'OpenSea',
              url: 'https://opensea.io/',
              description: 'NFT marketplace'
            },
            {
              name: 'Blur',
              url: 'https://blur.io/',
              description: 'NFT marketplace for professional traders'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'How do NFT royalties work?',
        'What makes an NFT valuable?',
        'What are the environmental concerns with NFTs?'
      ]
    },
    {
      id: 'dao',
      name: 'DAOs & Governance',
      icon: GanttChart,
      description: 'Decentralized Autonomous Organizations (DAOs) are community-led entities with no central authority. Governance tokens give holders voting rights in these organizations.',
      concepts: [
        {
          title: 'On-Chain Governance',
          description: 'Voting and proposal systems implemented directly on the blockchain.',
          resources: [
            {
              name: 'MakerDAO',
              url: 'https://makerdao.com/',
              description: 'DAO governing the DAI stablecoin'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'How does voting work in a DAO?',
        'What is a governance token?',
        'What are the challenges facing DAOs?'
      ]
    },
    {
      id: 'wallets',
      name: 'Wallets & Security',
      icon: Wallet,
      description: 'Cryptocurrency wallets store private keys needed to access and manage your digital assets. Security practices are critical to protect your holdings.',
      concepts: [
        {
          title: 'Types of Wallets',
          description: 'Hot wallets (online) vs. cold wallets (offline) and their security implications.',
          resources: [
            {
              name: 'MetaMask',
              url: 'https://metamask.io/',
              description: 'Browser extension wallet'
            },
            {
              name: 'Ledger',
              url: 'https://www.ledger.com/',
              description: 'Hardware wallet'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'What is a seed phrase and how do I protect it?',
        'How do I recognize and avoid scams?',
        'What happens if I lose access to my wallet?'
      ]
    },
    {
      id: 'defi2',
      name: 'DeFi 2.0 & Beyond',
      icon: Coins,
      description: 'DeFi 2.0 refers to the next generation of DeFi protocols that address limitations of the first wave, focusing on sustainability, capital efficiency, and risk management.',
      concepts: [
        {
          title: 'Protocol-Owned Liquidity',
          description: 'Protocols that own their own liquidity rather than relying on incentivized users.',
          resources: [
            {
              name: 'Olympus DAO',
              url: 'https://www.olympusdao.finance/',
              description: 'Protocol with bonding mechanism'
            }
          ]
        }
      ],
      suggestedQuestions: [
        'What problems does DeFi 2.0 solve?',
        'What is protocol-owned liquidity?',
        'How are DeFi protocols becoming more sustainable?'
      ]
    }
  ];

  const renderResourceLink = (resource: { name: string, url: string, description: string }) => {
    return (
      <a 
        href={resource.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-1.5 text-primary hover:underline my-1"
      >
        <ExternalLink size={14} />
        {resource.name}
        <span className="text-muted-foreground text-xs">- {resource.description}</span>
      </a>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Section Navigation */}
        <div className={cn(
          "border-r bg-card/50 flex-shrink-0 transition-all duration-300 overflow-hidden flex flex-col",
          isHistoryCollapsed ? "w-0" : "w-1/4 md:w-1/5"
        )}>
          <div className="p-4 flex-1 overflow-hidden">
            <h2 className="text-xl font-bold mb-4">DeFi Topics</h2>
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 pr-4">
                {defiSections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => handleSelectSection(section.id)}
                  >
                    <section.icon className="mr-2 h-4 w-4" />
                    {section.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Transaction Queue in bottom half */}
          {!isHistoryCollapsed && (
            <div className="border-t pt-4 p-4 h-1/3 overflow-hidden">
              <h3 className="font-medium text-sm mb-2">Transaction Queue</h3>
              <div className="overflow-y-auto h-[calc(100%-2rem)]">
                <TransactionQueue />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Messages display */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg max-w-3xl",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
                {isProcessing && (
                  <div className="bg-muted p-4 rounded-lg max-w-3xl">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Active Section Info Display */}
            {activeSection && (
              <div className="border-t p-4 bg-card/50">
                <Tabs defaultValue="overview">
                  <TabsList className="mb-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          {defiSections.find(s => s.id === activeSection)?.icon && 
                            React.createElement(
                              defiSections.find(s => s.id === activeSection)?.icon || 'div', 
                              { className: "mr-2 h-4 w-4" }
                            )
                          }
                          {defiSections.find(s => s.id === activeSection)?.name}
                        </CardTitle>
                        <CardDescription>
                          {defiSections.find(s => s.id === activeSection)?.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="concepts">
                    <Card>
                      <CardContent className="pt-4">
                        {defiSections.find(s => s.id === activeSection)?.concepts.map((concept, i) => (
                          <div key={i} className="mb-4">
                            <h3 className="font-medium">{concept.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="resources">
                    <Card>
                      <CardContent className="pt-4">
                        {defiSections.find(s => s.id === activeSection)?.concepts.flatMap((concept) => 
                          concept.resources.map((resource, i) => (
                            <div key={i} className="mb-2">
                              {renderResourceLink(resource)}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Input area with settings */}
            <div className="border-t p-4 bg-background">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="web3-intro-local-ai"
                      checked={useLocalAI}
                      onCheckedChange={setUseLocalAI}
                    />
                    <Label htmlFor="web3-intro-local-ai" className="text-sm cursor-pointer select-none">
                      {useLocalAI ? "Llama 3.2 (Local)" : "Flock Web3 (Cloud)"}
                    </Label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowEndpointSettings(!showEndpointSettings)}
                    className="h-8 w-8"
                  >
                    <Settings size={14} />
                  </Button>
                </div>
              </div>
              
              {showEndpointSettings && (
                <div className="mb-4 p-3 border rounded-md bg-muted/40 space-y-3 relative">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 absolute top-2 right-2"
                    onClick={() => setShowEndpointSettings(false)}
                  >
                    <X size={12} />
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="web3-intro-local-endpoint" className="text-xs">Local Endpoint</Label>
                    <Textarea
                      id="web3-intro-local-endpoint"
                      placeholder="http://localhost:11434"
                      value={localEndpoint}
                      onChange={(e) => setLocalEndpoint(e.target.value)}
                      className="h-8 text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <ApiKeyInput 
                      label="Replicate API Key"
                      apiKey={apiKeys.replicate}
                      onChange={(key) => updateApiKey('replicate', key)}
                      placeholder="Enter your Replicate API key"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about Web3 or DeFi..."
                  className="min-h-[60px] flex-1"
                />
                <Button onClick={handleSendMessage} className="self-end" disabled={isProcessing}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Suggested Prompts */}
        <div className={cn(
          "flex-shrink-0 transition-all duration-300 p-4 overflow-hidden",
          isSuggestionsCollapsed ? "w-0" : "w-1/4 md:w-1/5"
        )}>
          <SuggestedPromptsPanel
            onSelectQuestion={handleSelectQuestion}
            onCollapseChange={setIsSuggestionsCollapsed}
            defaultCollapsed={isSuggestionsCollapsed}
          />
        </div>
      </div>
    </div>
  );
};

export default Web3Intro;

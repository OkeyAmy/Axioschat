
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
  Shuffle, 
  Wallet
} from 'lucide-react';
import SuggestedPromptsPanel from '@/components/SuggestedPromptsPanel';
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

  // Shared functionality with Chat component
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const userMessage = { role: 'user', content: messageInput };
    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsProcessing(true);
    
    // Simulate AI response
    setTimeout(() => {
      const currentSection = defiSections.find(section => section.id === activeSection);
      let responseContent = `I'd be happy to tell you about ${currentSection?.name || 'DeFi'}. `;
      
      if (currentSection) {
        responseContent += `${currentSection.description} You can explore more specific concepts within this section or ask me questions about ${currentSection.name}.`;
      } else {
        responseContent += 'DeFi (Decentralized Finance) refers to financial applications built on blockchain technologies, typically using smart contracts. It aims to recreate and improve on traditional financial systems without the need for intermediaries like banks.';
      }
      
      const aiResponse = { role: 'assistant', content: responseContent };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1000);
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
          "border-r bg-card/50 flex-shrink-0 transition-all duration-300 overflow-hidden",
          isHistoryCollapsed ? "w-0" : "w-1/4 md:w-1/5"
        )}>
          <div className="p-4 h-full">
            <h2 className="text-xl font-bold mb-4">DeFi Topics</h2>
            <ScrollArea className="h-[calc(100vh-12rem)]">
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Messages display */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4 p-4">
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
          </div>

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

          {/* Input area */}
          <div className="border-t p-4 bg-background">
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

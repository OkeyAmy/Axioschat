
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lightbulb, ArrowRightCircle, ArrowLeftCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SuggestedPromptsPanelProps {
  onSelectQuestion: (question: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  customPrompts?: Array<{
    name: string;
    prompts: string[];
  }>;
}

const SuggestedPromptsPanel: React.FC<SuggestedPromptsPanelProps> = ({ 
  onSelectQuestion, 
  onCollapseChange,
  defaultCollapsed = false,
  customPrompts
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Example categories and prompts
  const defaultPromptCategories = [
    {
      name: "Smart Contracts",
      prompts: [
        "How do I deploy a smart contract?",
        "What are common security vulnerabilities?",
        "How do I verify my contract on Etherscan?"
      ]
    },
    {
      name: "DeFi",
      prompts: [
        "How do lending protocols work?",
        "What is yield farming?",
        "Explain impermanent loss"
      ]
    },
    {
      name: "NFTs",
      prompts: [
        "How do I mint an NFT collection?",
        "What are the benefits of ERC721 vs ERC1155?",
        "How do I add metadata to my NFTs?"
      ]
    },
    {
      name: "Web3 Development",
      prompts: [
        "How to connect to a wallet using ethers.js?",
        "What's the difference between EIP-1559 and legacy transactions?",
        "How to estimate gas for a transaction?"
      ]
    }
  ];

  // Use custom prompts if provided, otherwise use default
  const promptCategories = customPrompts || defaultPromptCategories;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-collapse on smaller screens
      if (window.innerWidth < 1400 && !isCollapsed) {
        setIsCollapsed(true);
        onCollapseChange?.(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed, onCollapseChange]);

  // Update collapsed state and notify parent
  const handleCollapseChange = (open: boolean) => {
    const newCollapsedState = !open;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  // Sync with parent's defaultCollapsed prop changes
  useEffect(() => {
    if (defaultCollapsed !== isCollapsed) {
      setIsCollapsed(defaultCollapsed);
    }
  }, [defaultCollapsed]);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {promptCategories.map((category, categoryIndex) => (
            <div key={category.name} className="space-y-3 animate-in fade-in-50" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
              <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                <Badge variant="outline" className="mr-2 bg-primary/10 text-primary border-primary/20">
                  {category.name}
                </Badge>
              </h4>
              <div className="grid gap-2">
                {category.prompts.map((prompt, promptIndex) => (
                  <Button 
                    key={prompt} 
                    variant="outline" 
                    className="justify-start text-sm h-auto py-3 px-4 font-normal bg-secondary/40 border-secondary/30 hover:bg-secondary/60 transition-all duration-300 animate-in slide-in-from-right-4 break-words text-left"
                    style={{ animationDelay: `${(categoryIndex * 100) + (promptIndex * 50)}ms` }}
                    onClick={() => onSelectQuestion(prompt)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <Lightbulb size={14} className="mt-0.5 text-primary flex-shrink-0" />
                      <span className="break-words whitespace-normal">{prompt}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SuggestedPromptsPanel;

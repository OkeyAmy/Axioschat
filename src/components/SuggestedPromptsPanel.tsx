
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lightbulb, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedPromptsPanelProps {
  onSelectQuestion: (question: string) => void;
}

const SuggestedPromptsPanel: React.FC<SuggestedPromptsPanelProps> = ({ onSelectQuestion }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Example categories and questions
  const promptCategories = [
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
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse on smaller screens
  useEffect(() => {
    if (windowWidth < 1400) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [windowWidth]);

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <div className={cn(
        "bg-card/80 backdrop-blur-sm border rounded-lg h-full transition-all duration-300",
        isCollapsed ? "w-14" : "w-full"
      )}>
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && <h3 className="text-sm font-medium">Suggested Prompts</h3>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              {isCollapsed ? <Lightbulb size={16} /> : <ArrowRightCircle size={16} />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-6">
              {promptCategories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{category.name}</h4>
                  <div className="grid gap-2">
                    {category.prompts.map((prompt) => (
                      <Button 
                        key={prompt} 
                        variant="outline" 
                        className="justify-start text-sm h-auto py-3 px-4 font-normal bg-accent/20 border-accent/20 hover-scale"
                        onClick={() => onSelectQuestion(prompt)}
                      >
                        <div className="flex items-start gap-2">
                          <Lightbulb size={14} className="mt-0.5 text-primary/70" />
                          <span>{prompt}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default SuggestedPromptsPanel;

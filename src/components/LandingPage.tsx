
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface LandingPageProps {
  onGetStarted: () => void;
  onAskQuestion: (question: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAskQuestion }) => {
  const [question, setQuestion] = useState("");

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onAskQuestion(question.trim());
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          NovachatV2
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
          The next generation of Web3 conversational AI, powered by the 
          <span className="font-semibold"> Flock Web3 Agent Model</span>
        </p>
        
        {/* Immediate Question Input */}
        <Card className="w-full max-w-2xl mb-8 border shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about Web3, blockchain, or smart contracts..."
                className="resize-none min-h-[80px]"
              />
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={onGetStarted}
                >
                  Just Browse
                </Button>
                <Button 
                  type="submit" 
                  disabled={!question.trim()}
                  className="gap-2"
                >
                  <Send size={16} />
                  Ask Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="animate-bounce mt-8">
          <ArrowDown className="text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Capabilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Web3 Knowledge" 
              description="Access comprehensive knowledge about blockchain technologies, smart contracts, and decentralized applications."
            />
            <FeatureCard 
              title="Real-time Interactions" 
              description="Connect your wallet and interact with blockchain data in real-time through natural conversation."
            />
            <FeatureCard 
              title="Developer Tools" 
              description="Get help with smart contract development, code reviews, and blockchain integration."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to experience the future of Web3 AI?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet and start chatting with the most advanced Web3 AI assistant.
          </p>
          <Button onClick={onGetStarted} size="lg" className="px-8 gap-2">
            Get Started Now
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card border rounded-lg p-6 transition-all hover:shadow-md">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default LandingPage;

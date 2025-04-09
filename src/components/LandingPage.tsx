
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          NovachatV2
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
          The next generation of Web3 conversational AI, powered by the 
          <span className="font-semibold"> Flock Web3 Agent Model</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Button onClick={onGetStarted} size="lg" className="px-8">
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.open("https://huggingface.co/", "_blank")}>
            Learn More
          </Button>
        </div>
        
        <div className="animate-bounce mt-12">
          <ArrowDown className="text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Capabilities</h2>
          
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
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to experience the future of Web3 AI?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet and start chatting with the most advanced Web3 AI assistant.
          </p>
          <Button onClick={onGetStarted} size="lg" className="px-8">
            Get Started Now
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

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowRight, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import Header from "@/components/Header"

const Landing = () => {
  const [question, setQuestion] = useState("")
  const navigate = useNavigate()

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    const params = question.trim() ? `?question=${encodeURIComponent(question.trim())}` : ""
    navigate(`/chat${params}`)
  }

  const handleGetStarted = () => {
    navigate("/chat")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-400 to-blue-500 bg-clip-text text-transparent animated-gradient-text">
            NovachatV2
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
            The next generation of Web3 conversational AI, powered by the
            <span className="font-semibold"> Flock Web3 Agent Model</span>
          </p>

          {/* Immediate Question Input */}
          <Card className="w-full max-w-2xl mb-8 border shadow-md bg-card/80 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-4">
              <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about Web3, blockchain, or smart contracts..."
                    className="resize-none min-h-[60px] flex-1"
                  />
                  <Button type="submit" className="h-full min-w-[100px] flex items-center justify-center gap-2">
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
            <Button onClick={handleGetStarted} size="lg" className="px-8 gap-2 hover-scale">
              Get Started Now
              <ArrowRight size={16} />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card/60 backdrop-blur-sm border rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:bg-card/80 hover-scale">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
)

export default Landing

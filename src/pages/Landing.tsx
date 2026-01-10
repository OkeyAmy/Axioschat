"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, Sparkles, Brain, Rocket, Database, Code, Bot, ChevronRight, BadgeCheck, Zap, ChevronDown, BookOpen, Repeat, Shield, Coins, CheckCircle, XCircle, Wallet, ArrowLeftRight, CreditCard, Lock, Share2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import Header from "@/components/Header"
import { cn, useAB } from "@/lib/utils"
import { motion } from 'framer-motion'

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

  const variant = useAB('/landing')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background/95">
      <Header />
      <div className="flex-1 flex flex-col">
        {/* Hero Section - Updated for MNEE Agentic Wallet */}
        <section className="relative flex flex-col items-center justify-center py-16 md:py-24 px-4 text-center overflow-hidden">
          {/* Decorative animated blobs */}
          <motion.div
            className="absolute top-10 left-10 w-60 h-60 bg-purple-500/20 rounded-full filter blur-3xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20 animate-float">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            AI That Pays: The First Agentic Wallet
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl"
          >
            Transform conversations into transactions. Your AI agent doesn't just talk about crypto—it manages MNEE assets autonomously.
          </motion.p>
          <div className="flex gap-4 mb-8">
            <Button onClick={handleGetStarted} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-md hover:opacity-90">
              Try Agentic Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/chat')} className="px-6 py-3 border-indigo-500 text-indigo-500 rounded-xl hover:bg-indigo-500/10 flex items-center gap-1">
              View Technical Docs
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Immediate Question Input */}
          <Card className="w-full max-w-2xl mb-10 border shadow-lg rounded-2xl bg-background/70 backdrop-blur-md animate-fade-in hover:scale-105 transition-transform duration-300">
            <CardContent className="p-5">
              <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder='Try: "Send 5 MNEE to @Alice for coffee"'
                    className="resize-none min-h-[60px] flex-1 rounded-xl border-muted-foreground/20 focus-visible:ring-indigo-500"
                  />
                  <Button 
                    type="submit" 
                    className="h-full min-w-[100px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md"
                  >
                    <Send size={16} />
                    Act
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Badge icon={Zap} text="MNEE Powered" />
            <Badge icon={Brain} text="Autonomous Agents" />
            <Badge icon={BadgeCheck} text="Secure HDWallet" />
          </div>
        </section>

        {/* Problem Statement Section - New */}
        <section className="py-20 bg-muted/30 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 mb-4 backdrop-blur-sm">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">The Problem: Friction & Passive AI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Current crypto tools are disconnected from where conversations happen, and AI agents are passive observers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={ArrowLeftRight}
                title="Context Switching"
                description="Sending money during a chat requires switching apps, copying addresses, and breaking the flow."
                delay="0ms"
                color="red"
              />
              <FeatureCard
                icon={Bot}
                title="Passive Agents"
                description="Standard AI can talk about crypto but can't execute transactions without complex manual bridging."
                delay="150ms"
                color="red"
              />
              <FeatureCard
                icon={Lock}
                title="Clunky UX"
                description="Wallet interfaces are often intimidating and disconnected from social interactions."
                delay="300ms"
                color="red"
              />
            </div>
          </div>
        </section>

        {/* Solution Showcase - MNEE Agentic Wallet */}
        <section className="py-20 bg-gradient-to-b from-background to-indigo-500/5 relative overflow-hidden">
           <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-4 backdrop-blur-sm">
                <Wallet className="h-7 w-7 text-indigo-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">The Solution: MNEE Agentic Wallet</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A native MNEE wallet integrated directly into the AI persona, enabling "Text-to-Pay" and autonomous asset management.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div className="space-y-8">
                  <SolutionStep 
                    number="1"
                    title="Natural Language Transfers"
                    description='Simply say "Send 5 MNEE to @Alice". The agent resolves the address and prepares the transaction.'
                    icon={Share2}
                  />
                  <SolutionStep 
                    number="2"
                    title="Smart Tipping"
                    description="Tip content creators or service providers instantly based on context, without leaving the chat."
                    icon={Coins}
                  />
                  <SolutionStep 
                    number="3"
                    title="Automated Management"
                    description="Agent proactively monitors your MNEE balance and UTXOs, alerting you to low funds or incoming payments."
                    icon={Database}
                  />
               </div>
               <div className="relative">
                  {/* Mock Chat Interface showing Transaction */}
                  <div className="bg-background border rounded-2xl shadow-2xl p-4 max-w-md mx-auto">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                         <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                           Send 5 MNEE to Alice for the coffee.
                         </div>
                      </div>
                      <div className="flex justify-start">
                         <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] shadow-sm border">
                           <p className="mb-2 text-sm">I've prepared a transaction of <strong>5 MNEE</strong> to Alice (1FQ6...).</p>
                           <div className="bg-background border rounded-xl p-3 mb-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Amount</span>
                                <span>5.00 MNEE</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Fee</span>
                                <span>0.0001 ETH</span>
                              </div>
                              <div className="flex justify-between text-xs font-medium">
                                <span>Total</span>
                                <span>5.00 MNEE</span>
                              </div>
                           </div>
                           <Button size="sm" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white h-8">
                             Confirm & Sign
                           </Button>
                         </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative Elements around phone */}
                  <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
               </div>
            </div>
          </div>
        </section>

        {/* Technical Implementation Section */}
        <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10 pointer-events-none" />
          
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-4 backdrop-blur-sm">
                <Code className="h-7 w-7 text-purple-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Built on MNEE SDK</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Leveraging the full power of MNEE's TypeScript SDK for secure, efficient blockchain interactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <TechCard 
                 title="HDWallet Integration"
                 code="Mnee.HDWallet.derive(path)"
                 description="Derives specific 'Agent Sub-Accounts' to keep funds segregated but accessible."
               />
               <TechCard 
                 title="Zero-Friction Transfers"
                 code="mnee.transfer({ ... })"
                 description="Constructs raw transactions locally for user signature, ensuring non-custodial security."
               />
               <TechCard 
                 title="UTXO Management"
                 code="mnee.getUtxos(address)"
                 description="Intelligent UTXO selection for optimizing fees and transaction reliability."
               />
               <TechCard 
                 title="Multi-Party Tx"
                 code="mnee.transferMulti(...)"
                 description="Enables complex split payments and batched transactions in a single atomic action."
               />
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4 bg-background">
           <div className="container mx-auto max-w-6xl">
             <div className="text-center mb-16">
               <h2 className="text-3xl font-bold mb-4">Real-World Use Cases</h2>
               <p className="text-muted-foreground">Unlocking new economic flows with Agentic Commerce</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <UseCaseCard 
                 icon={CreditCard}
                 title="Micro-Payments"
                 description="Pay-per-use AI services or content without subscriptions, powered by MNEE's low fees."
               />
               <UseCaseCard 
                 icon={Share2}
                 title="Creator Tipping"
                 description="Instantly tip authors, developers, or artists directly from the content context."
               />
               <UseCaseCard 
                 icon={Bot}
                 title="Agentic Commerce"
                 description="Autonomous agents managing budgets to execute tasks like booking or purchasing on your behalf."
               />
             </div>
           </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 text-center bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 font-medium text-sm mb-6 border border-indigo-500/20">
              Built for MNEE Hackathon 2025
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Experience the Future of Payments</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Don't just chat about crypto. Use an AI agent that can actually pay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted} 
                size="lg" 
                className="px-8 gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md transition-all hover:shadow-lg"
              >
                Launch Agentic Wallet
                <ArrowRight size={16} />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="px-8 rounded-full border-indigo-500/20 hover:bg-indigo-500/5"
              >
                View GitHub Repo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  delay,
  tagLabel,
  color = "indigo"
}: { 
  icon: React.ElementType,
  title: string; 
  description: string;
  delay: string;
  tagLabel?: string;
  color?: "indigo" | "red";
}) => (
  <div 
    className="bg-background/80 backdrop-blur-sm border border-muted-foreground/10 rounded-xl p-6 
    transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30 hover:translate-y-[-4px] 
    group relative overflow-hidden animate-fade-in" 
    style={{ animationDelay: delay }}
  >
    <div className={cn(
      "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
      color === "red" ? "from-red-500/5 via-orange-500/5 to-yellow-500/5" : "from-indigo-500/5 via-purple-500/5 to-pink-500/5"
    )} />
    
    <div className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-md relative z-10",
      color === "red" ? "bg-gradient-to-br from-red-500 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-purple-500"
    )}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
  </div>
)

const SolutionStep = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold border border-indigo-500/20">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
)

const TechCard = ({ title, code, description }: { title: string, code: string, description: string }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
    <h3 className="text-lg font-semibold text-indigo-400 mb-2">{title}</h3>
    <div className="bg-black/40 rounded-md p-2 mb-3 font-mono text-xs text-gray-300 border border-white/5">
      {code}
    </div>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
)

const UseCaseCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
    <Icon className="h-10 w-10 text-indigo-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
)

const Badge = ({ 
  icon: Icon, 
  text 
}: {
  icon: React.ElementType,
  text: string
}) => (
  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-500/20">
    <Icon className="h-3.5 w-3.5 text-indigo-500" />
    <span>{text}</span>
  </div>
)

export default Landing
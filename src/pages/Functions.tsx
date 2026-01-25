"use client"

import React, { useState } from "react"
import Header from "@/components/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, ArrowRightLeft, FileCode, Share2 } from "lucide-react"
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react"
import WalletSection from "@/components/functions/WalletSection"
import DexSection from "@/components/functions/DexSection"
import ContractsSection from "@/components/functions/ContractsSection"
import TransferSection from "@/components/functions/TransferSection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton } from "thirdweb/react"
import { thirdwebClient } from "@/components/ThirdwebProviderWrapper"

const Functions: React.FC = () => {
  const account = useActiveAccount()
  const activeChain = useActiveWalletChain()
  const isConnected = !!account
  const [currentChain, setCurrentChain] = useState(activeChain?.id || 1)

  // Update currentChain when activeChain changes
  React.useEffect(() => {
    if (activeChain?.id) {
      setCurrentChain(activeChain.id)
    }
  }, [activeChain?.id])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Please connect your Web3 wallet to access blockchain functions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Connect your wallet to send transactions, swap tokens, and interact with smart contracts.
                </p>
                <ConnectButton
                  client={thirdwebClient}
                  connectButton={{
                    label: "Connect Wallet",
                    className: "!w-full !bg-gradient-to-r !from-indigo-500 !to-purple-500 !text-white !rounded-xl !px-4 !py-2 !text-sm !font-medium hover:!opacity-90 !transition-opacity !shadow-md",
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Blockchain Functions
          </h1>
          <p className="text-muted-foreground mt-2">
            Interact with the blockchain using these powerful Web3 functions.
          </p>
        </div>

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="dex" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">DEX</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Contracts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet">
            <WalletSection currentChain={currentChain} setCurrentChain={setCurrentChain} />
          </TabsContent>

          <TabsContent value="transfer">
            <TransferSection currentChain={currentChain} />
          </TabsContent>

          <TabsContent value="dex">
            <DexSection />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default Functions


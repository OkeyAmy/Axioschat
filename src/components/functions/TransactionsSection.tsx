"use client"

/**
 * Transactions Section Component
 * 
 * Shows status of token transfer capabilities:
 * - Native token transfers: Available via Thirdweb
 * - ERC20 transfers: Coming Soon
 */

import type React from "react"
import { FunctionCard } from "./FunctionCard"
import { Share2, Clock, CheckCircle, ArrowRight, Coins, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TransferSectionProps {
  currentChain: number
}

const TransferSection: React.FC<TransferSectionProps> = ({ currentChain }) => {
  return (
    <FunctionCard title="Token Transfers" description="Send tokens to other addresses" icon={Share2}>
      <div className="space-y-4">
        {/* Available Feature */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30">
          <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/50">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-green-900 dark:text-green-100">Native Token Transfers</p>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-xs">
                Available
              </Badge>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Send ETH, MATIC, BNB, AVAX and other native tokens via the Transfer section
            </p>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">ERC-20 Token Transfers</p>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transfer USDT, USDC, and other ERC-20 tokens
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
          <div className="p-1.5 rounded-md bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">NFT Transfers (ERC-721/1155)</p>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transfer NFTs between wallets
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Use the Transfer section in the Wallet tab for native token transfers
          </p>
        </div>
      </div>
    </FunctionCard>
  )
}

export default TransferSection

/*
============================================================================
COMMENTED OUT - Original TransactionsSection implementation using web3.js
============================================================================

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FunctionCard } from "./FunctionCard"
import { Share2, ExternalLink, CheckCircle2 } from "lucide-react"
import { useWeb3 } from "@/hooks/useWeb3"
import { sendTransaction, getTxUrl } from "@/utils/blockchain"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Full TransferSection component implementation was here...
// This included token selection, amount input, address validation,
// transaction submission, and transaction status display.

============================================================================
END COMMENTED OUT SECTION
============================================================================
*/

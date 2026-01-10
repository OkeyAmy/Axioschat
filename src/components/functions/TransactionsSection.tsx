"use client"

/**
 * Transactions Section Component
 * 
 * TEMPORARILY DISABLED - Requires web3.js functionality that is not available
 * 
 * This component previously provided:
 * - Token transfers (native and ERC20)
 * - Transaction history display
 * - Address validation
 * 
 * The functionality has been commented out because:
 * 1. The useWeb3 hook now returns web3: null (migrated to Thirdweb)
 * 2. Token transfers require web3.eth.sendTransaction which is not available
 * 3. ERC20 transfers require web3.eth.Contract for token interaction
 * 
 * NOTE: Native token transfers ARE available via the TransferSection component
 * which uses Thirdweb's useSendTransaction hook.
 * 
 * TODO: Re-implement ERC20 transfers using Thirdweb's contract interaction patterns
 */

import type React from "react"
import { FunctionCard } from "./FunctionCard"
import { Share2, Wrench } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TransferSectionProps {
  currentChain: number
}

const TransferSection: React.FC<TransferSectionProps> = ({ currentChain }) => {
  return (
    <FunctionCard title="Send Tokens" description="Transfer tokens to another address" icon={Share2}>
      <Alert>
        <Wrench className="h-4 w-4" />
        <AlertTitle>Feature Under Development</AlertTitle>
        <AlertDescription>
          This token transfer functionality is currently being updated.
          For native token transfers (ETH, MATIC, BNB, etc.), please use the
          Transfer section in the Wallet tab which supports wallet signing.
        </AlertDescription>
      </Alert>
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

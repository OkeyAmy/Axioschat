"use client"

import { useEffect, useState, useCallback } from "react"
import { useSendTransaction, useActiveAccount, useActiveWalletChain } from "thirdweb/react"
import { prepareTransaction, toWei } from "thirdweb"
import { ethereum, polygon, bsc, arbitrum, optimism, base, avalanche, sepolia } from "thirdweb/chains"
import { thirdwebClient } from "./ThirdwebProviderWrapper"
import { transactionBridge, type TransactionRequest } from "@/services/transactionBridge"
import { saveLocalTransaction } from "@/services/thirdwebService"
import { toast } from "@/components/ui/use-toast"

// Chain mapping
const chainById: Record<number, any> = {
    1: ethereum,
    137: polygon,
    56: bsc,
    42161: arbitrum,
    10: optimism,
    8453: base,
    43114: avalanche,
    11155111: sepolia,
}

// Native token symbols by chain
const nativeSymbolByChain: Record<number, string> = {
    1: "ETH",
    137: "MATIC",
    56: "BNB",
    42161: "ETH",
    10: "ETH",
    8453: "ETH",
    43114: "AVAX",
    11155111: "ETH",
}

interface TransactionExecutorProps {
    onTransactionComplete?: (result: { id: string; success: boolean; txHash?: string; error?: string }) => void
}

/**
 * TransactionExecutor Component
 * 
 * This component listens for transaction requests from the transactionBridge
 * and executes them using Thirdweb's useSendTransaction hook.
 * 
 * It acts as a bridge between the AI service (which can't use React hooks)
 * and the actual wallet transaction execution.
 */
const TransactionExecutor: React.FC<TransactionExecutorProps> = ({ onTransactionComplete }) => {
    const account = useActiveAccount()
    const activeChain = useActiveWalletChain()
    const { mutate: sendTx, isPending } = useSendTransaction()
    const [pendingRequest, setPendingRequest] = useState<TransactionRequest | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Handle incoming transaction requests
    const handleTransactionRequest = useCallback((request: TransactionRequest) => {
        console.log("[TransactionExecutor] Received transaction request:", request)
        
        // Only handle pending requests
        if (request.status === "pending" && !isProcessing) {
            setPendingRequest(request)
        }
    }, [isProcessing])

    // Subscribe to transaction requests
    useEffect(() => {
        const unsubscribe = transactionBridge.onTransactionRequest(handleTransactionRequest)
        
        // Also check for any existing pending requests
        const existingRequests = transactionBridge.getPendingRequests()
        if (existingRequests.length > 0 && !pendingRequest && !isProcessing) {
            const firstPending = existingRequests.find(r => r.status === "pending")
            if (firstPending) {
                setPendingRequest(firstPending)
            }
        }

        return unsubscribe
    }, [handleTransactionRequest, pendingRequest, isProcessing])

    // Execute the pending transaction
    useEffect(() => {
        if (!pendingRequest || isProcessing || !account) {
            return
        }

        const executeTransaction = async () => {
            const { id, toAddress, amount, chainId } = pendingRequest
            
            setIsProcessing(true)
            transactionBridge.updateTransactionStatus(id, "signing")

            try {
                const chain = chainById[chainId] || ethereum
                const nativeSymbol = nativeSymbolByChain[chainId] || "ETH"

                // Show toast that transaction is being prepared
                toast({
                    title: "Transaction Requested",
                    description: `Sending ${amount} ${nativeSymbol} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}. Please confirm in your wallet.`,
                })

                // Prepare the transaction
                const transaction = prepareTransaction({
                    to: toAddress,
                    value: toWei(amount),
                    chain,
                    client: thirdwebClient,
                })

                // Send the transaction - this will trigger the wallet popup
                sendTx(transaction, {
                    onSuccess: (result) => {
                        console.log("[TransactionExecutor] Transaction successful:", result)
                        
                        transactionBridge.updateTransactionStatus(id, "confirmed", result.transactionHash)
                        
                        // Save to local history
                        saveLocalTransaction({
                            hash: result.transactionHash,
                            from: account.address,
                            to: toAddress,
                            value: `${amount} ${nativeSymbol}`,
                            timestamp: Date.now(),
                            status: "Success",
                            type: "Transfer",
                        })

                        // Report success to the bridge
                        transactionBridge.reportResult({
                            id,
                            success: true,
                            txHash: result.transactionHash,
                        })

                        // Notify parent component
                        onTransactionComplete?.({
                            id,
                            success: true,
                            txHash: result.transactionHash,
                        })

                        toast({
                            title: "Transaction Successful!",
                            description: `Sent ${amount} ${nativeSymbol} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
                        })

                        setPendingRequest(null)
                        setIsProcessing(false)
                    },
                    onError: (error) => {
                        console.error("[TransactionExecutor] Transaction failed:", error)
                        
                        const errorMessage = error.message || "Transaction failed"
                        
                        transactionBridge.updateTransactionStatus(id, "failed", undefined, errorMessage)
                        
                        // Report failure to the bridge
                        transactionBridge.reportResult({
                            id,
                            success: false,
                            error: errorMessage,
                        })

                        // Notify parent component
                        onTransactionComplete?.({
                            id,
                            success: false,
                            error: errorMessage,
                        })

                        toast({
                            title: "Transaction Failed",
                            description: errorMessage,
                            variant: "destructive",
                        })

                        setPendingRequest(null)
                        setIsProcessing(false)
                    },
                })
            } catch (error) {
                console.error("[TransactionExecutor] Error preparing transaction:", error)
                
                const errorMessage = error instanceof Error ? error.message : "Failed to prepare transaction"
                
                transactionBridge.updateTransactionStatus(id, "failed", undefined, errorMessage)
                transactionBridge.reportResult({
                    id,
                    success: false,
                    error: errorMessage,
                })

                onTransactionComplete?.({
                    id,
                    success: false,
                    error: errorMessage,
                })

                toast({
                    title: "Transaction Error",
                    description: errorMessage,
                    variant: "destructive",
                })

                setPendingRequest(null)
                setIsProcessing(false)
            }
        }

        executeTransaction()
    }, [pendingRequest, isProcessing, account, sendTx, onTransactionComplete])

    // Handle wallet not connected
    useEffect(() => {
        if (pendingRequest && !account) {
            const errorMessage = "Wallet not connected. Please connect your wallet to send transactions."
            
            transactionBridge.reportResult({
                id: pendingRequest.id,
                success: false,
                error: errorMessage,
            })

            toast({
                title: "Wallet Not Connected",
                description: errorMessage,
                variant: "destructive",
            })

            setPendingRequest(null)
        }
    }, [pendingRequest, account])

    // This component doesn't render anything visible
    // It just handles transaction execution in the background
    return null
}

export default TransactionExecutor



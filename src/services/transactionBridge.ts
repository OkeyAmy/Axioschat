/**
 * Transaction Bridge Service
 * 
 * This service provides an event-based bridge between the AI service (which runs outside React)
 * and the UI layer (which can use Thirdweb hooks for actual transaction execution).
 * 
 * The AI service requests transactions through this bridge, and the TransactionExecutor
 * component listens and executes them using useSendTransaction hook.
 */

import { v4 as uuidv4 } from "uuid"

export interface TransactionRequest {
    id: string
    type: "send_token" | "contract_call"
    toAddress: string
    amount: string
    chainId: number
    tokenAddress?: string // "native" for native tokens, or ERC20 address
    data?: string // For contract calls
    status: "pending" | "signing" | "submitted" | "confirmed" | "failed" | "rejected"
    txHash?: string
    error?: string
    createdAt: number
}

export interface TransactionResult {
    id: string
    success: boolean
    txHash?: string
    error?: string
}

type TransactionListener = (request: TransactionRequest) => void
type ResultListener = (result: TransactionResult) => void

class TransactionBridge {
    private pendingRequests: Map<string, TransactionRequest> = new Map()
    private transactionListeners: Set<TransactionListener> = new Set()
    private resultListeners: Map<string, ResultListener> = new Map()

    /**
     * Request a transaction to be executed by the UI layer
     * Returns a promise that resolves when the transaction is completed
     */
    async requestTransaction(
        toAddress: string,
        amount: string,
        chainId: number,
        tokenAddress: string = "native"
    ): Promise<TransactionResult> {
        const id = uuidv4()
        
        const request: TransactionRequest = {
            id,
            type: "send_token",
            toAddress,
            amount,
            chainId,
            tokenAddress,
            status: "pending",
            createdAt: Date.now(),
        }

        this.pendingRequests.set(id, request)

        // Notify all listeners about the new transaction request
        this.transactionListeners.forEach(listener => {
            try {
                listener(request)
            } catch (error) {
                console.error("Error in transaction listener:", error)
            }
        })

        // Return a promise that resolves when the transaction completes
        return new Promise((resolve) => {
            this.resultListeners.set(id, (result) => {
                this.pendingRequests.delete(id)
                this.resultListeners.delete(id)
                resolve(result)
            })

            // Timeout after 5 minutes
            setTimeout(() => {
                if (this.resultListeners.has(id)) {
                    this.resultListeners.delete(id)
                    this.pendingRequests.delete(id)
                    resolve({
                        id,
                        success: false,
                        error: "Transaction request timed out"
                    })
                }
            }, 5 * 60 * 1000)
        })
    }

    /**
     * Subscribe to transaction requests
     * Used by TransactionExecutor component
     */
    onTransactionRequest(listener: TransactionListener): () => void {
        this.transactionListeners.add(listener)
        return () => {
            this.transactionListeners.delete(listener)
        }
    }

    /**
     * Update transaction status
     * Called by TransactionExecutor as the transaction progresses
     */
    updateTransactionStatus(id: string, status: TransactionRequest["status"], txHash?: string, error?: string): void {
        const request = this.pendingRequests.get(id)
        if (request) {
            request.status = status
            if (txHash) request.txHash = txHash
            if (error) request.error = error

            // Notify listeners about status update
            this.transactionListeners.forEach(listener => {
                try {
                    listener(request)
                } catch (err) {
                    console.error("Error in transaction listener:", err)
                }
            })
        }
    }

    /**
     * Report transaction result
     * Called by TransactionExecutor when transaction completes or fails
     */
    reportResult(result: TransactionResult): void {
        const listener = this.resultListeners.get(result.id)
        if (listener) {
            listener(result)
        }
    }

    /**
     * Get all pending transaction requests
     */
    getPendingRequests(): TransactionRequest[] {
        return Array.from(this.pendingRequests.values())
    }

    /**
     * Get a specific transaction request by ID
     */
    getRequest(id: string): TransactionRequest | undefined {
        return this.pendingRequests.get(id)
    }

    /**
     * Cancel a pending transaction request
     */
    cancelRequest(id: string): void {
        const request = this.pendingRequests.get(id)
        if (request && request.status === "pending") {
            this.reportResult({
                id,
                success: false,
                error: "Transaction cancelled by user"
            })
        }
    }
}

// Singleton instance
export const transactionBridge = new TransactionBridge()

// Make it available globally for debugging
if (typeof window !== "undefined") {
    (window as any).transactionBridge = transactionBridge
}




"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, User, Loader2, SendHorizonal, Copy, Check, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useActiveAccount, useActiveWalletChain, useSendTransaction } from "thirdweb/react"
import { prepareTransaction, toWei } from "thirdweb"
import { getWalletBalance } from "thirdweb/wallets"
import { thirdwebClient } from "@/components/ThirdwebProviderWrapper"
import { useTransactionQueue } from "@/hooks/useTransactionQueue"
import { FunctionCard } from "./FunctionCard"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ethereum, polygon, bsc, arbitrum, optimism, base, avalanche, sepolia } from "thirdweb/chains"

// Chain mapping for Thirdweb
const chainById: Record<number, any> = {
    [ethereum.id]: ethereum,
    [polygon.id]: polygon,
    [bsc.id]: bsc,
    [arbitrum.id]: arbitrum,
    [optimism.id]: optimism,
    [base.id]: base,
    [avalanche.id]: avalanche,
    [sepolia.id]: sepolia,
}

// Token configuration per chain
const tokenConfig: Record<number, Array<{ symbol: string; name: string; address: string; decimals: number }>> = {
    [ethereum.id]: [
        { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
        { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
        { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    ],
    [polygon.id]: [
        { symbol: "MATIC", name: "Polygon", address: "native", decimals: 18 },
        { symbol: "USDT", name: "Tether USD", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
        { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6 },
    ],
    [bsc.id]: [
        { symbol: "BNB", name: "BNB", address: "native", decimals: 18 },
        { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
        { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
    ],
    [arbitrum.id]: [
        { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    ],
    [optimism.id]: [
        { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", decimals: 6 },
    ],
    [base.id]: [
        { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    ],
    [avalanche.id]: [
        { symbol: "AVAX", name: "Avalanche", address: "native", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    ],
    [sepolia.id]: [
        { symbol: "ETH", name: "Sepolia ETH", address: "native", decimals: 18 },
    ],
}

const TransferSection: React.FC = () => {
    const account = useActiveAccount()
    const activeChain = useActiveWalletChain()
    const { mutate: sendTx, isPending: isSending } = useSendTransaction()
    const address = account?.address
    const isReady = !!account
    const chainId = activeChain?.id || ethereum.id
    const { addTransaction } = useTransactionQueue()
    const navigate = useNavigate()

    const [recipient, setRecipient] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [selectedToken, setSelectedToken] = useState<string>("ETH")
    const [isTransferring, setIsTransferring] = useState<boolean>(false)
    const [nativeBalance, setNativeBalance] = useState<string>("0")
    const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false)
    const [recipientCopied, setRecipientCopied] = useState<boolean>(false)

    // Get available tokens for current chain
    const availableTokens = tokenConfig[chainId] || tokenConfig[ethereum.id]

    // Get native symbol for current chain
    const getNativeSymbol = () => {
        const nativeToken = availableTokens.find(t => t.address === "native")
        return nativeToken?.symbol || "ETH"
    }

    // Update selected token when chain changes
    useEffect(() => {
        const nativeSymbol = getNativeSymbol()
        setSelectedToken(nativeSymbol)
    }, [chainId])

    // Load native balance
    useEffect(() => {
        const loadBalance = async () => {
            if (!address || !chainId) return

            setIsLoadingBalance(true)
            try {
                const chain = chainById[chainId] || ethereum
                const balance = await getWalletBalance({
                    client: thirdwebClient,
                    chain,
                    address,
                })
                setNativeBalance(balance.displayValue)
            } catch (error) {
                console.error("Error loading balance:", error)
                setNativeBalance("0")
            } finally {
                setIsLoadingBalance(false)
            }
        }

        loadBalance()
    }, [address, chainId])

    // Validate Ethereum address
    const isValidAddress = (addr: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(addr)
    }

    const handleTransfer = async () => {
        if (!account || !isReady || !address) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to make transfers.",
                variant: "destructive",
            })
            return
        }

        if (!recipient) {
            toast({
                title: "Missing recipient",
                description: "Please enter a recipient address.",
                variant: "destructive",
            })
            return
        }

        if (!amount || Number.parseFloat(amount) <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid amount to transfer.",
                variant: "destructive",
            })
            return
        }

        if (!isValidAddress(recipient)) {
            toast({
                title: "Invalid address",
                description: "The recipient address is not a valid Ethereum address.",
                variant: "destructive",
            })
            return
        }

        setIsTransferring(true)

        try {
            const tokenData = availableTokens.find((t) => t.symbol === selectedToken)

            if (!tokenData) {
                throw new Error(`Token ${selectedToken} not found`)
            }

            const chain = chainById[chainId] || ethereum

            // Only native token transfers are supported for now
            if (tokenData.address === "native") {
                const transaction = prepareTransaction({
                    to: recipient,
                    value: toWei(amount),
                    chain,
                    client: thirdwebClient,
                })

                sendTx(transaction, {
                    onSuccess: (result) => {
                        // Add transaction to queue
                        addTransaction({
                            hash: result.transactionHash,
                            from: address,
                            to: recipient,
                            value: amount,
                            chainId: String(chainId),
                            type: "transfer",
                            status: "confirmed",
                            method: "transfer",
                            timestamp: Date.now(),
                        })

                        toast({
                            title: "Transfer Successful",
                            description: `Successfully transferred ${amount} ${selectedToken} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
                        })

                        // Reset form
                        setAmount("")
                    },
                    onError: (error) => {
                        console.error("Transfer error:", error)
                        toast({
                            title: "Transfer Failed",
                            description: error.message || "Failed to transfer tokens",
                            variant: "destructive",
                        })
                    },
                })
            } else {
                // ERC20 transfers - placeholder for future implementation
                toast({
                    title: "Token Transfer",
                    description: "ERC20 token transfers will be available soon. Please use native tokens for now.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error transferring tokens:", error)

            toast({
                title: "Transfer Failed",
                description: error instanceof Error ? error.message : "Failed to transfer tokens",
                variant: "destructive",
            })
        } finally {
            setIsTransferring(false)
        }
    }

    const handleSetSelfAsRecipient = () => {
        if (address) {
            setRecipient(address)
        } else {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to use this feature.",
                variant: "destructive",
            })
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setRecipientCopied(true)

            setTimeout(() => {
                setRecipientCopied(false)
            }, 2000)

            toast({
                title: "Copied to clipboard",
                description: "The address has been copied to your clipboard.",
            })
        } catch (error) {
            console.error("Failed to copy:", error)
        }
    }

    return (
        <FunctionCard
            title="Transfer Tokens"
            description="Send tokens to any address on the current network"
            icon={SendHorizonal}
        >
            <div className="space-y-5">
                <div className="bg-gradient-to-br from-background to-muted/30 border border-border/60 rounded-lg p-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="recipient" className="text-xs text-muted-foreground">Recipient Address</Label>
                                <Button
                                    variant="ghost"
                                    onClick={handleSetSelfAsRecipient}
                                    className="h-auto py-1 px-2 text-xs text-muted-foreground"
                                >
                                    <User className="h-3 w-3 mr-1" />
                                    Use My Address
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="recipient"
                                    placeholder="0x..."
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="bg-background/80 pr-10"
                                />
                                {recipient && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => copyToClipboard(recipient)}
                                    >
                                        {recipientCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount</Label>
                                    {!isLoadingBalance && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => setAmount(nativeBalance)}
                                        >
                                            <Wallet className="h-3 w-3" />
                                            Max: {Number.parseFloat(nativeBalance).toFixed(6)}
                                        </Button>
                                    )}
                                    {isLoadingBalance && (
                                        <Skeleton className="h-4 w-20" />
                                    )}
                                </div>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.000001"
                                    placeholder="0.0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-background/80"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Token</Label>
                                <Select value={selectedToken} onValueChange={setSelectedToken}>
                                    <SelectTrigger className="bg-background/80">
                                        <SelectValue placeholder="Select token" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b">
                                            <span className="text-xs font-semibold">Available Tokens</span>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                {availableTokens.length} tokens
                                            </Badge>
                                        </div>
                                        {availableTokens.map((token) => (
                                            <SelectItem key={token.symbol} value={token.symbol}>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mr-2">
                                                            <span className="text-[10px] font-bold text-primary">{token.symbol.charAt(0)}</span>
                                                        </div>
                                                        <span>{token.symbol}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
                        onClick={handleTransfer}
                        disabled={!isReady || isTransferring || isSending || !recipient || !amount || Number.parseFloat(amount) <= 0}
                    >
                        {isTransferring || isSending ? (
                            <div className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Transferring...</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <SendHorizonal className="mr-2 h-4 w-4" />
                                <span>Transfer {selectedToken}</span>
                            </div>
                        )}
                    </Button>

                    <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded border border-border/50 bg-muted/30">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium mb-1">Transfer Information</p>
                            <p>Ensure you're sending to the correct address on the {activeChain?.name || "current"} network. Check the recipient and amount before proceeding.</p>
                        </div>
                    </div>
                </div>
            </div>
        </FunctionCard>
    )
}

export default TransferSection

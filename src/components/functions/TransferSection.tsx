"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Wallet, User } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import useWeb3 from "@/hooks/useWeb3"
import { useTransactionQueue } from "@/hooks/useTransactionQueue"
import { getTokenBalance, transferToken, transferNativeToken, convertToTokenUnits } from "@/utils/blockchain"
import { COMMON_TOKENS } from "@/utils/blockchain/constants"

const TransferSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3()
  const { addTransaction } = useTransactionQueue()
  const navigate = useNavigate()

  const [recipient, setRecipient] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [selectedToken, setSelectedToken] = useState<string>(chainId === 137 ? "MATIC" : "ETH")
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [availableTokens, setAvailableTokens] = useState<Array<{ symbol: string; address: string; decimals: number }>>(
    [],
  )
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({})
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false)

  // Update available tokens when chain changes
  useEffect(() => {
    if (chainId) {
      // Set default token based on chain
      if (chainId === 137) {
        setSelectedToken("MATIC")
      } else if (chainId === 56) {
        setSelectedToken("BNB")
      } else if (chainId === 43114) {
        setSelectedToken("AVAX")
      } else {
        setSelectedToken("ETH")
      }

      // Get available tokens for this chain
      if (COMMON_TOKENS[chainId]) {
        const tokens = Object.entries(COMMON_TOKENS[chainId]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))
        setAvailableTokens(tokens)
      } else {
        // Default to Ethereum tokens if chain not supported
        const tokens = Object.entries(COMMON_TOKENS[1]).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          decimals: data.decimals,
        }))
        setAvailableTokens(tokens)
      }

      // Reset balances when chain changes
      setTokenBalances({})
    }
  }, [chainId])

  // Load token balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!web3 || !isReady || !address || !chainId || availableTokens.length === 0) {
        return
      }

      setIsLoadingBalances(true)

      try {
        const balances: Record<string, string> = {}

        // Get native token balance
        const nativeBalance = await web3.eth.getBalance(address)
        const nativeSymbol = chainId === 137 ? "MATIC" : chainId === 56 ? "BNB" : chainId === 43114 ? "AVAX" : "ETH"
        balances[nativeSymbol] = web3.utils.fromWei(nativeBalance, "ether")

        // Get ERC20 token balances
        for (const token of availableTokens) {
          if (token.symbol === nativeSymbol) continue

          try {
            const balance = await getTokenBalance(web3, address, token.address)
            balances[token.symbol] = balance
          } catch (error) {
            console.error(`Error loading balance for ${token.symbol}:`, error)
            balances[token.symbol] = "0"
          }
        }

        setTokenBalances(balances)
      } catch (error) {
        console.error("Error loading balances:", error)
        toast({
          title: "Failed to load balances",
          description: "Could not retrieve token balances. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingBalances(false)
      }
    }

    loadBalances()
  }, [web3, isReady, address, chainId, availableTokens])

  const handleTransfer = async () => {
    if (!web3 || !isReady || !address) {
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

    // Validate recipient address
    if (!web3.utils.isAddress(recipient)) {
      toast({
        title: "Invalid address",
        description: "The recipient address is not a valid Ethereum address.",
        variant: "destructive",
      })
      return
    }

    setIsTransferring(true)

    try {
      // Find the selected token in available tokens
      const tokenData = availableTokens.find((t) => t.symbol === selectedToken)

      if (!tokenData) {
        throw new Error(`Token ${selectedToken} not found`)
      }

      let txHash: string

      // Check if it's a native token (ETH, MATIC, etc.) or an ERC20 token
      if (tokenData.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Native token transfer
        txHash = await transferNativeToken(web3, recipient, amount, address)
      } else {
        // ERC20 token transfer
        txHash = await transferToken(web3, tokenData.address, recipient, amount, address, tokenData.decimals)
      }

      // Add transaction to queue
      addTransaction({
        hash: txHash,
        from: address,
        to: recipient,
        value: convertToTokenUnits(amount, tokenData.decimals),
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

      // Navigate to transactions page
      navigate("/functions/transactions")
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          Transfer Tokens
        </CardTitle>
        <CardDescription>Send tokens to any address on the current network</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transfer">
          <TabsList className="grid grid-cols-1 mb-4 w-full sm:w-[200px]">
            <TabsTrigger value="transfer">
              <ArrowRight className="h-4 w-4 mr-2" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={handleSetSelfAsRecipient}
                  >
                    <User className="h-3 w-3" />
                    Self
                  </Button>
                </div>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex justify-between w-full">
                          <span>{token.symbol}</span>
                          {tokenBalances[token.symbol] && (
                            <span className="text-muted-foreground text-xs ml-2">
                              {Number.parseFloat(tokenBalances[token.symbol]).toFixed(4)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="amount">Amount</Label>
                  {tokenBalances[selectedToken] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setAmount(tokenBalances[selectedToken])}
                    >
                      <Wallet className="h-3 w-3" />
                      Max: {Number.parseFloat(tokenBalances[selectedToken]).toFixed(6)}
                    </Button>
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
                />
              </div>

              <Button
                className="w-full"
                onClick={handleTransfer}
                disabled={!isReady || isTransferring || !recipient || !amount || Number.parseFloat(amount) <= 0}
              >
                {isTransferring ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Transfer {selectedToken}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Note: Make sure you're sending to the correct address on the current network.</p>
      </CardFooter>
    </Card>
  )
}

export default TransferSection

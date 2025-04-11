"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, DollarSign, Settings } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FunctionCard } from "./FunctionCard"
import { useWeb3 } from "@/hooks/useWeb3"
import { useSwitchChain } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base, zora, bsc, avalanche } from "wagmi/chains"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { getTokenBalance } from "@/utils/blockchain"

// Custom EduChain definition
const educhain = {
  id: 98432,
  name: "EduChain",
  nativeCurrency: {
    decimals: 18,
    name: "EduChain",
    symbol: "EDU",
  },
  rpcUrls: {
    default: { http: ["https://rpc.edutestnet.io"] },
  },
}

// Common ERC20 tokens
const commonTokens = {
  [mainnet.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  ],
  [polygon.id]: [
    { symbol: "MATIC", name: "Polygon", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  ],
  [bsc.id]: [
    { symbol: "BNB", name: "Binance Coin", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955" },
    { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" },
    { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" },
  ],
  [optimism.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "OP", name: "Optimism", address: "0x4200000000000000000000000000000000000042" },
    { symbol: "USDC", name: "USD Coin", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
  ],
  [arbitrum.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548" },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  ],
  [base.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  ],
  [zora.id]: [
    { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" },
  ],
  [avalanche.id]: [
    { symbol: "AVAX", name: "Avalanche", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
    { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
    { symbol: "USDT", name: "Tether USD", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
    { symbol: "JOE", name: "Trader Joe", address: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd" },
  ],
  [educhain.id]: [{ symbol: "EDU", name: "EduChain", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }],
}

interface WalletSectionProps {
  currentChain: number
  setCurrentChain: (chainId: number) => void
}

// Updated chains array to include BSC and EduChain
const availableChains = [mainnet, polygon, optimism, arbitrum, base, zora, bsc, avalanche, educhain]

const WalletSection: React.FC<WalletSectionProps> = ({ currentChain, setCurrentChain }) => {
  const { web3, isReady, address } = useWeb3()
  const [balance, setBalance] = useState<string>("0")
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState("native")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [showCustomToken, setShowCustomToken] = useState(false)
  const { switchChain } = useSwitchChain()

  // Get tokens for current chain
  const tokensForChain = commonTokens[currentChain as keyof typeof commonTokens] || []

  useEffect(() => {
    fetchBalance()
  }, [web3, address, currentChain, selectedToken])

  const fetchBalance = async () => {
    if (web3 && address) {
      try {
        setBalanceLoading(true)

        if (selectedToken === "native" || selectedToken === "custom") {
          // Native token balance
          const tokenAddress =
            selectedToken === "custom" && customTokenAddress
              ? customTokenAddress
              : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

          if (selectedToken === "native") {
            const balance = await web3.eth.getBalance(address)
            setBalance(web3.utils.fromWei(balance, "ether"))
          } else {
            // Custom token
            if (web3.utils.isAddress(customTokenAddress)) {
              const balance = await getTokenBalance(web3, address, customTokenAddress)
              setBalance(balance)
            } else {
              setBalance("Invalid address")
            }
          }
        } else {
          // Known ERC20 token
          const tokenInfo = tokensForChain.find((t) => t.symbol === selectedToken)
          if (tokenInfo && tokenInfo.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
            const balance = await getTokenBalance(web3, address, tokenInfo.address)
            setBalance(balance)
          } else {
            // Native token (ETH/MATIC/BNB etc)
            const balance = await web3.eth.getBalance(address)
            setBalance(web3.utils.fromWei(balance, "ether"))
          }
        }

        setBalanceLoading(false)
      } catch (error) {
        console.error("Error fetching balance:", error)
        setBalance("Error")
        setBalanceLoading(false)
      }
    }
  }

  const handleNetworkSwitch = (networkId: string) => {
    const chainId = Number.parseInt(networkId)
    setCurrentChain(chainId)
    // Reset token selection when changing networks
    setSelectedToken("native")
    setShowCustomToken(false)

    if (switchChain) {
      try {
        switchChain({ chainId })
      } catch (error) {
        console.error("Error switching chain:", error)
      }
    }
  }

  const getNativeSymbol = () => {
    const chain = availableChains.find((c) => c.id === currentChain)
    return chain?.nativeCurrency?.symbol || "ETH"
  }

  const getNativeSymbolForBalance = () => {
    if (selectedToken === "custom") return ""
    if (selectedToken === "native") return getNativeSymbol()
    return selectedToken
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunctionCard
        title="Wallet Balance"
        description="Check your current balance across different chains and tokens"
        icon={DollarSign}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Balance</p>
              <p className="text-2xl font-bold">
                {balanceLoading
                  ? "Loading..."
                  : `${Number.parseFloat(balance).toFixed(4)} ${getNativeSymbolForBalance()}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBalance}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Token</Label>
            <Select
              value={selectedToken}
              onValueChange={(value) => {
                setSelectedToken(value)
                setShowCustomToken(value === "custom")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">{getNativeSymbol()} (Native)</SelectItem>

                {tokensForChain.map((token) => {
                  if (token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") return null
                  return (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  )
                })}

                <SelectItem value="custom">Custom Token...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomToken && (
            <div className="space-y-2 animate-in fade-in-50">
              <Label htmlFor="custom-token-address">Custom Token Address</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-token-address"
                  placeholder="0x..."
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" variant="secondary" onClick={fetchBalance}>
                  Check
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Network</Label>
            <Select value={currentChain?.toString()} onValueChange={handleNetworkSwitch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                {availableChains.map((chainOption) => (
                  <SelectItem key={chainOption.id} value={chainOption.id.toString()}>
                    {chainOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FunctionCard>

      <FunctionCard title="Network Settings" description="Configure blockchain network settings" icon={Settings}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Network</Label>
            <div className="flex items-center gap-2 text-sm">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  currentChain === mainnet.id
                    ? "bg-green-500"
                    : currentChain === polygon.id
                      ? "bg-purple-500"
                      : currentChain === optimism.id
                        ? "bg-red-500"
                        : currentChain === arbitrum.id
                          ? "bg-blue-500"
                          : currentChain === base.id
                            ? "bg-blue-600"
                            : currentChain === zora.id
                              ? "bg-pink-500"
                              : currentChain === bsc.id
                                ? "bg-yellow-500"
                                : currentChain === educhain.id
                                  ? "bg-green-300"
                                  : "bg-gray-500",
                )}
              />
              <span>{availableChains.find((c) => c.id === currentChain)?.name || "Unknown"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Switch Network</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableChains.map((chainOption) => (
                <Button
                  key={chainOption.id}
                  variant={currentChain === chainOption.id ? "default" : "outline"}
                  size="sm"
                  className={currentChain === chainOption.id ? "bg-primary" : ""}
                  onClick={() => handleNetworkSwitch(chainOption.id.toString())}
                >
                  {chainOption.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </FunctionCard>
    </div>
  )
}

export default WalletSection

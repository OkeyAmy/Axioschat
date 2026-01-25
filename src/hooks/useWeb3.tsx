// useWeb3 Hook - Thirdweb Wallet Integration
// This hook provides a unified interface for Thirdweb wallet functionality

import { useActiveAccount, useActiveWalletChain } from "thirdweb/react"

interface Web3Context {
    web3: null // Web3.js instance - null since we're using Thirdweb
    address: string | null
    isReady: boolean
    chainId: number
    network: string
}

// Chain ID to network name mapping
const chainIdToNetwork: Record<number, string> = {
    1: "ethereum",
    137: "polygon",
    56: "bsc",
    42161: "arbitrum",
    10: "optimism",
    8453: "base",
    43114: "avalanche",
    11155111: "sepolia",
}

export const useWeb3 = (): Web3Context => {
    const account = useActiveAccount()
    const activeChain = useActiveWalletChain()
    
    const chainId = activeChain?.id || 1
    const network = chainIdToNetwork[chainId] || "ethereum"

    return {
        web3: null, // We use Thirdweb SDK, not Web3.js
        address: account?.address || null,
        isReady: !!account,
        chainId,
        network,
    }
}

export default useWeb3

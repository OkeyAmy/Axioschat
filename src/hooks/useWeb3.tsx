// useWeb3 Hook - MNEE Wallet Integration
// This hook replaces Thirdweb/Web3.js with MNEE wallet functionality

import { useState, useEffect } from "react"

// MNEE wallet address from environment
const MNEE_ADDRESS = import.meta.env.VITE_MNEE_ADDRESS || ""

interface Web3Context {
    web3: null // Web3.js instance - null since we're using MNEE
    address: string | null
    isReady: boolean
    chainId: number
    network: string
}

export const useWeb3 = (): Web3Context => {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        // Initialize as ready once we have the MNEE address
        if (MNEE_ADDRESS) {
            setIsReady(true)
        }
    }, [])

    return {
        web3: null, // We don't use Web3.js with MNEE
        address: MNEE_ADDRESS || null,
        isReady: !!MNEE_ADDRESS,
        chainId: 0, // MNEE doesn't use Ethereum chain IDs
        network: import.meta.env.VITE_MNEE_NETWORK || "sandbox",
    }
}

export default useWeb3

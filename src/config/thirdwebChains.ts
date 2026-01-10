/**
 * Thirdweb Chain Configuration
 * 
 * This file contains chain definitions for use with Thirdweb SDK.
 * Import chains from this file for consistent chain usage across the app.
 */

import {
    ethereum,
    polygon,
    bsc,
    arbitrum,
    optimism,
    base,
    avalanche,
    sepolia,
    polygonAmoy,
    baseSepolia
} from "thirdweb/chains"

// Available chains for the application
export const availableChains = [
    ethereum,
    polygon,
    bsc,
    arbitrum,
    optimism,
    base,
    avalanche,
]

// Testnet chains
export const testnetChains = [
    sepolia,
    polygonAmoy,
    baseSepolia,
]

// All chains (mainnet + testnet)
export const allChains = [...availableChains, ...testnetChains]

// Chain ID to chain object mapping
export const chainById: Record<number, (typeof availableChains)[number]> = {
    [ethereum.id]: ethereum,
    [polygon.id]: polygon,
    [bsc.id]: bsc,
    [arbitrum.id]: arbitrum,
    [optimism.id]: optimism,
    [base.id]: base,
    [avalanche.id]: avalanche,
    [sepolia.id]: sepolia,
    [polygonAmoy.id]: polygonAmoy,
    [baseSepolia.id]: baseSepolia,
}

// Chain colors for UI
export const chainColors: Record<number, string> = {
    [ethereum.id]: "from-blue-500 to-blue-600",
    [polygon.id]: "from-purple-500 to-purple-600",
    [bsc.id]: "from-yellow-500 to-yellow-600",
    [arbitrum.id]: "from-blue-600 to-blue-700",
    [optimism.id]: "from-red-500 to-red-600",
    [base.id]: "from-blue-400 to-blue-500",
    [avalanche.id]: "from-red-600 to-red-700",
    [sepolia.id]: "from-gray-400 to-gray-500",
    [polygonAmoy.id]: "from-purple-400 to-purple-500",
    [baseSepolia.id]: "from-blue-300 to-blue-400",
}

// Native token symbols per chain
export const nativeSymbols: Record<number, string> = {
    [ethereum.id]: "ETH",
    [polygon.id]: "MATIC",
    [bsc.id]: "BNB",
    [arbitrum.id]: "ETH",
    [optimism.id]: "ETH",
    [base.id]: "ETH",
    [avalanche.id]: "AVAX",
    [sepolia.id]: "ETH",
    [polygonAmoy.id]: "MATIC",
    [baseSepolia.id]: "ETH",
}

// Get chain color by ID
export function getChainColor(chainId: number): string {
    return chainColors[chainId] || "from-gray-500 to-gray-600"
}

// Get native symbol by chain ID
export function getNativeSymbol(chainId: number): string {
    return nativeSymbols[chainId] || "ETH"
}

// Get chain by ID
export function getChainById(chainId: number) {
    return chainById[chainId] || ethereum
}

// Default chain
export const defaultChain = ethereum

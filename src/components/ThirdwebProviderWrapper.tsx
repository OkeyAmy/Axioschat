"use client"

import type React from "react"
import { ThirdwebProvider } from "thirdweb/react"
import { createThirdwebClient } from "thirdweb"
import { inAppWallet, createWallet } from "thirdweb/wallets"

// Get Thirdweb Client ID from environment
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""

// Create the Thirdweb client
export const thirdwebClient = createThirdwebClient({
    clientId: clientId,
})

// Configure wallets to support both EVM and Solana
export const supportedWallets = [
    inAppWallet({
        auth: {
            options: ["email", "google", "apple", "facebook"],
        },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("app.phantom"), // Solana wallet
    createWallet("com.trustwallet.app"),
]

interface ThirdwebProviderWrapperProps {
    children: React.ReactNode
}

/**
 * ThirdwebProviderWrapper
 * 
 * A modular wrapper component for Thirdweb wallet connection.
 * Supports both EVM and Solana wallets.
 * 
 * Configuration:
 * - Set `VITE_THIRDWEB_CLIENT_ID` in your `.env` file
 * - Optionally set `VITE_THIRDWEB_SECRET_KEY` for server-side operations
 * 
 * Supported Wallets:
 * - EVM: MetaMask, Coinbase, Rainbow, Trust Wallet
 * - Solana: Phantom
 * - In-App: Email, Google, Apple, Facebook
 */
export const ThirdwebProviderWrapper: React.FC<ThirdwebProviderWrapperProps> = ({ children }) => {
    if (!clientId) {
        console.warn("Thirdweb Client ID is not set. Wallet connection may not work.")
    }

    return (
        <ThirdwebProvider>
            {children}
        </ThirdwebProvider>
    )
}

export default ThirdwebProviderWrapper

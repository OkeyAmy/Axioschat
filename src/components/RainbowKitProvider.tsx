
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  RainbowKitProvider as RKProvider,
  getDefaultWallets,
  darkTheme,
  lightTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base, zora } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { alchemyProvider } from "wagmi/providers/alchemy"
import { useTheme } from "@/components/ThemeProvider"
import "@rainbow-me/rainbowkit/styles.css"

interface RainbowKitWrapperProps {
  children: React.ReactNode
}

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora],
  [
    // Use Alchemy as primary provider if API key is available
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY })
      : publicProvider(),
    publicProvider(),
  ],
)

const { wallets } = getDefaultWallets({
  appName: "NovachatV2",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains,
})

const connectors = connectorsForWallets([...wallets])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export const RainbowKitProvider: React.FC<RainbowKitWrapperProps> = ({ children }) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure window is available before mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <WagmiConfig config={wagmiConfig}>
      <RKProvider chains={chains} theme={theme === "dark" ? darkTheme() : lightTheme()} modalSize="compact">
        {children}
      </RKProvider>
    </WagmiConfig>
  )
}

export default RainbowKitProvider

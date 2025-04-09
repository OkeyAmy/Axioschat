
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  RainbowKitProvider as RKProvider,
  getDefaultWallets,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit"
import { 
  http, 
  createConfig, 
  WagmiProvider
} from "wagmi"
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  zora
} from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "@/components/ThemeProvider"
import "@rainbow-me/rainbowkit/styles.css"

interface RainbowKitWrapperProps {
  children: React.ReactNode
}

// Create wagmi config
const config = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum, base, zora],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [zora.id]: http(),
  },
})

// Create query client
const queryClient = new QueryClient()

export const RainbowKitProvider: React.FC<RainbowKitWrapperProps> = ({ children }) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure window is available before mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RKProvider theme={theme === "dark" ? darkTheme() : lightTheme()} modalSize="compact">
          {children}
        </RKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default RainbowKitProvider

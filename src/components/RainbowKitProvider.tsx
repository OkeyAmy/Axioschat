
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  RainbowKitProvider as RKProvider,
  darkTheme,
  lightTheme
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
import { 
  getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "@/components/ThemeProvider"
import "@rainbow-me/rainbowkit/styles.css"

interface RainbowKitWrapperProps {
  children: React.ReactNode
}

// WalletConnect Project ID
const projectId = 'f648e94e1f1c32327aaa0416d6409e2b';

// Chain configuration
const chains = [mainnet, polygon, optimism, arbitrum, base, zora] as const;

// Get wallets using the proper API for RainbowKit v2
const { wallets } = getDefaultWallets({
  appName: 'NovachatV2',
  projectId,
});

// Create wagmi config
const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [zora.id]: http(),
  },
  connectors: wallets,
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
        <RKProvider theme={theme === "dark" ? darkTheme() : lightTheme()}>
          {children}
        </RKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default RainbowKitProvider

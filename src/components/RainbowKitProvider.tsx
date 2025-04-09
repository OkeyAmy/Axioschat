
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  RainbowKitProvider as RKProvider,
  darkTheme,
  lightTheme,
  connectorsForWallets
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
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "@/components/ThemeProvider"
import "@rainbow-me/rainbowkit/styles.css"

interface RainbowKitWrapperProps {
  children: React.ReactNode
}

// Chain config
const chains = [mainnet, polygon, optimism, arbitrum, base, zora];

// Wallets config
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // You can replace with your WalletConnect Project ID

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet,
      metaMaskWallet,
      walletConnectWallet,
      coinbaseWallet({ 
        appName: 'NovachatV2',
      }),
    ],
  },
]);

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
  connectors
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

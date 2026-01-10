"use client"

import React, { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import Header from "@/components/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Coins,
  ExternalLink,
  GanttChart,
  Lightbulb,
  LinkIcon,
  Lock,
  Send,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Wallet,
  Code,
  Brain,
  School,
  MessageSquare,
} from "lucide-react"
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel"
import TransactionQueue from "@/components/TransactionQueue"
import { cn, useAB } from "@/lib/utils"
import useApiKeys from "@/hooks/useApiKeys"
import { toast } from "@/components/ui/use-toast"
import FunctionQueue from "@/components/FunctionQueue"
import { Checkbox } from "@/components/ui/checkbox"
import {
  callLlama,
  callOpenAI,
  parseLlamaResponse,
  createFunctionCall,
  isReadOnlyFunction,
  type ChatMessage,
  type FunctionCall,
} from "@/services/aiService"
// import { callSensayWithContext } from "@/services/sensayService"

type DeFiSection = {
  id: string
  name: string
  icon: React.ElementType
  description: string
  concepts: Array<{
    title: string
    description: string
    resources: Array<{
      name: string
      url: string
      description: string
    }>
  }>
  suggestedQuestions: string[]
  systemPrompt?: string
}

type Message = {
  role: "user" | "assistant" | "system" | "function"
  content: string
  name?: string
}

const Web3Intro: React.FC = () => {
  // No wallet connection needed for educational content
  const address = ""
  const variant = useAB('/learn')
  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to Web3 Intro! What would you like to learn about DeFi today?" },
  ])
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([])
  const [activeSection, setActiveSection] = useState("intro")
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(window.innerWidth < 1200)
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(window.innerWidth < 1400)
  const [isProcessing, setIsProcessing] = useState(false)
  const [useLocalAI, setUseLocalAI] = useState(false)
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434")
  const [showEndpointSettings, setShowEndpointSettings] = useState(false)
  const [currentChain, setCurrentChain] = useState(1)
  const { apiKeys, updateApiKey } = useApiKeys()
  const [showFunctionMessages, setShowFunctionMessages] = useState(false)
  // const [useSensay, setUseSensay] = useState(false)

  const defiSections: DeFiSection[] = [
    {
      id: "mnee",
      name: "MNEE Stablecoin",
      icon: Coins,
      description: "MNEE is a USD-backed stablecoin built on the 1Sat Ordinals protocol, offering fast transactions, low fees, and instant finality for Web3 applications.",
      concepts: [
        {
          title: "What is MNEE?",
          description: "MNEE is a USD-backed stablecoin that provides a stable value for transactions on the blockchain. It's built on the 1Sat Ordinals protocol, enabling fast and efficient transfers with minimal fees.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Complete developer documentation and API reference." },
            { name: "MNEE Developer Portal", url: "https://developer.mnee.net", description: "Get API keys and access developer tools." },
            { name: "MNEE GitHub", url: "https://github.com/mnee-io", description: "SDK source code and examples." }
          ]
        },
        {
          title: "Key Features",
          description: "MNEE offers instant finality, low transaction fees, and seamless integration with Web3 applications. It's designed for in-app payments, microtransactions, P2P transfers, gaming, remittances, and A2A payments.",
          resources: [
            { name: "MNEE SDK", url: "https://www.npmjs.com/package/@mnee/ts-sdk", description: "TypeScript SDK for integrating MNEE into your applications." },
            { name: "MNEE CLI", url: "https://docs.mnee.io/cli", description: "Command-line interface for managing MNEE wallets and transactions." }
          ]
        },
        {
          title: "Use Cases",
          description: "MNEE is ideal for various applications including in-app payments, microtransactions, peer-to-peer transfers, gaming economies, remittances, and account-to-account payments. Its stable value makes it perfect for financial applications.",
          resources: []
        },
        {
          title: "Getting Started",
          description: "To start using MNEE, you'll need to get an API key from the developer portal, install the SDK, and set up your wallet. The SDK provides methods for transfers, balance checks, transaction history, and UTXO management.",
          resources: [
            { name: "Quick Start Guide", url: "https://docs.mnee.io/quickstart", description: "Step-by-step guide to integrating MNEE." },
            { name: "API Reference", url: "https://docs.mnee.io/api", description: "Complete API endpoint documentation." }
          ]
        }
      ],
      suggestedQuestions: [
        "What is MNEE and how does it work?",
        "How do I integrate MNEE into my application?",
        "What are the benefits of using MNEE over other stablecoins?",
        "How do I get started with the MNEE SDK?",
        "What are the transaction fees for MNEE?",
        "How do I check my MNEE balance?",
        "Can I use MNEE for microtransactions?",
        "What is the difference between MNEE and other stablecoins?"
      ],
      systemPrompt: `You are a helpful Web3 educator specializing in MNEE (a USD-backed stablecoin built on the 1Sat Ordinals protocol).

MNEE Key Information:
- USD-backed stablecoin for stable value transactions
- Built on 1Sat Ordinals protocol
- Fast transactions with instant finality
- Low transaction fees
- Ideal for in-app payments, microtransactions, P2P transfers, gaming, remittances, and A2A payments
- SDK available: @mnee/ts-sdk (npm package)
- Documentation: https://docs.mnee.io
- Developer Portal: https://developer.mnee.net (for API keys)
- CLI tool available for wallet management

When explaining MNEE:
- Emphasize its stability as a USD-backed token
- Highlight the speed and low fees compared to other networks
- Explain practical use cases and integration methods
- Provide guidance on getting started with the SDK
- Discuss the benefits for developers and end users
- Explain how it works on the 1Sat Ordinals protocol

If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    },
    {
      id: "payments",
      name: "Payments & Microtransactions",
      icon: Send,
      description: "Blockchain payments enable fast, low-cost transfers without intermediaries. Microtransactions open new possibilities for content monetization, gaming, and digital services.",
      concepts: [
        {
          title: "Stablecoin Payments",
          description: "Stablecoins like MNEE provide stable value for payments, making them ideal for everyday transactions, remittances, and cross-border payments without volatility concerns.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Learn about MNEE stablecoin payments." },
            { name: "MNEE SDK", url: "https://www.npmjs.com/package/@mnee/ts-sdk", description: "Integrate payments into your app." }
          ]
        },
        {
          title: "Microtransactions",
          description: "Microtransactions enable small-value payments that were previously uneconomical. They're perfect for content creators, gaming economies, pay-per-use services, and tipping.",
          resources: []
        },
        {
          title: "Payment Integration",
          description: "Integrating blockchain payments into applications requires understanding wallets, transaction fees, confirmation times, and user experience considerations.",
          resources: [
            { name: "MNEE Quick Start", url: "https://docs.mnee.io/quickstart", description: "Get started with MNEE payments." },
            { name: "MNEE API Reference", url: "https://docs.mnee.io/api", description: "Complete payment API documentation." }
          ]
        }
      ],
      suggestedQuestions: [
        "How do stablecoin payments work?",
        "What are the benefits of using blockchain for payments?",
        "How can I integrate payments into my application?",
        "What are microtransactions and why are they important?",
        "How do I handle payment fees in my app?",
        "What's the difference between on-chain and off-chain payments?"
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about blockchain payments and microtransactions.
      
      Focus on explaining how blockchain enables fast, low-cost payments, the role of stablecoins like MNEE, and how to integrate payment functionality into applications.
      
      When explaining:
      - Emphasize the benefits of blockchain payments (speed, low fees, no intermediaries)
      - Explain how stablecoins solve volatility issues for payments
      - Discuss use cases like remittances, gaming, content monetization, and microtransactions
      - Provide guidance on integrating payment systems
      - Explain transaction fees and confirmation times
      - Discuss best practices for payment UX
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    },
    {
      id: "ordinals",
      name: "Ordinals & BSV21 Tokens",
      icon: Code,
      description: "Ordinals enable data inscription on Bitcoin SV, while BSV21 is a token standard for creating fungible tokens like MNEE on the 1Sat Ordinals protocol.",
      concepts: [
        {
          title: "What are Ordinals?",
          description: "Ordinals allow data to be inscribed directly onto satoshis (the smallest unit of Bitcoin), creating unique digital artifacts and enabling token standards like BSV21.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Learn about MNEE on 1Sat Ordinals." },
            { name: "BSV21 Standard", url: "https://docs.mnee.io/bsv21", description: "Understanding the BSV21 token standard." }
          ]
        },
        {
          title: "BSV21 Token Standard",
          description: "BSV21 is a token standard built on 1Sat Ordinals that enables the creation of fungible tokens like stablecoins. MNEE uses this standard for its USD-backed stablecoin.",
          resources: []
        },
        {
          title: "UTXOs and Token Management",
          description: "Understanding Unspent Transaction Outputs (UTXOs) is crucial for managing tokens on Ordinals-based systems. Each UTXO can contain token data and must be properly managed for transfers.",
          resources: [
            { name: "MNEE UTXO Guide", url: "https://docs.mnee.io/utxos", description: "Learn about UTXO management with MNEE." }
          ]
        }
      ],
      suggestedQuestions: [
        "What are Ordinals and how do they work?",
        "What is the BSV21 token standard?",
        "How does MNEE use Ordinals?",
        "What are UTXOs and why are they important?",
        "How do token transfers work on Ordinals?",
        "What's the difference between Ordinals and other token standards?"
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about Ordinals and the BSV21 token standard.
      
      Focus on explaining how Ordinals enable data inscription on Bitcoin SV, the BSV21 token standard for fungible tokens, and how systems like MNEE leverage this technology.
      
      When explaining:
      - Explain Ordinals in simple terms (data inscribed on satoshis)
      - Describe the BSV21 standard and its benefits
      - Explain how MNEE uses 1Sat Ordinals protocol
      - Discuss UTXO management and why it matters
      - Compare Ordinals-based tokens to other token standards
      - Explain transaction mechanics on Ordinals-based systems
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    },
    {
      id: "intro",
      name: "Introduction to DeFi",
      icon: Lightbulb,
      description:
        "DeFi (Decentralized Finance) is an ecosystem of financial applications built on blockchain networks. It aims to recreate traditional financial systems in a decentralized way, removing intermediaries.",
      concepts: [
        {
          title: "What is DeFi?",
          description:
            "DeFi stands for Decentralized Finance and refers to financial applications built on blockchain technologies, typically using smart contracts.",
          resources: [
            {
              name: "Ethereum.org DeFi Page",
              url: "https://ethereum.org/en/defi/",
              description: "Official Ethereum explanation of DeFi",
            },
          ],
        },
        {
          title: "Key Principles",
          description: "Permissionless, transparent, and non-custodial are the core principles of DeFi.",
          resources: [
            {
              name: "Finematics",
              url: "https://finematics.com/",
              description: "Educational website about DeFi",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What are the main benefits of DeFi?",
        "How is DeFi different from traditional finance?",
        "What are the risks associated with DeFi?",
      ],
      systemPrompt: `You are a helpful Web3 educator introducing the basics of DeFi (Decentralized Finance) to a newcomer.
      
      Explain concepts in simple terms, avoiding jargon when possible. Focus on helping the user understand the fundamental principles, benefits, and risks of DeFi. Include information about stablecoins like MNEE as they play a crucial role in DeFi ecosystems.
      
      When explaining:
      - Use analogies to traditional finance when helpful
      - Highlight the key innovations of DeFi (permissionless, transparent, non-custodial)
      - Explain the importance of stablecoins for reducing volatility in DeFi
      - Be balanced in discussing both benefits and risks
      - Provide examples of popular DeFi protocols and stablecoins when relevant
      - Mention MNEE as an example of a USD-backed stablecoin built on Ordinals
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "lending",
      name: "Lending & Borrowing",
      icon: LinkIcon,
      description:
        "Lending and borrowing platforms allow users to lend their cryptocurrencies and earn interest or borrow assets by providing collateral.",
      concepts: [
        {
          title: "Overcollateralization",
          description: "Most DeFi loans require users to deposit more value than they borrow as security.",
          resources: [
            {
              name: "Aave",
              url: "https://aave.com/",
              description: "Decentralized lending platform",
            },
            {
              name: "Compound",
              url: "https://compound.finance/",
              description: "Algorithmic money market protocol",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How do interest rates work in DeFi lending?",
        "What happens if my collateral value drops?",
        "What is a liquidation in DeFi lending?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about DeFi lending and borrowing protocols.
      
      Focus on explaining how users can lend their assets to earn interest or borrow against collateral. Explain concepts like overcollateralization, liquidation risks, and interest rate models.
      
      When explaining:
      - Compare to traditional lending when helpful
      - Explain the risks of liquidation and how to avoid it
      - Discuss popular lending platforms like Aave and Compound
      - Explain variable vs. stable interest rates
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "dex",
      name: "Token Trading & Swaps",
      icon: Shuffle,
      description:
        "Decentralized exchanges (DEXs) and token swaps allow users to trade cryptocurrencies directly from their wallets. Stablecoins like MNEE are commonly used for trading pairs and as a stable store of value.",
      concepts: [
        {
          title: "Stablecoin Trading",
          description:
            "Stablecoins like MNEE provide a stable trading pair, reducing volatility risk. They're ideal for entering and exiting positions, remittances, and maintaining value during market fluctuations.",
          resources: [
            {
              name: "MNEE Documentation",
              url: "https://docs.mnee.io",
              description: "Learn about MNEE stablecoin",
            },
          ],
        },
        {
          title: "Automated Market Makers",
          description:
            "AMMs use liquidity pools and mathematical formulas to determine asset prices instead of order books, enabling permissionless trading.",
          resources: []
        },
        {
          title: "Token Swaps",
          description: "Token swaps allow users to exchange one cryptocurrency for another. Using stablecoins in swaps provides price stability and reduces slippage concerns.",
          resources: []
        }
      ],
      suggestedQuestions: [
        "How do stablecoins help with trading?",
        "What is slippage and how can I minimize it?",
        "How do liquidity pools work?",
        "What is impermanent loss?",
        "Why use stablecoins for trading pairs?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about token trading, decentralized exchanges, and the role of stablecoins like MNEE in trading.
      
      Focus on explaining how users can swap tokens without intermediaries, how AMMs work, the benefits of stablecoins in trading, and concepts like liquidity pools, slippage, and impermanent loss.
      
      When explaining:
      - Explain the role of stablecoins in trading (reducing volatility, providing stable pairs)
      - Compare to centralized exchanges when helpful
      - Explain how liquidity pools enable trading
      - Discuss the benefits of using stablecoins like MNEE for trading
      - Explain how to minimize slippage when trading
      - Discuss the risks of impermanent loss for liquidity providers
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "staking",
      name: "Staking & Yield Farming",
      icon: Lock,
      description:
        "Staking involves locking up cryptocurrencies to support network operations and earn rewards. Yield farming involves strategically providing liquidity to maximize returns.",
      concepts: [
        {
          title: "Proof of Stake",
          description:
            'A consensus mechanism where validators are selected based on the amount of cryptocurrency they hold and are willing to "stake".',
          resources: [
            {
              name: "Lido",
              url: "https://lido.fi/",
              description: "Liquid staking solution",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What is the difference between staking and yield farming?",
        "How are staking rewards calculated?",
        "What is liquid staking?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about staking and yield farming in DeFi.
      
      Focus on explaining how users can earn passive income by staking their assets or providing liquidity. Explain concepts like Proof of Stake, liquid staking, yield farming strategies, and APY/APR.
      
      When explaining:
      - Differentiate between staking for consensus and staking for yield
      - Explain the risks and rewards of different strategies
      - Discuss popular staking platforms and yield farming protocols
      - Explain how rewards are calculated and distributed
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "nft",
      name: "NFTs, Ordinals & Digital Assets",
      icon: BarChart3,
      description:
        "Non-Fungible Tokens (NFTs) and Ordinals represent ownership of unique digital items. Ordinals enable data inscription directly on Bitcoin SV, while NFTs can represent art, collectibles, gaming items, and more.",
      concepts: [
        {
          title: "Digital Ownership",
          description: "NFTs and Ordinals prove ownership of digital assets on the blockchain. Ordinals allow data to be inscribed directly onto satoshis, creating unique digital artifacts.",
          resources: [
            {
              name: "MNEE Documentation",
              url: "https://docs.mnee.io",
              description: "Learn about Ordinals and BSV21 tokens",
            },
          ],
        },
        {
          title: "Ordinals vs Traditional NFTs",
          description: "Ordinals differ from traditional NFTs by inscribing data directly on Bitcoin SV satoshis, while NFTs typically use smart contracts on other blockchains. Both enable digital ownership and collectibles.",
          resources: []
        },
        {
          title: "Use Cases",
          description: "Digital assets can represent art, collectibles, gaming items, identity, credentials, and more. They enable new monetization models for creators and unique experiences for users.",
          resources: []
        }
      ],
      suggestedQuestions: [
        "What are Ordinals and how do they differ from NFTs?",
        "How do I create or trade digital assets?",
        "What makes a digital asset valuable?",
        "How do royalties work for creators?",
        "What are the use cases for NFTs and Ordinals?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about NFTs, Ordinals, and digital assets.
      
      Focus on explaining how NFTs and Ordinals represent digital ownership, how they're created and traded, and their various use cases. Explain the relationship between Ordinals (on Bitcoin SV) and traditional NFTs.
      
      When explaining:
      - Explain Ordinals and how they work on Bitcoin SV
      - Compare Ordinals to traditional NFTs
      - Discuss how digital assets enable new business models
      - Explain how royalties work for creators
      - Discuss use cases beyond digital art (gaming, identity, credentials)
      - Explain how to evaluate digital asset projects
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "dao",
      name: "DAOs & Governance",
      icon: GanttChart,
      description:
        "Decentralized Autonomous Organizations (DAOs) are community-led entities with no central authority. Governance tokens give holders voting rights in these organizations.",
      concepts: [
        {
          title: "On-Chain Governance",
          description: "Voting and proposal systems implemented directly on the blockchain.",
          resources: [
            {
              name: "MakerDAO",
              url: "https://makerdao.com/",
              description: "DAO governing the DAI stablecoin",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "How does voting work in a DAO?",
        "What is a governance token?",
        "What are the challenges facing DAOs?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about DAOs (Decentralized Autonomous Organizations) and on-chain governance.
      
      Focus on explaining how DAOs enable decentralized decision-making, how governance tokens work, and the challenges and opportunities of DAO governance.
      
      When explaining:
      - Compare DAOs to traditional organizations
      - Explain how proposals and voting work
      - Discuss different governance models (token-weighted, quadratic, etc.)
      - Provide examples of successful DAOs and their governance structures
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "wallets",
      name: "Wallets & Security",
      icon: Wallet,
      description:
        "Cryptocurrency wallets store private keys needed to access and manage your digital assets. For MNEE and Ordinals-based tokens, wallet management includes handling UTXOs and WIF (Wallet Import Format) keys securely.",
      concepts: [
        {
          title: "Types of Wallets",
          description: "Hot wallets (online) vs. cold wallets (offline) and their security implications. For MNEE, you can use the MNEE CLI or integrate wallet functionality using the SDK.",
          resources: [
            {
              name: "MNEE CLI",
              url: "https://docs.mnee.io/cli",
              description: "Command-line wallet management for MNEE",
            },
            {
              name: "MNEE SDK",
              url: "https://www.npmjs.com/package/@mnee/ts-sdk",
              description: "Integrate wallet functionality into your app",
            },
          ],
        },
        {
          title: "WIF Keys & Security",
          description: "WIF (Wallet Import Format) keys are used to sign transactions for MNEE and Ordinals-based tokens. These must be stored securely and never shared. The MNEE CLI helps manage WIF keys safely.",
          resources: [
            {
              name: "MNEE Wallet Guide",
              url: "https://docs.mnee.io/wallet",
              description: "Learn about MNEE wallet management",
            }
          ]
        },
        {
          title: "UTXO Management",
          description: "Understanding UTXOs (Unspent Transaction Outputs) is important for managing tokens on Ordinals-based systems. Each UTXO contains token data and must be properly tracked for accurate balances.",
          resources: []
        }
      ],
      suggestedQuestions: [
        "What is a seed phrase and how do I protect it?",
        "How do I manage MNEE wallets securely?",
        "What is a WIF key and why is it important?",
        "How do I recognize and avoid scams?",
        "What happens if I lose access to my wallet?",
        "How do UTXOs work with MNEE tokens?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about cryptocurrency wallets and security best practices, with a focus on MNEE and Ordinals-based tokens.
      
      Focus on explaining how wallets work, the different types available, WIF key management, UTXO handling, and how users can secure their assets and protect themselves from scams.
      
      When explaining:
      - Explain the difference between custodial and non-custodial wallets
      - Emphasize the importance of seed phrase and WIF key security
      - Discuss MNEE-specific wallet management using CLI and SDK
      - Explain UTXO management for Ordinals-based tokens
      - Discuss common scams and how to avoid them
      - Provide guidance on wallet selection based on user needs
      - Explain best practices for storing private keys
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "defi2",
      name: "DeFi 2.0 & Beyond",
      icon: Coins,
      description:
        "DeFi 2.0 refers to the next generation of DeFi protocols that address limitations of the first wave, focusing on sustainability, capital efficiency, and risk management.",
      concepts: [
        {
          title: "Protocol-Owned Liquidity",
          description: "Protocols that own their own liquidity rather than relying on incentivized users.",
          resources: [
            {
              name: "Olympus DAO",
              url: "https://www.olympusdao.finance/",
              description: "Protocol with bonding mechanism",
            },
          ],
        },
      ],
      suggestedQuestions: [
        "What problems does DeFi 2.0 solve?",
        "What is protocol-owned liquidity?",
        "How are DeFi protocols becoming more sustainable?",
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about advanced DeFi concepts and the evolution of DeFi protocols.
      
      Focus on explaining how DeFi 2.0 protocols are addressing the limitations of earlier DeFi systems, innovations in capital efficiency, and emerging trends in the space.
      
      When explaining:
      - Discuss the sustainability challenges of early DeFi protocols
      - Explain concepts like protocol-owned liquidity and its benefits
      - Discuss innovations in risk management and insurance
      - Highlight emerging trends and potential future developments
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`,
    },
    {
      id: "mnee",
      name: "MNEE Stablecoin",
      icon: Coins,
      description: "MNEE is a USD-backed stablecoin built on the 1Sat Ordinals protocol, offering fast transactions, low fees, and instant finality for Web3 applications.",
      concepts: [
        {
          title: "What is MNEE?",
          description: "MNEE is a USD-backed stablecoin that provides a stable value for transactions on the blockchain. It's built on the 1Sat Ordinals protocol, enabling fast and efficient transfers with minimal fees.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Complete developer documentation and API reference." },
            { name: "MNEE Developer Portal", url: "https://developer.mnee.net", description: "Get API keys and access developer tools." },
            { name: "MNEE GitHub", url: "https://github.com/mnee-io", description: "SDK source code and examples." }
          ]
        },
        {
          title: "Key Features",
          description: "MNEE offers instant finality, low transaction fees, and seamless integration with Web3 applications. It's designed for in-app payments, microtransactions, P2P transfers, gaming, remittances, and A2A payments.",
          resources: [
            { name: "MNEE SDK", url: "https://www.npmjs.com/package/@mnee/ts-sdk", description: "TypeScript SDK for integrating MNEE into your applications." },
            { name: "MNEE CLI", url: "https://docs.mnee.io/cli", description: "Command-line interface for managing MNEE wallets and transactions." }
          ]
        },
        {
          title: "Use Cases",
          description: "MNEE is ideal for various applications including in-app payments, microtransactions, peer-to-peer transfers, gaming economies, remittances, and account-to-account payments. Its stable value makes it perfect for financial applications.",
          resources: []
        },
        {
          title: "Getting Started",
          description: "To start using MNEE, you'll need to get an API key from the developer portal, install the SDK, and set up your wallet. The SDK provides methods for transfers, balance checks, transaction history, and UTXO management.",
          resources: [
            { name: "Quick Start Guide", url: "https://docs.mnee.io/quickstart", description: "Step-by-step guide to integrating MNEE." },
            { name: "API Reference", url: "https://docs.mnee.io/api", description: "Complete API endpoint documentation." }
          ]
        }
      ],
      suggestedQuestions: [
        "What is MNEE and how does it work?",
        "How do I integrate MNEE into my application?",
        "What are the benefits of using MNEE over other stablecoins?",
        "How do I get started with the MNEE SDK?",
        "What are the transaction fees for MNEE?",
        "How do I check my MNEE balance?",
        "Can I use MNEE for microtransactions?",
        "What is the difference between MNEE and other stablecoins?"
      ],
      systemPrompt: `You are a helpful Web3 educator specializing in MNEE (a USD-backed stablecoin built on the 1Sat Ordinals protocol).

MNEE Key Information:
- USD-backed stablecoin for stable value transactions
- Built on 1Sat Ordinals protocol
- Fast transactions with instant finality
- Low transaction fees
- Ideal for in-app payments, microtransactions, P2P transfers, gaming, remittances, and A2A payments
- SDK available: @mnee/ts-sdk (npm package)
- Documentation: https://docs.mnee.io
- Developer Portal: https://developer.mnee.net (for API keys)
- CLI tool available for wallet management

When explaining MNEE:
- Emphasize its stability as a USD-backed token
- Highlight the speed and low fees compared to other networks
- Explain practical use cases and integration methods
- Provide guidance on getting started with the SDK
- Discuss the benefits for developers and end users
- Explain how it works on the 1Sat Ordinals protocol

If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    },
    {
      id: "payments",
      name: "Payments & Microtransactions",
      icon: Send,
      description: "Blockchain payments enable fast, low-cost transfers without intermediaries. Microtransactions open new possibilities for content monetization, gaming, and digital services.",
      concepts: [
        {
          title: "Stablecoin Payments",
          description: "Stablecoins like MNEE provide stable value for payments, making them ideal for everyday transactions, remittances, and cross-border payments without volatility concerns.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Learn about MNEE stablecoin payments." },
            { name: "MNEE SDK", url: "https://www.npmjs.com/package/@mnee/ts-sdk", description: "Integrate payments into your app." }
          ]
        },
        {
          title: "Microtransactions",
          description: "Microtransactions enable small-value payments that were previously uneconomical. They're perfect for content creators, gaming economies, pay-per-use services, and tipping.",
          resources: []
        },
        {
          title: "Payment Integration",
          description: "Integrating blockchain payments into applications requires understanding wallets, transaction fees, confirmation times, and user experience considerations.",
          resources: [
            { name: "MNEE Quick Start", url: "https://docs.mnee.io/quickstart", description: "Get started with MNEE payments." },
            { name: "MNEE API Reference", url: "https://docs.mnee.io/api", description: "Complete payment API documentation." }
          ]
        }
      ],
      suggestedQuestions: [
        "How do stablecoin payments work?",
        "What are the benefits of using blockchain for payments?",
        "How can I integrate payments into my application?",
        "What are microtransactions and why are they important?",
        "How do I handle payment fees in my app?",
        "What's the difference between on-chain and off-chain payments?"
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about blockchain payments and microtransactions.
      
      Focus on explaining how blockchain enables fast, low-cost payments, the role of stablecoins like MNEE, and how to integrate payment functionality into applications.
      
      When explaining:
      - Emphasize the benefits of blockchain payments (speed, low fees, no intermediaries)
      - Explain how stablecoins solve volatility issues for payments
      - Discuss use cases like remittances, gaming, content monetization, and microtransactions
      - Provide guidance on integrating payment systems
      - Explain transaction fees and confirmation times
      - Discuss best practices for payment UX
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    },
    {
      id: "ordinals",
      name: "Ordinals & BSV21 Tokens",
      icon: Code,
      description: "Ordinals enable data inscription on Bitcoin SV, while BSV21 is a token standard for creating fungible tokens like MNEE on the 1Sat Ordinals protocol.",
      concepts: [
        {
          title: "What are Ordinals?",
          description: "Ordinals allow data to be inscribed directly onto satoshis (the smallest unit of Bitcoin), creating unique digital artifacts and enabling token standards like BSV21.",
          resources: [
            { name: "MNEE Documentation", url: "https://docs.mnee.io", description: "Learn about MNEE on 1Sat Ordinals." },
            { name: "BSV21 Standard", url: "https://docs.mnee.io/bsv21", description: "Understanding the BSV21 token standard." }
          ]
        },
        {
          title: "BSV21 Token Standard",
          description: "BSV21 is a token standard built on 1Sat Ordinals that enables the creation of fungible tokens like stablecoins. MNEE uses this standard for its USD-backed stablecoin.",
          resources: []
        },
        {
          title: "UTXOs and Token Management",
          description: "Understanding Unspent Transaction Outputs (UTXOs) is crucial for managing tokens on Ordinals-based systems. Each UTXO can contain token data and must be properly managed for transfers.",
          resources: [
            { name: "MNEE UTXO Guide", url: "https://docs.mnee.io/utxos", description: "Learn about UTXO management with MNEE." }
          ]
        }
      ],
      suggestedQuestions: [
        "What are Ordinals and how do they work?",
        "What is the BSV21 token standard?",
        "How does MNEE use Ordinals?",
        "What are UTXOs and why are they important?",
        "How do token transfers work on Ordinals?",
        "What's the difference between Ordinals and other token standards?"
      ],
      systemPrompt: `You are a helpful Web3 educator teaching about Ordinals and the BSV21 token standard.
      
      Focus on explaining how Ordinals enable data inscription on Bitcoin SV, the BSV21 token standard for fungible tokens, and how systems like MNEE leverage this technology.
      
      When explaining:
      - Explain Ordinals in simple terms (data inscribed on satoshis)
      - Describe the BSV21 standard and its benefits
      - Explain how MNEE uses 1Sat Ordinals protocol
      - Discuss UTXO management and why it matters
      - Compare Ordinals-based tokens to other token standards
      - Explain transaction mechanics on Ordinals-based systems
      
      If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`
    }
  ]

  // Helper function to create educational fallback responses
  const createEducationalFallbackResponse = useCallback(
    (func: FunctionCall, result: any, currentSection?: DeFiSection): string => {
      const sectionName = currentSection?.name || "DeFi"

      switch (func.name) {
        case "get_token_balance":
          return `Your ${result.token || "token"} balance is ${result.balance} ${func.arguments.token_address === "native" ? "BNB" : result.token || "tokens"}.
        
In ${sectionName}, understanding your token balances is important because it helps you track your assets and make informed decisions. ${currentSection?.id === "lending" ? "For lending protocols, your balance determines how much you can lend or use as collateral." : currentSection?.id === "dex" ? "When using decentralized exchanges, knowing your balance is essential for planning trades." : "This information is fundamental to participating in any DeFi activity."}`

        case "get_token_price":
          return `The current price of ${func.arguments.token_symbol} is $${result.price}.
        
Price information is crucial in ${sectionName} as it affects the value of your assets and potential returns on investments. ${currentSection?.id === "dex" ? "When trading on DEXs, price data helps you determine if you're getting a fair exchange rate." : currentSection?.id === "staking" ? "For staking and yield farming, token prices help calculate your actual APY in dollar terms." : "Monitoring prices helps you make better decisions about when to buy, sell, or hold assets."}`

        case "get_gas_price":
          return `The current gas price is ${result.price} ${result.unit}.
        
Gas prices are important to monitor in ${sectionName} because they affect the cost of transactions on the blockchain. ${currentSection?.id === "dex" ? "When using DEXs, high gas prices can significantly impact the profitability of smaller trades." : currentSection?.id === "lending" ? "For lending platforms, understanding gas costs helps you determine if smaller deposits or withdrawals are economical." : "Being aware of gas prices helps you time your transactions to minimize fees."}`

        case "send_token":
          return `Transaction sent! ${func.arguments.amount} ${func.arguments.token_address === "native" ? "BNB" : "tokens"} have been sent to ${func.arguments.to_address}. Transaction hash: ${result.txHash}
        
In ${sectionName}, transactions like this represent the fundamental way value moves between addresses on the blockchain. ${currentSection?.id === "wallets" ? "This demonstrates how your wallet interacts with the blockchain to transfer assets securely." : "This transaction has been recorded on the blockchain and is now immutable and transparent - key principles of DeFi."}`

        case "swap_tokens":
          return `Swap completed! You received ${result.amountOut} ${func.arguments.token_out} in exchange for ${func.arguments.amount_in} ${func.arguments.token_in}. Transaction hash: ${result.txHash}
        
Token swaps are a core function in ${sectionName}, especially for decentralized exchanges. ${currentSection?.id === "dex" ? "This swap was executed through liquidity pools rather than a traditional order book, demonstrating how AMMs (Automated Market Makers) work." : "This demonstrates how DeFi enables permissionless trading without intermediaries, one of the key innovations of decentralized finance."}`

        default:
          return `Function ${func.name} executed successfully: ${JSON.stringify(result, null, 2)}
        
This information is relevant to ${sectionName} because it provides data that can help you make more informed decisions in the DeFi ecosystem.`
      }
    },
    [],
  )

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    const userMessage: Message = { role: "user", content: messageInput }
    setMessages((prev) => [...prev, userMessage])
    setMessageInput("")
    setIsProcessing(true)

    // Sensay branch (primary model)
    /* if (useSensay) {
      // Inject system prompt about Sensay
      const systemMessage: ChatMessage = {
        role: "system",
        content: `You are Sensay AI, an AI-driven blockchain knowledge engine with deep expertise in two networks:

1. Sensay AI Network: A comprehensive API-first Web3 platform providing chat-based blockchain Q&A, replica management, and history features via endpoints like /v1/replicas/{replicaUUID}/chat/completions. You can guide users on how to integrate, authenticate, and use Sensay in their applications, including code snippets.

2. Cyberscope Networks: A web-based blockchain analytics service delivering monitoring dashboards, on-chain metrics, and developer APIs at https://www.cyberscope.io. You can explain how to access Cyberscope data, use their APIs, and interpret metrics.

Use this context to answer any user questions about Sensay or Cyberscope comprehensively, providing accurate details, example URLs or code where appropriate. Do not respond that you lack information.`
      }
      // Prepare conversation messages
      const sensayMessages: ChatMessage[] = [
        systemMessage,
        ...messages.map((m) => ({ role: m.role, content: m.content, name: m.name })),
        { role: "user", content: messageInput }
      ]
      try {
        const response = await callSensayWithContext(sensayMessages)
        setMessages((prev) => [...prev, { role: "assistant", content: response }])
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMsg}` }])
      } finally {
        setIsProcessing(false)
      }
      return
    } */

    try {
      const currentSection = defiSections.find((section) => section.id === activeSection)
      const contextInfo = currentSection
        ? `We are discussing ${currentSection.name}. ${currentSection.description}`
        : "We are discussing DeFi (Decentralized Finance) in general."

      // Create system prompt based on the current section
      const systemPrompt =
        currentSection?.systemPrompt ||
        `You are a helpful Web3 educator specializing in DeFi topics. You're currently teaching about ${currentSection?.name || "DeFi basics"}. 
        Provide clear, educational responses that help users understand ${currentSection?.name || "DeFi"} concepts.
        ${contextInfo}
        
        When explaining concepts:
        - Use simple language and avoid jargon when possible
        - Provide real-world examples
        - Explain risks and benefits
        - Mention relevant protocols or projects
        
        When you receive function results, interpret them and respond in a natural, conversational way that incorporates the data and relates it back to the ${currentSection?.name || "DeFi"} concepts being taught.
        
        If the user asks about blockchain data or operations that require Web3 functions, inform them that you'll use functions to help answer their question.`

      // Check if we need to call Web3 functions
      let newFunctionCalls: FunctionCall[] = []
      let skipConversationalModel = false

      // We'll always use the conversational model first
      newFunctionCalls = []
      skipConversationalModel = false

      // We'll let the LLM decide if it needs to call functions

      // Only call the conversational model if we didn't get a response from the function calls
      let aiResponse = ""

      try {
        if (useLocalAI) {
          try {
            // Prepare messages for Llama
            const conversationalMessages: ChatMessage[] = messages
              .filter((m) => m.role !== "function") // Filter out function messages for the initial query
              .map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
                name: m.name,
              }))

            // Add the new user message
            conversationalMessages.push({
              role: "user",
              content: messageInput,
            })

            // Add system message to guide the model
            conversationalMessages.unshift({
              role: "system",
              content:
                systemPrompt +
                `\n\nIf you need to call a Web3 function, include [FUNCTION_CALL:function_name] in your response. Available functions: get_token_balance, get_token_price, get_gas_price, send_token, swap_tokens, add_liquidity, explain_transaction, estimate_gas.`,
            })

            // Call Llama
            aiResponse = await callLlama(
              {
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              },
              localEndpoint,
            )

            // Parse the response for function calls
            const parsedResponse = parseLlamaResponse(aiResponse)

            // If there's a function call, create it and add it to the queue
            if (parsedResponse.functionName) {
              const functionCall = createFunctionCall(parsedResponse.functionName, parsedResponse.functionArgs || {})
              newFunctionCalls.push(functionCall)

              // Add the assistant's message without the function call tag
              setMessages((prev) => [...prev, { role: "assistant", content: parsedResponse.text }])

              // Add the function call to the queue
              setFunctionCalls((prev) => [...prev, functionCall])

              // Auto-approve and execute read-only functions
              if (isReadOnlyFunction(functionCall.name)) {
                setTimeout(() => {
                  handleFunctionStatusChange(functionCall.id, "approved")
                }, 500)
              }

              // Skip adding another assistant message
              skipConversationalModel = true
            } else {
              // No function call, just use the response as is
              aiResponse = parsedResponse.text
            }
          } catch (error) {
            console.error("Error calling local model:", error)
            aiResponse = `I couldn't connect to the local model. ${error instanceof Error ? error.message : "Unknown error"}`
          }
        } else {
          // Gemini path (backend will use env API key)
          {
            // Prepare messages for Gemini
            const conversationalMessages: ChatMessage[] = messages
              .filter((m) => m.role !== "function") // Filter out function messages for the initial query
              .map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
                name: m.name,
              }))

            // Add the new user message
            conversationalMessages.push({
              role: "user",
              content: messageInput,
            })

            // Add system message to guide the model
            conversationalMessages.unshift({
              role: "system",
              content:
                systemPrompt +
                `\n\nIf you need to call a Web3 function, include [FUNCTION_CALL:function_name] in your response. Available functions: get_token_balance, get_token_price, get_gas_price, send_token, swap_tokens, add_liquidity, explain_transaction, estimate_gas.`,
            })

            // Call Gemini
            aiResponse = await callOpenAI({
              model: "gemini-2.0-flash-lite",
              messages: conversationalMessages,
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2000,
            })

            // Parse the response for function calls
            const parsedResponse = parseLlamaResponse(aiResponse)

            // If there's a function call, create it and add it to the queue
            if (parsedResponse.functionName) {
              const functionCall = createFunctionCall(parsedResponse.functionName, parsedResponse.functionArgs || {})
              newFunctionCalls.push(functionCall)

              // Add the assistant's message without the function call tag
              setMessages((prev) => [...prev, { role: "assistant", content: parsedResponse.text }])

              // Add the function call to the queue
              setFunctionCalls((prev) => [...prev, functionCall])

              // Auto-approve and execute read-only functions
              if (isReadOnlyFunction(functionCall.name)) {
                setTimeout(() => {
                  handleFunctionStatusChange(functionCall.id, "approved")
                }, 500)
              }

              // Skip adding another assistant message
              skipConversationalModel = true
            } else {
              // No function call, just use the response as is
              aiResponse = parsedResponse.text
            }
          }
        }

        // Only add the assistant message if we didn't already add one for a function call
        if (!skipConversationalModel && aiResponse && !aiResponse.includes("No valid response from Llama model")) {
          setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
        }
      } catch (error) {
        console.error("Error processing message:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ])

        toast({
          title: "Error",
          description: "Failed to get a response from the AI.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error)
      setIsProcessing(false)
    }
  }

  const handleFunctionStatusChange = useCallback(
    async (id: string, status: "approved" | "rejected" | "executed", result?: any) => {
      // Update the function call status
      setFunctionCalls((prev) =>
        prev.map((func) => (func.id === id ? { ...func, status, result: result || func.result } : func)),
      )

      // If a function was executed, process the result
      if (status === "executed" && result) {
        const func = functionCalls.find((f) => f.id === id)
        if (!func) return

        // Format the result for display in the function message
        let formattedResult = ""

        switch (func.name) {
          case "get_token_balance":
            formattedResult = JSON.stringify({
              balance: result.balance,
              token: result.token || (func.arguments.token_address === "native" ? "BNB" : "TOKEN"),
              wallet_address: func.arguments.wallet_address,
            })
            break
          case "get_token_price":
            formattedResult = JSON.stringify({
              price: result.price,
              currency: "USD",
              token_symbol: func.arguments.token_symbol,
            })
            break
          case "send_token":
            formattedResult = JSON.stringify({
              txHash: result.txHash,
              status: result.status,
              amount: func.arguments.amount,
              token: func.arguments.token_address === "native" ? "BNB" : "TOKEN",
              to_address: func.arguments.to_address,
            })
            break
          case "swap_tokens":
            formattedResult = JSON.stringify({
              txHash: result.txHash,
              status: result.status,
              amountIn: func.arguments.amount_in,
              amountOut: result.amountOut,
              tokenIn: func.arguments.token_in,
              tokenOut: func.arguments.token_out,
            })
            break
          case "get_gas_price":
            formattedResult = JSON.stringify({
              price: result.price,
              unit: result.unit,
              chain: func.arguments.chain,
            })
            break
          default:
            formattedResult = JSON.stringify(result)
        }

        // Add the function result as a function message
        const functionMessage: Message = {
          role: "function",
          name: func.name,
          content: formattedResult,
        }

        setMessages((prev) => [...prev, functionMessage])

        // Now send the function result to the AI for interpretation
        const currentSection = defiSections.find((section) => section.id === activeSection)
        const contextInfo = currentSection
          ? `We are discussing ${currentSection.name}. ${currentSection.description}`
          : "We are discussing DeFi (Decentralized Finance) in general."

        // Create system prompt for function result interpretation
        const interpretationPrompt = `You are a helpful Web3 educator specializing in ${currentSection?.name || "DeFi"} topics. 
      
You've just received the result of a ${func.name} function call. Interpret this data and explain it to the user in the context of ${currentSection?.name || "DeFi"}.

${contextInfo}

Respond in a natural, conversational way that:
1. Explains what the data means in plain language
2. Relates it back to the ${currentSection?.name || "DeFi"} concepts being taught
3. Provides educational context about why this information is important

Be concise but informative. Don't just repeat the raw data - explain its significance in the context of the current lesson.`

        const conversationalMessages: ChatMessage[] = []

        // Add system message to guide the model's interpretation
        conversationalMessages.push({
          role: "system",
          content: interpretationPrompt,
        })

        // Add the function result message
        conversationalMessages.push({
          role: "function",
          name: func.name,
          content: formattedResult,
        })

        // Call the AI to interpret the function result
        let aiResponse: string

        try {
          if (!useLocalAI) {
            // Use OpenAI
            if (!apiKeys.openai) {
              // Create a fallback educational response if no OpenAI API key
              aiResponse = createEducationalFallbackResponse(func, result, currentSection)
            } else {
              aiResponse = await callOpenAI({
                model: "gpt-4o",
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              })
            }
          } else {
            // Use Llama
            aiResponse = await callLlama(
              {
                messages: conversationalMessages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
              },
              localEndpoint,
            )
          }

          // Add the AI's interpretation as an assistant message
          if (aiResponse && !aiResponse.includes("No valid response from Llama model")) {
            setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
          } else {
            // Fallback if Llama doesn't provide a valid response
            const fallbackResponse = createEducationalFallbackResponse(func, result, currentSection)
            setMessages((prev) => [...prev, { role: "assistant", content: fallbackResponse }])
          }
        } catch (error) {
          console.error("Error getting AI interpretation:", error)

          // Fallback to an educational response if AI interpretation fails
          const fallbackResponse = createEducationalFallbackResponse(func, result, currentSection)
          setMessages((prev) => [...prev, { role: "assistant", content: fallbackResponse }])
        }

        // If the function generated a transaction, add it to the transaction queue
        if (result.txHash) {
          // Add to transaction queue if window.transactionQueue exists
          if (window.transactionQueue) {
            window.transactionQueue.add({
              hash: result.txHash,
              from: address || "",
              to: func.arguments.to_address || "",
              value: func.arguments.amount || "0",
              chainId: String(currentChain),
              type: func.name,
              status: "confirmed",
              method: func.name,
              timestamp: Date.now(),
              description: `${func.name} - ${func.arguments.amount || ""} ${func.arguments.token_address === "native" ? "BNB" : "tokens"}`,
              execute: async () => { },
            })
          }
        }
      }
    },
    [
      currentChain,
      functionCalls,
      apiKeys,
      useLocalAI,
      localEndpoint,
      setMessages,
      createEducationalFallbackResponse,
      callOpenAI,
      callLlama,
    ],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const section = defiSections.find((s) => s.id === sectionId)
    if (section) {
      const aiMessage: Message = {
        role: "assistant",
        content: `Let's explore ${section.name}. ${section.description}`,
      }
      setMessages([aiMessage])
      setFunctionCalls([])
    }
  }

  const handleSelectQuestion = (question: string) => {
    setMessageInput(question)
  }

  const toggleHistoryPanel = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed)
  }

  const togglePromptsPanel = () => {
    setIsSuggestionsCollapsed(!isSuggestionsCollapsed)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsSuggestionsCollapsed(true)
      }
      if (window.innerWidth < 1200) {
        setIsHistoryCollapsed(true)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const renderResourceLink = (resource: { name: string; url: string; description: string }) => {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-primary hover:underline my-1"
      >
        <ExternalLink size={14} />
        {resource.name}
        <span className="text-muted-foreground text-xs">- {resource.description}</span>
      </a>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/95">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "border-r bg-card/50 flex-shrink-0 transition-all duration-300 h-[calc(100vh-4rem)] flex flex-col",
            isHistoryCollapsed ? "w-10" : "w-[280px] md:w-1/4 lg:w-1/5",
          )}
        >
          {isHistoryCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHistoryPanel}
              className="h-full rounded-none border-r w-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">DeFi Topics</h2>
                  <Button variant="ghost" size="icon" onClick={toggleHistoryPanel} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search topics..."
                    className="w-full pl-10 py-2 bg-background/50 border border-input rounded-md text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {defiSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left transition-all",
                        activeSection === section.id
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                          : "hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20"
                      )}
                      onClick={() => handleSelectSection(section.id)}
                    >
                      <section.icon className="mr-2 h-4 w-4" />
                      <span>{section.name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t mt-auto p-4 bg-card/30 backdrop-blur-sm">
                <h3 className="font-medium text-sm mb-2 flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-indigo-500" />
                  Transaction Queue
                </h3>
                <div className="h-[25vh] max-h-[200px] overflow-y-auto rounded-md border bg-background/50">
                  <TransactionQueue chainId={currentChain} inPanel={true} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-4rem)]">
          <div className="flex items-center border-b px-4 py-3 bg-background/95 backdrop-blur-sm z-10">
            {isHistoryCollapsed && (
              <Button variant="ghost" size="icon" onClick={toggleHistoryPanel} className="md:hidden h-8 w-8 mr-2">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold flex items-center">
              {defiSections.find((s) => s.id === activeSection)?.icon &&
                React.createElement(defiSections.find((s) => s.id === activeSection)?.icon || "div", {
                  className: "mr-2 h-5 w-5 text-primary",
                })}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {defiSections.find((s) => s.id === activeSection)?.name || "Web3 Introduction"}
              </span>
            </h2>
            {isSuggestionsCollapsed && (
              <Button variant="ghost" size="icon" onClick={togglePromptsPanel} className="md:hidden h-8 w-8 ml-auto">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background/80 to-background">
              <div className="space-y-4 max-w-3xl mx-auto pb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 animate-float">
                      <School className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Web3 Learning Hub
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Ask questions and learn about {defiSections.find((s) => s.id === activeSection)?.name || "Web3 concepts"}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-6 justify-center">
                      {defiSections
                        .find((s) => s.id === activeSection)
                        ?.suggestedQuestions.slice(0, 3).map((question, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs border-indigo-500/20 text-muted-foreground hover:bg-indigo-500/5 hover:text-foreground rounded-lg"
                            onClick={() => handleSelectQuestion(question)}
                          >
                            {question}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : (
                  messages
                    .filter((m) => m.role !== "function" || showFunctionMessages)
                    .map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role !== "user" && (
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center",
                              message.role === "function"
                                ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                                : "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md"
                            )}
                          >
                            {message.role === "function" ? (
                              <Code size={16} className="text-amber-600 dark:text-amber-400" />
                            ) : (
                              <School size={16} className="text-white" />
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            "p-3 md:p-4 rounded-xl max-w-[85%] shadow-sm",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground ml-auto rounded-tr-sm"
                              : message.role === "function"
                                ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-tl-sm"
                                : "bg-card rounded-tl-sm"
                          )}
                        >
                          {message.role === "function" ? (
                            <div>
                              <div className="font-mono text-xs text-amber-700 dark:text-amber-300 mb-1">
                                Function Response:
                              </div>
                              <pre className="text-xs overflow-auto">{message.content}</pre>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap break-words text-sm md:text-base prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {message.role === "user" && (
                          <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                            <MessageSquare size={16} className="text-primary" />
                          </div>
                        )}
                      </div>
                    ))
                )}

                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center shadow-md">
                      <School size={16} className="text-white" />
                    </div>
                    <div className="p-4 rounded-xl bg-card rounded-tl-sm flex items-center max-w-[85%] shadow-sm">
                      <div className="dot-typing"></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 bg-background">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about Web3 or DeFi..."
                    className="min-h-[60px] flex-1 bg-card/70 border-indigo-500/20 focus-visible:ring-indigo-500/50 rounded-xl"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="self-end rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    disabled={isProcessing}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {activeSection && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {defiSections
                      .find((s) => s.id === activeSection)
                      ?.suggestedQuestions.slice(0, 3).map((question, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs border-indigo-500/20 text-muted-foreground hover:bg-indigo-500/5 hover:text-foreground rounded-lg"
                          onClick={() => handleSelectQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "bg-card/50 flex-shrink-0 transition-all duration-300 flex flex-col h-[calc(100vh-4rem)]",
          isSuggestionsCollapsed ? "w-10" : "w-[280px] md:w-1/4 lg:w-1/5",
        )}>
          {isSuggestionsCollapsed ? (
            <Button variant="ghost" size="icon" onClick={togglePromptsPanel} className="h-full rounded-none border-l w-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col h-full overflow-hidden border-l">
              <div className="p-2 flex justify-end">
                <Button variant="ghost" size="icon" onClick={togglePromptsPanel} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <Tabs defaultValue="overview" className="w-full flex flex-col h-full">
                <TabsList className="sticky top-0 z-20 bg-card/50 p-3 border-b flex gap-2">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="concepts" className="text-xs">Key Concepts</TabsTrigger>
                  <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1 overflow-y-auto p-3 space-y-3">
                  <TabsContent value="overview" className="p-2 space-y-2">
                    <h3 className="font-medium text-sm">{defiSections.find(s => s.id === activeSection)?.name}</h3>
                    <p className="text-xs text-muted-foreground">{defiSections.find(s => s.id === activeSection)?.description}</p>
                  </TabsContent>
                  <TabsContent value="concepts" className="p-2 space-y-2">
                    {defiSections.find(s => s.id === activeSection)?.concepts.map((c, i) => (
                      <div key={i} className="p-2 border rounded-lg bg-card/90">
                        <div className="font-medium text-sm">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="resources" className="p-2 space-y-2">
                    {defiSections.find(s => s.id === activeSection)?.concepts.flatMap(c => c.resources).map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 border rounded-lg hover:bg-card/80">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.description}</div>
                        </div>
                      </a>
                    ))}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Web3Intro


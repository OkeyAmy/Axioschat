/**
 * Thirdweb Blockchain Service
 * 
 * This service provides real blockchain interactions using the Thirdweb SDK.
 * It replaces the mock implementations in aiService.ts.
 */

import { createThirdwebClient, prepareTransaction, toWei } from "thirdweb"
import { getWalletBalance } from "thirdweb/wallets"
import { ethereum, polygon, bsc, arbitrum, optimism, base, avalanche, sepolia } from "thirdweb/chains"

// Initialize Thirdweb client
const clientId = import.meta.env?.VITE_THIRDWEB_CLIENT_ID || ""
export const thirdwebClient = createThirdwebClient({ clientId })

// Chain mapping
const chainById: Record<number, any> = {
    1: ethereum,
    137: polygon,
    56: bsc,
    42161: arbitrum,
    10: optimism,
    8453: base,
    43114: avalanche,
    11155111: sepolia,
}

const chainByName: Record<string, any> = {
    ethereum: ethereum,
    polygon: polygon,
    binance: bsc,
    bsc: bsc,
    arbitrum: arbitrum,
    optimism: optimism,
    base: base,
    avalanche: avalanche,
    sepolia: sepolia,
}

// Types
export interface TokenPriceResult {
    price: number
    currency: string
    timestamp: number
    source: string
}

export interface GasPriceResult {
    price: number
    unit: string
    timestamp: number
    chain: string
}

export interface TokenBalanceResult {
    balance: string
    symbol: string
    wallet_address: string
    timestamp: number
    token_address: string
}

export interface TransactionResult {
    txHash: string
    status: string
    timestamp: number
}

export interface TransactionHistoryItem {
    hash: string
    from: string
    to: string
    value: string
    timestamp: number
    status: string
    type: string
    gasUsed?: string
    gasPrice?: string
    blockNumber?: number
}

export interface TransactionHistoryResult {
    transactions: TransactionHistoryItem[]
    total: number
    chain: string
    chainId: number
    address: string
    timestamp: number
}

/**
 * Get token price from CoinGecko API
 */
export async function getTokenPrice(tokenSymbol: string): Promise<TokenPriceResult> {
    const symbolToId: Record<string, string> = {
        BTC: "bitcoin",
        ETH: "ethereum",
        BNB: "binancecoin",
        SOL: "solana",
        AVAX: "avalanche-2",
        MATIC: "matic-network",
        DOT: "polkadot",
        ADA: "cardano",
        XRP: "ripple",
        DOGE: "dogecoin",
        SHIB: "shiba-inu",
        LINK: "chainlink",
        UNI: "uniswap",
        AAVE: "aave",
    }

    const coinId = symbolToId[tokenSymbol.toUpperCase()] || tokenSymbol.toLowerCase()

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
        )

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`)
        }

        const data = await response.json()
        const price = data[coinId]?.usd

        if (price !== undefined) {
            return {
                price,
                currency: "USD",
                timestamp: Date.now(),
                source: "coingecko",
            }
        }

        // Fallback to placeholder if token not found
        throw new Error(`Token ${tokenSymbol} not found`)
    } catch (error) {
        console.error("Error fetching token price:", error)
        // Return a response indicating the error but don't throw
        return {
            price: 0,
            currency: "USD",
            timestamp: Date.now(),
            source: "error",
        }
    }
}

/**
 * Get gas price for a specific chain using Thirdweb
 */
export async function getGasPrice(chainName: string): Promise<GasPriceResult> {
    const chain = chainByName[chainName.toLowerCase()] || ethereum

    try {
        // Use public RPC endpoints to get gas price
        const rpcUrl = chain.rpc || `https://${chainName}.rpc.thirdweb.com`

        const response = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_gasPrice",
                params: [],
                id: 1,
            }),
        })

        if (response.ok) {
            const data = await response.json()
            const gasPriceWei = parseInt(data.result, 16)
            const gasPriceGwei = gasPriceWei / 1e9

            return {
                price: Math.round(gasPriceGwei * 100) / 100,
                unit: "Gwei",
                timestamp: Date.now(),
                chain: chainName,
            }
        }

        throw new Error("Failed to fetch gas price")
    } catch (error) {
        console.error("Error fetching gas price:", error)
        // Return default values for common chains
        const defaultGasPrices: Record<string, number> = {
            ethereum: 25,
            polygon: 80,
            binance: 5,
            bsc: 5,
            arbitrum: 0.1,
            optimism: 0.05,
            avalanche: 30,
            base: 0.01,
        }

        return {
            price: defaultGasPrices[chainName.toLowerCase()] || 10,
            unit: "Gwei",
            timestamp: Date.now(),
            chain: chainName,
        }
    }
}

/**
 * Get token balance using Thirdweb
 */
export async function getTokenBalance(
    walletAddress: string,
    tokenAddress: string = "native",
    chainId: number = 1
): Promise<TokenBalanceResult> {
    const chain = chainById[chainId] || ethereum

    try {
        if (tokenAddress === "native" || tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
            // Get native token balance
            const balance = await getWalletBalance({
                client: thirdwebClient,
                chain,
                address: walletAddress,
            })

            return {
                balance: balance.displayValue,
                symbol: balance.symbol,
                wallet_address: walletAddress,
                timestamp: Date.now(),
                token_address: "native",
            }
        } else {
            // For ERC20 tokens, we need to use a different approach
            // Using public RPC to call balanceOf
            const rpcUrl = `https://${chain.id}.rpc.thirdweb.com`

            // ERC20 balanceOf call data
            const data = `0x70a08231000000000000000000000000${walletAddress.slice(2)}`

            const response = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_call",
                    params: [
                        { to: tokenAddress, data },
                        "latest",
                    ],
                    id: 1,
                }),
            })

            if (response.ok) {
                const result = await response.json()
                const balanceWei = BigInt(result.result || "0")
                const balanceEth = Number(balanceWei) / 1e18 // Assuming 18 decimals

                return {
                    balance: balanceEth.toFixed(6),
                    symbol: "TOKEN",
                    wallet_address: walletAddress,
                    timestamp: Date.now(),
                    token_address: tokenAddress,
                }
            }

            throw new Error("Failed to fetch token balance")
        }
    } catch (error) {
        console.error("Error fetching balance:", error)
        return {
            balance: "0",
            symbol: "UNKNOWN",
            wallet_address: walletAddress,
            timestamp: Date.now(),
            token_address: tokenAddress,
        }
    }
}

/**
 * Prepare a send token transaction (returns transaction data, doesn't execute)
 * Actual execution should happen via wallet connection
 */
export async function prepareSendToken(
    toAddress: string,
    amount: string,
    chainId: number = 1
): Promise<{ to: string; value: string; chainId: number }> {
    return {
        to: toAddress,
        value: toWei(amount).toString(),
        chainId,
    }
}

/**
 * Get transaction details from block explorer
 */
export async function explainTransaction(
    txHash: string,
    chainId: number = 1
): Promise<{ type: string; value: string; status: string; from: string; to: string }> {
    const explorerApiUrls: Record<number, string> = {
        1: "https://api.etherscan.io/api",
        137: "https://api.polygonscan.com/api",
        56: "https://api.bscscan.com/api",
        42161: "https://api.arbiscan.io/api",
        10: "https://api-optimistic.etherscan.io/api",
        8453: "https://api.basescan.org/api",
    }

    const baseUrl = explorerApiUrls[chainId]
    if (!baseUrl) {
        return {
            type: "Unknown",
            value: "Unknown",
            status: "Unknown",
            from: "Unknown",
            to: "Unknown",
        }
    }

    try {
        const response = await fetch(
            `${baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
        )

        if (response.ok) {
            const data = await response.json()
            const tx = data.result

            if (tx) {
                const valueEth = parseInt(tx.value, 16) / 1e18

                return {
                    type: tx.input === "0x" ? "Transfer" : "Contract Interaction",
                    value: `${valueEth.toFixed(6)} ETH`,
                    status: "Confirmed",
                    from: tx.from,
                    to: tx.to || "Contract Creation",
                }
            }
        }

        throw new Error("Transaction not found")
    } catch (error) {
        console.error("Error explaining transaction:", error)
        return {
            type: "Unknown",
            value: "Unknown",
            status: "Error fetching transaction",
            from: "Unknown",
            to: "Unknown",
        }
    }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
    fromAddress: string,
    toAddress: string,
    value: string = "0",
    data: string = "0x",
    chainId: number = 1
): Promise<{ gas: number; gasPrice: number; totalCost: string }> {
    const chain = chainById[chainId] || ethereum

    try {
        const rpcUrl = `https://${chain.id}.rpc.thirdweb.com`

        const response = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_estimateGas",
                params: [{
                    from: fromAddress,
                    to: toAddress,
                    value: value === "0" ? "0x0" : `0x${BigInt(value).toString(16)}`,
                    data,
                }],
                id: 1,
            }),
        })

        if (response.ok) {
            const result = await response.json()
            const gasEstimate = parseInt(result.result, 16) || 21000

            // Get gas price
            const gasPriceResult = await getGasPrice(chain.name || "ethereum")
            const gasPrice = gasPriceResult.price

            const totalCostWei = gasEstimate * gasPrice * 1e9
            const totalCostEth = totalCostWei / 1e18

            return {
                gas: gasEstimate,
                gasPrice,
                totalCost: `${totalCostEth.toFixed(6)} ETH`,
            }
        }

        throw new Error("Failed to estimate gas")
    } catch (error) {
        console.error("Error estimating gas:", error)
        return {
            gas: 21000,
            gasPrice: 25,
            totalCost: "0.000525 ETH",
        }
    }
}

/**
 * Get transaction history for a wallet address from block explorer APIs
 * Uses Etherscan V2 API (https://docs.etherscan.io/supported-chains) which supports all chains
 */
export async function getTransactionHistory(
    walletAddress: string,
    chainId: number = 1,
    limit: number = 10
): Promise<TransactionHistoryResult> {
    // Chain name and native symbol mapping
    const chainConfigs: Record<number, { name: string; nativeSymbol: string }> = {
        1: { name: "Ethereum", nativeSymbol: "ETH" },
        137: { name: "Polygon", nativeSymbol: "MATIC" },
        56: { name: "BNB Smart Chain", nativeSymbol: "BNB" },
        42161: { name: "Arbitrum One", nativeSymbol: "ETH" },
        10: { name: "Optimism", nativeSymbol: "ETH" },
        8453: { name: "Base", nativeSymbol: "ETH" },
        43114: { name: "Avalanche", nativeSymbol: "AVAX" },
        11155111: { name: "Sepolia", nativeSymbol: "ETH" },
    }

    const config = chainConfigs[chainId] || { name: `Chain ${chainId}`, nativeSymbol: "ETH" }

    // Get API key from environment (optional - works without it but may have rate limits)
    const apiKey = import.meta.env?.VITE_ETHERSCAN_API_KEY || ""
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : ""

    try {
        // Use Etherscan V2 API which supports all chains via chainid parameter
        // Docs: https://docs.etherscan.io/supported-chains
        const baseUrl = "https://api.etherscan.io/v2/api"
        
        console.log(`[ThirdwebService] Fetching transaction history for ${walletAddress} on ${config.name} (Chain ID: ${chainId})`)

        // Helper function to fetch transactions from Etherscan V2 API
        const fetchTransactions = async (action: string): Promise<any[]> => {
            try {
                const url = `${baseUrl}?chainid=${chainId}&module=account&action=${action}&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc${apiKeyParam}`
                
                const response = await fetch(url)
                
                if (!response.ok) {
                    console.warn(`[ThirdwebService] API request failed with status ${response.status} for ${action}`)
                    return []
                }

                const data = await response.json()

                // Handle different response formats
                if (data.status === "0") {
                    // Check if it's "No transactions found" vs an actual error
                    if (data.message && data.message.includes("No transactions found")) {
                        return []
                    }
                    console.warn(`[ThirdwebService] API returned status 0 for ${action}:`, data.message)
                    return []
                }

                if (data.status === "1" && Array.isArray(data.result)) {
                    return data.result
                }

                // Try alternative response format (some APIs return data directly)
                if (Array.isArray(data.result)) {
                    return data.result
                }

                return []
            } catch (error) {
                console.error(`[ThirdwebService] Error fetching ${action}:`, error)
                return []
            }
        }

        // Fetch normal transactions, internal transactions, and ERC20 transfers in parallel
        const [normalTx, internalTx, erc20Tx] = await Promise.all([
            fetchTransactions("txlist"),
            fetchTransactions("txlistinternal"),
            fetchTransactions("tokentx")
        ])

        console.log(`[ThirdwebService] Found ${normalTx.length} normal, ${internalTx.length} internal, ${erc20Tx.length} ERC20 transactions`)

        // Combine and deduplicate transactions
        const allTxs: TransactionHistoryItem[] = []
        const seenHashes = new Set<string>()

        // Process normal transactions
        for (const tx of normalTx) {
            if (seenHashes.has(tx.hash)) continue
            
            const valueWei = BigInt(tx.value || "0")
            const valueEth = Number(valueWei) / 1e18

            allTxs.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || "Contract Creation",
                value: `${valueEth.toFixed(6)} ${config.nativeSymbol}`,
                timestamp: parseInt(tx.timeStamp) * 1000,
                status: tx.txreceipt_status === "1" ? "Success" : tx.txreceipt_status === "0" ? "Failed" : "Pending",
                type: tx.input === "0x" ? "Transfer" : "Contract Interaction",
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice,
                blockNumber: parseInt(tx.blockNumber),
            })
            seenHashes.add(tx.hash)
        }

        // Process ERC20 token transfers
        for (const tx of erc20Tx) {
            if (seenHashes.has(tx.hash)) {
                // Update existing transaction with token info
                const existing = allTxs.find(t => t.hash === tx.hash)
                if (existing) {
                    const decimals = parseInt(tx.tokenDecimal || "18")
                    const value = Number(tx.value) / Math.pow(10, decimals)
                    const symbol = tx.tokenSymbol || "Token"
                    existing.type = `Transfer ${symbol}`
                    existing.value = `${value.toFixed(4)} ${symbol}`
                    // Update recipient if this is a token transfer
                    if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
                        existing.to = tx.to
                    }
                }
                continue
            }

            // Add as new transaction
            const decimals = parseInt(tx.tokenDecimal || "18")
            const value = Number(tx.value) / Math.pow(10, decimals)
            const symbol = tx.tokenSymbol || "Token"

            allTxs.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: `${value.toFixed(4)} ${symbol}`,
                timestamp: parseInt(tx.timeStamp) * 1000,
                status: "Success", // Token transfers in this list are successful
                type: `Transfer ${symbol}`,
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice,
                blockNumber: parseInt(tx.blockNumber),
            })
            seenHashes.add(tx.hash)
        }

        // Process internal transactions (value transfers via contract calls)
        for (const tx of internalTx) {
            if (seenHashes.has(tx.hash)) continue

            const valueWei = BigInt(tx.value || "0")
            const valueEth = Number(valueWei) / 1e18

            allTxs.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || "Contract",
                value: `${valueEth.toFixed(6)} ${config.nativeSymbol}`,
                timestamp: parseInt(tx.timeStamp) * 1000,
                status: tx.txreceipt_status === "1" ? "Success" : "Failed",
                type: "Internal Transfer",
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice,
                blockNumber: parseInt(tx.blockNumber),
            })
            seenHashes.add(tx.hash)
        }

        // Sort by timestamp descending and apply limit
        allTxs.sort((a, b) => b.timestamp - a.timestamp)
        const limitedTxs = allTxs.slice(0, limit)

        return {
            transactions: limitedTxs,
            total: allTxs.length,
            chain: config.name,
            chainId,
            address: walletAddress,
            timestamp: Date.now(),
        }
    } catch (error) {
        console.error("[ThirdwebService] Error fetching transaction history:", error)
        return {
            transactions: [],
            total: 0,
            chain: config.name,
            chainId,
            address: walletAddress,
            timestamp: Date.now(),
        }
    }
}

/**
 * Get local transaction history stored in the app
 * This includes transactions initiated through the chat
 */
export function getLocalTransactionHistory(): TransactionHistoryItem[] {
    try {
        const stored = localStorage.getItem("axioschat_transactions")
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error("Error reading local transaction history:", error)
    }
    return []
}

/**
 * Save a transaction to local history
 */
export function saveLocalTransaction(tx: TransactionHistoryItem): void {
    try {
        const history = getLocalTransactionHistory()
        history.unshift(tx) // Add to beginning
        // Keep only last 50 transactions
        const trimmed = history.slice(0, 50)
        localStorage.setItem("axioschat_transactions", JSON.stringify(trimmed))
    } catch (error) {
        console.error("Error saving local transaction:", error)
    }
}

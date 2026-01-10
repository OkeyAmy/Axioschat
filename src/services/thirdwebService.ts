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

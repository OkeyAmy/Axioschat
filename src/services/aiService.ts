import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import OpenAI from "openai"
import { callGeminiForFunctions } from "./geminiService"
// import { callSensay, callSensayWithContext } from "./sensayService"

export type ChatMessage = {
  role: "user" | "assistant" | "system" | "function"
  content: string
  name?: string
}

export type FunctionCall = {
  id: string
  name: string
  arguments: Record<string, any>
  status?: "pending" | "approved" | "rejected" | "executed"
  result?: any
}

export type LlamaOptions = {
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string[]
}

export type OpenAIOptions = {
  model: string  // Now refers to Gemini model
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string[]
}

export interface LlamaRequest {
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
}

export interface OpenAIRequest {
  messages: ChatMessage[]
  model: string  // Now refers to Gemini model
  temperature?: number
  top_p?: number
  max_tokens?: number
}

export interface FlockWeb3Request {
  query: string
  tools: string
  top_p?: number
  temperature?: number
  max_new_tokens?: number
  messages?: ChatMessage[]
  chainId?: number // Current chain ID for network-aware function calls
}

// Get API tokens from localStorage
const getApiTokens = (): { gemini: string; openai: string; replicate: string; sensay: string } => {
  try {
    const apiKeys = localStorage.getItem("apiKeys")
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys)
      return {
        gemini: parsed.gemini || parsed.openai || "", // Check for both gemini and openai keys
        openai: parsed.openai || "",
        replicate: parsed.replicate || "",
        sensay: parsed.sensay || "", // Add Sensay API key
      }
    }
  } catch (error) {
    console.error("Error retrieving API tokens:", error)
  }
  return { gemini: "", openai: "", replicate: "", sensay: "" }
}

// Call Llama model (now using Gemini in production)
export async function callLlama(options: LlamaOptions, endpoint: string, useSensay: boolean = false): Promise<string> {
  try {
    // Check if we're in production (Vercel) or development
    const isProduction = !endpoint.includes("localhost") && !endpoint.includes("127.0.0.1")

    // If Sensay is selected, use it regardless of environment
    /* if (useSensay) {
      const { sensay: SENSAY_API_KEY } = getApiTokens()

      if (!SENSAY_API_KEY) {
        return "Please provide a Sensay API key in the settings to use the chatbot."
      }

      // Use Sensay for completions
      return await callSensayWithContext(options.messages)
    } else */ if (isProduction) {
      // In production, use Gemini API via the OpenAI compatibility layer
      const { gemini: GEMINI_API_KEY } = getApiTokens()

      if (!GEMINI_API_KEY) {
        return "Please provide a Gemini API key in the settings to use the chatbot."
      }

      // Call OpenAI function which now uses Gemini API
      return await callOpenAI({
        model: "gemini-2.5-flash",
        messages: options.messages,
        temperature: options.temperature,
        top_p: options.top_p,
        max_tokens: options.max_tokens,
        stop: options.stop,
      })
    } else {
      // In development, use the local Llama server
      const response = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2:latest",
          messages: options.messages,
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 2000,
          stop: options.stop || [],
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to call Llama model: ${errorText}`)
      }

      const data = await response.json()
      if (data.message && data.message.content) {
        return data.message.content
      } else {
        return "No valid response from Llama model"
      }
    }
  } catch (error) {
    console.error("Error calling Llama:", error)
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}

// Call OpenAI model (now using Gemini via server proxy)
export async function callOpenAI(options: OpenAIOptions, useSensay: boolean = false): Promise<string> {
  // If Sensay is selected as the model, use it
  /* if (useSensay) {
    const { sensay: SENSAY_API_KEY } = getApiTokens();
    
    if (!SENSAY_API_KEY) {
      return "Please provide a Sensay API key in the settings to use the chatbot.";
    }
    
    return await callSensayWithContext(options.messages);
  } */

  try {
    const { gemini: GEMINI_API_KEY } = getApiTokens();
    // If no key in localStorage, allow proxies to supply from server env
    if (!GEMINI_API_KEY) {
      console.warn("[AiService] No Gemini API key found in localStorage. Relying on server-side environment variables.");
    }
    if (!GEMINI_API_KEY) {
      console.warn("[AiService] No Gemini API key found in localStorage. Relying on server-side environment variables.");
    }

    // Convert our message format to OpenAI SDK format
    const formattedMessages = options.messages.map(msg => {
      if (msg.role === "function") {
        return {
          role: msg.role,
          name: msg.name || "function", // Function messages must have a name
          content: msg.content
        } as any;
      }
      return {
        role: msg.role,
        content: msg.content
      } as any;
    });

    // Create request body
    const requestBody = {
      model: "gemini-2.5-flash-lite",
      messages: formattedMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
    };

    console.log("Calling Gemini API via proxy with key:", GEMINI_API_KEY ? "API key exists" : "No API key");

    // Use both proxy endpoints with fallback
    try {
      // First try with proxy-gemini endpoint
      console.log("[AiService] Attempting proxy-gemini endpoint...");
      const response = await fetch("/api/proxy-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(GEMINI_API_KEY ? { "X-Gemini-API-Key": GEMINI_API_KEY } : {}),
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to call proxy-gemini: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content || "";
      } else {
        throw new Error("Invalid response format from proxy-gemini");
      }
    } catch (proxyError) {
      console.warn("[AiService] proxy-gemini failed, trying gemini-proxy:", proxyError);
      console.log("[AiService] Attempting gemini-proxy endpoint...");

      // Try with alternative gemini-proxy endpoint
      const altResponse = await fetch("/api/gemini-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(GEMINI_API_KEY ? { "X-Gemini-API-Key": GEMINI_API_KEY } : {}),
        },
        body: JSON.stringify(requestBody)
      });

      if (!altResponse.ok) {
        const errorText = await altResponse.text();
        throw new Error(`Failed to call gemini-proxy: ${errorText}`);
      }

      const altData = await altResponse.json();
      if (altData.choices && altData.choices.length > 0 && altData.choices[0].message) {
        return altData.choices[0].message.content || "";
      } else {
        throw new Error("Invalid response format from gemini-proxy");
      }
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Call FlockWeb3 model - now updated to use Gemini for function calling
export const callFlockWeb3 = async (
  input: FlockWeb3Request,
): Promise<{ text?: string; error?: string; functionCalls?: FunctionCall[] } | string> => {
  try {
    // API key check is removed here; backend (Render) is responsible for using its env var.

    console.log("Calling Gemini Functions API with input:", {
      query: input.query.substring(0, 50) + "...",
      temperature: input.temperature,
      top_p: input.top_p,
    })

    // Call the Gemini function calling service with the same input structure
    // Note: Using Gemini 2.0 Flash model as specified by the user

    // Get chain name from chain ID for context
    const getChainNameFromId = (id: number): string => {
      const chainNames: Record<number, string> = {
        1: "Ethereum Mainnet",
        137: "Polygon",
        56: "BNB Smart Chain (BSC)",
        42161: "Arbitrum One",
        10: "Optimism",
        8453: "Base",
        43114: "Avalanche",
        11155111: "Sepolia Testnet",
      }
      return chainNames[id] || `Chain ID ${id}`
    }

    const currentChainId = input.chainId || 1
    const currentChainName = getChainNameFromId(currentChainId)

    // Append system instruction to the query to prevent hallucination of wallet addresses
    const systemInstruction = `
IMPORTANT INSTRUCTION: When calling functions like get_token_balance, get_transaction_history, send_token, or estimate_gas:
1. DO NOT invent, guess, or hallucinate wallet addresses (like 0x1234... or 0xYourWallet...).
2. If the user refers to "my address", "my wallet", "me", "my transactions", "my history", or implies their own account, LEAVE the 'wallet_address' or 'from_address' field EMPTY/UNDEFINED.
3. The system will automatically fill in the connected user's wallet address.
4. ONLY provide a wallet_address if the user EXPLICITLY provides a specific 0x address in their request.
5. When the user asks about "transaction history", "transactions", "my transactions", or wants to "explain transactions", you MUST call get_transaction_history function.

CURRENT NETWORK CONTEXT:
- The user is currently connected to: ${currentChainName} (Chain ID: ${currentChainId})
- For ALL function calls that accept a chain_id parameter, use chain_id: ${currentChainId} unless the user explicitly asks about a different network.
- Native token on this network: ${currentChainId === 56 ? 'BNB' : currentChainId === 137 ? 'MATIC' : currentChainId === 43114 ? 'AVAX' : 'ETH'}
`;

    const geminiResponse = await callGeminiForFunctions({
      query: input.query + systemInstruction,
      tools: input.tools,
      top_p: input.top_p,
      temperature: input.temperature,
      max_output_tokens: input.max_new_tokens,
    })

    // Process the output from Gemini
    if (typeof geminiResponse === 'string') {
      return { text: geminiResponse }
    }

    // If there's an error, return it with proper formatting
    if (geminiResponse.error) {
      console.error("Error from Gemini function calling:", geminiResponse.error)
      // Return a user-friendly error message but don't break the conversation
      return {
        text: `I encountered an issue processing your request: ${geminiResponse.error.substring(0, 100)}... Let me try a different approach.`,
        error: geminiResponse.error
      }
    }

    // If there are function calls, process them
    if (geminiResponse.functionCalls && Array.isArray(geminiResponse.functionCalls)) {
      console.log("Parsed function calls from Gemini:", geminiResponse.functionCalls)

      // Format the function calls to match the expected structure
      const formattedFunctionCalls: FunctionCall[] = geminiResponse.functionCalls.map((call, index) => {
        // Ensure we have valid arguments even if they're not provided
        const args = call.arguments || {}

        return {
          id: `func-${Date.now()}-${index}`,
          name: call.name,
          description: call.description || `Execute ${call.name} function`,
          arguments: args,
          status: "pending" as const,
        }
      }).filter(call => call.name && typeof call.name === 'string') // Ensure only valid calls get through

      // Also include any text response that came with the function calls
      const textResponse = geminiResponse.text ||
        "I'll help you with that by performing some actions."

      if (formattedFunctionCalls.length > 0) {
        return {
          functionCalls: formattedFunctionCalls,
          text: textResponse
        }
      } else {
        // If no valid function calls were found, return a text response
        return { text: textResponse || "I couldn't find any valid function calls in the model's response." }
      }
    }

    // If there's text content, return it
    if (geminiResponse.text) {
      return { text: geminiResponse.text }
    }

    // Fallback response to ensure the conversation continues
    return { text: "I understand your request, but I'm not sure how to process it. Could you please rephrase?" }
  } catch (error) {
    console.error("Error calling AI model for function calling:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred while calling the AI model"

    // Only show toast for significant errors
    if (!(error instanceof Error && error.message.includes("AbortError"))) {
      toast({
        title: "AI API Error",
        description: errorMessage,
        variant: "destructive",
      })
    }

    // Return a more user-friendly error that doesn't break the conversation
    return {
      text: "I'm having trouble connecting to my knowledge sources right now. Let me try a different approach to help you.",
      error: errorMessage
    }
  }
}

// Parse Llama response for function calls
export function parseLlamaResponse(response: string): {
  text: string
  functionName?: string
  functionArgs?: Record<string, any>
} {
  // Check if the response contains a function call tag
  const functionCallRegex = /\[FUNCTION_CALL:([a-zA-Z_]+)\]/
  const match = response.match(functionCallRegex)

  if (!match) {
    return { text: response }
  }

  const functionName = match[1]
  const text = response.replace(functionCallRegex, "").trim()

  // Extract arguments based on the function name
  let functionArgs: Record<string, any> = {}

  // Extract wallet address if present in the text
  const walletAddressRegex = /0x[a-fA-F0-9]{40}/
  const walletAddressMatch = text.match(walletAddressRegex)
  if (walletAddressMatch) {
    functionArgs.wallet_address = walletAddressMatch[0]
  }

  // Extract token symbol if present
  const tokenSymbolRegex = /\b(BTC|ETH|BNB|USDT|USDC|DAI|LINK|UNI|AAVE|CAKE|MATIC|SOL|DOT|ADA|XRP|DOGE|SHIB)\b/i
  const tokenSymbolMatch = text.match(tokenSymbolRegex)
  if (tokenSymbolMatch) {
    functionArgs.token_symbol = tokenSymbolMatch[0].toUpperCase()
  }

  // Extract amount if present
  const amountRegex =
    /\b(\d+(\.\d+)?)\s*(BTC|ETH|BNB|USDT|USDC|DAI|LINK|UNI|AAVE|CAKE|MATIC|SOL|DOT|ADA|XRP|DOGE|SHIB)?\b/i
  const amountMatch = text.match(amountRegex)
  if (amountMatch) {
    functionArgs.amount = amountMatch[1]
    if (amountMatch[3] && !functionArgs.token_symbol) {
      functionArgs.token_symbol = amountMatch[3].toUpperCase()
    }
  }

  // Add default arguments based on function name
  // Note: wallet_address and from_address are intentionally left undefined if not provided
  // They will be filled in by executeFunctionCall using the connected wallet
  switch (functionName) {
    case "get_token_balance":
      functionArgs = {
        token_address: functionArgs.token_address || "native",
        ...functionArgs,
      }
      break
    case "get_token_price":
      functionArgs = {
        token_symbol: functionArgs.token_symbol || "BNB",
        ...functionArgs,
      }
      break
    case "get_gas_price":
      functionArgs = {
        chain: functionArgs.chain || "ethereum",
        ...functionArgs,
      }
      break
    case "send_token":
      functionArgs = {
        // Note: from_address will use connected wallet in executeFunctionCall if not provided
        to_address: functionArgs.to_address,
        amount: functionArgs.amount || "0.1",
        token_address: functionArgs.token_address || "native",
        ...functionArgs,
      }
      break
    case "swap_tokens":
      functionArgs = {
        token_in: functionArgs.token_in || "BNB",
        token_out: functionArgs.token_out || "BUSD",
        amount_in: functionArgs.amount_in || functionArgs.amount || "0.1",
        slippage: functionArgs.slippage || "0.5",
        ...functionArgs,
      }
      break
  }

  return { text, functionName, functionArgs }
}

// Create a function call object
export function createFunctionCall(name: string, args: Record<string, any>): FunctionCall {
  return {
    id: uuidv4(),
    name,
    arguments: args,
    status: "pending",
  }
}

// Check if a function is read-only (can be auto-executed)
export function isReadOnlyFunction(name: string): boolean {
  const readOnlyFunctions = [
    // Thirdweb Read Functions
    "get_token_balance",
    "get_token_price",
    "get_gas_price",
    "explain_transaction",
    "estimate_gas",
    "get_transaction_history",
  ]

  return readOnlyFunctions.includes(name)
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const createDefaultWeb3Tools = (): string => {
  // Thirdweb-based Web3 Tools
  const tools = [
    {
      type: "function",
      function: {
        name: "get_token_balance",
        description: "Get the token balance for a wallet address. Use this when the user asks about their balance, funds, or how much crypto they have. Supports native tokens (ETH, MATIC, BNB, etc.) and ERC20 tokens.",
        parameters: {
          type: "object",
          properties: {
            wallet_address: {
              type: "string",
              description: "The wallet address to check balance for. Leave empty to use the connected wallet.",
            },
            token_address: {
              type: "string",
              description: "The token contract address, or 'native' for native tokens like ETH, MATIC, BNB. Default is 'native'.",
            },
            chain_id: {
              type: "number",
              description: "The chain ID (1=Ethereum, 137=Polygon, 56=BSC, 42161=Arbitrum, 10=Optimism, 8453=Base, 43114=Avalanche, 11155111=Sepolia). Default is 1.",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_token_price",
        description: "Get the current price of a cryptocurrency token in USD. Use this when the user asks about token prices, crypto prices, or market data.",
        parameters: {
          type: "object",
          properties: {
            token_symbol: {
              type: "string",
              description: "The token symbol (e.g., BTC, ETH, BNB, SOL, MATIC, AVAX, DOT, ADA, XRP, DOGE, SHIB, LINK, UNI, AAVE).",
            },
          },
          required: ["token_symbol"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_gas_price",
        description: "Get the current gas price on a specific blockchain network. Use this when the user asks about gas fees, transaction costs, or network congestion.",
        parameters: {
          type: "object",
          properties: {
            chain: {
              type: "string",
              description: "The blockchain network name (ethereum, polygon, binance, bsc, arbitrum, optimism, base, avalanche). Default is ethereum.",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_token",
        description: "Send native tokens (ETH, MATIC, BNB, etc.) to a recipient address. Use this when the user wants to transfer or send cryptocurrency. Requires wallet approval.",
        parameters: {
          type: "object",
          properties: {
            to_address: {
              type: "string",
              description: "The recipient's wallet address (0x...)",
            },
            amount: {
              type: "string",
              description: "The amount of tokens to send (in human-readable format, e.g., '0.1')",
            },
            chain_id: {
              type: "number",
              description: "The chain ID for the transaction. Default is 1 (Ethereum).",
            },
          },
          required: ["to_address", "amount"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "explain_transaction",
        description: "Get details and explanation of a blockchain transaction by its hash. Use this when the user asks about a specific transaction.",
        parameters: {
          type: "object",
          properties: {
            tx_hash: {
              type: "string",
              description: "The transaction hash to look up (0x...)",
            },
            chain_id: {
              type: "number",
              description: "The chain ID where the transaction occurred. Default is 1 (Ethereum).",
            },
          },
          required: ["tx_hash"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "estimate_gas",
        description: "Estimate the gas cost for a transaction before executing it. Use this when the user wants to know how much a transaction will cost.",
        parameters: {
          type: "object",
          properties: {
            from_address: {
              type: "string",
              description: "The sender's wallet address. Leave empty to use the connected wallet.",
            },
            to_address: {
              type: "string",
              description: "The recipient's wallet address (0x...)",
            },
            value: {
              type: "string",
              description: "The amount to send in wei. Default is '0'.",
            },
            chain_id: {
              type: "number",
              description: "The chain ID. Default is 1 (Ethereum).",
            },
          },
          required: ["to_address"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "swap_tokens",
        description: "Swap one token for another using a DEX. This feature is coming soon and not yet available.",
        parameters: {
          type: "object",
          properties: {
            token_in: {
              type: "string",
              description: "The input token symbol or address",
            },
            token_out: {
              type: "string",
              description: "The output token symbol or address",
            },
            amount_in: {
              type: "string",
              description: "The amount of input tokens to swap",
            },
          },
          required: ["token_in", "token_out", "amount_in"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_liquidity",
        description: "Add liquidity to a DEX pool. This feature is coming soon and not yet available.",
        parameters: {
          type: "object",
          properties: {
            token_a: {
              type: "string",
              description: "The first token symbol or address",
            },
            token_b: {
              type: "string",
              description: "The second token symbol or address",
            },
            amount_a: {
              type: "string",
              description: "The amount of first token to add",
            },
            amount_b: {
              type: "string",
              description: "The amount of second token to add",
            },
          },
          required: ["token_a", "token_b", "amount_a", "amount_b"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_transaction_history",
        description: "Get the transaction history for a wallet address. Use this when the user asks about their transactions, transaction history, recent transactions, past transfers, transaction list, or wants to see what transactions they've made. Also use when they ask to 'explain transactions' or 'show my transactions'.",
        parameters: {
          type: "object",
          properties: {
            wallet_address: {
              type: "string",
              description: "The wallet address to get history for. Leave empty to use the connected wallet.",
            },
            chain_id: {
              type: "number",
              description: "The chain ID to fetch history from (1=Ethereum, 137=Polygon, 56=BSC, etc.). Uses current network if not specified.",
            },
            limit: {
              type: "number",
              description: "Maximum number of transactions to return. Default is 10.",
            },
          },
          required: [],
        },
      },
    },
  ]

  return JSON.stringify(tools)
}

// Execute a function call using Thirdweb blockchain services
export const executeFunctionCall = async (functionCall: FunctionCall, walletAddress?: string, chainId?: number): Promise<any> => {
  // Import Thirdweb service
  const thirdwebService = await import("./thirdwebService")

  console.log(`[AiService] Executing function: ${functionCall.name}`, functionCall.arguments)
  console.log(`[AiService] Connected wallet: ${walletAddress || 'Not connected'}`)
  console.log(`[AiService] Chain ID: ${chainId || 'Default (1)'}`)

  let result

  try {
    switch (functionCall.name) {
      case "get_token_balance":
        // Use connected wallet if no address specified
        const balanceAddress = functionCall.arguments.wallet_address || walletAddress
        if (!balanceAddress) {
          result = {
            error: "No wallet address provided. Please connect your wallet first.",
            timestamp: Date.now(),
          }
          break
        }
        
        result = await thirdwebService.getTokenBalance(
          balanceAddress,
          functionCall.arguments.token_address || "native",
          functionCall.arguments.chain_id || chainId || 1
        )
        break

      case "get_token_price":
        if (!functionCall.arguments.token_symbol) {
          result = {
            error: "Token symbol is required.",
            timestamp: Date.now(),
          }
          break
        }
        result = await thirdwebService.getTokenPrice(functionCall.arguments.token_symbol)
        break

      case "get_gas_price":
        result = await thirdwebService.getGasPrice(
          functionCall.arguments.chain || "ethereum"
        )
        break

      case "send_token":
        if (!functionCall.arguments.to_address || !functionCall.arguments.amount) {
          result = {
            error: "Recipient address and amount are required.",
            timestamp: Date.now(),
          }
          break
        }

        // Use the transaction bridge to request the transaction
        // The TransactionExecutor component will handle the actual execution
        const { transactionBridge } = await import("./transactionBridge")
        
        const txChainId = functionCall.arguments.chain_id || chainId || 1
        
        // Request the transaction through the bridge
        // This will trigger the wallet popup for signing
        console.log(`[AiService] Requesting transaction via bridge: ${functionCall.arguments.amount} to ${functionCall.arguments.to_address} on chain ${txChainId}`)
        
        const txResult = await transactionBridge.requestTransaction(
          functionCall.arguments.to_address,
          functionCall.arguments.amount,
          txChainId,
          "native"
        )
        
        if (txResult.success) {
          result = {
            status: "confirmed",
            txHash: txResult.txHash,
            message: `Transaction successful! Sent ${functionCall.arguments.amount} to ${functionCall.arguments.to_address}`,
            to: functionCall.arguments.to_address,
            amount: functionCall.arguments.amount,
            chainId: txChainId,
            timestamp: Date.now(),
          }
        } else {
          result = {
            status: "failed",
            error: txResult.error || "Transaction failed or was rejected",
            to: functionCall.arguments.to_address,
            amount: functionCall.arguments.amount,
            chainId: txChainId,
            timestamp: Date.now(),
          }
        }
        break

      case "explain_transaction":
        if (!functionCall.arguments.tx_hash) {
          result = {
            error: "Transaction hash is required.",
            timestamp: Date.now(),
          }
          break
        }
        result = await thirdwebService.explainTransaction(
          functionCall.arguments.tx_hash,
          functionCall.arguments.chain_id || chainId || 1
        )
        break

      case "estimate_gas":
        const fromAddr = functionCall.arguments.from_address || walletAddress
        if (!fromAddr) {
          result = {
            error: "No wallet address provided. Please connect your wallet first.",
            timestamp: Date.now(),
          }
          break
        }
        if (!functionCall.arguments.to_address) {
          result = {
            error: "Recipient address is required.",
            timestamp: Date.now(),
          }
          break
        }
        result = await thirdwebService.estimateGas(
          fromAddr,
          functionCall.arguments.to_address,
          functionCall.arguments.value || "0",
          "0x",
          functionCall.arguments.chain_id || chainId || 1
        )
        break

      case "swap_tokens":
        result = {
          status: "coming_soon",
          message: "Token swap functionality is coming soon! This feature will allow you to swap tokens directly through the chat interface using decentralized exchanges.",
          feature: "DEX Token Swaps",
          timestamp: Date.now(),
        }
        break

      case "add_liquidity":
        result = {
          status: "coming_soon",
          message: "Liquidity provision functionality is coming soon! This feature will allow you to add liquidity to DEX pools directly through the chat interface.",
          feature: "DEX Liquidity Pools",
          timestamp: Date.now(),
        }
        break

      case "get_transaction_history":
        const historyAddress = functionCall.arguments.wallet_address || walletAddress
        if (!historyAddress) {
          result = {
            error: "No wallet address provided. Please connect your wallet first.",
            timestamp: Date.now(),
          }
          break
        }

        const historyChainId = functionCall.arguments.chain_id || chainId || 1
        const limit = functionCall.arguments.limit || 10

        // Fetch from explorer APIs
        const explorerHistory = await thirdwebService.getTransactionHistory(
          historyAddress,
          historyChainId,
          limit
        )

        // Also get local transaction history
        const localHistory = thirdwebService.getLocalTransactionHistory()

        // Merge and deduplicate by hash
        const allTxHashes = new Set<string>()
        const mergedTransactions = []

        // Add explorer transactions first (most recent from blockchain)
        for (const tx of explorerHistory.transactions) {
          if (!allTxHashes.has(tx.hash)) {
            allTxHashes.add(tx.hash)
            mergedTransactions.push(tx)
          }
        }

        // Add local transactions that aren't already included
        for (const tx of localHistory) {
          if (!allTxHashes.has(tx.hash)) {
            allTxHashes.add(tx.hash)
            mergedTransactions.push(tx)
          }
        }

        // Sort by timestamp descending
        mergedTransactions.sort((a, b) => b.timestamp - a.timestamp)

        result = {
          transactions: mergedTransactions.slice(0, limit),
          total: mergedTransactions.length,
          chain: explorerHistory.chain,
          chainId: historyChainId,
          address: historyAddress,
          timestamp: Date.now(),
        }
        break

      default:
        result = {
          error: `Unknown function: ${functionCall.name}`,
          timestamp: Date.now(),
        }
    }
  } catch (error) {
    console.error(`Error executing function ${functionCall.name}:`, error)
    result = {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    }
  }

  console.log(`[AiService] Function ${functionCall.name} executed with result:`, result)
  return result
}


/* COMMENTED OUT - Previous mock implementation
export const executeFunctionCall_MOCK = async (functionCall: FunctionCall): Promise<any> => {
  // This was a mock implementation - in a real app, you would connect to actual blockchain services
  console.log(`Executing function: ${functionCall.name}`, functionCall.arguments)

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock results based on the function name
  let result

  switch (functionCall.name) {
    case "get_token_price":
      const tokenPrices: Record<string, number> = {
        BTC: 65432.78,
        ETH: 3456.89,
        BNB: 567.23,
        SOL: 145.67,
        AVAX: 34.56,
        MATIC: 0.89,
        DOT: 7.65,
        ADA: 0.45,
        XRP: 0.56,
      }

      const symbol = functionCall.arguments.token_symbol?.toUpperCase() || "BTC"
      result = {
        price: tokenPrices[symbol] || Math.floor(Math.random() * 10000) / 100,
        currency: "USD",
        timestamp: Date.now(),
      }
      break

    case "get_gas_price":
      const chainGasPrices: Record<string, number> = {
        ethereum: 25,
        binance: 5,
        polygon: 80,
        avalanche: 30,
        solana: 0.001,
        arbitrum: 0.1,
        optimism: 0.05,
      }

      const chain = functionCall.arguments.chain?.toLowerCase() || "binance"
      result = {
        price: chainGasPrices[chain] || Math.floor(Math.random() * 100),
        unit: "Gwei",
        timestamp: Date.now(),
      }
      break

    case "send_token":
      result = {
        txHash: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("")}`,
        status: "pending",
        timestamp: Date.now(),
      }
      break

    case "swap_tokens":
      result = {
        txHash: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("")}`,
        amountOut: (Number.parseFloat(functionCall.arguments.amount_in || "1") * (0.9 + Math.random() * 0.2)).toFixed(
          6,
        ),
        status: "pending",
        timestamp: Date.now(),
      }
      break

    case "add_liquidity":
      result = {
        txHash: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("")}`,
        lpTokens: (Number.parseFloat(functionCall.arguments.amount_a || "1") * Math.random()).toFixed(6),
        status: "pending",
        timestamp: Date.now(),
      }
      break

    case "get_token_balance":
      // Provide consistent mock balances for common tokens
      const tokenBalances: Record<string, number> = {
        native: 42.38, // BNB, ETH, etc.
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": 156.78, // WBNB
        "0x55d398326f99059fF775485246999027B3197955": 1250.45, // USDT on BSC
        "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": 980.23, // USDC on BSC
        "0x2170Ed0880ac9A755fd29B2688956BD959F933F8": 5.67, // ETH on BSC
      }

      const tokenAddress = functionCall.arguments.token_address || "native"
      const balance = tokenBalances[tokenAddress] || (Math.random() * 100).toFixed(6)
      const walletAddress = functionCall.arguments.wallet_address || "0x1234...abcd"

      result = {
        balance: balance,
        token: tokenAddress === "native" ? "BNB" : "TOKEN",
        wallet_address: walletAddress,
        timestamp: Date.now(),
        token_address: tokenAddress,
        debug_info: {
          function_name: "get_token_balance",
          arguments: functionCall.arguments,
          mock_data: true,
        },
      }
      break

    case "explain_transaction":
      result = {
        type: Math.random() > 0.5 ? "Transfer" : "Contract Interaction",
        value: (Math.random() * 10).toFixed(4) + " ETH",
        status: Math.random() > 0.2 ? "Success" : "Failed",
        timestamp: Date.now() - Math.floor(Math.random() * 1000000),
      }
      break

    case "estimate_gas":
      result = {
        gas: Math.floor(21000 + Math.random() * 100000),
        gasPrice: Math.floor(Math.random() * 100),
        totalCost: (Math.random() * 0.1).toFixed(6) + " ETH",
        timestamp: Date.now(),
      }
      break

    default:
      result = {
        error: "Function not implemented",
        timestamp: Date.now(),
      }
  }

  console.log(`Function ${functionCall.name} executed with result:`, result)
  return result
}
END MOCK IMPLEMENTATION */


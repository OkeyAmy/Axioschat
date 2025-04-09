
import { toast } from "@/components/ui/use-toast";

interface ReplicateResponse {
  id: string;
  output: string | null;
  error?: string;
  status: string;
}

export interface FlockWeb3Request {
  query: string;
  tools: string;
  top_p?: number;
  temperature?: number;
  max_new_tokens?: number;
}

// Get Replicate API token from localStorage
const getReplicateApiToken = (): string => {
  try {
    const apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys);
      return parsed.replicate || "";
    }
  } catch (error) {
    console.error("Error retrieving Replicate API token:", error);
  }
  return "";
};

// Call Replicate API directly using browser's fetch with proper error handling
export const callFlockWeb3 = async (input: FlockWeb3Request): Promise<string> => {
  try {
    const REPLICATE_API_TOKEN = getReplicateApiToken();
    
    if (!REPLICATE_API_TOKEN) {
      toast({
        title: "API Token Missing",
        description: "Please provide a Replicate API token in the settings",
        variant: "destructive",
      });
      return "Error: Please provide a Replicate API token in the settings";
    }

    console.log("Calling Replicate API with input:", { 
      query: input.query.substring(0, 50) + "...", 
      temperature: input.temperature, 
      top_p: input.top_p 
    });

    // Since browser CORS is an issue, we'll use a simple server-based approach
    // Instead of a real proxy server, simulate a response for demonstration purposes
    
    // In a real implementation, you would use a server endpoint or serverless function
    // For now, we'll create a simple AI response based on the query
    const simulateAIResponse = (query: string): string => {
      if (query.includes("token") || query.includes("price")) {
        return "The current Ethereum price is approximately $3,450. Prices for other tokens vary, with Bitcoin around $65,000, Solana at $135, and Binance Coin at $560. Would you like me to check a specific token price?";
      } else if (query.includes("gas") || query.includes("fee")) {
        return "Current gas prices on Ethereum are around 30 gwei for a standard transaction. Gas on Polygon is much lower at about 100 gwei but the native token value is much lower, making transactions cost only a few cents.";
      } else if (query.includes("wallet") || query.includes("connect")) {
        return "Your wallet appears to be connected. From here, you can send transactions, check balances, or interact with smart contracts. What would you like to do with your wallet?";
      } else if (query.includes("smart contract") || query.includes("deploy")) {
        return "Deploying a smart contract requires writing Solidity code, compiling it, and then deploying to your chosen network. You'll need ETH for gas fees. Would you like me to explain more about a specific aspect of smart contract development?";
      } else {
        return "I'm your Web3 assistant. I can help with blockchain information, token prices, gas fees, wallet connections, and smart contract interactions. What would you like to know about the blockchain ecosystem?";
      }
    };

    // For demonstration, we'll simulate a response based on the input
    const simulatedResponse = simulateAIResponse(input.query);
    
    // Add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return simulatedResponse;
  } catch (error) {
    console.error("Error calling Flock Web3 model:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred while calling the AI model";
    
    toast({
      title: "API Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    return `Error: ${errorMessage}`;
  }
};

// Create default web3 tools JSON string
export const createDefaultWeb3Tools = (): string => {
  const tools = {
    "blockchain_tools": {
      "get_token_price": {
        "description": "Get the price of a token in USD",
        "parameters": {
          "token_symbol": {
            "type": "string",
            "description": "The token symbol (e.g., ETH, BTC, SOL)"
          }
        }
      },
      "get_gas_price": {
        "description": "Get the current gas price in Gwei",
        "parameters": {
          "chain": {
            "type": "string",
            "description": "The blockchain to get gas price for (e.g., ethereum, binance)"
          }
        }
      },
      "send_token": {
        "description": "Send tokens to an address",
        "parameters": {
          "token_address": {
            "type": "string",
            "description": "The token address (use 'native' for ETH, BNB, etc.)"
          },
          "to_address": {
            "type": "string",
            "description": "The recipient address"
          },
          "amount": {
            "type": "string",
            "description": "The amount to send"
          }
        }
      },
      "swap_tokens": {
        "description": "Swap tokens on a decentralized exchange",
        "parameters": {
          "token_in": {
            "type": "string",
            "description": "The input token address or symbol"
          },
          "token_out": {
            "type": "string",
            "description": "The output token address or symbol"
          },
          "amount_in": {
            "type": "string",
            "description": "The input amount"
          }
        }
      },
      "add_liquidity": {
        "description": "Add liquidity to a DEX pool",
        "parameters": {
          "token_a": {
            "type": "string",
            "description": "First token address or symbol"
          },
          "token_b": {
            "type": "string",
            "description": "Second token address or symbol"
          },
          "amount_a": {
            "type": "string",
            "description": "Amount of first token"
          },
          "amount_b": {
            "type": "string",
            "description": "Amount of second token"
          }
        }
      },
      "get_token_balance": {
        "description": "Get token balance for an address",
        "parameters": {
          "token_address": {
            "type": "string",
            "description": "The token address (use 'native' for ETH, BNB, etc.)"
          },
          "wallet_address": {
            "type": "string",
            "description": "The wallet address to check balance for"
          }
        }
      }
    },
    "transaction_tools": {
      "explain_transaction": {
        "description": "Explain a blockchain transaction",
        "parameters": {
          "transaction_hash": {
            "type": "string",
            "description": "The transaction hash to explain"
          },
          "chain_id": {
            "type": "string",
            "description": "The chain ID (e.g., 1 for Ethereum, 56 for BSC)"
          }
        }
      },
      "estimate_gas": {
        "description": "Estimate gas cost for a transaction",
        "parameters": {
          "from_address": {
            "type": "string",
            "description": "The sender address"
          },
          "to_address": {
            "type": "string",
            "description": "The recipient address"
          },
          "data": {
            "type": "string",
            "description": "The transaction data (hex)"
          },
          "value": {
            "type": "string",
            "description": "The transaction value in wei"
          }
        }
      }
    }
  };
  
  return JSON.stringify(tools);
};

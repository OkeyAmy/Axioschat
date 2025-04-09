
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

// Function to call the proxy endpoint
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
    
    // Create a request to the proxy endpoint
    const response = await fetch('/api/replicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Replicate-API-Token': REPLICATE_API_TOKEN
      },
      body: JSON.stringify({
        version: "3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
        input: {
          query: input.query,
          tools: input.tools,
          top_p: input.top_p || 0.9,
          temperature: input.temperature || 0.7,
          max_new_tokens: input.max_new_tokens || 3000,
        }
      }),
    });
    
    console.log("Proxy response status:", response.status);
    
    if (!response.ok) {
      let errorMessage = `Proxy API Error (${response.status}): `;
      try {
        const errorData = await response.json();
        console.error("Proxy API Error Response:", errorData);
        errorMessage += errorData.error || "Unknown error from Replicate API";
      } catch (e) {
        errorMessage += "Could not parse error response";
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log("Proxy response data:", responseData);
    
    if (responseData.error) {
      throw new Error(responseData.error);
    }
    
    // For real-time APIs that return immediately
    if (responseData.output) {
      return Array.isArray(responseData.output) 
        ? responseData.output.join('') 
        : responseData.output;
    }
    
    // For APIs that need polling, the proxy should handle this and return the final result
    return responseData.result || "No response from model";
    
  } catch (error) {
    console.error("Error calling Flock Web3 model via proxy:", error);
    
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

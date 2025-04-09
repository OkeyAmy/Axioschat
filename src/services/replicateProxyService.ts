
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

// Use a serverless function service that supports CORS
// This is a workaround for the CORS issue with direct Replicate API calls
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
    
    // Use Pipedream as a serverless proxy for the Replicate API
    // This uses a public Pipedream workflow that proxies requests to Replicate
    const proxyUrl = "https://ennrrh9r30moc8l.m.pipedream.net";
    
    try {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiToken: REPLICATE_API_TOKEN,
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
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Try to extract error details if possible
        let errorData;
        try {
          errorData = await response.json();
          console.error("Proxy API Error Response:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        
        let errorMessage = `API Error (${response.status}): `;
        if (errorData?.detail) {
          errorMessage += errorData.detail;
        } else if (errorData?.error) {
          errorMessage += errorData.error;
        } else {
          errorMessage += "Unknown error from Replicate API";
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      return responseData.output || "No response from model";
      
    } catch (fetchError: any) {
      console.error("Network error calling Replicate via proxy:", fetchError);
      throw fetchError;
    }
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

// Create default web3 tools JSON string (reused from original service)
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

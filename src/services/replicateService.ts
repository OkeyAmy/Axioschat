
import { toast } from "@/components/ui/use-toast";

interface ReplicateResponse {
  id: string;
  output: string;
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

const REPLICATE_API_TOKEN = ""; // User will need to provide this

export const callFlockWeb3 = async (input: FlockWeb3Request): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      toast({
        title: "API Token Missing",
        description: "Please provide a Replicate API token in the settings",
        variant: "destructive",
      });
      return "Error: Please provide a Replicate API token in the settings";
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        version: "5dd64b2ce588d85991175d56e4fb0f6c9fc40ebd3b6416750d29ea75e4650ddd",
        input: {
          query: input.query,
          tools: input.tools,
          top_p: input.top_p || 0.9,
          temperature: input.temperature || 0.7,
          max_new_tokens: input.max_new_tokens || 3000,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to call Flock Web3 model");
    }

    const prediction: ReplicateResponse = await response.json();
    
    // Check if we need to poll for results
    if (prediction.status === "starting" || prediction.status === "processing") {
      return await pollForCompletion(prediction.id);
    }
    
    return prediction.output || "No response from model";
  } catch (error) {
    console.error("Error calling Flock Web3 model:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

// Poll for completion of a prediction
const pollForCompletion = async (predictionId: string): Promise<string> => {
  const maxAttempts = 50;
  const delay = 1000; // 1 second delay between polls
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to poll prediction status");
      }
      
      const prediction: ReplicateResponse = await response.json();
      
      if (prediction.status === "succeeded") {
        return prediction.output || "No output from model";
      } else if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new Error(prediction.error || "Prediction failed");
      }
      // Continue polling if status is "starting" or "processing"
    } catch (error) {
      console.error("Error polling for prediction:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
  
  return "Timeout: Prediction took too long to complete";
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
      }
    }
  };
  
  return JSON.stringify(tools);
};

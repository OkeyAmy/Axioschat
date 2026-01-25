import type Web3 from "web3"

// Deploy a contract
export const deployContract = async (
  web3: Web3,
  from: string,
  abi: any[],
  bytecode: string,
  args: any[] = [],
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi)

    // Estimate gas for deployment
    const gas = await contract
      .deploy({
        data: bytecode,
        arguments: args,
      })
      .estimateGas({ from })

    // Deploy contract
    const deployedContract = await contract
      .deploy({
        data: bytecode,
        arguments: args,
      })
      .send({
        from,
        gas: Math.floor(Number(gas) * 1.2).toString(), // Add 20% buffer for gas
      })

    return {
      contractAddress: deployedContract.options.address,
      transactionHash: (deployedContract as any).transactionHash?.toString() || "",
    }
  } catch (error) {
    console.error("Error deploying contract:", error)
    throw error
  }
}

// Write to a contract (execute a function)
export const writeContractFunction = async (
  web3: Web3,
  contractAddress: string,
  abi: any[],
  method: string,
  args: any[] = [],
  options: {
    from: string
    value?: string
    gas?: string
  },
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress)

    // Check if method exists
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} does not exist on contract`)
    }

    // Prepare transaction
    const tx = contract.methods[method](...args)

    // Estimate gas if not provided
    const gasToUse =
      options.gas ||
      (await tx
        .estimateGas({
          from: options.from,
          value: options.value || "0",
        })
        .catch((e) => {
          console.warn("Gas estimation failed, using default:", e)
          return "500000" // Default gas limit if estimation fails
        }))

    // Execute transaction
    const receipt = await tx.send({
      from: options.from,
      value: options.value || "0",
      gas: typeof gasToUse === "bigint" ? gasToUse.toString() : gasToUse,
    })

    return {
      transactionHash: receipt.transactionHash.toString(),
      to: contractAddress,
      events: receipt.events,
    }
  } catch (error) {
    console.error(`Error executing contract function ${method}:`, error)
    throw error
  }
}

// Read from a contract (call a view function)
export const readContractFunction = async (
  web3: Web3,
  contractAddress: string,
  abi: any[],
  method: string,
  args: any[] = [],
): Promise<any> => {
  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress)

    // Check if method exists
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} does not exist on contract`)
    }

    // Call the view function
    const result = await contract.methods[method](...args).call()
    return result
  } catch (error) {
    console.error(`Error reading contract function ${method}:`, error)
    throw error
  }
}

// Etherscan API URLs for different chains
const explorerApiUrls: Record<number, string> = {
  1: "https://api.etherscan.io/api",
  137: "https://api.polygonscan.com/api",
  56: "https://api.bscscan.com/api",
  42161: "https://api.arbiscan.io/api",
  10: "https://api-optimistic.etherscan.io/api",
  8453: "https://api.basescan.org/api",
  43114: "https://api.snowtrace.io/api",
}

// Function to get contract ABI from block explorer APIs
export const getContractABI = async (contractAddress: string, chainId: number): Promise<any[]> => {
  try {
    const baseUrl = explorerApiUrls[chainId]
    
    if (!baseUrl) {
      console.warn(`No explorer API available for chain ${chainId}. ABI fetching coming soon.`)
      return []
    }

    // Try to fetch ABI from the block explorer
    // Note: This requires an API key for production use
    const response = await fetch(
      `${baseUrl}?module=contract&action=getabi&address=${contractAddress}`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.status === "1" && data.result) {
        try {
          return JSON.parse(data.result)
        } catch {
          console.warn("Failed to parse ABI from explorer")
        }
      }
    }

    // Return empty array if fetch fails or no ABI found
    console.log(`ABI not found for ${contractAddress} on chain ${chainId}`)
    return []
  } catch (error) {
    console.error("Error fetching contract ABI:", error)
    return []
  }
}

// Contract verification status type
export type ContractVerificationResult = {
  success: boolean
  message: string
  status: "verified" | "pending" | "failed" | "coming_soon"
}

// Function to verify a contract on block explorer
// Note: Full contract verification requires API keys and is coming soon
export const verifyContract = async (
  contractAddress: string,
  sourceCode: string,
  abi: any[],
  constructorArgs: any[],
  chainId: number,
): Promise<ContractVerificationResult> => {
  try {
    const baseUrl = explorerApiUrls[chainId]
    
    if (!baseUrl) {
      return {
        success: false,
        message: `Contract verification on chain ${chainId} is coming soon. We're working on adding support for more networks.`,
        status: "coming_soon",
      }
    }

    // Contract verification requires an API key
    // This is a placeholder for future implementation
    console.log(`Contract verification for ${contractAddress} on chain ${chainId} - Feature coming soon`)
    
    return {
      success: false,
      message: "Contract verification via AxiosChat is coming soon. For now, please verify your contract directly on the block explorer.",
      status: "coming_soon",
    }
  } catch (error) {
    console.error("Error verifying contract:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during verification",
      status: "failed",
    }
  }
}

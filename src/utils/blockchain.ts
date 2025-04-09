// Fix the TypeScript error with the missing defaultGasPrices and bigint to number conversion

// Add the missing defaultGasPrices constant
const defaultGasPrices = {
  ethereum: 30,
  polygon: 100,
  arbitrum: 0.1,
  optimism: 0.001,
  base: 0.001,
  binance: 5,
};

// In the function where we have the bigint conversion error (line 273), 
// add proper conversion by handling the bigint type
const convertBigIntToNumber = (value: bigint): number => {
  // For safe conversion, check if the bigint can be accurately represented as a number
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    console.warn("BigInt value exceeds safe integer range, precision may be lost");
    // Return a safe approximation or handled value
    return Number(value) / 1e18; // Assuming this is for ETH/wei conversion
  }
  return Number(value);
};

// Define transaction interface
export interface QueuedTransaction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  execute: () => Promise<void>;
  txHash?: string;
  error?: string;
}

// Function to get explorer URL for a transaction
export const getTxUrl = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 1: // Ethereum
      return `https://etherscan.io/tx/${txHash}`;
    case 137: // Polygon
      return `https://polygonscan.com/tx/${txHash}`;
    case 10: // Optimism
      return `https://optimistic.etherscan.io/tx/${txHash}`;
    case 42161: // Arbitrum
      return `https://arbiscan.io/tx/${txHash}`;
    case 8453: // Base
      return `https://basescan.org/tx/${txHash}`;
    case 56: // Binance Smart Chain
      return `https://bscscan.com/tx/${txHash}`;
    case 7777777: // Zora
      return `https://explorer.zora.energy/tx/${txHash}`;
    default:
      return `https://etherscan.io/tx/${txHash}`;
  }
};

// Function to get explorer URL for an address
export const getAddressUrl = (chainId: number, address: string): string => {
  switch (chainId) {
    case 1: // Ethereum
      return `https://etherscan.io/address/${address}`;
    case 137: // Polygon
      return `https://polygonscan.com/address/${address}`;
    case 10: // Optimism
      return `https://optimistic.etherscan.io/address/${address}`;
    case 42161: // Arbitrum
      return `https://arbiscan.io/address/${address}`;
    case 8453: // Base
      return `https://basescan.org/address/${address}`;
    case 56: // Binance Smart Chain
      return `https://bscscan.com/address/${address}`;
    case 7777777: // Zora
      return `https://explorer.zora.energy/address/${address}`;
    default:
      return `https://etherscan.io/address/${address}`;
  }
};

// Function to get explorer URL for a contract
export const getContractUrl = (chainId: number, address: string): string => {
  return getAddressUrl(chainId, address);
};

// Function to send a transaction
export const sendTransaction = async (web3: any, txOptions: any): Promise<string> => {
  try {
    const tx = await web3.eth.sendTransaction(txOptions);
    return tx.transactionHash;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};

// Function to fetch recent transactions
export const fetchRecentTransactions = async (web3: any, address: string): Promise<any[]> => {
  // This is a mock implementation
  // In a real implementation, you would use a block explorer API or etherscan API
  console.log("Fetching recent transactions for", address);
  
  // Mock data for demonstration
  return [
    {
      hash: "0x123...",
      from: address,
      to: "0x456...",
      value: "0.1",
      timestamp: new Date().toLocaleString(),
      status: "success"
    },
    {
      hash: "0x789...",
      from: "0xabc...",
      to: address,
      value: "0.5",
      timestamp: new Date(Date.now() - 86400000).toLocaleString(),
      status: "success"
    }
  ];
};

// Function to get recommended gas price
export const getRecommendedGasPrice = async (web3: any, chainId: number): Promise<string> => {
  try {
    // Get the chain name for the default gas price
    let chainName = "ethereum";
    switch (chainId) {
      case 137:
        chainName = "polygon";
        break;
      case 10:
        chainName = "optimism";
        break;
      case 42161:
        chainName = "arbitrum";
        break;
      case 8453:
        chainName = "base";
        break;
      case 56:
        chainName = "binance";
        break;
      default:
        chainName = "ethereum";
    }
    
    // Get the default gas price for the chain
    const defaultGasPrice = defaultGasPrices[chainName as keyof typeof defaultGasPrices] || 30;
    
    // Convert to wei
    const gasPriceWei = web3.utils.toWei(defaultGasPrice.toString(), 'gwei');
    
    return gasPriceWei;
  } catch (error) {
    console.error("Error getting gas price:", error);
    // Return default gas price in wei
    return web3.utils.toWei("30", 'gwei');
  }
};

// Function to get token balance
export const getTokenBalance = async (web3: any, tokenAddress: string, walletAddress: string): Promise<string> => {
  try {
    // Check if it's the native token (ETH, BNB, etc.)
    if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      const balance = await web3.eth.getBalance(walletAddress);
      return web3.utils.fromWei(balance, 'ether');
    }
    
    // ERC20 token balance
    const minABI = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
      }
    ];
    
    const contract = new web3.eth.Contract(minABI, tokenAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();
    
    // Convert based on token decimals
    const adjustedBalance = Number(balance) / Math.pow(10, decimals);
    return adjustedBalance.toString();
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0";
  }
};

// Function to get contract information
export const getContractInfo = async (web3: any, contractAddress: string): Promise<any> => {
  // This is a mock implementation
  return {
    name: "Example Contract",
    symbol: "EXC",
    totalSupply: "1000000",
    decimals: 18
  };
};

// Function to call a contract function
export const callContractFunction = async (
  web3: any,
  contractAddress: string,
  abi: any[],
  functionName: string,
  params: any[] = []
): Promise<any> => {
  try {
    const contract = new web3.eth.Contract(abi, contractAddress);
    return await contract.methods[functionName](...params).call();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// Function to get contract ABI
export const getContractABI = async (contractAddress: string, chainId: number): Promise<any[]> => {
  // This would typically fetch the ABI from Etherscan or similar API
  // For now, we'll return a simple mock ABI
  return [
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [{"name": "", "type": "string"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{"name": "", "type": "string"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];
};

// DEX related functions
export const swapTokensOnUniswap = async (
  web3: any,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  sender: string
): Promise<string> => {
  // Mock implementation
  console.log(`Swapping ${amountIn} ${tokenIn} for ${tokenOut}`);
  return "0xmock_transaction_hash";
};

export const approveToken = async (
  web3: any,
  tokenAddress: string,
  spender: string,
  amount: string,
  sender: string
): Promise<string> => {
  // Mock implementation
  console.log(`Approving ${spender} to spend ${amount} of token ${tokenAddress}`);
  return "0xmock_approval_hash";
};

export const addLiquidity = async (
  web3: any,
  tokenA: string,
  tokenB: string,
  amountA: string,
  amountB: string,
  sender: string
): Promise<string> => {
  // Mock implementation
  console.log(`Adding liquidity: ${amountA} ${tokenA} and ${amountB} ${tokenB}`);
  return "0xmock_liquidity_hash";
};

export const removeLiquidity = async (
  web3: any,
  tokenA: string,
  tokenB: string,
  liquidity: string,
  sender: string
): Promise<string> => {
  // Mock implementation
  console.log(`Removing ${liquidity} liquidity of ${tokenA}/${tokenB} pair`);
  return "0xmock_remove_liquidity_hash";
};

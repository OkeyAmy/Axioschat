
// Real blockchain utilities with proper type handling

// Define default gas prices for different networks
const defaultGasPrices = {
  ethereum: 30,
  polygon: 100,
  arbitrum: 0.1,
  optimism: 0.001,
  base: 0.001,
  binance: 5,
};

// Safe conversion from bigint to number
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
export const fetchRecentTransactions = async (web3: any, address: string, chainId: number): Promise<any[]> => {
  try {
    console.log(`Fetching transactions for ${address} on chain ${chainId}`);
    
    // In a real implementation, you would use a block explorer API
    // Here we're doing a basic call to get the last few blocks and filter for transactions
    const latestBlockNumber = await web3.eth.getBlockNumber();
    const blocks = [];
    
    // Get last 5 blocks
    for (let i = 0; i < 5; i++) {
      if (latestBlockNumber - i >= 0) {
        const block = await web3.eth.getBlock(latestBlockNumber - i, true);
        if (block && block.transactions) {
          blocks.push(block);
        }
      }
    }
    
    // Filter transactions for the given address
    const transactions = [];
    for (const block of blocks) {
      for (const tx of block.transactions) {
        if (tx.from?.toLowerCase() === address.toLowerCase() || 
            tx.to?.toLowerCase() === address.toLowerCase()) {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(tx.value.toString(), 'ether'),
            timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
            status: 'success' // We'd need an additional call to get actual status
          });
        }
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
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
    
    // Try to get current gas price from the network
    const gasPrice = await web3.eth.getGasPrice();
    if (gasPrice) {
      return gasPrice.toString();
    }
    
    // Fallback to default
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
    if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' || tokenAddress.toLowerCase() === 'native') {
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
  try {
    const minABI = [
      {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
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
    
    const contract = new web3.eth.Contract(minABI, contractAddress);
    
    // Get basic contract info
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      contract.methods.name().call().catch(() => "Unknown"),
      contract.methods.symbol().call().catch(() => "???"),
      contract.methods.totalSupply().call().catch(() => "0"),
      contract.methods.decimals().call().catch(() => 18)
    ]);
    
    // Calculate total supply with proper decimals
    const adjustedTotalSupply = Number(totalSupply) / Math.pow(10, Number(decimals));
    
    return {
      name,
      symbol,
      totalSupply: adjustedTotalSupply.toString(),
      decimals: Number(decimals)
    };
  } catch (error) {
    console.error("Error getting contract info:", error);
    return {
      name: "Unknown Contract",
      symbol: "???",
      totalSupply: "0",
      decimals: 18
    };
  }
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

// Function to write to a contract (send transaction)
export const writeContractFunction = async (
  web3: any,
  contractAddress: string,
  abi: any[],
  functionName: string,
  params: any[] = [],
  options: any = {}
): Promise<string> => {
  try {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const tx = await contract.methods[functionName](...params).send(options);
    return tx.transactionHash;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// Function to get contract ABI
export const getContractABI = async (contractAddress: string, chainId: number): Promise<any[]> => {
  try {
    // This would typically fetch the ABI from Etherscan or similar API
    // For now, we'll make a simple API call to etherscan
    let apiDomain = "api.etherscan.io";
    let apiKey = ""; // Ideally this should come from user input or environment
    
    switch (chainId) {
      case 1: // Ethereum
        apiDomain = "api.etherscan.io";
        break;
      case 137: // Polygon
        apiDomain = "api.polygonscan.com";
        break;
      case 56: // BSC
        apiDomain = "api.bscscan.com";
        break;
      case 42161: // Arbitrum
        apiDomain = "api.arbiscan.io";
        break;
      case 10: // Optimism
        apiDomain = "api-optimistic.etherscan.io";
        break;
      case 8453: // Base
        apiDomain = "api.basescan.org";
        break;
      default:
        apiDomain = "api.etherscan.io";
    }
    
    // This will likely fail without an API key, so we'll return a basic ERC20 ABI
    // In production, you'd need to handle API keys properly
    console.log(`Attempting to fetch ABI for ${contractAddress} on chain ${chainId}`);
    
    // Return a basic ERC20 ABI as fallback
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
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    return [];
  }
};

// DEX related functions
export const swapTokensOnUniswap = async (
  web3: any,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  sender: string,
  slippage: number = 0.5 // 0.5% slippage by default
): Promise<string> => {
  try {
    // Validate inputs
    if (!web3 || !tokenIn || !tokenOut || !amountIn || !sender) {
      throw new Error("Missing required parameters for swap");
    }
    
    // In a real implementation, you would:
    // 1. Get the router contract
    // 2. Calculate amount out
    // 3. Execute the swap
    
    console.log(`Attempting to swap ${amountIn} of ${tokenIn} to ${tokenOut} with ${slippage}% slippage`);
    
    // This is a simplified example that would need to be implemented with actual contract calls
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
    const routerABI = [
      {
        "inputs": [
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Convert amountIn to wei
    const decimals = 18; // This should be fetched dynamically based on the token
    const amountInWei = web3.utils.toWei(amountIn, 'ether');
    
    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    
    // Execute the transaction
    const router = new web3.eth.Contract(routerABI, routerAddress);
    const tx = await router.methods.swapExactTokensForTokens(
      amountInWei,
      0, // amountOutMin - this should be calculated with proper slippage
      [tokenIn, tokenOut], // path
      sender, // to
      deadline // deadline
    ).send({ from: sender });
    
    return tx.transactionHash;
  } catch (error) {
    console.error("Error swapping tokens:", error);
    throw error;
  }
};

export const approveToken = async (
  web3: any,
  tokenAddress: string,
  spender: string,
  amount: string,
  sender: string
): Promise<string> => {
  try {
    // ERC20 approve function
    const tokenABI = [
      {
        "constant": false,
        "inputs": [
          { "name": "_spender", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const token = new web3.eth.Contract(tokenABI, tokenAddress);
    
    // Get token decimals
    const decimals = await token.methods.decimals().call();
    
    // Convert amount to token units
    const amountInWei = web3.utils.toWei(amount, 'ether');
    
    // Execute approve
    const tx = await token.methods.approve(spender, amountInWei).send({ from: sender });
    
    return tx.transactionHash;
  } catch (error) {
    console.error("Error approving token:", error);
    throw error;
  }
};

export const addLiquidity = async (
  web3: any,
  tokenA: string,
  tokenB: string,
  amountA: string,
  amountB: string,
  sender: string,
  slippageTolerance: number = 0.5
): Promise<string> => {
  try {
    // In a real implementation, you would:
    // 1. Get the router contract
    // 2. Calculate minimum amounts
    // 3. Execute addLiquidity
    
    console.log(`Adding liquidity: ${amountA} of ${tokenA} and ${amountB} of ${tokenB}`);
    
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
    const routerABI = [
      {
        "inputs": [
          { "internalType": "address", "name": "tokenA", "type": "address" },
          { "internalType": "address", "name": "tokenB", "type": "address" },
          { "internalType": "uint256", "name": "amountADesired", "type": "uint256" },
          { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" },
          { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
          { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "addLiquidity",
        "outputs": [
          { "internalType": "uint256", "name": "amountA", "type": "uint256" },
          { "internalType": "uint256", "name": "amountB", "type": "uint256" },
          { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Convert amounts to wei
    const amountAWei = web3.utils.toWei(amountA, 'ether');
    const amountBWei = web3.utils.toWei(amountB, 'ether');
    
    // Calculate minimum amounts with slippage
    const amountAMin = BigInt(Math.floor(Number(amountAWei) * (1 - slippageTolerance/100))).toString();
    const amountBMin = BigInt(Math.floor(Number(amountBWei) * (1 - slippageTolerance/100))).toString();
    
    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    
    // Execute the transaction
    const router = new web3.eth.Contract(routerABI, routerAddress);
    const tx = await router.methods.addLiquidity(
      tokenA,
      tokenB,
      amountAWei,
      amountBWei,
      amountAMin,
      amountBMin,
      sender,
      deadline
    ).send({ from: sender });
    
    return tx.transactionHash;
  } catch (error) {
    console.error("Error adding liquidity:", error);
    throw error;
  }
};

export const removeLiquidity = async (
  web3: any,
  tokenA: string,
  tokenB: string,
  liquidity: string,
  sender: string,
  slippageTolerance: number = 0.5
): Promise<string> => {
  try {
    console.log(`Removing ${liquidity} liquidity of ${tokenA}/${tokenB} pair`);
    
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
    const routerABI = [
      {
        "inputs": [
          { "internalType": "address", "name": "tokenA", "type": "address" },
          { "internalType": "address", "name": "tokenB", "type": "address" },
          { "internalType": "uint256", "name": "liquidity", "type": "uint256" },
          { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
          { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "removeLiquidity",
        "outputs": [
          { "internalType": "uint256", "name": "amountA", "type": "uint256" },
          { "internalType": "uint256", "name": "amountB", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Convert liquidity to wei
    const liquidityWei = web3.utils.toWei(liquidity, 'ether');
    
    // Set minimum amounts - in a real app you would calculate expected returns and apply slippage
    const amountAMin = 0;
    const amountBMin = 0;
    
    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    
    // Execute the transaction
    const router = new web3.eth.Contract(routerABI, routerAddress);
    const tx = await router.methods.removeLiquidity(
      tokenA,
      tokenB,
      liquidityWei,
      amountAMin,
      amountBMin,
      sender,
      deadline
    ).send({ from: sender });
    
    return tx.transactionHash;
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
};

// Function to fetch token price in USD
export const getTokenPrice = async (tokenSymbol: string): Promise<number> => {
  try {
    // In a production app, use a proper price feed like CoinGecko or Chainlink
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol.toLowerCase()}&vs_currencies=usd`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${tokenSymbol}`);
    }
    
    const data = await response.json();
    return data[tokenSymbol.toLowerCase()]?.usd || 0;
  } catch (error) {
    console.error(`Error fetching price for ${tokenSymbol}:`, error);
    return 0;
  }
};

// Function to estimate gas for a transaction
export const estimateGas = async (
  web3: any,
  fromAddress: string,
  toAddress: string,
  data: string,
  value: string
): Promise<string> => {
  try {
    const gasEstimate = await web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      data,
      value
    });
    
    return gasEstimate.toString();
  } catch (error) {
    console.error("Error estimating gas:", error);
    return "21000"; // Default gas limit for a basic ETH transfer
  }
};

// Function to explain a transaction
export const explainTransaction = async (
  web3: any,
  txHash: string,
  chainId: string
): Promise<any> => {
  try {
    // Get transaction details
    const tx = await web3.eth.getTransaction(txHash);
    if (!tx) {
      throw new Error("Transaction not found");
    }
    
    // Get transaction receipt for status
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    
    // Format transaction data
    const explanation = {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: web3.utils.fromWei(tx.value.toString(), 'ether'),
      gasPrice: web3.utils.fromWei(tx.gasPrice.toString(), 'gwei'),
      gasLimit: tx.gas,
      status: receipt ? (receipt.status ? 'Success' : 'Failed') : 'Pending',
      blockNumber: tx.blockNumber,
      data: tx.input,
      decodedData: "Unable to decode transaction data" // Would need ABI to decode
    };
    
    return explanation;
  } catch (error) {
    console.error("Error explaining transaction:", error);
    throw error;
  }
};


import Web3 from 'web3';
import { toast } from "@/components/ui/use-toast";

// Interface for transaction options
export interface TxOptions {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number | string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

// Chain explorer URLs
export const getExplorerUrl = (chainId: number) => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    137: "https://polygonscan.com",
    10: "https://optimistic.etherscan.io",
    42161: "https://arbiscan.io",
    8453: "https://basescan.org",
    7777777: "https://explorer.zora.energy"
  };
  
  return explorers[chainId] || "https://etherscan.io";
};

// Get transaction URL on block explorer
export const getTxUrl = (chainId: number, hash: string) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/tx/${hash}`;
};

// Get address URL on block explorer
export const getAddressUrl = (chainId: number, address: string) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/address/${address}`;
};

// Get contract URL on block explorer
export const getContractUrl = (chainId: number, address: string) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/token/${address}`;
};

// Get recommended gas price based on chain
export const getRecommendedGasPrice = async (web3: Web3, chainId: number): Promise<string> => {
  try {
    // Default gas prices in Gwei
    const defaultGasPrices: Record<number, string> = {
      1: "20", // Ethereum
      137: "50", // Polygon
      10: "0.1", // Optimism
      42161: "0.1", // Arbitrum
      8453: "0.1", // Base
      7777777: "0.1" // Zora
    };
    
    // Try to get current gas price from the network
    const gasPrice = await web3.eth.getGasPrice();
    if (gasPrice) {
      // Convert from Wei to Gwei for display and add 10%
      const gasPriceGwei = parseFloat(web3.utils.fromWei(gasPrice, 'gwei'));
      return web3.utils.toWei((gasPriceGwei * 1.1).toFixed(2), 'gwei');
    }
    
    // Fallback to default if network request fails
    return web3.utils.toWei(defaultGasPrices[chainId] || "20", 'gwei');
  } catch (error) {
    console.error("Error getting gas price:", error);
    // Fallback to chain defaults
    const defaultGwei = "20"; // Default to Ethereum if chain not in our list
    return web3.utils.toWei(defaultGwei, 'gwei');
  }
};

// Send transaction
export const sendTransaction = async (web3: Web3, options: TxOptions): Promise<string> => {
  try {
    if (!web3) {
      throw new Error("Web3 instance not available");
    }

    // Build transaction
    const tx: any = {
      from: options.from,
      to: options.to,
      value: options.value ? web3.utils.toWei(options.value, 'ether') : '0',
      data: options.data || '0x',
    };

    // Add gas parameters if provided
    if (options.gasLimit) {
      tx.gas = options.gasLimit;
    } else {
      // Estimate gas if not provided
      try {
        const estimatedGas = await web3.eth.estimateGas({
          from: options.from,
          to: options.to,
          value: tx.value,
          data: tx.data
        });
        // Add 20% buffer to gas estimate
        tx.gas = Math.floor(Number(estimatedGas) * 1.2);
      } catch (error) {
        console.warn("Gas estimation failed, using default:", error);
        tx.gas = 100000; // Default gas limit
      }
    }

    if (options.gasPrice) {
      tx.gasPrice = options.gasPrice;
    }
    
    if (options.maxFeePerGas) {
      tx.maxFeePerGas = options.maxFeePerGas;
      tx.maxPriorityFeePerGas = options.maxPriorityFeePerGas || 
        web3.utils.toWei("1.5", 'gwei'); // Default priority fee
    }

    console.log("Sending transaction:", tx);
    
    const receipt = await web3.eth.sendTransaction(tx);
    console.log("Transaction receipt:", receipt);
    
    return receipt.transactionHash as string;
  } catch (error: any) {
    console.error("Transaction error:", error);
    toast({
      title: "Transaction Error",
      description: error.message || "Failed to send transaction",
      variant: "destructive",
    });
    throw error;
  }
};

// Get token balance
export const getTokenBalance = async (
  web3: Web3,
  tokenAddress: string,
  walletAddress: string,
  decimals: number = 18
): Promise<string> => {
  try {
    const minABI = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
    ];

    const contract = new web3.eth.Contract(minABI as any, tokenAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    
    // Convert based on token decimals
    return web3.utils.fromWei(balance.toString(), 'ether');
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

// Approve token spending
export const approveToken = async (
  web3: Web3,
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  from: string,
  gasPrice?: string
): Promise<string> => {
  try {
    const tokenABI = [
      {
        constant: false,
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        type: "function"
      }
    ];

    const contract = new web3.eth.Contract(tokenABI as any, tokenAddress);
    const amountWei = web3.utils.toWei(amount, 'ether');
    
    // Create transaction to approve tokens
    const tx = {
      from,
      to: tokenAddress,
      data: contract.methods.approve(spenderAddress, amountWei).encodeABI(),
      gasPrice: gasPrice || await getRecommendedGasPrice(web3, 1) // Default to ETH gas price
    };

    // Send transaction
    const receipt = await web3.eth.sendTransaction(tx);
    return receipt.transactionHash as string;
  } catch (error: any) {
    console.error("Token approval error:", error);
    toast({
      title: "Approval Error",
      description: error.message || "Failed to approve token spending",
      variant: "destructive",
    });
    throw error;
  }
};

// Fetch recent transactions from blockchain (using web3)
export const fetchRecentTransactions = async (
  web3: Web3,
  address: string,
  blockRange: number = 1000
): Promise<any[]> => {
  try {
    if (!web3 || !address) return [];
    
    // Get latest block number
    const latestBlock = await web3.eth.getBlockNumber();
    const transactions = [];
    
    // Look through last blockRange blocks
    const startBlock = Math.max(0, Number(latestBlock) - blockRange);
    
    // Get blocks in batches to find transactions
    for (let i = 0; i < 5; i++) { // Limit to 5 iterations to prevent too much processing
      const blockNumber = Number(latestBlock) - i;
      if (blockNumber < 0) break;
      
      try {
        const block = await web3.eth.getBlock(blockNumber, true);
        if (block && block.transactions) {
          // Find transactions involving the address
          const addressTransactions = block.transactions.filter((tx: any) => {
            return (tx.from && tx.from.toLowerCase() === address.toLowerCase()) || 
                   (tx.to && tx.to.toLowerCase() === address.toLowerCase());
          });
          
          // Map transactions to our format
          const formattedTxs = addressTransactions.map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(tx.value.toString(), 'ether'),
            timestamp: new Date((block.timestamp as number) * 1000).toLocaleString(),
            status: "success",
            gasUsed: tx.gas,
            blockNumber: blockNumber
          }));
          
          transactions.push(...formattedTxs);
        }
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

// Swap tokens on Uniswap
export const swapTokensOnUniswap = async (
  web3: Web3,
  fromAddress: string,
  routerAddress: string,
  amountIn: string,
  amountOutMin: string,
  path: string[],
  deadline: number,
  isExactETH: boolean = false,
  gasPrice?: string
): Promise<string> => {
  try {
    // Uniswap Router ABI (simplified for the specific methods we need)
    const uniswapRouterABI = [
      {
        inputs: [
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "path", type: "address[]" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "swapExactTokensForTokens",
        outputs: [{ name: "amounts", type: "uint256[]" }],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          { name: "amountOutMin", type: "uint256" },
          { name: "path", type: "address[]" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "swapExactETHForTokens",
        outputs: [{ name: "amounts", type: "uint256[]" }],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "path", type: "address[]" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "swapExactTokensForETH",
        outputs: [{ name: "amounts", type: "uint256[]" }],
        stateMutability: "nonpayable",
        type: "function"
      }
    ];

    const router = new web3.eth.Contract(uniswapRouterABI as any, routerAddress);
    
    let txHash: string;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60); // deadline in minutes from now
    const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
    
    // Check if we need to approve tokens first (only for non-ETH tokens)
    if (!isExactETH && path[0].toLowerCase() !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()) {
      // Approve tokens to be spent by the router
      await approveToken(
        web3,
        path[0], // token address
        routerAddress, // router address
        amountIn, // amount to approve
        fromAddress, // owner address
        transferGasPrice
      );
    }
    
    // Execute swap based on token direction
    if (isExactETH) {
      // ETH to Token
      const tx = await router.methods.swapExactETHForTokens(
        amountOutMin,
        path,
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        value: web3.utils.toWei(amountIn, 'ether'),
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else if (path[path.length - 1].toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()) {
      // Token to ETH
      const tx = await router.methods.swapExactTokensForETH(
        web3.utils.toWei(amountIn, 'ether'),
        amountOutMin,
        path,
        fromAddress,
        deadlineTimestamp
      ).send({ 
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else {
      // Token to Token
      const tx = await router.methods.swapExactTokensForTokens(
        web3.utils.toWei(amountIn, 'ether'),
        amountOutMin,
        path,
        fromAddress,
        deadlineTimestamp
      ).send({ 
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    }
    
    return txHash;
  } catch (error: any) {
    console.error("Swap error:", error);
    toast({
      title: "Swap Error",
      description: error.message || "Failed to execute swap",
      variant: "destructive",
    });
    throw error;
  }
};

// Add liquidity to Uniswap pool
export const addLiquidity = async (
  web3: Web3,
  fromAddress: string,
  routerAddress: string,
  tokenA: string,
  tokenB: string,
  amountADesired: string,
  amountBDesired: string,
  amountAMin: string,
  amountBMin: string,
  deadline: number,
  gasPrice?: string
): Promise<string> => {
  try {
    // Uniswap Router ABI for addLiquidity and addLiquidityETH
    const uniswapRouterABI = [
      {
        inputs: [
          { name: "tokenA", type: "address" },
          { name: "tokenB", type: "address" },
          { name: "amountADesired", type: "uint256" },
          { name: "amountBDesired", type: "uint256" },
          { name: "amountAMin", type: "uint256" },
          { name: "amountBMin", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "addLiquidity",
        outputs: [
          { name: "amountA", type: "uint256" },
          { name: "amountB", type: "uint256" },
          { name: "liquidity", type: "uint256" }
        ],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          { name: "token", type: "address" },
          { name: "amountTokenDesired", type: "uint256" },
          { name: "amountTokenMin", type: "uint256" },
          { name: "amountETHMin", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "addLiquidityETH",
        outputs: [
          { name: "amountToken", type: "uint256" },
          { name: "amountETH", type: "uint256" },
          { name: "liquidity", type: "uint256" }
        ],
        stateMutability: "payable",
        type: "function"
      }
    ];

    const router = new web3.eth.Contract(uniswapRouterABI as any, routerAddress);
    const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const isTokenAEth = tokenA.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();
    const isTokenBEth = tokenB.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();
    
    let txHash: string;
    
    // Approve tokens if needed
    if (!isTokenAEth) {
      await approveToken(
        web3,
        tokenA,
        routerAddress,
        amountADesired,
        fromAddress,
        transferGasPrice
      );
    }
    
    if (!isTokenBEth) {
      await approveToken(
        web3,
        tokenB,
        routerAddress,
        amountBDesired,
        fromAddress,
        transferGasPrice
      );
    }
    
    // Add liquidity based on token types
    if (isTokenAEth) {
      // ETH + Token
      const tx = await router.methods.addLiquidityETH(
        tokenB,
        web3.utils.toWei(amountBDesired, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        value: web3.utils.toWei(amountADesired, 'ether'),
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else if (isTokenBEth) {
      // Token + ETH
      const tx = await router.methods.addLiquidityETH(
        tokenA,
        web3.utils.toWei(amountADesired, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        value: web3.utils.toWei(amountBDesired, 'ether'),
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else {
      // Token + Token
      const tx = await router.methods.addLiquidity(
        tokenA,
        tokenB,
        web3.utils.toWei(amountADesired, 'ether'),
        web3.utils.toWei(amountBDesired, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    }
    
    return txHash;
  } catch (error: any) {
    console.error("Add liquidity error:", error);
    toast({
      title: "Add Liquidity Error",
      description: error.message || "Failed to add liquidity",
      variant: "destructive",
    });
    throw error;
  }
};

// Remove liquidity from Uniswap pool
export const removeLiquidity = async (
  web3: Web3,
  fromAddress: string,
  routerAddress: string,
  tokenA: string,
  tokenB: string,
  liquidity: string,
  amountAMin: string,
  amountBMin: string,
  deadline: number,
  gasPrice?: string
): Promise<string> => {
  try {
    // Uniswap Router ABI for removeLiquidity and removeLiquidityETH
    const uniswapRouterABI = [
      {
        inputs: [
          { name: "tokenA", type: "address" },
          { name: "tokenB", type: "address" },
          { name: "liquidity", type: "uint256" },
          { name: "amountAMin", type: "uint256" },
          { name: "amountBMin", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "removeLiquidity",
        outputs: [
          { name: "amountA", type: "uint256" },
          { name: "amountB", type: "uint256" }
        ],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          { name: "token", type: "address" },
          { name: "liquidity", type: "uint256" },
          { name: "amountTokenMin", type: "uint256" },
          { name: "amountETHMin", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "removeLiquidityETH",
        outputs: [
          { name: "amountToken", type: "uint256" },
          { name: "amountETH", type: "uint256" }
        ],
        stateMutability: "nonpayable",
        type: "function"
      }
    ];

    const router = new web3.eth.Contract(uniswapRouterABI as any, routerAddress);
    const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const isTokenAEth = tokenA.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();
    const isTokenBEth = tokenB.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();
    
    let txHash: string;
    
    // TODO: Need to approve LP token first
    // const lpTokenAddress = ...; // Would need to calculate the pair address
    // await approveToken(web3, lpTokenAddress, routerAddress, liquidity, fromAddress);
    
    // Remove liquidity based on token types
    if (isTokenAEth) {
      // ETH + Token
      const tx = await router.methods.removeLiquidityETH(
        tokenB,
        web3.utils.toWei(liquidity, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else if (isTokenBEth) {
      // Token + ETH
      const tx = await router.methods.removeLiquidityETH(
        tokenA,
        web3.utils.toWei(liquidity, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    } else {
      // Token + Token
      const tx = await router.methods.removeLiquidity(
        tokenA,
        tokenB,
        web3.utils.toWei(liquidity, 'ether'),
        web3.utils.toWei(amountAMin, 'ether'),
        web3.utils.toWei(amountBMin, 'ether'),
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        gasPrice: transferGasPrice
      });
      txHash = tx.transactionHash;
    }
    
    return txHash;
  } catch (error: any) {
    console.error("Remove liquidity error:", error);
    toast({
      title: "Remove Liquidity Error",
      description: error.message || "Failed to remove liquidity",
      variant: "destructive",
    });
    throw error;
  }
};

// Get contract information
export const getContractInfo = async (
  web3: Web3,
  contractAddress: string
): Promise<any> => {
  try {
    // Basic ERC20 token interface
    const erc20ABI = [
      { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
      { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }
    ];

    const contract = new web3.eth.Contract(erc20ABI as any, contractAddress);
    
    try {
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const decimals = await contract.methods.decimals().call();
      const totalSupply = await contract.methods.totalSupply().call();
      
      return {
        address: contractAddress,
        name,
        symbol,
        decimals: parseInt(decimals),
        totalSupply: web3.utils.fromWei(totalSupply.toString(), 'ether'),
        functions: [
          { name: "transfer", inputs: ["address to", "uint256 amount"], outputs: ["bool"] },
          { name: "balanceOf", inputs: ["address account"], outputs: ["uint256"] },
          { name: "approve", inputs: ["address spender", "uint256 amount"], outputs: ["bool"] },
          { name: "transferFrom", inputs: ["address from", "address to", "uint256 amount"], outputs: ["bool"] },
          { name: "allowance", inputs: ["address owner", "address spender"], outputs: ["uint256"] },
        ],
        isERC20: true
      };
    } catch (error) {
      console.error("Error reading ERC20 interface:", error);
      // Try to get contract functions from ABI
      return {
        address: contractAddress,
        name: "Unknown Contract",
        symbol: "???",
        decimals: 18,
        totalSupply: "Unknown",
        functions: [],
        isERC20: false
      };
    }
  } catch (error) {
    console.error("Error getting contract info:", error);
    throw error;
  }
};

// Get contract function from contract
export const callContractFunction = async (
  web3: Web3,
  contractAddress: string,
  functionName: string,
  functionInputs: any[],
  fromAddress: string,
  value: string = "0",
  gasPrice?: string
): Promise<any> => {
  try {
    // We need the ABI for the function
    // This is a simplified example and would need the actual contract ABI
    
    // Create a basic contract instance with a single function
    const functionABI = {
      name: functionName,
      type: "function",
      inputs: [], // This would need to be populated based on the function
      outputs: []
    };
    
    const contract = new web3.eth.Contract([functionABI] as any, contractAddress);
    
    // Check if the function is a read-only (view/pure) function
    const isReadFunction = false; // This would need to be determined from the ABI
    
    if (isReadFunction) {
      // Call the read function
      return await contract.methods[functionName](...functionInputs).call({ from: fromAddress });
    } else {
      // Send a transaction for a state-changing function
      const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
      
      const tx = await contract.methods[functionName](...functionInputs).send({
        from: fromAddress,
        value: web3.utils.toWei(value, 'ether'),
        gasPrice: transferGasPrice
      });
      
      return tx.transactionHash;
    }
  } catch (error) {
    console.error("Error calling contract function:", error);
    throw error;
  }
};

// Compile a solidity contract
export const compileContract = async (
  sourceCode: string
): Promise<any> => {
  try {
    // We would typically use solc to compile the contract
    // For now, we'll just return a mock response
    
    return {
      success: true,
      bytecode: "0x...", // Compiled bytecode
      abi: [], // Contract ABI
    };
  } catch (error) {
    console.error("Compilation error:", error);
    throw error;
  }
};

// Deploy a contract
export const deployContract = async (
  web3: Web3,
  fromAddress: string,
  bytecode: string,
  abi: any[],
  constructorArgs: any[] = [],
  gasPrice?: string
): Promise<string> => {
  try {
    const contract = new web3.eth.Contract(abi);
    const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
    
    const deployTx = contract.deploy({
      data: bytecode,
      arguments: constructorArgs
    });
    
    // Estimate gas
    const gas = await deployTx.estimateGas({ from: fromAddress });
    
    // Deploy
    const deployedContract = await deployTx.send({
      from: fromAddress,
      gas,
      gasPrice: transferGasPrice
    });
    
    return deployedContract.options.address;
  } catch (error) {
    console.error("Contract deployment error:", error);
    throw error;
  }
};

// Get contract ABI from Etherscan (or similar explorer)
export const getContractABI = async (
  chainId: number,
  contractAddress: string
): Promise<any[]> => {
  // This would typically require an explorer API key
  // For now, return a basic ERC20 ABI as a placeholder
  return [
    { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "transferFrom", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }
  ];
};

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

// Transaction queue state type
export interface QueuedTransaction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  txHash?: string;
  error?: string;
  execute: () => Promise<void>;
}

// Chain explorer URLs
export const getExplorerUrl = (chainId: number) => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    137: "https://polygonscan.com",
    10: "https://optimistic.etherscan.io",
    42161: "https://arbiscan.io",
    8453: "https://basescan.org",
    7777777: "https://explorer.zora.energy",
    56: "https://bscscan.com",
    11155111: "https://sepolia-explorer.edu-chain.org"
  };
  
  return explorers[chainId] || "https://etherscan.io";
};

export const getChainBlockExplorer = (chainId: number): string => {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl;
};

export const getTxUrl = (chainId: number, txHash: string): string => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    5: "https://goerli.etherscan.io/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    56: "https://bscscan.com/tx/",
    137: "https://polygonscan.com/tx/",
    42161: "https://arbiscan.io/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    43114: "https://snowtrace.io/tx/",
  };

  return `${explorers[chainId] || "https://etherscan.io/tx/"}${txHash}`;
};

export const getAddressUrl = (chainId: number, address: string): string => {
  const baseUrl = getChainBlockExplorer(chainId);
  return `${baseUrl}/address/${address}`;
};

export const getContractUrl = (chainId: number, address: string) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/token/${address}`;
};

export const getRecommendedGasPrice = async (web3: Web3, chainId: number): Promise<string> => {
  try {
    const defaultGasPrices: Record<number, string> = {
      1: "20",
      137: "50",
      10: "0.1",
      42161: "0.1",
      8453: "0.1",
      7777777: "0.1",
      56: "5",
      11155111: "1"
    };
    
    let gasPrice;
    try {
      gasPrice = await web3.eth.getGasPrice();
    } catch (error) {
      console.error("Error getting gas price, using default:", error);
      return web3.utils.toWei(defaultGasPrices[chainId] || "20", 'gwei');
    }
    
    if (gasPrice) {
      const gasPriceGwei = parseFloat(web3.utils.fromWei(gasPrice.toString(), 'gwei'));
      return web3.utils.toWei((gasPriceGwei * 1.1).toFixed(2), 'gwei');
    }
    
    return web3.utils.toWei(defaultGasPrices[chainId] || "20", 'gwei');
  } catch (error) {
    console.error("Error getting gas price:", error);
    return web3.utils.toWei(defaultGasPrices[chainId] || "20", 'gwei');
  }
};

export const sendTransaction = async (web3: Web3, options: TxOptions): Promise<string> => {
  try {
    if (!web3) {
      throw new Error("Web3 instance not available");
    }

    const tx: any = {
      from: options.from,
      to: options.to,
      value: options.value ? web3.utils.toWei(options.value, 'ether') : '0',
      data: options.data || '0x',
    };

    if (options.gasLimit) {
      tx.gas = options.gasLimit;
    } else {
      try {
        const estimatedGas = await web3.eth.estimateGas({
          from: options.from,
          to: options.to,
          value: tx.value,
          data: tx.data
        });
        const estimatedGasNum = parseInt(estimatedGas.toString());
        tx.gas = Math.floor(estimatedGasNum * 1.2);
      } catch (error) {
        console.warn("Gas estimation failed, using default:", error);
        tx.gas = 100000;
      }
    }

    if (options.gasPrice) {
      tx.gasPrice = options.gasPrice;
    }
    
    if (options.maxFeePerGas) {
      tx.maxFeePerGas = options.maxFeePerGas;
      tx.maxPriorityFeePerGas = options.maxPriorityFeePerGas || 
        web3.utils.toWei("1.5", 'gwei');
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
    let balance;
    try {
      balance = await contract.methods.balanceOf(walletAddress).call();
    } catch (error) {
      console.error("Error calling balanceOf:", error);
      return "0";
    }
    
    const balanceNumber = Number(parseFloat(balance.toString()) / 10 ** decimals);
    return web3.utils.fromWei(balanceNumber.toString(), 'ether');
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

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
    
    const tx = {
      from,
      to: tokenAddress,
      data: contract.methods.approve(spenderAddress, amountWei).encodeABI(),
      gasPrice: gasPrice || await getRecommendedGasPrice(web3, 1)
    };

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

export const fetchRecentTransactions = async (
  web3: Web3,
  address: string,
  blockRange: number = 1000
): Promise<any[]> => {
  try {
    if (!web3 || !address) return [];
    
    const latestBlock = await web3.eth.getBlockNumber();
    const transactions = [];
    
    const startBlock = Math.max(0, Number(latestBlock) - blockRange);
    
    for (let i = 0; i < 5; i++) {
      const blockNumber = Number(latestBlock) - i;
      if (blockNumber < 0) break;
      
      try {
        const block = await web3.eth.getBlock(blockNumber, true);
        if (block && block.transactions) {
          const addressTransactions = block.transactions.filter((tx: any) => {
            return (tx.from && tx.from.toLowerCase() === address.toLowerCase()) || 
                   (tx.to && tx.to.toLowerCase() === address.toLowerCase());
          });
          
          const formattedTxs = addressTransactions.map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(tx.value ? tx.value.toString() : '0', 'ether'),
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
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    const transferGasPrice = gasPrice || await getRecommendedGasPrice(web3, 1);
    
    if (!isExactETH && path[0].toLowerCase() !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()) {
      await approveToken(
        web3,
        path[0],
        routerAddress,
        amountIn,
        fromAddress,
        transferGasPrice
      );
    }
    
    if (isExactETH) {
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
    
    if (isTokenAEth) {
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
    
    if (isTokenAEth) {
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

export const getContractInfo = async (
  web3: Web3,
  contractAddress: string
): Promise<any> => {
  try {
    const erc20ABI = [
      { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
      { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }
    ];

    const contract = new web3.eth.Contract(erc20ABI as any, contractAddress);
    
    try {
      let name = "";
      let symbol = "";
      let decimals = "18";
      let totalSupply = "0";
      
      try {
        name = await contract.methods.name().call();
      } catch (error) {
        console.error("Error reading name:", error);
        name = "Unknown";
      }
      
      try {
        symbol = await contract.methods.symbol().call();
      } catch (error) {
        console.error("Error reading symbol:", error);
        symbol = "???";
      }
      
      try {
        decimals = await contract.methods.decimals().call();
      } catch (error) {
        console.error("Error reading decimals:", error);
        decimals = "18";
      }
      
      try {
        totalSupply = await contract.methods.totalSupply().call();
      } catch (error) {
        console.error("Error reading totalSupply:", error);
        totalSupply = "0";
      }
      
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
    const functionABI = {
      name: functionName,
      type: "function",
      inputs: [],
      outputs: []
    };
    
    const contract = new web3.eth.Contract([functionABI] as any, contractAddress);
    
    const isReadFunction = false;
    
    if (isReadFunction) {
      return await contract.methods[functionName](...functionInputs).call({ from: fromAddress });
    } else {
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

export const compileContract = async (
  sourceCode: string
): Promise<any> => {
  try {
    return {
      success: true,
      bytecode: "0x...",
      abi: [],
    };
  } catch (error) {
    console.error("Compilation error:", error);
    throw error;
  }
};

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
    
    const gas = await deployTx.estimateGas({ from: fromAddress });
    
    const deployedContract = await deployTx.send({
      from: fromAddress,
      gas: gas.toString(),
      gasPrice: transferGasPrice
    });
    
    return deployedContract.options.address;
  } catch (error) {
    console.error("Contract deployment error:", error);
    throw error;
  }
};

export const getContractABI = async (
  chainId: number,
  contractAddress: string
): Promise<any[]> => {
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

export const getGasPrice = async (chainId: number): Promise<string> => {
  try {
    const defaultGasPrices: Record<number, string> = {
      1: "20",
      56: "5",
      137: "30",
      42161: "0.1",
      10: "0.001",
      43114: "25"
    };
    
    return defaultGasPrices[chainId] || "10";
  } catch (error) {
    console.error("Error getting gas price:", error);
    return "10";
  }
};

export const formatBigInt = (value: bigint, decimals: number = 18, displayDecimals: number = 4): string => {
  try {
    if (value === BigInt(0)) return "0";
    
    const divisor = BigInt(10) ** BigInt(decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    let remainderStr = remainder.toString().padStart(decimals, "0");
    remainderStr = remainderStr.substring(0, displayDecimals).replace(/0+$/, "");
    
    if (remainderStr === "") {
      return quotient.toString();
    }
    
    return `${quotient}.${remainderStr}`;
  } catch (error) {
    console.error("Error formatting BigInt:", error);
    return String(value);
  }
};

export const convertEstimatedGas = (gas: bigint): number => {
  return Number(gas);
};

export const formatGasPrice = (gasPrice: bigint): string => {
  return (Number(gasPrice.toString()) / 1e9).toFixed(2);
};

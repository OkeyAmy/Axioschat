
import Web3 from 'web3';
import { toast } from "@/components/ui/use-toast";

// Interface for transaction options
export interface TxOptions {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
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

// Send transaction
export const sendTransaction = async (web3: Web3, options: TxOptions): Promise<string> => {
  try {
    if (!web3) {
      throw new Error("Web3 instance not available");
    }

    const tx = {
      from: options.from,
      to: options.to,
      value: options.value ? web3.utils.toWei(options.value, 'ether') : '0',
      data: options.data || '0x',
      gas: options.gasLimit || 21000,
      gasPrice: options.gasPrice || await web3.eth.getGasPrice()
    };

    console.log("Sending transaction:", tx);
    
    const receipt = await web3.eth.sendTransaction(tx);
    console.log("Transaction receipt:", receipt);
    
    return receipt.transactionHash;
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
    return web3.utils.fromWei(balance, 'ether');
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

// Fetch recent transactions from blockchain explorer (using etherscan-like API)
export const fetchRecentTransactions = async (
  chainId: number,
  address: string,
  apiKey: string = ""
): Promise<any[]> => {
  try {
    const explorerUrl = getExplorerUrl(chainId);
    const apiBase = `${explorerUrl}/api`;
    
    const response = await fetch(
      `${apiBase}?module=account&action=txlist&address=${address}&sort=desc&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result.slice(0, 10).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
        status: tx.isError === "0" ? "success" : "failed",
        gasUsed: tx.gasUsed,
        blockNumber: tx.blockNumber
      }));
    }
    
    return [];
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
  isExactETH: boolean = false
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
    
    let txHash;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60); // deadline in minutes from now
    
    if (isExactETH) {
      // ETH to Token
      const tx = await router.methods.swapExactETHForTokens(
        amountOutMin,
        path,
        fromAddress,
        deadlineTimestamp
      ).send({
        from: fromAddress,
        value: web3.utils.toWei(amountIn, 'ether')
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
      ).send({ from: fromAddress });
      txHash = tx.transactionHash;
    } else {
      // Token to Token
      const tx = await router.methods.swapExactTokensForTokens(
        web3.utils.toWei(amountIn, 'ether'),
        amountOutMin,
        path,
        fromAddress,
        deadlineTimestamp
      ).send({ from: fromAddress });
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
        totalSupply: web3.utils.fromWei(totalSupply, 'ether'),
        functions: [
          { name: "transfer", inputs: ["address to", "uint256 amount"], outputs: ["bool"] },
          { name: "balanceOf", inputs: ["address account"], outputs: ["uint256"] },
          { name: "approve", inputs: ["address spender", "uint256 amount"], outputs: ["bool"] },
          { name: "transferFrom", inputs: ["address from", "address to", "uint256 amount"], outputs: ["bool"] },
          { name: "allowance", inputs: ["address owner", "address spender"], outputs: ["uint256"] },
        ]
      };
    } catch (error) {
      console.error("Error reading ERC20 interface:", error);
      return {
        address: contractAddress,
        name: "Unknown Contract",
        symbol: "???",
        decimals: 18,
        totalSupply: "Unknown",
        functions: []
      };
    }
  } catch (error) {
    console.error("Error getting contract info:", error);
    throw error;
  }
};

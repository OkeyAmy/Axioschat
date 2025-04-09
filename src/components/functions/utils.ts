
import { mainnet, sepolia, base, polygon } from "wagmi/chains";

export type TransactionStatus = "pending" | "success" | "failed" | "none";

export const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
      return "https://etherscan.io";
    case sepolia.id:
      return "https://sepolia.etherscan.io";
    case base.id:
      return "https://basescan.org";
    case polygon.id:
      return "https://polygonscan.com";
    default:
      return "https://etherscan.io";
  }
};

export const tokenData = {
  eth: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  usdc: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  dai: { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  usdt: { name: "Tether", symbol: "USDT", decimals: 6 },
  wbtc: { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
};

export const tokenAddresses: Record<number, Record<string, string>> = {
  [mainnet.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    wbtc: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  [sepolia.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    dai: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
    usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    wbtc: "0xCA063A2AB07491eE991dCecb456D1265f842b568",
  },
  [base.id]: {
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    dai: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    usdt: "0x4260e52248BEAf8cEC68f2910F1E41c4428dBc17",
    wbtc: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
  },
  [polygon.id]: {
    eth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    dai: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    wbtc: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  },
};

export const generateSampleTxs = (chainId: number, address: string | undefined) => {
  if (!address) return [];
  
  const explorerUrl = getExplorerUrl(chainId);
  
  return [
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Transfer",
      value: "0.1 ETH",
      to: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Swap",
      value: "100 USDC → 0.05 ETH",
      to: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - 7200000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
    {
      hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: "Approve",
      value: "Unlimited USDC",
      to: tokenAddresses[chainId]?.usdc || "",
      timestamp: new Date(Date.now() - 86400000).toLocaleString(),
      status: "success" as TransactionStatus,
    },
  ];
};

export const UNISWAP_ROUTER_ABI = [
  {
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForETH",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const UNISWAP_ROUTER_ADDRESSES: Record<number, string> = {
  [mainnet.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  [sepolia.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  [base.id]: "0x2626664c2603336E57B271c5C0b26F421741e481",
  [polygon.id]: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
};

export const getTxLink = (hash: string, chainId: number) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/tx/${hash}`;
};

export const getAddressLink = (address: string, chainId: number) => {
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/address/${address}`;
};

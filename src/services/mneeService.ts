/**
 * MNEE Service - Handles all MNEE API interactions
 * Based on MNEE API documentation: https://docs.mnee.io
 */

import Mnee from '@mnee/ts-sdk';

// MNEE API Configuration
// ALWAYS use proxy endpoint to avoid CORS errors (MNEE API only allows requests from docs.mnee.io)
// The proxy handles CORS and keeps API key secure on server-side
const MNEE_API_BASE = '/mnee-api';

// Initialize MNEE SDK client
const MNEE_API_KEY = import.meta.env.VITE_MNEE_API_KEY || '';
const MNEE_ENV = (import.meta.env.VITE_MNEE_ENV || 'sandbox') as 'production' | 'sandbox';
let mneeClient: Mnee | null = null;

/**
 * Get or create MNEE SDK client instance
 * Note: The SDK makes direct API calls which may fail due to CORS.
 * If CORS errors occur, we'll need to use raw fetch through the proxy instead.
 */
function getMneeClient(): Mnee {
  if (!mneeClient) {
    if (!MNEE_API_KEY) {
      throw new Error('MNEE API key not configured. Please set VITE_MNEE_API_KEY in your environment.');
    }
    mneeClient = new Mnee({
      environment: MNEE_ENV,
      apiKey: MNEE_API_KEY,
    });
  }
  return mneeClient;
}

// Types
export interface MNEEBalance {
  address: string;
  amt: number;
  precised: number;
}

export interface MNEEBalanceResult {
  address: string;
  amount: number;
  decimalAmount: number;
}

export interface MNEETransaction {
  txid: string;
  height: number;
  blkTime?: number;
  senders: string[];
  receivers: string[];
  score: number;
  rawtx?: string;
}

export interface MNEETransferTicket {
  id: string;
  tx_id: string;
  tx_hex: string;
  action_requested: string;
  status: 'BROADCASTING' | 'SUCCESS' | 'MINED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  errors: string | null;
}

export interface TransferResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  message?: string;
}

export interface MNEEConfig {
  approver: string;
  decimals: number;
  feeAddress: string;
  burnAddress: string;
  mintAddress: string;
  fees: Array<{ min: number; max: number; fee: number }>;
  tokenId: string;
}

export interface MNEEUtxo {
  txid: string;
  vout: number;
  outpoint: string;
  height: number;
  idx: number;
  satoshis: number;
  score: number;
  script: string;
  owners: string[];
  data: {
    bsv21: {
      amt: number;
      dec: number;
      icon: string;
      id: string;
      op: string;
      sym: string;
    };
    cosign: {
      address: string;
      cosigner: string;
    };
  };
}

export interface TransferInput {
  txid: string;
  vout: number;
  wif: string;
}

export interface TransferRecipient {
  address: string;
  amount: number;
}

export interface TransferMultiOptions {
  inputs: TransferInput[];
  recipients: TransferRecipient[];
  changeAddress?: string | TransferRecipient[];
}

// Wallet storage - using localStorage for persistence
const WALLET_STORAGE_KEY = 'mnee_wallet_address';
const WIF_STORAGE_KEY = 'mnee_wallet_wif';

/**
 * Get stored MNEE wallet address
 */
export function getMneeAddress(): string {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) return stored;
    // Fallback to environment variable
    return import.meta.env.VITE_MNEE_ADDRESS || '';
  } catch {
    return import.meta.env.VITE_MNEE_ADDRESS || '';
  }
}

/**
 * Set MNEE wallet address
 */
export function setMneeAddress(address: string): void {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, address);
  } catch (error) {
    console.error('Failed to save wallet address:', error);
  }
}

/**
 * Get stored WIF (private key) for transfers
 */
export function getMneeWif(): string {
  try {
    return localStorage.getItem(WIF_STORAGE_KEY) || import.meta.env.VITE_MNEE_WIF || '';
  } catch {
    return import.meta.env.VITE_MNEE_WIF || '';
  }
}

/**
 * Set WIF (private key) for transfers
 */
export function setMneeWif(wif: string): void {
  try {
    localStorage.setItem(WIF_STORAGE_KEY, wif);
  } catch (error) {
    console.error('Failed to save WIF:', error);
  }
}

/**
 * Clear wallet data
 */
export function clearMneeWallet(): void {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(WIF_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wallet data:', error);
  }
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return !!getMneeAddress();
}

/**
 * Build API URL - always use proxy endpoint
 */
function buildApiUrl(endpoint: string): string {
  const baseUrl = MNEE_API_BASE.endsWith('/') ? MNEE_API_BASE.slice(0, -1) : MNEE_API_BASE;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Get MNEE balance for an address using POST /v2/balance
 * This is the CORRECT endpoint per MNEE API documentation
 */
export async function getMneeBalance(address?: string): Promise<MNEEBalanceResult> {
  const walletAddress = address || getMneeAddress();
  
  if (!walletAddress) {
    throw new Error('No wallet address provided. Please connect your wallet first.');
  }

  console.log('[MneeService] Fetching balance for:', walletAddress);

  try {
    const response = await fetch(buildApiUrl('/v2/balance'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([walletAddress]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MNEE balance API error:', response.status, errorText);
      throw new Error(`Failed to fetch balance: ${response.status} ${errorText}`);
    }

    const data: MNEEBalance[] = await response.json();
    
    if (data && data.length > 0) {
      const balance = data[0];
      return {
        address: balance.address,
        amount: balance.amt,
        decimalAmount: balance.precised,
      };
    }

    // Return zero balance if no data
    return {
      address: walletAddress,
      amount: 0,
      decimalAmount: 0,
    };
  } catch (error) {
    console.error('Error fetching MNEE balance:', error);
    throw error;
  }
}

/**
 * Get MNEE balances for multiple addresses
 */
export async function getMneeBalances(addresses: string[]): Promise<MNEEBalanceResult[]> {
  if (!addresses || addresses.length === 0) {
    throw new Error('No addresses provided');
  }

  console.log('[MneeService] Fetching balances for:', addresses.length, 'addresses');

  try {
    const response = await fetch(buildApiUrl('/v2/balance'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addresses),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch balances: ${response.status} ${errorText}`);
    }

    const data: MNEEBalance[] = await response.json();
    
    return data.map(balance => ({
      address: balance.address,
      amount: balance.amt,
      decimalAmount: balance.precised,
    }));
  } catch (error) {
    console.error('Error fetching MNEE balances:', error);
    throw error;
  }
}

/**
 * Get MNEE config including fee structure
 */
export async function getMneeConfig(): Promise<MNEEConfig> {
  try {
    const response = await fetch(buildApiUrl('/v1/config'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch config: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching MNEE config:', error);
    throw error;
  }
}

/**
 * Calculate transfer fee based on amount
 */
export async function calculateFee(amount: number): Promise<number> {
  const config = await getMneeConfig();
  const atomicAmount = toAtomicAmount(amount);
  
  const feeTier = config.fees.find(
    tier => atomicAmount >= tier.min && atomicAmount <= tier.max
  );
  
  return feeTier ? fromAtomicAmount(feeTier.fee) : 0.001; // Default fee
}

/**
 * Check if user has sufficient balance for a transfer
 */
export async function hasSufficientBalance(amount: number, address?: string): Promise<{
  sufficient: boolean;
  balance: number;
  required: number;
  shortfall: number;
}> {
  const balance = await getMneeBalance(address);
  const fee = await calculateFee(amount);
  const required = amount + fee;
  const sufficient = balance.decimalAmount >= required;
  
  return {
    sufficient,
    balance: balance.decimalAmount,
    required,
    shortfall: sufficient ? 0 : required - balance.decimalAmount,
  };
}

/**
 * Get transaction history for an address using POST /v1/sync
 */
export async function getMneeTransactionHistory(
  limit: number = 10,
  address?: string,
  fromScore?: number
): Promise<MNEETransaction[]> {
  const walletAddress = address || getMneeAddress();
  
  if (!walletAddress) {
    throw new Error('No wallet address provided');
  }

  console.log('[MneeService] Fetching transaction history for:', walletAddress);

  try {
    // Build URL with query params
    const params = new URLSearchParams();
    if (fromScore) params.set('from', fromScore.toString());
    params.set('limit', limit.toString());
    const url = `${buildApiUrl('/v1/sync')}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([walletAddress]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Handle 500 errors with more context
      if (response.status === 500) {
        console.error('[MneeService] Server error fetching history:', errorText);
        // Return empty array instead of throwing for 500 errors
        // This allows the UI to continue functioning
        return [];
      }
      throw new Error(`Failed to fetch history: ${response.status} ${errorText}`);
    }

    const data: MNEETransaction[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching MNEE history:', error);
    // Return empty array on error to prevent UI breakage
    // The error is logged for debugging
    return [];
  }
}

/**
 * Get transaction status by ticket ID
 */
export async function getTransactionStatus(ticketId: string): Promise<MNEETransferTicket> {
  console.log('[MneeService] Getting transaction status for ticket:', ticketId);

  try {
    const url = `${buildApiUrl('/v2/ticket')}?ticketID=${encodeURIComponent(ticketId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get ticket status: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
}

/**
 * Prepare an MNEE transfer (validates before execution)
 * This prepares the transfer data but requires WIF for actual execution
 */
export async function prepareMneeTransfer(
  toAddress: string,
  amount: number
): Promise<TransferResult> {
  const fromAddress = getMneeAddress();
  
  if (!fromAddress) {
    return {
      success: false,
      error: 'No wallet connected. Please connect your wallet first.',
    };
  }

  // Validate recipient address (MNEE addresses start with '1')
  if (!toAddress || !toAddress.startsWith('1')) {
    return {
      success: false,
      error: 'Invalid recipient address. MNEE addresses should start with "1".',
    };
  }

  // Validate amount
  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than 0.',
    };
  }

  // Check sufficient balance
  const balanceCheck = await hasSufficientBalance(amount);
  if (!balanceCheck.sufficient) {
    return {
      success: false,
      error: `Insufficient balance. You have ${balanceCheck.balance} MNEE but need ${balanceCheck.required} MNEE (including fee). You are short by ${balanceCheck.shortfall.toFixed(5)} MNEE.`,
    };
  }

  // Return prepared transfer info
  return {
    success: true,
    message: `Transfer prepared: ${amount} MNEE to ${toAddress}. Balance: ${balanceCheck.balance} MNEE. Required: ${balanceCheck.required} MNEE (including fee).`,
  };
}

/**
 * Execute an MNEE transfer using @mnee/ts-sdk
 * Note: This requires the WIF (private key) which should be stored securely
 * In production, this should be handled by a secure backend service
 */
export async function executeMneeTransfer(
  toAddress: string,
  amount: number,
  wif?: string
): Promise<TransferResult> {
  const privateKey = wif || getMneeWif();
  
  if (!privateKey) {
    return {
      success: false,
      error: 'No private key (WIF) available. Please set up your wallet with MNEE CLI first. You can get your WIF by running: mnee wallet',
    };
  }

  // Validate recipient address
  if (!isValidMneeAddress(toAddress)) {
    return {
      success: false,
      error: 'Invalid recipient address. MNEE addresses should start with "1".',
    };
  }

  // Validate amount
  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than 0.',
    };
  }

  // Check sufficient balance first
  const balanceCheck = await hasSufficientBalance(amount);
  if (!balanceCheck.sufficient) {
    return {
      success: false,
      error: `Insufficient balance. You have ${balanceCheck.balance.toFixed(5)} MNEE but need ${balanceCheck.required.toFixed(5)} MNEE (including fee). Shortfall: ${balanceCheck.shortfall.toFixed(5)} MNEE.`,
    };
  }

  try {
    console.log('[MneeService] Executing transfer:', { toAddress, amount });
    
    // Use MNEE SDK to execute the transfer
    const client = getMneeClient();
    const response = await client.transfer(
      [{ address: toAddress, amount }],
      privateKey
    );

    console.log('[MneeService] Transfer successful, ticket ID:', response.ticketId);

    return {
      success: true,
      ticketId: response.ticketId,
      message: `Transfer submitted successfully! Ticket ID: ${response.ticketId}. You can track the status using this ticket ID.`,
    };
  } catch (error) {
    console.error('[MneeService] Transfer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: `Transfer failed: ${errorMessage}`,
    };
  }
}

/**
 * Convert MNEE amount to atomic units (1 MNEE = 100,000 atomic units)
 */
export function toAtomicAmount(mneeAmount: number): number {
  return Math.round(mneeAmount * 100000);
}

/**
 * Convert atomic units to MNEE amount
 */
export function fromAtomicAmount(atomicAmount: number): number {
  return atomicAmount / 100000;
}

/**
 * Format balance for display
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

/**
 * Validate MNEE address format
 */
export function isValidMneeAddress(address: string): boolean {
  // MNEE uses Bitcoin-style addresses starting with '1'
  return /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Get UTXOs for one or more addresses using POST /v2/utxos
 */
export async function getMneeUtxos(
  addresses: string | string[],
  page: number = 1,
  size: number = 10,
  order: 'asc' | 'desc' = 'desc'
): Promise<MNEEUtxo[]> {
  const addressList = Array.isArray(addresses) ? addresses : [addresses];
  
  if (addressList.length === 0) {
    throw new Error('No addresses provided');
  }

  console.log('[MneeService] Fetching UTXOs for:', addressList.length, 'addresses');

  try {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    if (order) params.set('order', order);
    
    const url = `${buildApiUrl('/v2/utxos')}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressList),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch UTXOs: ${response.status} ${errorText}`);
    }

    const data: MNEEUtxo[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching MNEE UTXOs:', error);
    throw error;
  }
}

/**
 * Transfer MNEE tokens from multiple UTXOs (transferMulti)
 * Note: This requires WIF keys for each input UTXO
 */
export async function transferMneeMulti(
  options: TransferMultiOptions
): Promise<TransferResult> {
  if (!options.inputs || options.inputs.length === 0) {
    return {
      success: false,
      error: 'No inputs provided. At least one UTXO input is required.',
    };
  }

  if (!options.recipients || options.recipients.length === 0) {
    return {
      success: false,
      error: 'No recipients provided. At least one recipient is required.',
    };
  }

  // Validate all inputs have WIF
  for (const input of options.inputs) {
    if (!input.wif) {
      return {
        success: false,
        error: `Input ${input.txid}:${input.vout} is missing WIF (private key).`,
      };
    }
  }

  // Validate all recipients
  for (const recipient of options.recipients) {
    if (!isValidMneeAddress(recipient.address)) {
      return {
        success: false,
        error: `Invalid recipient address: ${recipient.address}`,
      };
    }
    if (recipient.amount <= 0) {
      return {
        success: false,
        error: `Invalid amount for ${recipient.address}: ${recipient.amount}`,
      };
    }
  }

  console.log('[MneeService] Preparing multi-transfer:', {
    inputs: options.inputs.length,
    recipients: options.recipients.length,
  });

  // Note: Actual transferMulti implementation requires MNEE SDK
  // This is a placeholder that validates and prepares the transfer
  // In production, this would call the MNEE SDK's transferMulti method
  
  return {
    success: false,
    error: 'Transfer multi requires MNEE SDK integration. Please use MNEE CLI or SDK for multi-source transfers.',
    message: `To transfer from ${options.inputs.length} UTXOs to ${options.recipients.length} recipients, use MNEE SDK transferMulti method.`,
  };
}

/**
 * Submit a raw transaction hex using POST /v2/transfer
 * Returns a ticket ID for tracking
 */
export async function submitRawTransaction(rawTxHex: string): Promise<TransferResult> {
  if (!rawTxHex || !rawTxHex.trim()) {
    return {
      success: false,
      error: 'Raw transaction hex is required.',
    };
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(rawTxHex.trim())) {
    return {
      success: false,
      error: 'Invalid transaction hex format.',
    };
  }

  console.log('[MneeService] Submitting raw transaction:', rawTxHex.slice(0, 32) + '...');

  try {
    const response = await fetch(buildApiUrl('/v2/transfer'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawtx: rawTxHex.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MNEE submit transaction error:', response.status, errorText);
      throw new Error(`Failed to submit transaction: ${response.status} ${errorText}`);
    }

    // POST /v2/transfer returns ticket ID as plain text
    const ticketId = await response.text();
    
    return {
      success: true,
      ticketId: ticketId.trim(),
      message: `Transaction submitted successfully. Ticket ID: ${ticketId.trim()}`,
    };
  } catch (error) {
    console.error('Error submitting raw transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}


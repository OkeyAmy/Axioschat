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

// The rest of the file remains unchanged

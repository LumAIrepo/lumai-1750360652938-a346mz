import React from "react"
```typescript
/**
 * Pricing utilities for Zentro prediction market
 */

export interface PriceData {
  current: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
}

export interface MarketOdds {
  yes: number;
  no: number;
  impliedProbability: number;
}

export interface PricingConfig {
  baseFee: number;
  liquidityFee: number;
  protocolFee: number;
  maxSlippage: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseFee: 0.001, // 0.1%
  liquidityFee: 0.002, // 0.2%
  protocolFee: 0.0005, // 0.05%
  maxSlippage: 0.05, // 5%
};

/**
 * Calculate market odds from yes/no token prices
 */
export function calculateMarketOdds(yesPrice: number, noPrice: number): MarketOdds {
  const total = yesPrice + noPrice;
  const normalizedYes = yesPrice / total;
  const normalizedNo = noPrice / total;
  
  return {
    yes: normalizedYes,
    no: normalizedNo,
    impliedProbability: normalizedYes,
  };
}

/**
 * Calculate implied probability from odds
 */
export function oddsToImpliedProbability(odds: number): number {
  return 1 / (odds + 1);
}

/**
 * Calculate odds from implied probability
 */
export function impliedProbabilityToOdds(probability: number): number {
  return (1 - probability) / probability;
}

/**
 * Calculate trading fees for a given amount
 */
export function calculateTradingFees(
  amount: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): {
  baseFee: number;
  liquidityFee: number;
  protocolFee: number;
  totalFees: number;
  netAmount: number;
} {
  const baseFee = amount * config.baseFee;
  const liquidityFee = amount * config.liquidityFee;
  const protocolFee = amount * config.protocolFee;
  const totalFees = baseFee + liquidityFee + protocolFee;
  
  return {
    baseFee,
    liquidityFee,
    protocolFee,
    totalFees,
    netAmount: amount - totalFees,
  };
}

/**
 * Calculate price impact for a trade
 */
export function calculatePriceImpact(
  tradeAmount: number,
  liquidity: number,
  currentPrice: number
): {
  priceImpact: number;
  newPrice: number;
  slippage: number;
} {
  const k = liquidity * currentPrice;
  const newLiquidity = liquidity + tradeAmount;
  const newPrice = k / newLiquidity;
  const priceImpact = Math.abs(newPrice - currentPrice) / currentPrice;
  const slippage = priceImpact;
  
  return {
    priceImpact,
    newPrice,
    slippage,
  };
}

/**
 * Calculate minimum received amount considering slippage
 */
export function calculateMinimumReceived(
  expectedAmount: number,
  slippageTolerance: number
): number {
  return expectedAmount * (1 - slippageTolerance);
}

/**
 * Calculate maximum input amount considering slippage
 */
export function calculateMaximumInput(
  expectedInput: number,
  slippageTolerance: number
): number {
  return expectedInput * (1 + slippageTolerance);
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number, decimals: number = 4): string {
  if (price === 0) return '0';
  
  if (price < 0.0001) {
    return price.toExponential(2);
  }
  
  if (price < 1) {
    return price.toFixed(decimals);
  }
  
  if (price < 1000) {
    return price.toFixed(2);
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format percentage change
 */
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Calculate average price from price history
 */
export function calculateAveragePrice(prices: number[]): number {
  if (prices.length === 0) return 0;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

/**
 * Calculate price volatility (standard deviation)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const average = calculateAveragePrice(prices);
  const squaredDifferences = prices.map(price => Math.pow(price - average, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / prices.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate Sharpe ratio for risk assessment
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.02
): number {
  if (returns.length === 0) return 0;
  
  const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturn = averageReturn - riskFreeRate;
  
  const variance = returns.reduce((sum, ret) => {
    return sum + Math.pow(ret - averageReturn, 2);
  }, 0) / returns.length;
  
  const standardDeviation = Math.sqrt(variance);
  
  return standardDeviation === 0 ? 0 : excessReturn / standardDeviation;
}

/**
 * Validate price data
 */
export function validatePriceData(data: Partial<PriceData>): data is PriceData {
  return (
    typeof data.current === 'number' &&
    typeof data.change24h === 'number' &&
    typeof data.changePercent24h === 'number' &&
    typeof data.volume24h === 'number' &&
    data.current >= 0 &&
    data.volume24h >= 0
  );
}

/**
 * Check if slippage is within acceptable limits
 */
export function isSlippageAcceptable(
  slippage: number,
  maxSlippage: number = DEFAULT_PRICING_CONFIG.maxSlippage
): boolean {
  return slippage <= maxSlippage;
}
```
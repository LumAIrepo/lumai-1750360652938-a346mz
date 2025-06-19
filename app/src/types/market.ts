import React from "react"
```typescript
export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  createdAt: Date;
  endDate: Date;
  status: MarketStatus;
  totalVolume: number;
  totalLiquidity: number;
  outcomes: MarketOutcome[];
  metadata: MarketMetadata;
  fees: MarketFees;
  resolution?: MarketResolution;
}

export interface MarketOutcome {
  id: string;
  title: string;
  description?: string;
  probability: number;
  price: number;
  volume: number;
  shares: number;
  color: string;
}

export interface MarketMetadata {
  tags: string[];
  imageUrl?: string;
  sourceUrl?: string;
  verificationRequired: boolean;
  minimumStake: number;
  maximumStake?: number;
}

export interface MarketFees {
  creatorFee: number;
  platformFee: number;
  liquidityFee: number;
}

export interface MarketResolution {
  winningOutcomeId: string;
  resolvedAt: Date;
  resolvedBy: string;
  evidence?: string;
  disputed: boolean;
}

export enum MarketStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum MarketCategory {
  SPORTS = 'sports',
  POLITICS = 'politics',
  CRYPTO = 'crypto',
  ENTERTAINMENT = 'entertainment',
  SCIENCE = 'science',
  ECONOMICS = 'economics',
  WEATHER = 'weather',
  OTHER = 'other'
}

export interface CreateMarketRequest {
  title: string;
  description: string;
  category: MarketCategory;
  endDate: Date;
  outcomes: CreateMarketOutcome[];
  metadata: Partial<MarketMetadata>;
  initialLiquidity: number;
}

export interface CreateMarketOutcome {
  title: string;
  description?: string;
  initialProbability: number;
  color: string;
}

export interface MarketPosition {
  marketId: string;
  outcomeId: string;
  shares: number;
  averagePrice: number;
  currentValue: number;
  unrealizedPnL: number;
  createdAt: Date;
}

export interface MarketTrade {
  id: string;
  marketId: string;
  outcomeId: string;
  trader: string;
  type: TradeType;
  shares: number;
  price: number;
  amount: number;
  timestamp: Date;
  txHash: string;
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell'
}

export interface MarketOrderBook {
  marketId: string;
  outcomeId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: Date;
}

export interface OrderBookEntry {
  price: number;
  shares: number;
  total: number;
}

export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalUsers: number;
  averageMarketDuration: number;
  popularCategories: CategoryStats[];
}

export interface CategoryStats {
  category: MarketCategory;
  count: number;
  volume: number;
}

export interface UserMarketActivity {
  userId: string;
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  totalPnL: number;
  activePositions: MarketPosition[];
  recentTrades: MarketTrade[];
}
```
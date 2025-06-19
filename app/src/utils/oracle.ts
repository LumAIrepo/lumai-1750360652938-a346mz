import React from "react"
```typescript
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

export interface OracleData {
  price: number;
  timestamp: number;
  confidence: number;
  status: 'active' | 'inactive' | 'stale';
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export class Oracle {
  private connection: Connection;
  private oracleAccount: PublicKey;
  private updateInterval: number;
  private subscribers: Map<string, (data: OracleData) => void>;

  constructor(
    connection: Connection,
    oracleAccount: PublicKey,
    updateInterval: number = 30000
  ) {
    this.connection = connection;
    this.oracleAccount = oracleAccount;
    this.updateInterval = updateInterval;
    this.subscribers = new Map();
  }

  async initialize(): Promise<void> {
    try {
      await this.validateOracleAccount();
      this.startPriceUpdates();
    } catch (error) {
      throw new Error(`Failed to initialize oracle: ${error}`);
    }
  }

  private async validateOracleAccount(): Promise<void> {
    const accountInfo = await this.connection.getAccountInfo(this.oracleAccount);
    if (!accountInfo) {
      throw new Error('Oracle account not found');
    }
  }

  async getCurrentPrice(): Promise<OracleData> {
    try {
      const accountInfo = await this.connection.getAccountInfo(this.oracleAccount);
      if (!accountInfo) {
        throw new Error('Oracle account not found');
      }

      return this.parseOracleData(accountInfo);
    } catch (error) {
      throw new Error(`Failed to fetch current price: ${error}`);
    }
  }

  private parseOracleData(accountInfo: AccountInfo<Buffer>): OracleData {
    const data = accountInfo.data;
    
    // Parse the oracle data based on your specific format
    const price = data.readDoubleLE(0);
    const timestamp = data.readBigUInt64LE(8);
    const confidence = data.readDoubleLE(16);
    const statusByte = data.readUInt8(24);
    
    const status = this.parseStatus(statusByte);
    
    return {
      price,
      timestamp: Number(timestamp),
      confidence,
      status
    };
  }

  private parseStatus(statusByte: number): 'active' | 'inactive' | 'stale' {
    switch (statusByte) {
      case 0:
        return 'inactive';
      case 1:
        return 'active';
      case 2:
        return 'stale';
      default:
        return 'inactive';
    }
  }

  subscribe(id: string, callback: (data: OracleData) => void): void {
    this.subscribers.set(id, callback);
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  private startPriceUpdates(): void {
    setInterval(async () => {
      try {
        const oracleData = await this.getCurrentPrice();
        this.notifySubscribers(oracleData);
      } catch (error) {
        console.error('Failed to update price:', error);
      }
    }, this.updateInterval);
  }

  private notifySubscribers(data: OracleData): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  async getHistoricalPrices(
    startTime: number,
    endTime: number,
    interval: number = 3600
  ): Promise<OracleData[]> {
    try {
      // This would typically fetch from a historical data service
      // For now, return mock data structure
      const prices: OracleData[] = [];
      
      for (let time = startTime; time <= endTime; time += interval * 1000) {
        prices.push({
          price: Math.random() * 100 + 50,
          timestamp: time,
          confidence: 0.95,
          status: 'active'
        });
      }
      
      return prices;
    } catch (error) {
      throw new Error(`Failed to fetch historical prices: ${error}`);
    }
  }

  async validatePriceUpdate(update: PriceUpdate): Promise<boolean> {
    const currentTime = Date.now();
    const maxAge = 300000; // 5 minutes
    
    if (currentTime - update.timestamp > maxAge) {
      return false;
    }
    
    if (update.price <= 0) {
      return false;
    }
    
    return true;
  }

  async aggregatePrices(sources: PriceUpdate[]): Promise<OracleData> {
    const validUpdates = [];
    
    for (const update of sources) {
      if (await this.validatePriceUpdate(update)) {
        validUpdates.push(update);
      }
    }
    
    if (validUpdates.length === 0) {
      throw new Error('No valid price updates available');
    }
    
    const totalWeight = validUpdates.length;
    const weightedSum = validUpdates.reduce((sum, update) => sum + update.price, 0);
    const averagePrice = weightedSum / totalWeight;
    
    const variance = validUpdates.reduce((sum, update) => {
      return sum + Math.pow(update.price - averagePrice, 2);
    }, 0) / totalWeight;
    
    const confidence = Math.max(0, 1 - Math.sqrt(variance) / averagePrice);
    
    return {
      price: averagePrice,
      timestamp: Date.now(),
      confidence,
      status: 'active'
    };
  }

  destroy(): void {
    this.subscribers.clear();
  }
}

export const createOracle = (
  connection: Connection,
  oracleAccount: PublicKey,
  updateInterval?: number
): Oracle => {
  return new Oracle(connection, oracleAccount, updateInterval);
};

export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

export const calculatePriceChange = (
  currentPrice: number,
  previousPrice: number
): { change: number; percentage: number } => {
  const change = currentPrice - previousPrice;
  const percentage = (change / previousPrice) * 100;
  
  return { change, percentage };
};

export const isPriceStale = (timestamp: number, maxAge: number = 300000): boolean => {
  return Date.now() - timestamp > maxAge;
};
```
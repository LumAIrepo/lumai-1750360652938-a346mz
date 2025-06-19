import React from "react"
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'

interface Position {
  id: string
  marketId: string
  marketTitle: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercentage: number
}

interface PortfolioStats {
  totalValue: number
  totalPnl: number
  totalPnlPercentage: number
  activePositions: number
  winRate: number
}

interface UsePortfolioReturn {
  positions: Position[]
  stats: PortfolioStats
  isLoading: boolean
  error: string | null
  refreshPortfolio: () => Promise<void>
}

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

export function usePortfolio(): UsePortfolioReturn {
  const { publicKey, connected } = useWallet()
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercentage: 0,
    activePositions: 0,
    winRate: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateStats = useCallback((positions: Position[]): PortfolioStats => {
    if (positions.length === 0) {
      return {
        totalValue: 0,
        totalPnl: 0,
        totalPnlPercentage: 0,
        activePositions: 0,
        winRate: 0
      }
    }

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
    const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
    const totalPnlPercentage = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0
    const activePositions = positions.filter(pos => pos.shares > 0).length
    const winningPositions = positions.filter(pos => pos.pnl > 0).length
    const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0

    return {
      totalValue,
      totalPnl,
      totalPnlPercentage,
      activePositions,
      winRate
    }
  }, [])

  const fetchPortfolio = useCallback(async () => {
    if (!connected || !publicKey) {
      setPositions([])
      setStats({
        totalValue: 0,
        totalPnl: 0,
        totalPnlPercentage: 0,
        activePositions: 0,
        winRate: 0
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const connection = new Connection(SOLANA_RPC_URL)
      
      // Mock data for demonstration - replace with actual Solana program calls
      const mockPositions: Position[] = [
        {
          id: '1',
          marketId: 'market-1',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          side: 'yes',
          shares: 100,
          avgPrice: 0.65,
          currentPrice: 0.72,
          value: 72,
          pnl: 7,
          pnlPercentage: 10.77
        },
        {
          id: '2',
          marketId: 'market-2',
          marketTitle: 'Will Ethereum 2.0 launch successfully?',
          side: 'no',
          shares: 50,
          avgPrice: 0.45,
          currentPrice: 0.38,
          value: 19,
          pnl: -3.5,
          pnlPercentage: -15.56
        }
      ]

      setPositions(mockPositions)
      setStats(calculateStats(mockPositions))
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio')
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey, calculateStats])

  const refreshPortfolio = useCallback(async () => {
    await fetchPortfolio()
  }, [fetchPortfolio])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return {
    positions,
    stats,
    isLoading,
    error,
    refreshPortfolio
  }
}
```
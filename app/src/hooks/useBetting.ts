import React from "react"
```typescript
import { useState, useCallback, useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { toast } from 'sonner'

export interface BettingPosition {
  id: string
  marketId: string
  side: 'yes' | 'no'
  amount: number
  odds: number
  timestamp: number
  status: 'pending' | 'matched' | 'settled' | 'cancelled'
  payout?: number
}

export interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  yesPrice: number
  noPrice: number
  status: 'active' | 'resolved' | 'cancelled'
  resolution?: 'yes' | 'no'
}

export interface BettingState {
  positions: BettingPosition[]
  markets: Market[]
  isLoading: boolean
  error: string | null
  totalPnL: number
  activePositions: number
}

export function useBetting() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  
  const [state, setState] = useState<BettingState>({
    positions: [],
    markets: [],
    isLoading: false,
    error: null,
    totalPnL: 0,
    activePositions: 0
  })

  const placeBet = useCallback(async (
    marketId: string,
    side: 'yes' | 'no',
    amount: number,
    odds: number
  ): Promise<boolean> => {
    if (!publicKey || !connection) {
      toast.error('Please connect your wallet')
      return false
    }

    if (amount <= 0) {
      toast.error('Bet amount must be greater than 0')
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const lamports = amount * LAMPORTS_PER_SOL
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('11111111111111111111111111111112'),
          lamports
        })
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      const newPosition: BettingPosition = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        marketId,
        side,
        amount,
        odds,
        timestamp: Date.now(),
        status: 'pending'
      }

      setState(prev => ({
        ...prev,
        positions: [...prev.positions, newPosition],
        activePositions: prev.activePositions + 1,
        isLoading: false
      }))

      toast.success(`Bet placed successfully: ${amount} SOL on ${side.toUpperCase()}`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bet'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      toast.error(errorMessage)
      return false
    }
  }, [publicKey, connection, sendTransaction])

  const cancelBet = useCallback(async (positionId: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const position = state.positions.find(p => p.id === positionId)
      if (!position || position.status !== 'pending') {
        throw new Error('Position not found or cannot be cancelled')
      }

      setState(prev => ({
        ...prev,
        positions: prev.positions.map(p =>
          p.id === positionId ? { ...p, status: 'cancelled' as const } : p
        ),
        activePositions: prev.activePositions - 1,
        isLoading: false
      }))

      toast.success('Bet cancelled successfully')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel bet'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      toast.error(errorMessage)
      return false
    }
  }, [publicKey, state.positions])

  const getPositionsByMarket = useCallback((marketId: string): BettingPosition[] => {
    return state.positions.filter(position => position.marketId === marketId)
  }, [state.positions])

  const getMarketExposure = useCallback((marketId: string): { yes: number; no: number } => {
    const positions = getPositionsByMarket(marketId)
    return positions.reduce(
      (acc, position) => {
        if (position.status === 'matched' || position.status === 'pending') {
          acc[position.side] += position.amount
        }
        return acc
      },
      { yes: 0, no: 0 }
    )
  }, [getPositionsByMarket])

  const calculatePnL = useCallback((): number => {
    return state.positions.reduce((total, position) => {
      if (position.status === 'settled' && position.payout) {
        return total + (position.payout - position.amount)
      }
      return total
    }, 0)
  }, [state.positions])

  const activePositions = useMemo(() => {
    return state.positions.filter(p => p.status === 'pending' || p.status === 'matched')
  }, [state.positions])

  const settledPositions = useMemo(() => {
    return state.positions.filter(p => p.status === 'settled')
  }, [state.positions])

  const winRate = useMemo(() => {
    const settled = settledPositions
    if (settled.length === 0) return 0
    
    const wins = settled.filter(p => p.payout && p.payout > p.amount).length
    return (wins / settled.length) * 100
  }, [settledPositions])

  const refreshData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Simulate API call to refresh market data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setState(prev => ({
        ...prev,
        totalPnL: calculatePnL(),
        isLoading: false
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [calculatePnL])

  return {
    ...state,
    placeBet,
    cancelBet,
    getPositionsByMarket,
    getMarketExposure,
    calculatePnL,
    refreshData,
    activePositions,
    settledPositions,
    winRate,
    totalPnL: calculatePnL()
  }
}
```
import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

interface Market {
  id: string
  title: string
  description: string
  yesPrice: number
  noPrice: number
  totalVolume: number
  participants: number
  endDate: Date
  category: string
  resolved: boolean
  outcome?: 'yes' | 'no'
}

interface BettingInterfaceProps {
  market: Market
  onBetPlaced?: (betId: string, amount: number, side: 'yes' | 'no') => void
}

interface BetState {
  side: 'yes' | 'no'
  amount: string
  isLoading: boolean
  error: string | null
  success: boolean
}

export default function BettingInterface({ market, onBetPlaced }: BettingInterfaceProps) {
  const { connected, publicKey, signTransaction } = useWallet()
  const [betState, setBetState] = useState<BetState>({
    side: 'yes',
    amount: '',
    isLoading: false,
    error: null,
    success: false
  })
  const [userBalance, setUserBalance] = useState<number>(0)
  const [connection] = useState(() => new Connection('https://api.mainnet-beta.solana.com'))

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserBalance()
    }
  }, [connected, publicKey])

  const fetchUserBalance = async () => {
    if (!publicKey) return
    try {
      const balance = await connection.getBalance(publicKey)
      setUserBalance(balance / 1e9) // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '')
    if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
      setBetState(prev => ({ ...prev, amount: numericValue, error: null }))
    }
  }

  const validateBet = (): string | null => {
    if (!connected) return 'Please connect your wallet'
    if (!betState.amount || parseFloat(betState.amount) <= 0) return 'Please enter a valid amount'
    if (parseFloat(betState.amount) > userBalance) return 'Insufficient balance'
    if (market.resolved) return 'This market has been resolved'
    if (new Date() > market.endDate) return 'Betting period has ended'
    return null
  }

  const handlePlaceBet = async () => {
    const validationError = validateBet()
    if (validationError) {
      setBetState(prev => ({ ...prev, error: validationError }))
      return
    }

    setBetState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Simulate transaction creation and signing
      const amount = parseFloat(betState.amount)
      
      // In a real implementation, you would:
      // 1. Create a transaction to interact with your prediction market program
      // 2. Sign the transaction
      // 3. Send it to the network
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay
      
      setBetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true,
        amount: ''
      }))

      onBetPlaced?.(
        `bet_${Date.now()}`,
        amount,
        betState.side
      )

      // Reset success state after 3 seconds
      setTimeout(() => {
        setBetState(prev => ({ ...prev, success: false }))
      }, 3000)

    } catch (error) {
      setBetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to place bet. Please try again.' 
      }))
    }
  }

  const calculatePotentialPayout = (): number => {
    if (!betState.amount) return 0
    const amount = parseFloat(betState.amount)
    const price = betState.side === 'yes' ? market.yesPrice : market.noPrice
    return amount / price
  }

  const yesPercentage = (market.yesPrice / (market.yesPrice + market.noPrice)) * 100
  const noPercentage = 100 - yesPercentage

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Market Overview */}
      <Card className="border-2" style={{ borderColor: '#6366f1' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">{market.title}</CardTitle>
            <Badge 
              variant={market.resolved ? 'secondary' : 'default'}
              className="text-sm"
              style={{ backgroundColor: market.resolved ? '#8b5cf6' : '#06b6d4' }}
            >
              {market.resolved ? 'Resolved' : 'Active'}
            </Badge>
          </div>
          <CardDescription className="text-gray-600">{market.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">Volume</span>
              </div>
              <p className="text-lg font-semibold">${market.totalVolume.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">Participants</span>
              </div>
              <p className="text-lg font-semibold">{market.participants}</p>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500 block mb-2">Yes Price</span>
              <p className="text-lg font-semibold" style={{ color: '#06b6d4' }}>
                ${market.yesPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500 block mb-2">No Price</span>
              <p className="text-lg font-semibold" style={{ color: '#8b5cf6' }}>
                ${market.noPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Market Probability */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Market Probability</span>
              <span>Yes: {yesPercentage.toFixed(1)}% | No: {noPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={yesPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Betting Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: '#6366f1' }} />
            Place Your Bet
          </CardTitle>
          {connected && (
            <CardDescription>
              Wallet Balance: {userBalance.toFixed(4)} SOL
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Tabs 
            value={betState.side} 
            onValueChange={(value) => setBetState(prev => ({ ...prev, side: value as 'yes' | 'no' }))}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="yes" 
                className="data-[state=active]:bg-[#06b6d4] data-[state=active]:text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Yes ${market.yesPrice.toFixed(2)}
              </TabsTrigger>
              <TabsTrigger 
                value="no"
                className="data-[state=active]:bg-[#8b5cf6] data-[state=active]:text-white"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                No ${market.noPrice.toFixed(2)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="yes" className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#06b6d4', opacity: 0.1 }}>
                <p className="text-sm text-gray-700">
                  Betting <strong>Yes</strong> - You win if the outcome is positive
                </p>
              </div>
            </TabsContent>

            <TabsContent value="no" className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#8b5cf6', opacity: 0.1 }}>
                <p className="text-sm text-gray-700">
                  Betting <strong>No</strong> - You win if the outcome is negative
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                Bet Amount (SOL)
              </Label>
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={betState.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="mt-1"
                style={{ borderRadius: '0.75rem' }}
              />
            </div>

            {betState.amount && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bet Amount:</span>
                  <span>{betState.amount} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Potential Payout:</span>
                  <span className="font-semibold">
                    {calculatePotentialPayout().toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Potential Profit:</span>
                  <span 
                    className="font-semibold"
                    style={{ color: '#06b6d4' }}
                  >
                    {(calculatePotentialPayout() - parseFloat(betState.amount || '0')).toFixed(4)} SOL
                  </span>
                </div>
              </div>
            )}

            {betState.error && (
              <Alert variant="destructive">
                <AlertDescription>{betState.error}</AlertDescription>
              </Alert>
            )}

            {betState.success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Bet placed successfully! Transaction is being processed.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePlaceBet}
              disabled={betState.isLoading || !connected || market.resolved}
              className="w-full h-12 text-base font-semibold"
              style={{ 
                backgroundColor: betState.side === 'yes' ? '#06b6d4' : '#8b5cf6',
                borderRadius: '0.75rem'
              }}
            >
              {betState.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Bet...
                </>
              ) : !connected ? (
                'Connect Wallet to Bet'
              ) : market.resolved ? (
                'Market Resolved'
              ) : (
                `Place ${betState.side.toUpperCase()} Bet`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium">{market.category}</span>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <span className="ml-2 font-medium">
                {market.endDate.toLocaleDateString()}
              </span>
            </div>
            {market.resolved && market.outcome && (
              <div className="md:col-span-2">
                <span className="text-gray-500">Outcome:</span>
                <Badge 
                  className="ml-2"
                  style={{ 
                    backgroundColor: market.outcome === 'yes' ? '#06b6d4' : '#8b5cf6' 
                  }}
                >
                  {market.outcome.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```
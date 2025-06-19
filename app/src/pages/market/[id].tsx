import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { toast } from 'react-hot-toast'
import { ArrowLeft, TrendingUp, TrendingDown, Users, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  yesPrice: number
  noPrice: number
  yesShares: number
  noShares: number
  participants: number
  status: 'active' | 'resolved' | 'closed'
  creator: string
  resolution?: 'yes' | 'no'
}

interface Position {
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  value: number
}

interface OrderBookEntry {
  price: number
  shares: number
  total: number
}

export default function MarketPage() {
  const router = useRouter()
  const { id } = router.query
  const { publicKey, connected, signTransaction } = useWallet()
  
  const [market, setMarket] = useState<Market | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes')
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const [orderBook, setOrderBook] = useState<{
    yes: { bids: OrderBookEntry[], asks: OrderBookEntry[] }
    no: { bids: OrderBookEntry[], asks: OrderBookEntry[] }
  }>({
    yes: { bids: [], asks: [] },
    no: { bids: [], asks: [] }
  })

  useEffect(() => {
    if (id) {
      fetchMarketData()
      if (connected && publicKey) {
        fetchUserPosition()
      }
    }
  }, [id, connected, publicKey])

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockMarket: Market = {
        id: id as string,
        title: "Will Bitcoin reach $100,000 by end of 2024?",
        description: "This market resolves to 'Yes' if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange by December 31, 2024, 11:59 PM UTC.",
        category: "Cryptocurrency",
        endDate: new Date('2024-12-31'),
        totalVolume: 125000,
        yesPrice: 0.65,
        noPrice: 0.35,
        yesShares: 85000,
        noShares: 40000,
        participants: 1247,
        status: 'active',
        creator: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv'
      }
      
      setMarket(mockMarket)
      
      // Mock order book data
      setOrderBook({
        yes: {
          bids: [
            { price: 0.64, shares: 1000, total: 640 },
            { price: 0.63, shares: 1500, total: 945 },
            { price: 0.62, shares: 2000, total: 1240 }
          ],
          asks: [
            { price: 0.66, shares: 800, total: 528 },
            { price: 0.67, shares: 1200, total: 804 },
            { price: 0.68, shares: 1800, total: 1224 }
          ]
        },
        no: {
          bids: [
            { price: 0.34, shares: 900, total: 306 },
            { price: 0.33, shares: 1100, total: 363 },
            { price: 0.32, shares: 1600, total: 512 }
          ],
          asks: [
            { price: 0.36, shares: 700, total: 252 },
            { price: 0.37, shares: 1000, total: 370 },
            { price: 0.38, shares: 1400, total: 532 }
          ]
        }
      })
    } catch (error) {
      console.error('Error fetching market data:', error)
      toast.error('Failed to load market data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosition = async () => {
    try {
      // Mock position data - replace with actual program call
      const mockPosition: Position = {
        side: 'yes',
        shares: 500,
        avgPrice: 0.62,
        value: 325
      }
      setPosition(mockPosition)
    } catch (error) {
      console.error('Error fetching position:', error)
    }
  }

  const handlePlaceOrder = async () => {
    if (!connected || !publicKey || !market) {
      toast.error('Please connect your wallet')
      return
    }

    if (!shares || !price) {
      toast.error('Please enter shares and price')
      return
    }

    try {
      setOrderLoading(true)
      
      // Mock transaction - replace with actual program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`${orderType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`)
      
      // Reset form
      setShares('')
      setPrice('')
      
      // Refresh data
      await fetchMarketData()
      if (connected && publicKey) {
        await fetchUserPosition()
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order')
    } finally {
      setOrderLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Market not found</h1>
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">
            Return to markets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Markets
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-xl" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {market.category}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      market.status === 'active' ? 'bg-green-100 text-green-800' :
                      market.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.title}</h1>
                  <p className="text-gray-600">{market.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(market.totalVolume)}</div>
                  <div className="text-sm text-gray-500">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{market.participants.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Participants</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.ceil((market.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                  </div>
                  <div className="text-sm text-gray-500">Days Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{(market.yesPrice * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-500">Yes Probability</div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Chart</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">YES</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">${market.yesPrice.toFixed(2)}</div>
                  <div className="text-sm text-green-600">+2.3% (24h)</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">NO</span>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-900">${market.noPrice.toFixed(2)}</div>
                  <div className="text-sm text-red-600">-2.3% (24h)</div>
                </div>
              </div>
              <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-gray-500">Price chart visualization would go here</span>
              </div>
            </div>

            {/* Order Book */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Book</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-3">YES Orders</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                      <span>Price</span>
                      <span>Shares</span>
                      <span>Total</span>
                    </div>
                    {orderBook.yes.asks.map((ask, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 text-sm text-red-600">
                        <span>${ask.price.toFixed(2)}</span>
                        <span>{ask.shares}</span>
                        <span>${ask.total}</span>
                      </div>
                    ))}
                    <div className
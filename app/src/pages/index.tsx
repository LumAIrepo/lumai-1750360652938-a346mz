```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ChevronRightIcon, TrendingUpIcon, UsersIcon, ShieldCheckIcon, ZapIcon } from '@heroicons/react/24/outline'

interface Market {
  id: string
  title: string
  description: string
  yesPrice: number
  noPrice: number
  volume: number
  endDate: string
  category: string
}

interface Stats {
  totalVolume: number
  activeMarkets: number
  totalUsers: number
}

export default function HomePage() {
  const { connected, publicKey } = useWallet()
  const [markets, setMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState<Stats>({ totalVolume: 0, activeMarkets: 0, totalUsers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Mock data for demonstration
        const mockMarkets: Market[] = [
          {
            id: '1',
            title: 'Will Bitcoin reach $100k by end of 2024?',
            description: 'Prediction market for Bitcoin price reaching $100,000 USD',
            yesPrice: 0.65,
            noPrice: 0.35,
            volume: 125000,
            endDate: '2024-12-31',
            category: 'Crypto'
          },
          {
            id: '2',
            title: 'Will Solana surpass Ethereum in TVL?',
            description: 'Total Value Locked comparison between Solana and Ethereum',
            yesPrice: 0.23,
            noPrice: 0.77,
            volume: 89000,
            endDate: '2025-06-30',
            category: 'DeFi'
          },
          {
            id: '3',
            title: 'Next US Presidential Election Winner',
            description: 'Prediction market for the 2024 US Presidential Election',
            yesPrice: 0.52,
            noPrice: 0.48,
            volume: 2100000,
            endDate: '2024-11-05',
            category: 'Politics'
          }
        ]

        const mockStats: Stats = {
          totalVolume: 15600000,
          activeMarkets: 247,
          totalUsers: 12450
        }

        setMarkets(mockMarkets)
        setStats(mockStats)
      } catch (err) {
        setError('Failed to load market data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6366f1]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Data</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white">Zentro</h1>
              <span className="ml-2 px-2 py-1 text-xs font-semibold text-[#6366f1] bg-[#6366f1]/10 rounded-full border border-[#6366f1]/20">
                BETA
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-[#6366f1] hover:!bg-[#5855eb] !rounded-xl !font-medium !transition-all !duration-200" />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Predict the Future,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
              {' '}Earn Rewards
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the world's most advanced prediction market platform built on Solana. 
            Trade on real-world events with lightning-fast transactions and minimal fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-[#6366f1] hover:bg-[#5855eb] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center group">
              Start Trading
              <ChevronRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-gray-600 hover:border-[#06b6d4] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <div className="text-4xl font-bold text-[#06b6d4] mb-2">
                {formatCurrency(stats.totalVolume)}
              </div>
              <div className="text-gray-300 font-medium">Total Volume Traded</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <div className="text-4xl font-bold text-[#8b5cf6] mb-2">
                {formatNumber(stats.activeMarkets)}
              </div>
              <div className="text-gray-300 font-medium">Active Markets</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <div className="text-4xl font-bold text-[#6366f1] mb-2">
                {formatNumber(stats.totalUsers)}+
              </div>
              <div className="text-gray-300 font-medium">Active Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4">Featured Markets</h3>
            <p className="text-gray-300 text-lg">Trade on the most popular prediction markets</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {markets.map((market) => (
              <div
                key={market.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 text-xs font-semibold text-[#06b6d4] bg-[#06b6d4]/10 rounded-full border border-[#06b6d4]/20">
                    {market.category}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Ends {new Date(market.endDate).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-[#6366f1] transition-colors">
                  {market.title}
                </h4>
                <p className="text-gray-300 text-sm mb-6 line-clamp-2">
                  {market.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-lg">
                        ${market.yesPrice.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">YES</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-bold text-lg">
                        ${market.noPrice.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">NO</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {formatCurrency(market.volume)}
                    </div>
                    <div className="text-gray-400 text-xs">Volume</div>
                  </div>
                </div>
                <button className="w-full bg-[#6366f1] hover:bg-[#5855eb] text-white py-3 rounded-xl font-semibold transition-all duration-200">
                  Trade Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4">Why Choose Zentro?</h3>
            <p className="text-gray-300 text-lg">Built for the future of prediction markets</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-xl p-6 mb-4 inline-block">
                <ZapIcon className="h-8 w-8 text-[#6366f1]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Lightning Fast</h4>
              <p className="text-gray-300">Built on Solana for instant transactions and minimal fees</p>
            </div>
            <div className="text-center">
              <div className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl p-6 mb-4 inline-block">
                <ShieldCheckIcon className="h-8 w-8 text-[#8b5cf6]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Secure & Trustless</h4>
              <p className="text-gray-300">Smart contracts ensure fair and transparent outcomes</p>
            </div>
            <div className="text-center">
              <div className="bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-xl p-6 mb-4 inline-block">
                <TrendingUpIcon className="h-8 w-8 text-[#06b6d4]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">High Liquidity</h4>
              <p className="text-gray-300">Deep liquidity pools for better price discovery</p>
            </div>
            <div className="text-center">
              <div className="bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-xl p-6 mb-4 inline-block">
                <UsersIcon className="h-8 w-8 text-[#6366f1]" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Community Driven</h4>
              <p className="text-gray-300">Governed by the community for the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Start Predicting?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of traders making informed predictions on real-world events
          </p>
          {connected ? (
            <div className="space-y-4">
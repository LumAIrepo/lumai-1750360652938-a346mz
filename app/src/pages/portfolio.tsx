```tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3, Wallet, RefreshCw } from 'lucide-react'

interface Position {
  id: string
  marketName: string
  side: 'YES' | 'NO'
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

export default function Portfolio() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [balance, setBalance] = useState(0)
  const [positions, setPositions] = useState<Position[]>([])
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')

  const portfolioStats = useMemo((): PortfolioStats => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
    const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
    const totalPnlPercentage = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0
    const activePositions = positions.length
    const winningPositions = positions.filter(pos => pos.pnl > 0).length
    const winRate = activePositions > 0 ? (winningPositions / activePositions) * 100 : 0

    return {
      totalValue,
      totalPnl,
      totalPnlPercentage,
      activePositions,
      winRate
    }
  }, [positions])

  const fetchBalance = async () => {
    if (!publicKey || !connection) return
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchPositions = async () => {
    if (!publicKey) return
    
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockPositions: Position[] = [
        {
          id: '1',
          marketName: 'Will Bitcoin reach $100k by end of 2024?',
          side: 'YES',
          shares: 150,
          avgPrice: 0.65,
          currentPrice: 0.72,
          value: 108,
          pnl: 10.5,
          pnlPercentage: 10.77
        },
        {
          id: '2',
          marketName: 'Will Ethereum ETF be approved in Q1 2024?',
          side: 'NO',
          shares: 200,
          avgPrice: 0.45,
          currentPrice: 0.38,
          value: 76,
          pnl: -14,
          pnlPercentage: -15.56
        },
        {
          id: '3',
          marketName: 'Will Solana price exceed $200 this year?',
          side: 'YES',
          shares: 100,
          avgPrice: 0.55,
          currentPrice: 0.68,
          value: 68,
          pnl: 13,
          pnlPercentage: 23.64
        }
      ]
      
      setPositions(mockPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchBalance(), fetchPositions()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
      fetchPositions()
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Wallet className="w-16 h-16 text-[#6366f1] mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md">
              Connect your Solana wallet to view your prediction market portfolio
            </p>
            <WalletMultiButton className="!bg-[#6366f1] hover:!bg-[#5855eb] !rounded-xl !font-semibold !px-8 !py-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
            <p className="text-gray-300">Track your prediction market positions</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] hover:bg-[#5855eb] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <WalletMultiButton className="!bg-[#8b5cf6] hover:!bg-[#7c3aed] !rounded-xl" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#6366f1]/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-[#6366f1]" />
              </div>
              <span className="text-sm text-gray-300">Portfolio Value</span>
            </div>
            <div className="text-2xl font-bold text-white">${portfolioStats.totalValue.toFixed(2)}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#06b6d4]/20 rounded-lg">
                <Activity className="w-6 h-6 text-[#06b6d4]" />
              </div>
              <span className="text-sm text-gray-300">Total P&L</span>
            </div>
            <div className={`text-2xl font-bold ${portfolioStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolioStats.totalPnl >= 0 ? '+' : ''}${portfolioStats.totalPnl.toFixed(2)}
            </div>
            <div className={`text-sm ${portfolioStats.totalPnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolioStats.totalPnlPercentage >= 0 ? '+' : ''}{portfolioStats.totalPnlPercentage.toFixed(2)}%
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-lg">
                <PieChart className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <span className="text-sm text-gray-300">Active Positions</span>
            </div>
            <div className="text-2xl font-bold text-white">{portfolioStats.activePositions}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-300">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{portfolioStats.winRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Wallet Balance</h3>
              <p className="text-gray-300">Available SOL for trading</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{balance.toFixed(4)} SOL</div>
              <div className="text-sm text-gray-300">≈ ${(balance * 100).toFixed(2)} USD</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'positions'
                ? 'bg-[#6366f1] text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Active Positions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-[#6366f1] text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Trading History
          </button>
        </div>

        {/* Positions Table */}
        {activeTab === 'positions' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-[#6366f1] animate-spin" />
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Active Positions</h3>
                <p className="text-gray-300">Start trading to see your positions here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Market</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Side</th>
                      <th className="text-right py-4 px-6 text-gray-300 font-medium">Shares</th>
                      <th className="text-right py-4 px-6 text-gray-300 font-medium">Avg Price</th>
                      <th className="text-right py-4 px-6 text-gray-300 font-medium">Current Price</th>
                      <th className="text-right py-4 px-6 text-gray-300 font-medium">Value</th>
                      <th className="text-right py-4 px-6 text-gray-300 font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="py-4 px-6">
                          <div className="text-white font-medium max-w-xs truncate">
                            {position.marketName}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              position.side === 'YES'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {position.side}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-white">{position.shares}</td>
                        <td className="py-4 px-6 text-right text-white">${position.avgPrice.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right text-white">${position.currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right text-white">${position.value.toFixed(2)}</td>
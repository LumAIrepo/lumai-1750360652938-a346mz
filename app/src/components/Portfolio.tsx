import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from 'lucide-react'

interface Position {
  id: string
  marketTitle: string
  position: 'YES' | 'NO'
  shares: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercentage: number
  status: 'active' | 'resolved' | 'closed'
}

interface PortfolioStats {
  totalValue: number
  totalPnl: number
  totalPnlPercentage: number
  activePositions: number
  winRate: number
  totalVolume: number
}

interface PortfolioProps {
  walletAddress?: string
  className?: string
}

export default function Portfolio({ walletAddress, className = '' }: PortfolioProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('positions')

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const mockPositions: Position[] = [
          {
            id: '1',
            marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
            position: 'YES',
            shares: 150,
            avgPrice: 0.65,
            currentPrice: 0.72,
            value: 108,
            pnl: 10.5,
            pnlPercentage: 10.77,
            status: 'active'
          },
          {
            id: '2',
            marketTitle: 'Will Ethereum 2.0 launch successfully?',
            position: 'NO',
            shares: 200,
            avgPrice: 0.35,
            currentPrice: 0.28,
            value: 56,
            pnl: -14,
            pnlPercentage: -20,
            status: 'active'
          },
          {
            id: '3',
            marketTitle: 'Will Tesla stock hit $300 this quarter?',
            position: 'YES',
            shares: 100,
            avgPrice: 0.45,
            currentPrice: 0.85,
            value: 85,
            pnl: 40,
            pnlPercentage: 88.89,
            status: 'resolved'
          }
        ]

        const mockStats: PortfolioStats = {
          totalValue: 249,
          totalPnl: 36.5,
          totalPnlPercentage: 17.18,
          activePositions: 2,
          winRate: 66.7,
          totalVolume: 1250
        }

        setPositions(mockPositions)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [walletAddress])

  if (!walletAddress) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <PieChart className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 text-center max-w-md">
          Connect your Solana wallet to view your prediction market portfolio and track your positions.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>
                ${stats.totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Portfolio value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {stats.totalPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPnlPercentage >= 0 ? '+' : ''}{stats.totalPnlPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
                {stats.activePositions}
              </div>
              <p className="text-xs text-muted-foreground">
                Open positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#06b6d4' }}>
                {stats.winRate.toFixed(1)}%
              </div>
              <Progress value={stats.winRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>
                Track your active and resolved prediction market positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No positions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: '0.75rem' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 line-clamp-1">
                            {position.marketTitle}
                          </h4>
                          <Badge
                            variant={position.position === 'YES' ? 'default' : 'secondary'}
                            style={{
                              backgroundColor: position.position === 'YES' ? '#6366f1' : '#8b5cf6',
                              color: 'white'
                            }}
                          >
                            {position.position}
                          </Badge>
                          <Badge
                            variant={position.status === 'active' ? 'outline' : 'secondary'}
                          >
                            {position.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{position.shares} shares</span>
                          <span>Avg: ${position.avgPrice.toFixed(2)}</span>
                          <span>Current: ${position.currentPrice.toFixed(2)}</span>
                          <span>Value: ${position.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </div>
                        <div className={`text-sm ${position.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading History</CardTitle>
              <CardDescription>
                View your complete trading history and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Trading history coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```
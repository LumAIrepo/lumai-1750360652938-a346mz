import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OddsData {
  id: string
  outcome: string
  odds: number
  probability: number
  volume: number
  change24h: number
  isActive: boolean
}

interface OddsDisplayProps {
  marketId: string
  outcomes: OddsData[]
  isLoading?: boolean
  onOddsSelect?: (outcome: OddsData) => void
  showVolume?: boolean
  showChange?: boolean
  compact?: boolean
  className?: string
}

export default function OddsDisplay({
  marketId,
  outcomes,
  isLoading = false,
  onOddsSelect,
  showVolume = true,
  showChange = true,
  compact = false,
  className
}: OddsDisplayProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [animatingOdds, setAnimatingOdds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newAnimatingOdds = new Set<string>()
    outcomes.forEach(outcome => {
      if (outcome.change24h !== 0) {
        newAnimatingOdds.add(outcome.id)
      }
    })
    setAnimatingOdds(newAnimatingOdds)

    const timer = setTimeout(() => {
      setAnimatingOdds(new Set())
    }, 1000)

    return () => clearTimeout(timer)
  }, [outcomes])

  const handleOddsClick = (outcome: OddsData) => {
    if (!outcome.isActive) return
    setSelectedOutcome(outcome.id)
    onOddsSelect?.(outcome)
  }

  const formatOdds = (odds: number): string => {
    if (odds >= 2) {
      return `+${Math.round((odds - 1) * 100)}`
    } else {
      return `-${Math.round(100 / (odds - 1))}`
    }
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    }
    return `$${volume.toFixed(0)}`
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-400'
  }

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Market Odds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {outcomes.map((outcome) => (
          <Button
            key={outcome.id}
            variant={selectedOutcome === outcome.id ? 'default' : 'outline'}
            size="sm"
            disabled={!outcome.isActive}
            onClick={() => handleOddsClick(outcome)}
            className={cn(
              'transition-all duration-200',
              selectedOutcome === outcome.id && 'bg-[#6366f1] hover:bg-[#5855eb]',
              animatingOdds.has(outcome.id) && 'animate-pulse',
              !outcome.isActive && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="font-medium">{outcome.outcome}</span>
            <Badge variant="secondary" className="ml-2">
              {formatOdds(outcome.odds)}
            </Badge>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Market Odds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {outcomes.map((outcome) => (
          <div
            key={outcome.id}
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer',
              selectedOutcome === outcome.id
                ? 'border-[#6366f1] bg-[#6366f1]/5'
                : 'border-gray-200 hover:border-[#6366f1]/50',
              !outcome.isActive && 'opacity-50 cursor-not-allowed',
              animatingOdds.has(outcome.id) && 'animate-pulse'
            )}
            onClick={() => handleOddsClick(outcome)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {outcome.outcome}
                    </h3>
                    {!outcome.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Probability: {(outcome.probability * 100).toFixed(1)}%
                    </span>
                    {showVolume && (
                      <span>Volume: {formatVolume(outcome.volume)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {showChange && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(outcome.change24h)}
                      <span
                        className={cn(
                          'text-sm font-medium',
                          getTrendColor(outcome.change24h)
                        )}
                      >
                        {outcome.change24h > 0 ? '+' : ''}
                        {outcome.change24h.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#6366f1]">
                      {formatOdds(outcome.odds)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {outcome.odds.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 h-1 bg-[#6366f1] transition-all duration-300"
              style={{ width: `${outcome.probability * 100}%` }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```
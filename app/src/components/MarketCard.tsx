import React from "react"
```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  totalBettors: number
  yesPrice: number
  noPrice: number
  yesVolume: number
  noVolume: number
  isResolved?: boolean
  outcome?: 'yes' | 'no'
  createdBy: string
  imageUrl?: string
  onBet?: (marketId: string, side: 'yes' | 'no') => void
  onViewDetails?: (marketId: string) => void
}

export default function MarketCard({
  id,
  title,
  description,
  category,
  endDate,
  totalVolume,
  totalBettors,
  yesPrice,
  noPrice,
  yesVolume,
  noVolume,
  isResolved = false,
  outcome,
  createdBy,
  imageUrl,
  onBet,
  onViewDetails
}: MarketCardProps) {
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  
  const totalVolumeForSides = yesVolume + noVolume
  const yesPercentage = totalVolumeForSides > 0 ? (yesVolume / totalVolumeForSides) * 100 : 50
  const noPercentage = totalVolumeForSides > 0 ? (noVolume / totalVolumeForSides) * 100 : 50
  
  const isExpired = new Date() > endDate
  const timeRemaining = endDate.getTime() - new Date().getTime()
  const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)))
  
  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`
    return `$${volume.toFixed(0)}`
  }

  const handleBet = (side: 'yes' | 'no') => {
    if (isResolved || isExpired) return
    setSelectedSide(side)
    onBet?.(id, side)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      politics: 'bg-red-100 text-red-800 border-red-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      crypto: 'bg-orange-100 text-orange-800 border-orange-200',
      entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
      technology: 'bg-blue-100 text-blue-800 border-blue-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category.toLowerCase() as keyof typeof colors] || colors.default
  }

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge 
              variant="outline" 
              className={cn("mb-2 text-xs font-medium", getCategoryColor(category))}
            >
              {category}
            </Badge>
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
              {title}
            </CardTitle>
          </div>
          {imageUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            {isResolved ? (
              <span className="font-medium text-gray-900">
                Resolved: {outcome === 'yes' ? 'YES' : 'NO'}
              </span>
            ) : isExpired ? (
              <span className="text-red-600 font-medium">Expired</span>
            ) : (
              <span>{daysRemaining}d remaining</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">by {createdBy}</div>
          </div>
        </div>

        {/* Volume and Bettors */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>{formatVolume(totalVolume)} volume</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{totalBettors} bettors</span>
          </div>
        </div>

        {/* Price Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Market Probability</span>
            <span className="font-medium text-gray-900">{yesPercentage.toFixed(0)}% YES</span>
          </div>
          <Progress 
            value={yesPercentage} 
            className="h-2"
            style={{
              '--progress-background': '#6366f1',
              '--progress-foreground': '#e5e7eb'
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>NO {noPercentage.toFixed(0)}%</span>
            <span>YES {yesPercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Betting Options */}
        {!isResolved && !isExpired && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedSide === 'yes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBet('yes')}
              className={cn(
                "flex items-center gap-1 transition-all",
                selectedSide === 'yes' 
                  ? "bg-[#6366f1] hover:bg-[#5855eb] text-white" 
                  : "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              )}
            >
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">YES {formatPrice(yesPrice)}</span>
            </Button>
            <Button
              variant={selectedSide === 'no' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBet('no')}
              className={cn(
                "flex items-center gap-1 transition-all",
                selectedSide === 'no' 
                  ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white" 
                  : "hover:bg-red-50 hover:border-red-300 hover:text-red-700"
              )}
            >
              <TrendingDown className="w-3 h-3" />
              <span className="text-xs">NO {formatPrice(noPrice)}</span>
            </Button>
          </div>
        )}

        {/* Resolved Outcome */}
        {isResolved && outcome && (
          <div className={cn(
            "p-3 rounded-lg text-center font-medium",
            outcome === 'yes' 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          )}>
            Market Resolved: {outcome.toUpperCase()}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(id)}
          className="w-full text-[#06b6d4] hover:text-[#0891b2] hover:bg-cyan-50"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
```
import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Activity } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'bet' | 'market_created' | 'market_resolved' | 'comment' | 'follow'
  user: {
    id: string
    name: string
    avatar?: string
    username: string
  }
  timestamp: Date
  market?: {
    id: string
    title: string
    category: string
  }
  amount?: number
  outcome?: 'yes' | 'no'
  description: string
}

interface ActivityFeedProps {
  limit?: number
  showHeader?: boolean
  className?: string
  userId?: string
  marketId?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'bet',
    user: {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice_j',
      avatar: '/avatars/alice.jpg'
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    market: {
      id: '1',
      title: 'Will Bitcoin reach $100k by end of 2024?',
      category: 'Crypto'
    },
    amount: 250,
    outcome: 'yes',
    description: 'placed a $250 bet on YES'
  },
  {
    id: '2',
    type: 'market_created',
    user: {
      id: '2',
      name: 'Bob Smith',
      username: 'bob_smith',
      avatar: '/avatars/bob.jpg'
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    market: {
      id: '2',
      title: 'Will Tesla stock hit $300 this quarter?',
      category: 'Stocks'
    },
    description: 'created a new prediction market'
  },
  {
    id: '3',
    type: 'bet',
    user: {
      id: '3',
      name: 'Carol Davis',
      username: 'carol_d',
      avatar: '/avatars/carol.jpg'
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    market: {
      id: '3',
      title: 'Will the next iPhone have USB-C?',
      category: 'Tech'
    },
    amount: 100,
    outcome: 'no',
    description: 'placed a $100 bet on NO'
  },
  {
    id: '4',
    type: 'market_resolved',
    user: {
      id: '4',
      name: 'David Wilson',
      username: 'david_w',
      avatar: '/avatars/david.jpg'
    },
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    market: {
      id: '4',
      title: 'Will it rain tomorrow in NYC?',
      category: 'Weather'
    },
    description: 'market resolved as YES'
  },
  {
    id: '5',
    type: 'comment',
    user: {
      id: '5',
      name: 'Eva Brown',
      username: 'eva_b',
      avatar: '/avatars/eva.jpg'
    },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    market: {
      id: '1',
      title: 'Will Bitcoin reach $100k by end of 2024?',
      category: 'Crypto'
    },
    description: 'commented on the market discussion'
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'bet':
      return <DollarSign className="h-4 w-4" />
    case 'market_created':
      return <TrendingUp className="h-4 w-4" />
    case 'market_resolved':
      return <Activity className="h-4 w-4" />
    case 'comment':
      return <Users className="h-4 w-4" />
    case 'follow':
      return <Users className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'bet':
      return 'text-[#06b6d4]'
    case 'market_created':
      return 'text-[#6366f1]'
    case 'market_resolved':
      return 'text-[#8b5cf6]'
    case 'comment':
      return 'text-gray-600'
    case 'follow':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }
}

const ActivityFeedSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

export default function ActivityFeed({
  limit = 10,
  showHeader = true,
  className = '',
  userId,
  marketId
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        let filteredActivities = mockActivities
        
        if (userId) {
          filteredActivities = filteredActivities.filter(activity => activity.user.id === userId)
        }
        
        if (marketId) {
          filteredActivities = filteredActivities.filter(activity => activity.market?.id === marketId)
        }
        
        setActivities(filteredActivities.slice(0, limit))
      } catch (err) {
        setError('Failed to load activity feed')
        console.error('Error fetching activities:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [limit, userId, marketId])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    // Trigger refetch
    setTimeout(() => {
      setActivities(mockActivities.slice(0, limit))
      setIsLoading(false)
    }, 1000)
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Failed to load activity feed</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border border-gray-200 ${className}`} style={{ borderRadius: '0.75rem' }}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#6366f1] font-inter">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {isLoading ? (
          <ActivityFeedSkeleton />
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-1">No activity yet</p>
            <p className="text-sm">Activity will appear here as users interact with markets</p>
          </div>
        ) : (
          <ScrollArea className="h-full max-h-96">
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                    index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="bg-[#6366f1] text-white font-inter">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 font-inter">
                            {activity.user.name}
                          </span>
                          <span className="text-gray-500 text-sm">
                            @{activity.user.username}
                          </span>
                          <div className={`${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2 font-inter">
                          {activity.description}
                          {activity.market && (
                            <span className="block mt-1 text-[#6366f1] hover:text-[#8b5cf6] cursor-pointer">
                              "{activity.market.title}"
                            </span>
                          )}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                          
                          {activity.market && (
                            <>
                              <span>•</span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                {activity.market.category}
                              </Badge>
                            </>
                          )}
                          
                          {activity.amount && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-[#06b6d4]">
                                ${activity.amount}
                              </span>
                            </>
                          )}
                          
                          {activity.outcome && (
                            <>
                              <span>•</span>
                              <Badge 
                                variant={activity.outcome === 'yes' ? 'default' : 'destructive'}
                                className={`text-xs ${
                                  activity.outcome === 'yes' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {activity.outcome === 'yes' ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {activity.outcome.toUpperCase()}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
```
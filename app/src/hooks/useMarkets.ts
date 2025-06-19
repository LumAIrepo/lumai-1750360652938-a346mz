import React from "react"
```typescript
import { useState, useEffect } from 'react'

export interface Market {
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
  resolved: boolean
  outcome?: boolean
  createdAt: Date
  creator: string
  tags: string[]
}

export interface MarketFilters {
  category?: string
  resolved?: boolean
  search?: string
  sortBy?: 'volume' | 'endDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
  filters: MarketFilters
  setFilters: (filters: MarketFilters) => void
}

const MARKETS_PER_PAGE = 20

export function useMarkets(initialFilters: MarketFilters = {}): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<MarketFilters>(initialFilters)

  const fetchMarkets = async (pageNum: number = 1, currentFilters: MarketFilters = filters, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call - replace with actual API endpoint
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: MARKETS_PER_PAGE.toString(),
        ...(currentFilters.category && { category: currentFilters.category }),
        ...(currentFilters.resolved !== undefined && { resolved: currentFilters.resolved.toString() }),
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.sortBy && { sortBy: currentFilters.sortBy }),
        ...(currentFilters.sortOrder && { sortOrder: currentFilters.sortOrder }),
      })

      // Mock data - replace with actual fetch
      const mockMarkets: Market[] = Array.from({ length: MARKETS_PER_PAGE }, (_, i) => ({
        id: `market-${pageNum}-${i}`,
        title: `Prediction Market ${pageNum}-${i}`,
        description: `Description for market ${pageNum}-${i}`,
        category: ['Sports', 'Politics', 'Crypto', 'Entertainment'][i % 4],
        endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        totalVolume: Math.floor(Math.random() * 100000),
        yesPrice: Math.random() * 100,
        noPrice: Math.random() * 100,
        yesShares: Math.floor(Math.random() * 10000),
        noShares: Math.floor(Math.random() * 10000),
        resolved: Math.random() > 0.8,
        outcome: Math.random() > 0.5 ? true : undefined,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        creator: `creator-${i}`,
        tags: [`tag${i}`, `tag${i + 1}`],
      }))

      const filteredMarkets = mockMarkets.filter(market => {
        if (currentFilters.category && market.category !== currentFilters.category) return false
        if (currentFilters.resolved !== undefined && market.resolved !== currentFilters.resolved) return false
        if (currentFilters.search && !market.title.toLowerCase().includes(currentFilters.search.toLowerCase())) return false
        return true
      })

      const sortedMarkets = [...filteredMarkets].sort((a, b) => {
        const { sortBy = 'createdAt', sortOrder = 'desc' } = currentFilters
        let comparison = 0

        switch (sortBy) {
          case 'volume':
            comparison = a.totalVolume - b.totalVolume
            break
          case 'endDate':
            comparison = a.endDate.getTime() - b.endDate.getTime()
            break
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime()
            break
          default:
            comparison = 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
      })

      if (append) {
        setMarkets(prev => [...prev, ...sortedMarkets])
      } else {
        setMarkets(sortedMarkets)
      }

      setTotalCount(filteredMarkets.length + (pageNum - 1) * MARKETS_PER_PAGE)
      setHasMore(sortedMarkets.length === MARKETS_PER_PAGE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMarkets(nextPage, filters, true)
    }
  }

  const refetch = () => {
    setPage(1)
    fetchMarkets(1, filters, false)
  }

  const handleSetFilters = (newFilters: MarketFilters) => {
    setFilters(newFilters)
    setPage(1)
    fetchMarkets(1, newFilters, false)
  }

  useEffect(() => {
    fetchMarkets(1, filters, false)
  }, [])

  return {
    markets,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refetch,
    filters,
    setFilters: handleSetFilters,
  }
}
```
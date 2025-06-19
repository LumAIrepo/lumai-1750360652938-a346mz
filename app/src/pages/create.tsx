```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Calendar, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface MarketCategory {
  id: string
  name: string
  icon: React.ReactNode
}

interface CreateMarketForm {
  title: string
  description: string
  category: string
  endDate: string
  endTime: string
  outcomes: string[]
  initialLiquidity: number
}

const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'sports', name: 'Sports', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'politics', name: 'Politics', icon: <Calendar className="w-5 h-5" /> },
  { id: 'crypto', name: 'Cryptocurrency', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'entertainment', name: 'Entertainment', icon: <Clock className="w-5 h-5" /> },
  { id: 'technology', name: 'Technology', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'other', name: 'Other', icon: <AlertCircle className="w-5 h-5" /> }
]

export default function CreateMarketPage() {
  const { connected, publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  
  const [form, setForm] = useState<CreateMarketForm>({
    title: '',
    description: '',
    category: '',
    endDate: '',
    endTime: '',
    outcomes: ['', ''],
    initialLiquidity: 1
  })

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey || !connection) return
    
    try {
      setIsLoading(true)
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (err) {
      console.error('Error fetching balance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateMarketForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...form.outcomes]
    newOutcomes[index] = value
    setForm(prev => ({
      ...prev,
      outcomes: newOutcomes
    }))
    setError(null)
  }

  const addOutcome = () => {
    if (form.outcomes.length < 10) {
      setForm(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, '']
      }))
    }
  }

  const removeOutcome = (index: number) => {
    if (form.outcomes.length > 2) {
      const newOutcomes = form.outcomes.filter((_, i) => i !== index)
      setForm(prev => ({
        ...prev,
        outcomes: newOutcomes
      }))
    }
  }

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Market title is required'
    if (!form.description.trim()) return 'Market description is required'
    if (!form.category) return 'Please select a category'
    if (!form.endDate) return 'End date is required'
    if (!form.endTime) return 'End time is required'
    if (form.outcomes.some(outcome => !outcome.trim())) return 'All outcomes must be filled'
    if (form.outcomes.length < 2) return 'At least 2 outcomes are required'
    if (form.initialLiquidity < 0.1) return 'Minimum initial liquidity is 0.1 SOL'
    
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`)
    if (endDateTime <= new Date()) return 'End date must be in the future'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (balance === null || balance < form.initialLiquidity) {
      setError('Insufficient SOL balance')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create transaction for market creation
      const transaction = new Transaction()
      
      // Add instruction to transfer initial liquidity
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('11111111111111111111111111111112'), // System program
          lamports: form.initialLiquidity * LAMPORTS_PER_SOL
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed')
      
      setSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setForm({
          title: '',
          description: '',
          category: '',
          endDate: '',
          endTime: '',
          outcomes: ['', ''],
          initialLiquidity: 1
        })
        setSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error('Error creating market:', err)
      setError('Failed to create market. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create Prediction Market
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Launch your own prediction market and let the community forecast the future
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <WalletMultiButton 
                style={{
                  backgroundColor: '#6366f1',
                  borderRadius: '0.75rem',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              {connected && balance !== null && (
                <div className="text-sm text-slate-600">
                  Balance: {balance.toFixed(4)} SOL
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Market created successfully!</span>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Basic Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Market Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide detailed information about the market conditions, resolution criteria, and any relevant context..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MARKET_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleInputChange('category', category.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          form.category === category.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {category.icon}
                        <span className="font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market Timeline */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Market Timeline
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      min={getTomorrowDate()}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>
              </div>

              {/* Outcomes */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Possible Outcomes
                  </h2>
                  <button
                    type="button"
                    onClick={addOutcome}
                    disabled={form.outcomes.length >= 10}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Add Outcome
                  </button>
                </div>
                
                <div className="space-y-4">
                  {form.outcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => handleOutcomeChange(index, e.target.value)}
                        placeholder={`Outcome ${index + 1} (e.g., ${index === 0 ? 'Yes' : 'No'})`}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        maxLength={100}
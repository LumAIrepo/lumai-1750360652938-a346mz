import React from "react"
```typescript
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Program ID for the prediction market smart contract
export const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

// RPC endpoint configuration
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Connection instance
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Market account structure
export interface MarketAccount {
  authority: PublicKey;
  title: string;
  description: string;
  endTime: BN;
  totalVolume: BN;
  yesShares: BN;
  noShares: BN;
  resolved: boolean;
  outcome: boolean | null;
  bump: number;
}

// Position account structure
export interface PositionAccount {
  user: PublicKey;
  market: PublicKey;
  yesShares: BN;
  noShares: BN;
  bump: number;
}

// Program interface
export interface PredictionMarketProgram {
  createMarket: (
    title: string,
    description: string,
    endTime: number
  ) => Promise<string>;
  
  buyShares: (
    marketPubkey: PublicKey,
    amount: number,
    prediction: boolean
  ) => Promise<string>;
  
  sellShares: (
    marketPubkey: PublicKey,
    amount: number,
    prediction: boolean
  ) => Promise<string>;
  
  resolveMarket: (
    marketPubkey: PublicKey,
    outcome: boolean
  ) => Promise<string>;
  
  claimWinnings: (
    marketPubkey: PublicKey
  ) => Promise<string>;
}

// Get program instance
export const getProgram = (wallet: WalletContextState): Program | null => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    return null;
  }

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  );

  // Mock IDL - replace with actual IDL
  const idl: Idl = {
    version: '0.1.0',
    name: 'prediction_market',
    instructions: [],
    accounts: [],
    types: [],
    metadata: {
      address: PROGRAM_ID.toString()
    }
  };

  return new Program(idl, PROGRAM_ID, provider);
};

// Derive market PDA
export const getMarketPDA = (authority: PublicKey, seed: string): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('market'),
      authority.toBuffer(),
      Buffer.from(seed)
    ],
    PROGRAM_ID
  );
};

// Derive position PDA
export const getPositionPDA = (user: PublicKey, market: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      user.toBuffer(),
      market.toBuffer()
    ],
    PROGRAM_ID
  );
};

// Create market transaction
export const createMarketTransaction = async (
  wallet: WalletContextState,
  title: string,
  description: string,
  endTime: number
): Promise<Transaction | null> => {
  if (!wallet.publicKey) return null;

  const program = getProgram(wallet);
  if (!program) return null;

  const seed = Date.now().toString();
  const [marketPDA] = getMarketPDA(wallet.publicKey, seed);

  const transaction = new Transaction();
  
  // Add create market instruction (mock implementation)
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: marketPDA,
      lamports: LAMPORTS_PER_SOL * 0.01,
      space: 1000,
      programId: PROGRAM_ID
    })
  );

  return transaction;
};

// Buy shares transaction
export const buySharesTransaction = async (
  wallet: WalletContextState,
  marketPubkey: PublicKey,
  amount: number,
  prediction: boolean
): Promise<Transaction | null> => {
  if (!wallet.publicKey) return null;

  const program = getProgram(wallet);
  if (!program) return null;

  const [positionPDA] = getPositionPDA(wallet.publicKey, marketPubkey);

  const transaction = new Transaction();
  
  // Add buy shares instruction (mock implementation)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: marketPubkey,
      lamports: amount * LAMPORTS_PER_SOL
    })
  );

  return transaction;
};

// Sell shares transaction
export const sellSharesTransaction = async (
  wallet: WalletContextState,
  marketPubkey: PublicKey,
  amount: number,
  prediction: boolean
): Promise<Transaction | null> => {
  if (!wallet.publicKey) return null;

  const program = getProgram(wallet);
  if (!program) return null;

  const [positionPDA] = getPositionPDA(wallet.publicKey, marketPubkey);

  const transaction = new Transaction();
  
  // Add sell shares instruction (mock implementation)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: marketPubkey,
      toPubkey: wallet.publicKey,
      lamports: amount * LAMPORTS_PER_SOL
    })
  );

  return transaction;
};

// Resolve market transaction
export const resolveMarketTransaction = async (
  wallet: WalletContextState,
  marketPubkey: PublicKey,
  outcome: boolean
): Promise<Transaction | null> => {
  if (!wallet.publicKey) return null;

  const program = getProgram(wallet);
  if (!program) return null;

  const transaction = new Transaction();
  
  // Add resolve market instruction (mock implementation)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: marketPubkey,
      lamports: 0
    })
  );

  return transaction;
};

// Claim winnings transaction
export const claimWinningsTransaction = async (
  wallet: WalletContextState,
  marketPubkey: PublicKey
): Promise<Transaction | null> => {
  if (!wallet.publicKey) return null;

  const program = getProgram(wallet);
  if (!program) return null;

  const [positionPDA] = getPositionPDA(wallet.publicKey, marketPubkey);

  const transaction = new Transaction();
  
  // Add claim winnings instruction (mock implementation)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: marketPubkey,
      toPubkey: wallet.publicKey,
      lamports: 0
    })
  );

  return transaction;
};

// Fetch market account
export const fetchMarketAccount = async (marketPubkey: PublicKey): Promise<MarketAccount | null> => {
  try {
    const accountInfo = await connection.getAccountInfo(marketPubkey);
    if (!accountInfo) return null;

    // Mock deserialization - replace with actual account parsing
    return {
      authority: new PublicKey('11111111111111111111111111111111'),
      title: 'Mock Market',
      description: 'Mock Description',
      endTime: new BN(Date.now() + 86400000),
      totalVolume: new BN(0),
      yesShares: new BN(0),
      noShares: new BN(0),
      resolved: false,
      outcome: null,
      bump: 255
    };
  } catch (error) {
    console.error('Error fetching market account:', error);
    return null;
  }
};

// Fetch position account
export const fetchPositionAccount = async (
  user: PublicKey,
  market: PublicKey
): Promise<PositionAccount | null> => {
  try {
    const [positionPDA] = getPositionPDA(user, market);
    const accountInfo = await connection.getAccountInfo(positionPDA);
    if (!accountInfo) return null;

    // Mock deserialization - replace with actual account parsing
    return {
      user,
      market,
      yesShares: new BN(0),
      noShares: new BN(0),
      bump: 255
    };
  } catch (error) {
    console.error('Error fetching position account:', error);
    return null;
  }
};

// Calculate share price
export const calculateSharePrice = (yesShares: BN, noShares: BN, prediction: boolean): number => {
  const totalShares = yesShares.add(noShares);
  if (totalShares.isZero()) return 0.5;

  const targetShares = prediction ? yesShares : noShares;
  return targetShares.toNumber() / totalShares.toNumber();
};

// Format SOL amount
export const formatSOL = (lamports: number | BN): string => {
  const amount = typeof lamports === 'number' ? lamports : lamports.toNumber();
  return (amount / LAMPORTS_PER_SOL).toFixed(4);
};

// Validate market parameters
export const validateMarketParams = (
  title: string,
  description: string,
  endTime: number
): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (title.length > 100) {
    return { valid: false, error: 'Title must be less than 100 characters' };
  }
  
  if (!description.trim()) {
    return { valid: false, error: 'Description is required' };
  }
  
  if (description.length > 500) {
    return { valid: false, error: 'Description must be less than 500 characters' };
  }
  
  if (endTime <= Date.now()) {
    return { valid: false, error: 'End time must be in the future' };
  }
  
  return { valid: true };
};

// Send and confirm transaction
export const sendAndConfirmTransaction = async (
  wallet: WalletContextState,
  transaction: Transaction
): Promise<string> => {
  if (!wallet.signTransaction || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  const signedTransaction = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
};
```
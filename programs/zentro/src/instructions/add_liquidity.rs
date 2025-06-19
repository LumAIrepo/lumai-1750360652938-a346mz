```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + LiquidityPosition::INIT_SPACE,
        seeds = [b"liquidity", market.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub liquidity_position: Account<'info, LiquidityPosition>,

    #[account(
        mut,
        constraint = user_token_account.mint == market.token_mint,
        constraint = user_token_account.owner == user.key(),
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump,
        constraint = market_vault.mint == market.token_mint,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, SystemProgram>,
}

impl<'info> AddLiquidity<'info> {
    pub fn add_liquidity(&mut self, amount: u64, bumps: &AddLiquidityBumps) -> Result<()> {
        require!(amount > 0, ZentroError::InvalidAmount);
        require!(self.market.is_active, ZentroError::MarketNotActive);

        // Calculate liquidity shares to mint
        let total_liquidity = self.market.total_liquidity;
        let vault_balance = self.market_vault.amount;

        let shares_to_mint = if total_liquidity == 0 {
            // First liquidity provider gets shares equal to amount
            amount
        } else {
            // Calculate proportional shares
            (amount as u128)
                .checked_mul(total_liquidity as u128)
                .ok_or(ZentroError::MathOverflow)?
                .checked_div(vault_balance as u128)
                .ok_or(ZentroError::MathOverflow)? as u64
        };

        require!(shares_to_mint > 0, ZentroError::InsufficientLiquidity);

        // Transfer tokens from user to market vault
        let transfer_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_token_account.to_account_info(),
                to: self.market_vault.to_account_info(),
                authority: self.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Update liquidity position
        if self.liquidity_position.market == Pubkey::default() {
            // Initialize new position
            self.liquidity_position.market = self.market.key();
            self.liquidity_position.owner = self.user.key();
            self.liquidity_position.shares = shares_to_mint;
            self.liquidity_position.bump = bumps.liquidity_position;
        } else {
            // Add to existing position
            self.liquidity_position.shares = self
                .liquidity_position
                .shares
                .checked_add(shares_to_mint)
                .ok_or(ZentroError::MathOverflow)?;
        }

        // Update market state
        self.market.total_liquidity = self
            .market
            .total_liquidity
            .checked_add(shares_to_mint)
            .ok_or(ZentroError::MathOverflow)?;

        emit!(LiquidityAddedEvent {
            market: self.market.key(),
            user: self.user.key(),
            amount,
            shares: shares_to_mint,
            total_liquidity: self.market.total_liquidity,
        });

        Ok(())
    }
}

#[event]
pub struct LiquidityAddedEvent {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub shares: u64,
    pub total_liquidity: u64,
}
```
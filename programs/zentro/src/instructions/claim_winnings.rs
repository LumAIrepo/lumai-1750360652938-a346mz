```rust
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.is_resolved @ ZentroError::MarketNotResolved,
        constraint = !market.is_closed @ ZentroError::MarketClosed
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [
            b"position",
            market.key().as_ref(),
            user.key().as_ref()
        ],
        bump = position.bump,
        constraint = position.market == market.key() @ ZentroError::InvalidMarket,
        constraint = position.user == user.key() @ ZentroError::InvalidUser,
        constraint = !position.claimed @ ZentroError::AlreadyClaimed
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the vault's token account
    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key() @ ZentroError::InvalidVaultTokenAccount
    )]
    pub vault_token_account: AccountInfo<'info>,

    /// CHECK: This is the user's token account
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ ZentroError::InvalidUserTokenAccount
    )]
    pub user_token_account: AccountInfo<'info>,

    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let vault = &ctx.accounts.vault;

    // Verify the position is on the winning outcome
    require!(
        position.outcome == market.winning_outcome.unwrap(),
        ZentroError::NotWinningPosition
    );

    // Calculate winnings based on position shares and market resolution
    let total_winning_shares = match market.winning_outcome.unwrap() {
        0 => market.total_yes_shares,
        1 => market.total_no_shares,
        _ => return Err(ZentroError::InvalidOutcome.into()),
    };

    require!(total_winning_shares > 0, ZentroError::NoWinningShares);

    // Calculate user's share of the total pool
    let user_share_ratio = position.shares as u128 * 1_000_000 / total_winning_shares as u128;
    let winnings = (market.total_pool as u128 * user_share_ratio / 1_000_000) as u64;

    require!(winnings > 0, ZentroError::NoWinningsToclaim);
    require!(vault.balance >= winnings, ZentroError::InsufficientVaultBalance);

    // Transfer winnings from vault to user
    let market_key = market.key();
    let vault_seeds = &[
        b"vault",
        market_key.as_ref(),
        &[vault.bump]
    ];
    let vault_signer = &[&vault_seeds[..]];

    let transfer_instruction = anchor_spl::token::Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: vault.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_instruction,
        vault_signer,
    );

    anchor_spl::token::transfer(cpi_ctx, winnings)?;

    // Update vault balance
    let vault = &mut ctx.accounts.vault;
    vault.balance = vault.balance.checked_sub(winnings)
        .ok_or(ZentroError::ArithmeticOverflow)?;

    // Mark position as claimed
    position.claimed = true;
    position.winnings_claimed = winnings;

    // Update market statistics
    market.total_claimed = market.total_claimed.checked_add(winnings)
        .ok_or(ZentroError::ArithmeticOverflow)?;

    emit!(WinningsClaimedEvent {
        market: market.key(),
        user: ctx.accounts.user.key(),
        position: position.key(),
        amount: winnings,
        outcome: position.outcome,
        shares: position.shares,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "User {} claimed {} tokens for {} shares on outcome {} in market {}",
        ctx.accounts.user.key(),
        winnings,
        position.shares,
        position.outcome,
        market.key()
    );

    Ok(())
}

#[event]
pub struct WinningsClaimedEvent {
    pub market: Pubkey,
    pub user: Pubkey,
    pub position: Pubkey,
    pub amount: u64,
    pub outcome: u8,
    pub shares: u64,
    pub timestamp: i64,
}
```
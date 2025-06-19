```rust
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = authority @ ZentroError::Unauthorized,
        constraint = market.status == MarketStatus::Active @ ZentroError::MarketNotActive
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn resolve_market(
    ctx: Context<ResolveMarket>,
    outcome: u8,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    
    require!(
        outcome < market.outcomes.len() as u8,
        ZentroError::InvalidOutcome
    );
    
    require!(
        Clock::get()?.unix_timestamp >= market.end_time,
        ZentroError::MarketNotEnded
    );
    
    market.status = MarketStatus::Resolved;
    market.winning_outcome = Some(outcome);
    market.resolved_at = Clock::get()?.unix_timestamp;
    
    emit!(MarketResolvedEvent {
        market: market.key(),
        outcome,
        resolved_at: market.resolved_at,
    });
    
    Ok(())
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub outcome: u8,
    pub resolved_at: i64,
}
```
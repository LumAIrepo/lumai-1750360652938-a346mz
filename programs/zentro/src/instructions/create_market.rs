```rust
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_market(
    ctx: Context<CreateMarket>,
    market_id: String,
    title: String,
    description: String,
    end_time: i64,
    category: String,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;
    
    require!(
        end_time > clock.unix_timestamp,
        ZentroError::InvalidEndTime
    );
    
    require!(
        title.len() <= 200,
        ZentroError::TitleTooLong
    );
    
    require!(
        description.len() <= 1000,
        ZentroError::DescriptionTooLong
    );
    
    require!(
        market_id.len() <= 50,
        ZentroError::MarketIdTooLong
    );
    
    market.market_id = market_id;
    market.title = title;
    market.description = description;
    market.authority = ctx.accounts.authority.key();
    market.created_at = clock.unix_timestamp;
    market.end_time = end_time;
    market.category = category;
    market.status = MarketStatus::Active;
    market.total_volume = 0;
    market.yes_shares = 0;
    market.no_shares = 0;
    market.yes_price = 50; // Initial price at 50%
    market.no_price = 50;  // Initial price at 50%
    market.bump = ctx.bumps.market;
    
    emit!(MarketCreated {
        market: market.key(),
        market_id: market.market_id.clone(),
        title: market.title.clone(),
        authority: market.authority,
        end_time: market.end_time,
        created_at: market.created_at,
    });
    
    Ok(())
}

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub market_id: String,
    pub title: String,
    pub authority: Pubkey,
    pub end_time: i64,
    pub created_at: i64,
}
```
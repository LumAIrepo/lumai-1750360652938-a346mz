```rust
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), &market.market_id.to_le_bytes()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Active @ ZentroError::MarketNotActive,
        constraint = market.resolution_time > Clock::get()?.unix_timestamp @ ZentroError::MarketExpired
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref(), &market.total_bets.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn place_bet(
    ctx: Context<PlaceBet>,
    amount: u64,
    prediction: bool,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let bet = &mut ctx.accounts.bet;
    let bettor = &ctx.accounts.bettor;
    let vault = &ctx.accounts.vault;

    require!(amount > 0, ZentroError::InvalidBetAmount);
    require!(amount >= market.min_bet_amount, ZentroError::BetAmountTooLow);
    require!(amount <= market.max_bet_amount, ZentroError::BetAmountTooHigh);

    // Transfer SOL from bettor to vault
    let transfer_instruction = anchor_lang::system_program::Transfer {
        from: bettor.to_account_info(),
        to: vault.to_account_info(),
    };

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_instruction,
    );

    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Initialize bet account
    bet.market = market.key();
    bet.bettor = bettor.key();
    bet.amount = amount;
    bet.prediction = prediction;
    bet.timestamp = Clock::get()?.unix_timestamp;
    bet.bump = ctx.bumps.bet;

    // Update market statistics
    market.total_bets += 1;
    market.total_volume += amount;

    if prediction {
        market.yes_volume += amount;
        market.yes_bets += 1;
    } else {
        market.no_volume += amount;
        market.no_bets += 1;
    }

    // Update market odds
    let total_volume = market.yes_volume + market.no_volume;
    if total_volume > 0 {
        market.yes_odds = (market.yes_volume as f64 / total_volume as f64 * 100.0) as u8;
        market.no_odds = 100 - market.yes_odds;
    }

    emit!(BetPlacedEvent {
        market: market.key(),
        bettor: bettor.key(),
        amount,
        prediction,
        timestamp: bet.timestamp,
        market_odds_yes: market.yes_odds,
        market_odds_no: market.no_odds,
    });

    Ok(())
}

#[event]
pub struct BetPlacedEvent {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub timestamp: i64,
    pub market_odds_yes: u8,
    pub market_odds_no: u8,
}
```
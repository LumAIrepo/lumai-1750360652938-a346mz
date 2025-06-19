```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111112");

#[program]
pub mod zentro {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: u64,
        question: String,
        end_time: i64,
        oracle: Pubkey,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.id = market_id;
        market.question = question;
        market.end_time = end_time;
        market.oracle = oracle;
        market.total_yes_tokens = 0;
        market.total_no_tokens = 0;
        market.resolved = false;
        market.outcome = None;
        market.creator = ctx.accounts.creator.key();
        
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        prediction: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_position = &mut ctx.accounts.user_position;
        
        require!(!market.resolved, ErrorCode::MarketResolved);
        require!(Clock::get()?.unix_timestamp < market.end_time, ErrorCode::MarketExpired);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer tokens from user to market vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.market_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update market totals
        if prediction {
            market.total_yes_tokens += amount;
        } else {
            market.total_no_tokens += amount;
        }

        // Update user position
        user_position.user = ctx.accounts.user.key();
        user_position.market = market.key();
        if prediction {
            user_position.yes_tokens += amount;
        } else {
            user_position.no_tokens += amount;
        }

        emit!(BetPlaced {
            market: market.key(),
            user: ctx.accounts.user.key(),
            amount,
            prediction,
        });

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
        require!(ctx.accounts.oracle.key() == market.oracle, ErrorCode::UnauthorizedOracle);
        require!(Clock::get()?.unix_timestamp >= market.end_time, ErrorCode::MarketNotExpired);

        market.resolved = true;
        market.outcome = Some(outcome);

        emit!(MarketResolved {
            market: market.key(),
            outcome,
        });

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_position = &ctx.accounts.user_position;
        
        require!(market.resolved, ErrorCode::MarketNotResolved);
        require!(user_position.user == ctx.accounts.user.key(), ErrorCode::UnauthorizedUser);
        require!(!user_position.claimed, ErrorCode::AlreadyClaimed);

        let outcome = market.outcome.unwrap();
        let winning_tokens = if outcome {
            user_position.yes_tokens
        } else {
            user_position.no_tokens
        };

        require!(winning_tokens > 0, ErrorCode::NoWinnings);

        let total_winning_pool = if outcome {
            market.total_yes_tokens
        } else {
            market.total_no_tokens
        };

        let total_pool = market.total_yes_tokens + market.total_no_tokens;
        let payout = (winning_tokens as u128 * total_pool as u128 / total_winning_pool as u128) as u64;

        // Transfer winnings to user
        let seeds = &[
            b"market",
            &market.id.to_le_bytes(),
            &[ctx.bumps.market_vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.market_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, payout)?;

        let user_position = &mut ctx.accounts.user_position;
        user_position.claimed = true;

        emit!(WinningsClaimed {
            market: market.key(),
            user: ctx.accounts.user.key(),
            amount: payout,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = market_vault,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,
    
    #[account(mut)]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,
    
    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    #[max_len(200)]
    pub question: String,
    pub end_time: i64,
    pub oracle: Pubkey,
    pub total_yes_tokens: u64,
    pub total_no_tokens: u64,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub creator: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,
    pub market: Pubkey,
    pub yes_tokens: u64,
    pub no_tokens: u64,
    pub claimed: bool,
}

#[event]
pub struct BetPlaced {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub prediction: bool,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub outcome: bool,
}

#[event]
pub struct WinningsClaimed {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market has already been resolved")]
    MarketResolved,
    #[msg("Market has expired")]
    MarketExpired,
    #[msg("Invalid bet amount")]
    InvalidAmount,
    #[msg("Market already resolved")]
    MarketAlreadyResolved,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Market not expired yet")]
    MarketNotExpired,
    #[msg("Market not resolved")]
    MarketNotResolved,
    #[msg("Unauthorized user")]
    UnauthorizedUser,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("No winnings to claim")]
    NoWinnings,
}
```
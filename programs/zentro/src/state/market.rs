```rust
use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub title: String,
    pub description: String,
    pub category: String,
    pub resolution_source: String,
    pub end_time: i64,
    pub resolved: bool,
    pub resolution: Option<bool>,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub creator_fee_rate: u16,
    pub platform_fee_rate: u16,
    pub min_bet_amount: u64,
    pub max_bet_amount: u64,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        4 + 200 + // title (max 200 chars)
        4 + 500 + // description (max 500 chars)
        4 + 50 + // category (max 50 chars)
        4 + 200 + // resolution_source (max 200 chars)
        8 + // end_time
        1 + // resolved
        1 + 1 + // resolution (Option<bool>)
        8 + // total_yes_amount
        8 + // total_no_amount
        2 + // creator_fee_rate
        2 + // platform_fee_rate
        8 + // min_bet_amount
        8 + // max_bet_amount
        8 + // created_at
        1 + 8 + // resolved_at (Option<i64>)
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        title: String,
        description: String,
        category: String,
        resolution_source: String,
        end_time: i64,
        creator_fee_rate: u16,
        platform_fee_rate: u16,
        min_bet_amount: u64,
        max_bet_amount: u64,
        bump: u8,
    ) -> Result<()> {
        require!(title.len() <= 200, MarketError::TitleTooLong);
        require!(description.len() <= 500, MarketError::DescriptionTooLong);
        require!(category.len() <= 50, MarketError::CategoryTooLong);
        require!(resolution_source.len() <= 200, MarketError::ResolutionSourceTooLong);
        require!(end_time > Clock::get()?.unix_timestamp, MarketError::InvalidEndTime);
        require!(creator_fee_rate <= 1000, MarketError::InvalidFeeRate); // max 10%
        require!(platform_fee_rate <= 1000, MarketError::InvalidFeeRate); // max 10%
        require!(min_bet_amount > 0, MarketError::InvalidBetAmount);
        require!(max_bet_amount >= min_bet_amount, MarketError::InvalidBetAmount);

        self.authority = authority;
        self.title = title;
        self.description = description;
        self.category = category;
        self.resolution_source = resolution_source;
        self.end_time = end_time;
        self.resolved = false;
        self.resolution = None;
        self.total_yes_amount = 0;
        self.total_no_amount = 0;
        self.creator_fee_rate = creator_fee_rate;
        self.platform_fee_rate = platform_fee_rate;
        self.min_bet_amount = min_bet_amount;
        self.max_bet_amount = max_bet_amount;
        self.created_at = Clock::get()?.unix_timestamp;
        self.resolved_at = None;
        self.bump = bump;

        Ok(())
    }

    pub fn place_bet(&mut self, amount: u64, is_yes: bool) -> Result<()> {
        require!(!self.resolved, MarketError::MarketResolved);
        require!(Clock::get()?.unix_timestamp < self.end_time, MarketError::MarketExpired);
        require!(amount >= self.min_bet_amount, MarketError::BetTooSmall);
        require!(amount <= self.max_bet_amount, MarketError::BetTooLarge);

        if is_yes {
            self.total_yes_amount = self.total_yes_amount.checked_add(amount)
                .ok_or(MarketError::Overflow)?;
        } else {
            self.total_no_amount = self.total_no_amount.checked_add(amount)
                .ok_or(MarketError::Overflow)?;
        }

        Ok(())
    }

    pub fn resolve(&mut self, resolution: bool) -> Result<()> {
        require!(!self.resolved, MarketError::AlreadyResolved);
        require!(Clock::get()?.unix_timestamp >= self.end_time, MarketError::MarketNotExpired);

        self.resolved = true;
        self.resolution = Some(resolution);
        self.resolved_at = Some(Clock::get()?.unix_timestamp);

        Ok(())
    }

    pub fn get_total_pool(&self) -> u64 {
        self.total_yes_amount.saturating_add(self.total_no_amount)
    }

    pub fn get_yes_odds(&self) -> f64 {
        let total = self.get_total_pool();
        if total == 0 {
            0.5
        } else {
            self.total_yes_amount as f64 / total as f64
        }
    }

    pub fn get_no_odds(&self) -> f64 {
        let total = self.get_total_pool();
        if total == 0 {
            0.5
        } else {
            self.total_no_amount as f64 / total as f64
        }
    }

    pub fn is_expired(&self) -> Result<bool> {
        Ok(Clock::get()?.unix_timestamp >= self.end_time)
    }

    pub fn can_resolve(&self) -> Result<bool> {
        Ok(!self.resolved && self.is_expired()?)
    }
}

#[error_code]
pub enum MarketError {
    #[msg("Title is too long")]
    TitleTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Category is too long")]
    CategoryTooLong,
    #[msg("Resolution source is too long")]
    ResolutionSourceTooLong,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    #[msg("Market is already resolved")]
    MarketResolved,
    #[msg("Market has expired")]
    MarketExpired,
    #[msg("Bet amount is too small")]
    BetTooSmall,
    #[msg("Bet amount is too large")]
    BetTooLarge,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Market is already resolved")]
    AlreadyResolved,
    #[msg("Market has not expired yet")]
    MarketNotExpired,
}
```
```rust
use anchor_lang::prelude::*;

#[account]
pub struct UserPosition {
    pub user: Pubkey,
    pub market: Pubkey,
    pub outcome: u8,
    pub shares: u64,
    pub average_price: u64,
    pub total_invested: u64,
    pub created_at: i64,
    pub last_updated: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        32 + // market
        1 + // outcome
        8 + // shares
        8 + // average_price
        8 + // total_invested
        8 + // created_at
        8 + // last_updated
        1 + // is_active
        1; // bump

    pub fn new(
        user: Pubkey,
        market: Pubkey,
        outcome: u8,
        shares: u64,
        price: u64,
        bump: u8,
    ) -> Self {
        let clock = Clock::get().unwrap();
        let total_invested = shares.checked_mul(price).unwrap();
        
        Self {
            user,
            market,
            outcome,
            shares,
            average_price: price,
            total_invested,
            created_at: clock.unix_timestamp,
            last_updated: clock.unix_timestamp,
            is_active: true,
            bump,
        }
    }

    pub fn add_shares(&mut self, additional_shares: u64, price: u64) -> Result<()> {
        let additional_investment = additional_shares.checked_mul(price).unwrap();
        let new_total_invested = self.total_invested.checked_add(additional_investment).unwrap();
        let new_total_shares = self.shares.checked_add(additional_shares).unwrap();
        
        self.average_price = new_total_invested.checked_div(new_total_shares).unwrap();
        self.shares = new_total_shares;
        self.total_invested = new_total_invested;
        self.last_updated = Clock::get().unwrap().unix_timestamp;
        
        Ok(())
    }

    pub fn remove_shares(&mut self, shares_to_remove: u64) -> Result<()> {
        require!(self.shares >= shares_to_remove, ErrorCode::InsufficientShares);
        
        let remaining_shares = self.shares.checked_sub(shares_to_remove).unwrap();
        
        if remaining_shares == 0 {
            self.is_active = false;
            self.shares = 0;
            self.total_invested = 0;
        } else {
            let investment_to_remove = shares_to_remove.checked_mul(self.average_price).unwrap();
            self.shares = remaining_shares;
            self.total_invested = self.total_invested.checked_sub(investment_to_remove).unwrap();
        }
        
        self.last_updated = Clock::get().unwrap().unix_timestamp;
        
        Ok(())
    }

    pub fn calculate_pnl(&self, current_price: u64) -> i64 {
        let current_value = self.shares.checked_mul(current_price).unwrap();
        current_value as i64 - self.total_invested as i64
    }

    pub fn get_position_value(&self, current_price: u64) -> u64 {
        self.shares.checked_mul(current_price).unwrap()
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient shares to remove")]
    InsufficientShares,
}
```
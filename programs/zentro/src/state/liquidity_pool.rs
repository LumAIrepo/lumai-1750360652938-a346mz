```rust
use anchor_lang::prelude::*;
use crate::errors::ZentroError;

#[account]
pub struct LiquidityPool {
    pub authority: Pubkey,
    pub market: Pubkey,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub yes_token_mint: Pubkey,
    pub no_token_mint: Pubkey,
    pub yes_token_vault: Pubkey,
    pub no_token_vault: Pubkey,
    pub total_liquidity: u64,
    pub yes_reserves: u64,
    pub no_reserves: u64,
    pub fee_rate: u16, // basis points (e.g., 100 = 1%)
    pub accumulated_fees: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl LiquidityPool {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // market
        32 + // token_mint
        32 + // token_vault
        32 + // yes_token_mint
        32 + // no_token_mint
        32 + // yes_token_vault
        32 + // no_token_vault
        8 + // total_liquidity
        8 + // yes_reserves
        8 + // no_reserves
        2 + // fee_rate
        8 + // accumulated_fees
        1 + // is_active
        8 + // created_at
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        market: Pubkey,
        token_mint: Pubkey,
        token_vault: Pubkey,
        yes_token_mint: Pubkey,
        no_token_mint: Pubkey,
        yes_token_vault: Pubkey,
        no_token_vault: Pubkey,
        fee_rate: u16,
        bump: u8,
    ) -> Result<()> {
        require!(fee_rate <= 1000, ZentroError::InvalidFeeRate); // Max 10%
        
        self.authority = authority;
        self.market = market;
        self.token_mint = token_mint;
        self.token_vault = token_vault;
        self.yes_token_mint = yes_token_mint;
        self.no_token_mint = no_token_mint;
        self.yes_token_vault = yes_token_vault;
        self.no_token_vault = no_token_vault;
        self.total_liquidity = 0;
        self.yes_reserves = 0;
        self.no_reserves = 0;
        self.fee_rate = fee_rate;
        self.accumulated_fees = 0;
        self.is_active = true;
        self.created_at = Clock::get()?.unix_timestamp;
        self.bump = bump;

        Ok(())
    }

    pub fn add_liquidity(&mut self, amount: u64) -> Result<u64> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(amount > 0, ZentroError::InvalidAmount);

        let liquidity_tokens = if self.total_liquidity == 0 {
            // Initial liquidity provision
            amount
        } else {
            // Calculate proportional liquidity tokens
            let total_reserves = self.yes_reserves.checked_add(self.no_reserves)
                .ok_or(ZentroError::MathOverflow)?;
            
            if total_reserves == 0 {
                amount
            } else {
                amount.checked_mul(self.total_liquidity)
                    .ok_or(ZentroError::MathOverflow)?
                    .checked_div(total_reserves)
                    .ok_or(ZentroError::MathOverflow)?
            }
        };

        // Add equal amounts to both reserves initially
        let half_amount = amount.checked_div(2).ok_or(ZentroError::MathOverflow)?;
        
        self.yes_reserves = self.yes_reserves.checked_add(half_amount)
            .ok_or(ZentroError::MathOverflow)?;
        self.no_reserves = self.no_reserves.checked_add(half_amount)
            .ok_or(ZentroError::MathOverflow)?;
        
        self.total_liquidity = self.total_liquidity.checked_add(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?;

        Ok(liquidity_tokens)
    }

    pub fn remove_liquidity(&mut self, liquidity_tokens: u64) -> Result<(u64, u64)> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(liquidity_tokens > 0, ZentroError::InvalidAmount);
        require!(liquidity_tokens <= self.total_liquidity, ZentroError::InsufficientLiquidity);

        let yes_amount = self.yes_reserves.checked_mul(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(self.total_liquidity)
            .ok_or(ZentroError::MathOverflow)?;

        let no_amount = self.no_reserves.checked_mul(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(self.total_liquidity)
            .ok_or(ZentroError::MathOverflow)?;

        self.yes_reserves = self.yes_reserves.checked_sub(yes_amount)
            .ok_or(ZentroError::MathOverflow)?;
        self.no_reserves = self.no_reserves.checked_sub(no_amount)
            .ok_or(ZentroError::MathOverflow)?;
        
        self.total_liquidity = self.total_liquidity.checked_sub(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?;

        Ok((yes_amount, no_amount))
    }

    pub fn calculate_swap_output(&self, input_amount: u64, is_yes_to_no: bool) -> Result<u64> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(input_amount > 0, ZentroError::InvalidAmount);

        let (input_reserve, output_reserve) = if is_yes_to_no {
            (self.yes_reserves, self.no_reserves)
        } else {
            (self.no_reserves, self.yes_reserves)
        };

        require!(input_reserve > 0 && output_reserve > 0, ZentroError::InsufficientLiquidity);

        // Apply fee
        let fee_amount = input_amount.checked_mul(self.fee_rate as u64)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(10000)
            .ok_or(ZentroError::MathOverflow)?;

        let input_after_fee = input_amount.checked_sub(fee_amount)
            .ok_or(ZentroError::MathOverflow)?;

        // Constant product formula: x * y = k
        let new_input_reserve = input_reserve.checked_add(input_after_fee)
            .ok_or(ZentroError::MathOverflow)?;

        let k = input_reserve.checked_mul(output_reserve)
            .ok_or(ZentroError::MathOverflow)?;

        let new_output_reserve = k.checked_div(new_input_reserve)
            .ok_or(ZentroError::MathOverflow)?;

        let output_amount = output_reserve.checked_sub(new_output_reserve)
            .ok_or(ZentroError::MathOverflow)?;

        require!(output_amount < output_reserve, ZentroError::InsufficientLiquidity);

        Ok(output_amount)
    }

    pub fn execute_swap(&mut self, input_amount: u64, is_yes_to_no: bool) -> Result<u64> {
        let output_amount = self.calculate_swap_output(input_amount, is_yes_to_no)?;

        let fee_amount = input_amount.checked_mul(self.fee_rate as u64)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(10000)
            .ok_or(ZentroError::MathOverflow)?;

        let input_after_fee = input_amount.checked_sub(fee_amount)
            .ok_or(ZentroError::MathOverflow)?;

        if is_yes_to_no {
            self.yes_reserves = self.yes_reserves.checked_add(input_after_fee)
                .ok_or(ZentroError::MathOverflow)?;
            self.no_reserves = self.no_reserves.checked_sub(output_amount)
                .ok_or(ZentroError::MathOverflow)?;
        } else {
            self.no_reserves = self.no_reserves.checked_add(input_after_fee)
                .ok_or(ZentroError::MathOverflow)?;
            self.yes_reserves = self.yes_reserves.checked_sub(output_amount)
                .ok_or(ZentroError::MathOverflow)?;
        }

        self.accumulated_fees = self.accumulated_fees.checked_add(fee_amount)
            .ok_or(ZentroError::MathOverflow)?;

        Ok(output_amount)
    }

    pub fn get_price(&self, is_yes_price: bool) -> Result<u64> {
        require!(self.yes_reserves > 0 && self.no_reserves > 0, ZentroError::InsufficientLiquidity);

        let total_reserves = self.yes_reserves.checked_add(self.no_reserves)
            .ok_or(ZentroError::MathOverflow)?;

        if is_yes_price {
            // Price as percentage (scaled by 10000 for precision)
            self.yes_reserves.checked_mul(10000)
                .ok_or(ZentroError::MathOverflow)?
                .checked_div(total_reserves)
                .ok_or(ZentroError::MathOverflow)
        } else {
            self.no_reserves.checked_mul(10000)
                .ok_or(ZentroError::MathOverflow)?
                .checked_div(total_reserves)
                .ok_or(ZentroError::MathOverflow)
        }
    }

    pub fn deactivate(&mut self) -> Result<()> {
        self.is_active = false;
        Ok(())
    }

    pub fn reactivate(&mut self) -> Result<()> {
        self.is_active = true;
        Ok(())
    }

    pub fn update_fee_rate(&mut self, new_fee_rate: u16) -> Result<()> {
        require!(new_fee_rate <= 1000, ZentroError::InvalidFeeRate); // Max 10%
        self.fee_rate = new_fee_rate;
        Ok(())
    }

    pub fn collect_fees(&mut self) -> Result<u64> {
        let fees = self.accumulated_fees;
        self.accumulated_fees = 0;
        Ok(fees)
    }
}
```
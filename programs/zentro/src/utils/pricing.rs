```rust
use anchor_lang::prelude::*;
use std::cmp;

#[derive(Debug, Clone, Copy)]
pub struct PricingParams {
    pub base_price: u64,
    pub volatility_factor: u64,
    pub liquidity_depth: u64,
    pub time_decay_factor: u64,
}

impl Default for PricingParams {
    fn default() -> Self {
        Self {
            base_price: 5000, // 50.00% in basis points
            volatility_factor: 100,
            liquidity_depth: 1000000, // 1M lamports
            time_decay_factor: 50,
        }
    }
}

pub fn calculate_market_price(
    yes_shares: u64,
    no_shares: u64,
    total_liquidity: u64,
    params: &PricingParams,
) -> Result<u64> {
    if total_liquidity == 0 {
        return Ok(params.base_price);
    }

    let total_shares = yes_shares.saturating_add(no_shares);
    if total_shares == 0 {
        return Ok(params.base_price);
    }

    // Calculate probability based on share distribution
    let yes_probability = (yes_shares as u128)
        .saturating_mul(10000)
        .saturating_div(total_shares as u128) as u64;

    // Apply liquidity adjustment
    let liquidity_factor = calculate_liquidity_factor(total_liquidity, params.liquidity_depth);
    
    // Apply volatility adjustment
    let volatility_adjustment = calculate_volatility_adjustment(
        yes_shares,
        no_shares,
        params.volatility_factor,
    );

    let adjusted_price = yes_probability
        .saturating_mul(liquidity_factor)
        .saturating_div(10000)
        .saturating_add(volatility_adjustment);

    Ok(cmp::min(adjusted_price, 10000))
}

pub fn calculate_buy_price(
    current_price: u64,
    shares_to_buy: u64,
    total_liquidity: u64,
    is_yes_side: bool,
) -> Result<u64> {
    if shares_to_buy == 0 {
        return Ok(0);
    }

    let base_cost = current_price.saturating_mul(shares_to_buy).saturating_div(10000);
    
    // Calculate slippage based on order size relative to liquidity
    let slippage = calculate_slippage(shares_to_buy, total_liquidity);
    
    let slippage_cost = base_cost.saturating_mul(slippage).saturating_div(10000);
    
    if is_yes_side {
        Ok(base_cost.saturating_add(slippage_cost))
    } else {
        let inverse_price = 10000_u64.saturating_sub(current_price);
        let inverse_cost = inverse_price.saturating_mul(shares_to_buy).saturating_div(10000);
        Ok(inverse_cost.saturating_add(slippage_cost))
    }
}

pub fn calculate_sell_price(
    current_price: u64,
    shares_to_sell: u64,
    total_liquidity: u64,
    is_yes_side: bool,
) -> Result<u64> {
    if shares_to_sell == 0 {
        return Ok(0);
    }

    let base_value = if is_yes_side {
        current_price.saturating_mul(shares_to_sell).saturating_div(10000)
    } else {
        let inverse_price = 10000_u64.saturating_sub(current_price);
        inverse_price.saturating_mul(shares_to_sell).saturating_div(10000)
    };
    
    // Calculate slippage (negative for selling)
    let slippage = calculate_slippage(shares_to_sell, total_liquidity);
    let slippage_reduction = base_value.saturating_mul(slippage).saturating_div(10000);
    
    Ok(base_value.saturating_sub(slippage_reduction))
}

fn calculate_liquidity_factor(current_liquidity: u64, target_liquidity: u64) -> u64 {
    if target_liquidity == 0 {
        return 10000;
    }

    let ratio = (current_liquidity as u128)
        .saturating_mul(10000)
        .saturating_div(target_liquidity as u128) as u64;

    // Liquidity factor ranges from 8000 (low liquidity) to 12000 (high liquidity)
    cmp::max(8000, cmp::min(12000, 8000_u64.saturating_add(ratio.saturating_mul(4000).saturating_div(10000))))
}

fn calculate_volatility_adjustment(yes_shares: u64, no_shares: u64, volatility_factor: u64) -> u64 {
    let total_shares = yes_shares.saturating_add(no_shares);
    if total_shares == 0 {
        return 0;
    }

    let imbalance = if yes_shares > no_shares {
        yes_shares.saturating_sub(no_shares)
    } else {
        no_shares.saturating_sub(yes_shares)
    };

    let imbalance_ratio = (imbalance as u128)
        .saturating_mul(10000)
        .saturating_div(total_shares as u128) as u64;

    imbalance_ratio
        .saturating_mul(volatility_factor)
        .saturating_div(10000)
}

fn calculate_slippage(order_size: u64, total_liquidity: u64) -> u64 {
    if total_liquidity == 0 {
        return 500; // 5% default slippage
    }

    let order_ratio = (order_size as u128)
        .saturating_mul(10000)
        .saturating_div(total_liquidity as u128) as u64;

    // Slippage increases quadratically with order size
    let base_slippage = order_ratio.saturating_mul(order_ratio).saturating_div(10000);
    
    // Cap slippage at 10%
    cmp::min(base_slippage, 1000)
}

pub fn calculate_payout_odds(current_price: u64) -> (u64, u64) {
    if current_price == 0 {
        return (0, 10000);
    }
    if current_price >= 10000 {
        return (10000, 0);
    }

    let yes_odds = 10000_u64.saturating_mul(10000).saturating_div(current_price);
    let no_odds = 10000_u64.saturating_mul(10000).saturating_div(10000_u64.saturating_sub(current_price));

    (yes_odds, no_odds)
}

pub fn calculate_expected_return(
    investment: u64,
    current_price: u64,
    predicted_outcome: bool,
) -> Result<u64> {
    let (yes_odds, no_odds) = calculate_payout_odds(current_price);
    
    let potential_return = if predicted_outcome {
        investment.saturating_mul(yes_odds).saturating_div(10000)
    } else {
        investment.saturating_mul(no_odds).saturating_div(10000)
    };

    Ok(potential_return.saturating_sub(investment))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_market_price() {
        let params = PricingParams::default();
        
        // Equal shares should result in ~50% price
        let price = calculate_market_price(1000, 1000, 100000, &params).unwrap();
        assert!(price >= 4500 && price <= 5500);
        
        // More yes shares should increase price
        let price_yes_heavy = calculate_market_price(2000, 1000, 100000, &params).unwrap();
        assert!(price_yes_heavy > price);
    }

    #[test]
    fn test_calculate_buy_price() {
        let current_price = 5000; // 50%
        let shares = 100;
        let liquidity = 100000;
        
        let yes_price = calculate_buy_price(current_price, shares, liquidity, true).unwrap();
        let no_price = calculate_buy_price(current_price, shares, liquidity, false).unwrap();
        
        assert!(yes_price > 0);
        assert!(no_price > 0);
        assert_eq!(yes_price, no_price); // Should be equal at 50% price
    }

    #[test]
    fn test_payout_odds() {
        let (yes_odds, no_odds) = calculate_payout_odds(2500); // 25% price
        
        assert_eq!(yes_odds, 40000); // 4:1 odds for yes
        assert_eq!(no_odds, 13333); // ~1.33:1 odds for no
    }
}
```
```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum ZentroError {
    #[msg("Market is not active")]
    MarketNotActive,
    
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    
    #[msg("Insufficient funds for bet")]
    InsufficientFunds,
    
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    
    #[msg("Market resolution time has not passed")]
    ResolutionTimeNotReached,
    
    #[msg("Only market creator can resolve")]
    UnauthorizedResolver,
    
    #[msg("Invalid market outcome")]
    InvalidOutcome,
    
    #[msg("Bet not found")]
    BetNotFound,
    
    #[msg("Cannot claim winnings from losing bet")]
    CannotClaimLosingBet,
    
    #[msg("Winnings already claimed")]
    WinningsAlreadyClaimed,
    
    #[msg("Market creation fee insufficient")]
    InsufficientCreationFee,
    
    #[msg("Invalid market duration")]
    InvalidMarketDuration,
    
    #[msg("Market title too long")]
    MarketTitleTooLong,
    
    #[msg("Market description too long")]
    MarketDescriptionTooLong,
    
    #[msg("Invalid oracle authority")]
    InvalidOracleAuthority,
    
    #[msg("Oracle has not provided resolution")]
    OracleResolutionPending,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid percentage value")]
    InvalidPercentage,
    
    #[msg("Market is paused")]
    MarketPaused,
    
    #[msg("Feature not implemented")]
    NotImplemented,
}
```
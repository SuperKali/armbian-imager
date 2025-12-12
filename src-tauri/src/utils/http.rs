//! HTTP client utilities
//!
//! Provides centralized HTTP client creation with consistent configuration.

use crate::config;
use reqwest::Client;
use std::time::Duration;

/// Create an HTTP client with a short timeout for quick requests
///
/// Useful for requests like fetching board info pages where we don't
/// want to wait too long.
pub fn create_short_timeout_client() -> Result<Client, String> {
    Client::builder()
        .user_agent(config::app::USER_AGENT)
        .timeout(Duration::from_secs(config::http::SHORT_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(config::http::SHORT_TIMEOUT_SECS))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_short_timeout_client() {
        let client = create_short_timeout_client();
        assert!(client.is_ok());
    }
}

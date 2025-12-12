//! Utility functions shared across the application
//!
//! This module contains common helpers for formatting, system info,
//! HTTP client creation, and path management.

mod format;
mod http;
mod system;

pub use format::*;
pub use http::*;
pub use system::*;

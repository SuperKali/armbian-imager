//! macOS-specific flash implementation
//!
//! Uses Security.framework AuthorizationCreate + authopen with -extauth
//! for privilege escalation when writing to block devices.

mod authorization;
mod bindings;
mod writer;

// Re-export public API
pub use authorization::request_authorization;
pub use writer::flash_image;

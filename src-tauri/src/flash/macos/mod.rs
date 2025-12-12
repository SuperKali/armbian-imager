//! macOS-specific flash implementation
//!
//! Uses Security.framework AuthorizationCreate + authopen with -extauth
//! This is the same approach used by Raspberry Pi Imager.

mod authorization;
mod bindings;
mod writer;

// Re-export public API
pub use authorization::request_authorization;
pub use writer::flash_image;

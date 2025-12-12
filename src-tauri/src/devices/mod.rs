//! Block device detection module
//!
//! Platform-specific implementations for detecting available storage devices.

mod types;

#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "windows")]
mod windows;

// Re-export types
pub use types::BlockDevice;

// Re-export platform-specific implementation
#[cfg(target_os = "macos")]
pub use macos::get_block_devices;

#[cfg(target_os = "linux")]
pub use linux::get_block_devices;

#[cfg(target_os = "windows")]
pub use windows::get_block_devices;

//! Flash module - Platform-specific image flashing implementations
//!
//! This module provides privilege escalation and raw device writing for each platform:
//! - macOS: Uses authopen with Touch ID support
//! - Linux: Uses pkexec for privilege escalation
//! - Windows: Requires running as Administrator

mod verify;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;

use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use tokio::sync::Mutex;

/// Flash progress state shared between frontend and backend
pub struct FlashState {
    pub total_bytes: AtomicU64,
    pub written_bytes: AtomicU64,
    pub verified_bytes: AtomicU64,
    pub is_verifying: AtomicBool,
    pub is_cancelled: AtomicBool,
    pub error: Mutex<Option<String>>,
}

impl FlashState {
    pub fn new() -> Self {
        Self {
            total_bytes: AtomicU64::new(0),
            written_bytes: AtomicU64::new(0),
            verified_bytes: AtomicU64::new(0),
            is_verifying: AtomicBool::new(false),
            is_cancelled: AtomicBool::new(false),
            error: Mutex::new(None),
        }
    }

    pub fn reset(&self) {
        self.total_bytes.store(0, Ordering::SeqCst);
        self.written_bytes.store(0, Ordering::SeqCst);
        self.verified_bytes.store(0, Ordering::SeqCst);
        self.is_verifying.store(false, Ordering::SeqCst);
        self.is_cancelled.store(false, Ordering::SeqCst);
    }
}

// Re-export the platform-specific flash_image function
#[cfg(target_os = "macos")]
pub use macos::flash_image;
#[cfg(target_os = "linux")]
pub use linux::flash_image;
#[cfg(target_os = "windows")]
pub use windows::flash_image;

// Re-export authorization function for macOS
#[cfg(target_os = "macos")]
pub use macos::request_authorization;

/// Request authorization before flashing (platform-specific)
/// On macOS: Shows Touch ID / password dialog
/// On Linux/Windows: No-op (authorization happens during flash)
#[cfg(not(target_os = "macos"))]
pub fn request_authorization(_device_path: &str) -> Result<bool, String> {
    Ok(true)
}

/// Unmount a device before flashing (platform-specific)
pub(crate) fn unmount_device(device_path: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("diskutil")
            .args(["unmountDisk", device_path])
            .output();
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("lsblk")
            .args(["-ln", "-o", "NAME", device_path])
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let part_path = format!("/dev/{}", line.trim());
                let _ = Command::new("umount").arg(&part_path).output();
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let _ = device_path;
    }

    Ok(())
}

/// Sync device to ensure all data is written to disk
pub(crate) fn sync_device(_device_path: &str) {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        let _ = Command::new("sync").output();
    }
}

/// Calculate SHA256 hash of a file
#[allow(dead_code)]
pub fn calculate_sha256(path: &PathBuf) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;

    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 1024 * 1024];

    loop {
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        if bytes_read == 0 {
            break;
        }

        hasher.update(&buffer[..bytes_read]);
    }

    Ok(hex::encode(hasher.finalize()))
}

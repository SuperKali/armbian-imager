//! Windows-specific flash implementation
//!
//! On Windows, the application must be run as Administrator to access raw disk devices.
//! Uses direct file I/O to write to physical disks.

use super::FlashState;
use crate::config;
use crate::{log_debug, log_error, log_info};
use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::sync::Arc;

const MODULE: &str = "flash::windows";

/// Flash an image to a block device on Windows
///
/// Requires the application to be running with Administrator privileges.
/// Opens the physical disk device directly for raw write access.
pub async fn flash_image(
    image_path: &PathBuf,
    device_path: &str,
    state: Arc<FlashState>,
    verify: bool,
) -> Result<(), String> {
    state.reset();

    log_info!(
        MODULE,
        "Starting flash: {} -> {}",
        image_path.display(),
        device_path
    );

    // Get image size
    let image_size = std::fs::metadata(image_path)
        .map_err(|e| format!("Failed to get image size: {}", e))?
        .len();

    state.total_bytes.store(image_size, Ordering::SeqCst);

    log_info!(
        MODULE,
        "Image size: {} bytes ({:.2} GB)",
        image_size,
        image_size as f64 / 1024.0 / 1024.0 / 1024.0
    );

    // Open image file
    let mut image_file =
        File::open(image_path).map_err(|e| format!("Failed to open image: {}", e))?;

    // Open device for writing (requires Administrator)
    log_info!(MODULE, "Opening device for writing (requires Administrator)...");
    let mut device = open_device_for_write(device_path)?;

    // Write image in chunks with progress
    let chunk_size = config::flash::CHUNK_SIZE;
    let mut buffer = vec![0u8; chunk_size];
    let mut written: u64 = 0;
    let mut last_logged_percent: u64 = 0;

    log_info!(MODULE, "Writing image to device...");

    loop {
        if state.is_cancelled.load(Ordering::SeqCst) {
            log_info!(MODULE, "Flash cancelled by user");
            return Err("Flash cancelled".to_string());
        }

        let bytes_read = image_file
            .read(&mut buffer)
            .map_err(|e| {
                log_error!(MODULE, "Failed to read image: {}", e);
                format!("Failed to read image: {}", e)
            })?;

        if bytes_read == 0 {
            break;
        }

        device
            .write_all(&buffer[..bytes_read])
            .map_err(|e| {
                log_error!(MODULE, "Failed to write to device: {}", e);
                format!("Failed to write to device: {}", e)
            })?;

        written += bytes_read as u64;
        state.written_bytes.store(written, Ordering::SeqCst);

        // Log progress at intervals
        let current_percent = (written * 100 / image_size) as u64;
        if current_percent >= last_logged_percent + config::flash::LOG_INTERVAL_PERCENT {
            log_debug!(
                MODULE,
                "Write progress: {:.1}%",
                (written as f64 / image_size as f64) * 100.0
            );
            last_logged_percent = current_percent;
        }
    }

    device.flush().ok();
    log_info!(MODULE, "Write complete!");

    // Verify if requested
    if verify {
        log_info!(MODULE, "Starting verification...");
        // Close and reopen device for reading
        drop(device);
        let mut device = open_device_for_read(device_path)?;

        // Use shared verification logic
        super::verify::verify_data(image_path, &mut device, state)?;
    }

    log_info!(MODULE, "Flash complete!");
    Ok(())
}

/// Open device for writing (requires Administrator privileges)
fn open_device_for_write(device_path: &str) -> Result<File, String> {
    std::fs::OpenOptions::new()
        .write(true)
        .open(device_path)
        .map_err(|e| {
            format!(
                "Failed to open device for writing: {}. Try running as Administrator.",
                e
            )
        })
}

/// Open device for reading
fn open_device_for_read(device_path: &str) -> Result<File, String> {
    std::fs::OpenOptions::new()
        .read(true)
        .open(device_path)
        .map_err(|e| format!("Failed to open device for reading: {}", e))
}

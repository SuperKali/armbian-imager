//! Linux privilege management
//!
//! On Linux, we use UDisks2 for privilege escalation via polkit.
//! The app runs as a normal user and polkit handles authentication
//! when accessing block devices.

use crate::log_info;

const MODULE: &str = "flash::linux::privileges";

/// Request authorization for a device
/// With UDisks2, authorization is handled automatically via polkit
/// when we call OpenDevice on the block device.
/// This function just returns true to indicate we can proceed.
pub fn request_authorization(device_path: &str) -> Result<bool, String> {
    log_info!(
        MODULE,
        "Authorization will be requested via polkit when accessing: {}",
        device_path
    );
    // Authorization happens later via UDisks2/polkit when we open the device
    Ok(true)
}

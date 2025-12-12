//! Linux device detection
//!
//! Uses lsblk to enumerate block devices.

use std::process::Command;

use crate::utils::format_size;

use super::types::BlockDevice;

/// Get list of block devices on Linux
pub fn get_block_devices() -> Result<Vec<BlockDevice>, String> {
    let output = Command::new("lsblk")
        .args(["-dpno", "NAME,SIZE,MODEL,RM", "-b"])
        .output()
        .map_err(|e| format!("Failed to run lsblk: {}", e))?;

    if !output.status.success() {
        return Err("lsblk command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut devices = Vec::new();
    let system_disks = get_system_disks();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }

        let path = parts[0];

        // Skip non-standard devices
        if !path.starts_with("/dev/sd")
            && !path.starts_with("/dev/hd")
            && !path.starts_with("/dev/vd")
            && !path.starts_with("/dev/nvme")
            && !path.starts_with("/dev/mmcblk")
        {
            continue;
        }

        // Skip mmcblk boot/rpmb partitions
        if path.contains("boot") || path.contains("rpmb") {
            continue;
        }

        let dev_name = path.split('/').last().unwrap_or("");

        // Mark as system disk instead of skipping (consistent with macOS behavior)
        let is_system = system_disks.iter().any(|sys| {
            sys.starts_with(dev_name) || dev_name.starts_with(sys)
        });

        let size: u64 = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
        if size == 0 {
            continue;
        }

        let model = if parts.len() > 2 {
            if parts.len() > 3 {
                parts[2..parts.len() - 1].join(" ")
            } else {
                parts[2].to_string()
            }
        } else {
            String::new()
        };

        let is_removable = parts.last().map(|s| *s == "1").unwrap_or(false);

        devices.push(BlockDevice {
            path: path.to_string(),
            name: dev_name.to_string(),
            size,
            size_formatted: format_size(size),
            model,
            is_removable,
            is_system,
        });
    }

    Ok(devices)
}

/// Get list of system disk names to exclude
fn get_system_disks() -> Vec<String> {
    let mut system_disks = Vec::new();

    for mount in &["/", "/boot", "/boot/efi"] {
        if let Ok(output) = Command::new("findmnt")
            .args(["-n", "-o", "SOURCE", mount])
            .output()
        {
            let source = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !source.is_empty() {
                if let Ok(pkname_output) = Command::new("lsblk")
                    .args(["-no", "PKNAME", &source])
                    .output()
                {
                    let pkname = String::from_utf8_lossy(&pkname_output.stdout)
                        .trim()
                        .to_string();
                    if !pkname.is_empty() {
                        system_disks.push(pkname);
                    }
                }
                if let Some(name) = source.split('/').last() {
                    system_disks.push(name.to_string());
                }
            }
        }
    }

    system_disks.sort();
    system_disks.dedup();
    system_disks
}

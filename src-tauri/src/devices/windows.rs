//! Windows device detection
//!
//! Uses PowerShell Get-Disk to enumerate block devices.

use std::process::Command;

use crate::utils::format_size;

use super::types::BlockDevice;

/// Get list of block devices on Windows
pub fn get_block_devices() -> Result<Vec<BlockDevice>, String> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "Get-Disk | Where-Object { $_.BusType -ne 'NVMe' -or $_.IsSystem -eq $false } | Select-Object Number, FriendlyName, Size, BusType | ConvertTo-Json",
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    if !output.status.success() {
        return Err("PowerShell command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    let json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse disk info: {}", e))?;

    let mut devices = Vec::new();

    let disks = if json.is_array() {
        json.as_array().unwrap().clone()
    } else {
        vec![json]
    };

    let system_disk = get_system_disk();

    for disk in disks {
        let number = disk["Number"].as_i64().unwrap_or(-1);
        if number < 0 {
            continue;
        }

        // Skip system disk
        if let Some(sys_num) = system_disk {
            if number == sys_num {
                continue;
            }
        }

        let size = disk["Size"].as_u64().unwrap_or(0);
        if size == 0 {
            continue;
        }

        let model = disk["FriendlyName"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string();

        let bus_type = disk["BusType"].as_str().unwrap_or("");
        let is_removable = bus_type == "USB" || bus_type == "SD";

        devices.push(BlockDevice {
            path: format!("\\\\.\\PhysicalDrive{}", number),
            name: format!("Disk {}", number),
            size,
            size_formatted: format_size(size),
            model,
            is_removable,
            is_system: false,
        });
    }

    Ok(devices)
}

/// Get the system disk number
fn get_system_disk() -> Option<i64> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-Partition -DriveLetter C | Get-Disk).Number",
        ])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.trim().parse().ok()
}

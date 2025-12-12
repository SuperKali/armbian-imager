//! Core operations module
//!
//! Handles download and flash operations.

use std::path::PathBuf;
use tauri::State;

use crate::config;
use crate::download::download_image as do_download;
use crate::flash::{flash_image as do_flash, request_authorization};
use crate::utils::get_cache_dir;

use super::state::AppState;

/// Request write authorization before starting the flash process
/// This shows the authorization dialog (Touch ID on macOS) BEFORE downloading
/// Returns true if authorized, false if user cancelled
#[tauri::command]
pub async fn request_write_authorization(device_path: String) -> Result<bool, String> {
    request_authorization(&device_path)
}

/// Start downloading an image
#[tauri::command]
pub async fn download_image(
    file_url: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let download_dir = get_cache_dir(config::app::NAME).join("images");

    let download_state = state.download_state.clone();
    let result = do_download(&file_url, &download_dir, download_state).await?;

    Ok(result.to_string_lossy().to_string())
}

/// Start flashing an image to a device
#[tauri::command]
pub async fn flash_image(
    image_path: String,
    device_path: String,
    verify: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let path = PathBuf::from(&image_path);
    let flash_state = state.flash_state.clone();

    do_flash(&path, &device_path, flash_state, verify).await
}

/// Delete a downloaded image file
#[tauri::command]
pub async fn delete_downloaded_image(image_path: String) -> Result<(), String> {
    let path = PathBuf::from(&image_path);

    // Safety check: only delete files in our cache directory
    let cache_dir = get_cache_dir(config::app::NAME);

    if !path.starts_with(&cache_dir) {
        return Err("Cannot delete files outside cache directory".to_string());
    }

    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Failed to delete image: {}", e))?;
    }

    Ok(())
}

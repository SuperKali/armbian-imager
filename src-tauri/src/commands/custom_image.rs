//! Custom image handling module
//!
//! Handles selection and processing of user-provided custom images.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

use crate::decompress::{decompress_local_file, needs_decompression};

use super::state::AppState;

/// Custom image info returned when user selects a local file
#[derive(Debug, Serialize, Deserialize)]
pub struct CustomImageInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
}

/// Check if a custom image needs decompression
#[tauri::command]
pub async fn check_needs_decompression(image_path: String) -> Result<bool, String> {
    let path = PathBuf::from(&image_path);
    Ok(needs_decompression(&path))
}

/// Decompress a custom image file
/// Returns the path to the decompressed file
#[tauri::command]
pub async fn decompress_custom_image(
    image_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let path = PathBuf::from(&image_path);
    let download_state = state.download_state.clone();

    // Reset state for progress tracking
    download_state.reset();

    // Run decompression in a blocking task
    let result = tokio::task::spawn_blocking(move || decompress_local_file(&path, &download_state))
        .await
        .map_err(|e| format!("Task failed: {}", e))?;

    result.map(|p| p.to_string_lossy().to_string())
}

/// Select a custom image file using native file picker
#[tauri::command]
pub async fn select_custom_image(
    window: tauri::Window,
) -> Result<Option<CustomImageInfo>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = window
        .dialog()
        .file()
        .add_filter(
            "Disk Images",
            &["img", "iso", "xz", "gz", "zip", "zst", "bz2", "raw"],
        )
        .add_filter("All Files", &["*"])
        .set_title("Select Disk Image")
        .blocking_pick_file();

    match file_path {
        Some(file_path) => {
            let path_buf = file_path
                .as_path()
                .ok_or_else(|| "Invalid path: not a valid file path".to_string())?;
            let metadata = std::fs::metadata(path_buf)
                .map_err(|e| format!("Failed to read file info: {}", e))?;

            let name = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            Ok(Some(CustomImageInfo {
                path: path_buf.to_string_lossy().to_string(),
                name,
                size: metadata.len(),
            }))
        }
        None => Ok(None),
    }
}

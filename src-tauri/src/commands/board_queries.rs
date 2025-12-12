//! Board and image queries module
//!
//! Handles fetching and filtering board/image data.

use tauri::State;

use crate::devices::{get_block_devices as devices_get_block_devices, BlockDevice};
use crate::images::{
    extract_images, fetch_all_images, filter_images_for_board, get_unique_boards, BoardInfo,
    ImageInfo,
};

use super::state::AppState;

/// Get list of available boards
#[tauri::command]
pub async fn get_boards(state: State<'_, AppState>) -> Result<Vec<BoardInfo>, String> {
    // Fetch images if not cached
    let mut json_guard = state.images_json.lock().await;
    if json_guard.is_none() {
        let json = fetch_all_images().await?;
        *json_guard = Some(json);
    }

    let json = json_guard.as_ref().unwrap();
    let images = extract_images(json);
    Ok(get_unique_boards(&images))
}

/// Get images available for a specific board
#[tauri::command]
pub async fn get_images_for_board(
    board_slug: String,
    preapp_filter: Option<String>,
    kernel_filter: Option<String>,
    variant_filter: Option<String>,
    stable_only: bool,
    state: State<'_, AppState>,
) -> Result<Vec<ImageInfo>, String> {
    let json_guard = state.images_json.lock().await;
    let json = json_guard
        .as_ref()
        .ok_or("Images not loaded. Call get_boards first.")?;

    let images = extract_images(json);
    Ok(filter_images_for_board(
        &images,
        &board_slug,
        preapp_filter.as_deref(),
        kernel_filter.as_deref(),
        variant_filter.as_deref(),
        stable_only,
    ))
}

/// Get available block devices
#[tauri::command]
pub async fn get_block_devices() -> Result<Vec<BlockDevice>, String> {
    devices_get_block_devices()
}

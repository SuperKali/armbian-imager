//! Board image URL module
//!
//! Returns remote URLs for board images from cache.armbian.com

use crate::config;

/// Get board image URL - returns remote URL for the board image
#[tauri::command]
pub fn get_board_image_url(board_slug: String) -> Result<Option<String>, String> {
    let url = format!(
        "{}{}/{}.png",
        config::urls::BOARD_IMAGES_BASE,
        config::urls::BOARD_IMAGE_SIZE,
        board_slug
    );
    Ok(Some(url))
}

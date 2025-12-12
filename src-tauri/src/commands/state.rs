//! Application state module
//!
//! Defines the shared application state used across commands.

use std::sync::Arc;
use tokio::sync::Mutex;

use crate::download::DownloadState;
use crate::flash::FlashState;

/// Application state shared across all commands
pub struct AppState {
    pub images_json: Mutex<Option<serde_json::Value>>,
    pub download_state: Arc<DownloadState>,
    pub flash_state: Arc<FlashState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            images_json: Mutex::new(None),
            download_state: Arc::new(DownloadState::new()),
            flash_state: Arc::new(FlashState::new()),
        }
    }
}

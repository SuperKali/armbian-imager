//! Download module
//!
//! Handles downloading Armbian images from the web.

use futures_util::StreamExt;
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::config;
use crate::decompress::{decompress_with_rust_library, decompress_with_system_xz};
use crate::{log_error, log_info, log_warn};

const MODULE: &str = "download";

/// Download progress state
pub struct DownloadState {
    pub total_bytes: AtomicU64,
    pub downloaded_bytes: AtomicU64,
    pub is_decompressing: AtomicBool,
    pub is_cancelled: AtomicBool,
    pub error: Mutex<Option<String>>,
    pub output_path: Mutex<Option<PathBuf>>,
}

impl DownloadState {
    pub fn new() -> Self {
        Self {
            total_bytes: AtomicU64::new(0),
            downloaded_bytes: AtomicU64::new(0),
            is_decompressing: AtomicBool::new(false),
            is_cancelled: AtomicBool::new(false),
            error: Mutex::new(None),
            output_path: Mutex::new(None),
        }
    }

    pub fn reset(&self) {
        self.total_bytes.store(0, Ordering::SeqCst);
        self.downloaded_bytes.store(0, Ordering::SeqCst);
        self.is_decompressing.store(false, Ordering::SeqCst);
        self.is_cancelled.store(false, Ordering::SeqCst);
    }
}

impl Default for DownloadState {
    fn default() -> Self {
        Self::new()
    }
}

/// Extract filename from URL
fn extract_filename(url: &str) -> Result<&str, String> {
    let url_path = url.split('?').next().unwrap_or(url);
    url_path
        .split('/')
        .last()
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "Invalid URL: no filename".to_string())
}

/// Download and decompress an Armbian image
pub async fn download_image(
    url: &str,
    output_dir: &PathBuf,
    state: Arc<DownloadState>,
) -> Result<PathBuf, String> {
    state.reset();

    let filename = extract_filename(url)?;

    // Determine output filename (remove .xz if present)
    let output_filename = filename.trim_end_matches(".xz");
    let output_path = output_dir.join(output_filename);

    log_info!(MODULE, "Download requested: {}", url);
    log_info!(MODULE, "Output path: {}", output_path.display());

    // Check if already exists
    if output_path.exists() {
        log_info!(MODULE, "Image already exists, skipping download");
        *state.output_path.lock().await = Some(output_path.clone());
        return Ok(output_path);
    }

    // Create output directory if needed
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    let client = Client::builder()
        .user_agent(config::app::USER_AGENT)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Start download
    log_info!(MODULE, "Starting download...");
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| {
            log_error!(MODULE, "Failed to start download: {}", e);
            format!("Failed to start download: {}", e)
        })?;

    if !response.status().is_success() {
        log_error!(MODULE, "Download failed with status: {}", response.status());
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    // Get content length
    let total_size = response.content_length().unwrap_or(0);
    state.total_bytes.store(total_size, Ordering::SeqCst);

    log_info!(
        MODULE,
        "Download size: {} bytes ({:.2} MB)",
        total_size,
        total_size as f64 / 1024.0 / 1024.0
    );

    // Create temp file for compressed data
    let temp_path = output_dir.join(format!("{}.downloading", filename));
    let mut temp_file =
        File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;

    // Download with progress
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
        if state.is_cancelled.load(Ordering::SeqCst) {
            log_info!(MODULE, "Download cancelled by user");
            drop(temp_file);
            let _ = std::fs::remove_file(&temp_path);
            return Err("Download cancelled".to_string());
        }

        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        temp_file
            .write_all(&chunk)
            .map_err(|e| format!("Failed to write chunk: {}", e))?;

        downloaded += chunk.len() as u64;
        state.downloaded_bytes.store(downloaded, Ordering::SeqCst);
    }

    drop(temp_file);
    log_info!(MODULE, "Download complete: {} bytes", downloaded);

    // Decompress if needed
    if filename.ends_with(".xz") {
        state.is_decompressing.store(true, Ordering::SeqCst);
        log_info!(MODULE, "Starting decompression...");

        // Try system xz first, fall back to Rust library
        if let Err(e) = decompress_with_system_xz(&temp_path, &output_path) {
            log_warn!(
                MODULE,
                "System xz failed: {}, falling back to Rust library (slower)",
                e
            );
            decompress_with_rust_library(&temp_path, &output_path, &state)?;
            log_info!(MODULE, "Rust fallback decompression complete");
        }

        // Clean up temp file
        let _ = std::fs::remove_file(&temp_path);
    } else {
        // No decompression needed, just rename
        std::fs::rename(&temp_path, &output_path)
            .map_err(|e| format!("Failed to move file: {}", e))?;
    }

    log_info!(MODULE, "Image ready: {}", output_path.display());
    *state.output_path.lock().await = Some(output_path.clone());
    Ok(output_path)
}

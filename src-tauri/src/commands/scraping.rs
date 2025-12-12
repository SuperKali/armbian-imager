//! Board image scraping module
//!
//! Handles fetching board images from armbian.com website.

use crate::config;
use crate::utils::create_short_timeout_client;

/// Get board image URL by scraping armbian.com
#[tauri::command]
pub async fn get_board_image_url(board_slug: String) -> Result<Option<String>, String> {
    let url = format!("{}{}/", config::urls::BOARD_IMAGES_BASE, board_slug);

    let client = create_short_timeout_client()?;
    let response = client.get(&url).send().await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            let html = resp
                .text()
                .await
                .map_err(|e| format!("Failed to read response: {}", e))?;

            // Method 1: Extract from JSON-LD schema (most reliable)
            if let Some(image_url) = extract_image_from_json_ld(&html) {
                return Ok(Some(image_url));
            }

            // Method 2: Parse HTML to find og:image meta tag
            let document = scraper::Html::parse_document(&html);
            let og_selector = scraper::Selector::parse("meta[property='og:image']").ok();
            if let Some(sel) = og_selector {
                if let Some(meta) = document.select(&sel).next() {
                    if let Some(content) = meta.value().attr("content") {
                        if content.contains("cdn.armbian.com") {
                            return Ok(Some(content.to_string()));
                        }
                    }
                }
            }

            // Method 3: Find img with cdn.armbian.com src
            let img_selector = scraper::Selector::parse("img[src*='cdn.armbian.com']").ok();
            if let Some(sel) = img_selector {
                if let Some(img) = document.select(&sel).next() {
                    if let Some(src) = img.value().attr("src") {
                        return Ok(Some(src.to_string()));
                    }
                }
            }

            // Method 4: Find any image in article/content area
            let content_selector =
                scraper::Selector::parse("article img, .entry-content img, .post-content img")
                    .ok();
            if let Some(sel) = content_selector {
                if let Some(img) = document.select(&sel).next() {
                    if let Some(src) = img.value().attr("src") {
                        if src.contains("cdn.armbian.com") || src.contains("wp-content") {
                            return Ok(Some(src.to_string()));
                        }
                    }
                }
            }

            Ok(None)
        }
        _ => Ok(None),
    }
}

/// Extract image URL from JSON-LD schema in HTML
fn extract_image_from_json_ld(html: &str) -> Option<String> {
    let document = scraper::Html::parse_document(html);
    let selector = scraper::Selector::parse("script[type='application/ld+json']").ok()?;

    for script in document.select(&selector) {
        let json_text = script.inner_html();
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_text) {
            // Check for primaryImageOfPage
            if let Some(img) = json.get("primaryImageOfPage") {
                if let Some(url) = img.get("url").and_then(|u| u.as_str()) {
                    if url.contains("cdn.armbian.com") {
                        return Some(url.to_string());
                    }
                }
            }
            // Check for image field directly
            if let Some(img) = json.get("image") {
                if let Some(url) = img.as_str() {
                    if url.contains("cdn.armbian.com") {
                        return Some(url.to_string());
                    }
                }
                if let Some(url) = img.get("url").and_then(|u| u.as_str()) {
                    if url.contains("cdn.armbian.com") {
                        return Some(url.to_string());
                    }
                }
            }
            // Check @graph array
            if let Some(graph) = json.get("@graph").and_then(|g| g.as_array()) {
                for item in graph {
                    if let Some(img) = item.get("primaryImageOfPage") {
                        if let Some(id) = img.get("@id").and_then(|i| i.as_str()) {
                            // Find the ImageObject with this id
                            for inner_item in graph {
                                if inner_item.get("@id").and_then(|i| i.as_str()) == Some(id) {
                                    if let Some(url) =
                                        inner_item.get("url").and_then(|u| u.as_str())
                                    {
                                        if url.contains("cdn.armbian.com") {
                                            return Some(url.to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Direct image in graph item
                    if item.get("@type").and_then(|t| t.as_str()) == Some("ImageObject") {
                        if let Some(url) = item.get("url").and_then(|u| u.as_str()) {
                            if url.contains("cdn.armbian.com") {
                                return Some(url.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    None
}

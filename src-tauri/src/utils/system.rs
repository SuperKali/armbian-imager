//! System utilities for CPU, paths, and platform detection
//!
//! Provides system-level utilities for cross-platform functionality.

use std::path::PathBuf;

/// Get the number of CPU cores available on the system
fn get_cpu_cores() -> usize {
    std::thread::available_parallelism()
        .map(|p| p.get())
        .unwrap_or(2)
}

/// Get recommended thread count for CPU-intensive operations
/// Uses half of available cores to avoid saturating the system
pub fn get_recommended_threads() -> usize {
    std::cmp::max(1, get_cpu_cores() / 2)
}

/// Find a binary in common system locations
/// Returns the first path that exists
pub fn find_binary(name: &str) -> Option<PathBuf> {
    let paths = get_binary_search_paths(name);

    for path in paths {
        if path.exists() {
            return Some(path);
        }
    }
    None
}

/// Get platform-specific search paths for a binary
fn get_binary_search_paths(name: &str) -> Vec<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        vec![
            PathBuf::from(format!("/opt/homebrew/bin/{}", name)),  // macOS ARM
            PathBuf::from(format!("/usr/local/bin/{}", name)),     // macOS Intel
            PathBuf::from(format!("/usr/bin/{}", name)),
        ]
    }

    #[cfg(target_os = "linux")]
    {
        vec![
            PathBuf::from(format!("/usr/bin/{}", name)),
            PathBuf::from(format!("/bin/{}", name)),
            PathBuf::from(format!("/usr/local/bin/{}", name)),
        ]
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, rely on PATH or specific install locations
        vec![
            PathBuf::from(format!("C:\\Program Files\\{0}\\{0}.exe", name)),
            PathBuf::from(format!("C:\\Program Files (x86)\\{0}\\{0}.exe", name)),
        ]
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        vec![PathBuf::from(format!("/usr/bin/{}", name))]
    }
}

/// Get the cache directory for the application
pub fn get_cache_dir(app_name: &str) -> PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join(app_name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_cpu_cores() {
        let cores = get_cpu_cores();
        assert!(cores >= 1);
    }

    #[test]
    fn test_get_recommended_threads() {
        let threads = get_recommended_threads();
        assert!(threads >= 1);
        assert!(threads <= get_cpu_cores());
    }

    #[test]
    fn test_get_cache_dir() {
        let cache = get_cache_dir("test-app");
        assert!(cache.to_string_lossy().contains("test-app"));
    }
}

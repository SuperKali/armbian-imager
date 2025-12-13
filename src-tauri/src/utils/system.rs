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
/// On Linux, when running as root via pkexec/sudo, uses the original user's cache directory
pub fn get_cache_dir(app_name: &str) -> PathBuf {
    #[cfg(target_os = "linux")]
    {
        // Check if running as root
        let euid = unsafe { libc::geteuid() };
        if euid == 0 {
            // Try to get the original user's home directory
            if let Some(home) = get_original_user_home() {
                let cache_dir = PathBuf::from(home).join(".cache").join(app_name);
                // Try to create the directory (may fail if permissions are wrong)
                let _ = std::fs::create_dir_all(&cache_dir);
                return cache_dir;
            }
        }
    }

    dirs::cache_dir()
        .or_else(|| dirs::data_local_dir())
        .or_else(|| std::env::temp_dir().parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(std::env::temp_dir)
        .join(app_name)
}

/// Get the original user's home directory when running as root via pkexec/sudo
#[cfg(target_os = "linux")]
fn get_original_user_home() -> Option<String> {
    use std::ffi::CStr;

    // Try PKEXEC_UID first (set by pkexec), then SUDO_UID
    let uid = std::env::var("PKEXEC_UID")
        .or_else(|_| std::env::var("SUDO_UID"))
        .ok()
        .and_then(|s| s.parse::<u32>().ok());

    if let Some(uid) = uid {
        unsafe {
            let pw = libc::getpwuid(uid);
            if !pw.is_null() {
                let home_ptr = (*pw).pw_dir;
                if !home_ptr.is_null() {
                    if let Ok(home) = CStr::from_ptr(home_ptr).to_str() {
                        return Some(home.to_string());
                    }
                }
            }
        }
    }

    // Fallback: check SUDO_USER and get their home
    if let Ok(sudo_user) = std::env::var("SUDO_USER") {
        unsafe {
            let user_cstr = std::ffi::CString::new(sudo_user).ok()?;
            let pw = libc::getpwnam(user_cstr.as_ptr());
            if !pw.is_null() {
                let home_ptr = (*pw).pw_dir;
                if !home_ptr.is_null() {
                    if let Ok(home) = CStr::from_ptr(home_ptr).to_str() {
                        return Some(home.to_string());
                    }
                }
            }
        }
    }

    None
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

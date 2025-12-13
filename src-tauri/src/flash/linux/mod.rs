//! Linux-specific flash implementation
//!
//! Uses direct device access after app is elevated via pkexec.
//! When request_authorization is called and we're not root,
//! pkexec is launched to restart the app with elevated privileges.

mod privileges;
mod writer;

pub use privileges::request_authorization;
pub use writer::flash_image;

/**
 * Badge configuration for desktop environments and kernel types
 */

export interface BadgeConfig {
  label: string;
  color: string;
}

/**
 * Desktop environment badges
 */
export const DESKTOP_BADGES: Record<string, BadgeConfig> = {
  'gnome': { label: 'GNOME', color: '#4a86cf' },
  'kde': { label: 'KDE', color: '#1d99f3' },
  'xfce': { label: 'XFCE', color: '#2284f2' },
  'cinnamon': { label: 'Cinnamon', color: '#dc682e' },
  'budgie': { label: 'Budgie', color: '#6a9fb5' },
  'mate': { label: 'MATE', color: '#9bda5a' },
  'lxde': { label: 'LXDE', color: '#a4a4a4' },
  'lxqt': { label: 'LXQt', color: '#0192d3' },
  'i3': { label: 'i3wm', color: '#1a8cff' },
  'sway': { label: 'Sway', color: '#68b0d8' },
};

/**
 * Kernel type badges
 */
export const KERNEL_BADGES: Record<string, BadgeConfig> = {
  'current': { label: 'Current', color: '#10b981' },
  'edge': { label: 'Edge', color: '#f59e0b' },
  'legacy': { label: 'Legacy', color: '#6b7280' },
  'vendor': { label: 'Vendor', color: '#8b5cf6' },
};

/**
 * List of desktop environment keys for filtering
 */
export const DESKTOP_ENVIRONMENTS = Object.keys(DESKTOP_BADGES);

/**
 * Get desktop environment from variant string
 */
export function getDesktopEnv(variant: string): string | null {
  const v = variant.toLowerCase();
  for (const key of DESKTOP_ENVIRONMENTS) {
    if (v.includes(key)) return key;
  }
  return null;
}

/**
 * Get kernel type from branch string
 */
export function getKernelType(branch: string): string | null {
  const b = branch.toLowerCase();
  for (const key of Object.keys(KERNEL_BADGES)) {
    if (b.includes(key)) return key;
  }
  return null;
}

// OS Logos
import debianLogo from './debian.svg';
import ubuntuLogo from './ubuntu.png';
import armbianLogo from '../armbian-logo.png';

// App Logos
import homeassistantLogo from './homeassistant.png';
import openmediavaultLogo from './openmediavault.jpeg';

export const osLogos: Record<string, string> = {
  debian: debianLogo,
  ubuntu: ubuntuLogo,
  armbian: armbianLogo,
};

export const appLogos: Record<string, string> = {
  homeassistant: homeassistantLogo,
  'home assistant': homeassistantLogo,
  openmediavault: openmediavaultLogo,
  omv: openmediavaultLogo,
};

// Debian codenames
const debianCodenames = ['bookworm', 'bullseye', 'trixie', 'sid', 'buster', 'stretch'];
// Ubuntu codenames
const ubuntuCodenames = ['jammy', 'noble', 'focal', 'kinetic', 'lunar', 'mantic'];

/**
 * Get the appropriate logo for an image based on distro release and preinstalled app
 * Priority: preinstalled app logo > OS logo based on distro > Armbian default
 * For custom images, also checks the filename for OS/app keywords
 */
export function getImageLogo(distroRelease: string, preinstalledApp?: string): string {
  // First check if there's a preinstalled app with a logo
  if (preinstalledApp) {
    const appKey = preinstalledApp.toLowerCase();
    for (const [key, logo] of Object.entries(appLogos)) {
      if (appKey.includes(key)) {
        return logo;
      }
    }
  }

  // Check OS based on distro release (also works for custom image filenames)
  const distro = distroRelease.toLowerCase();

  // Check for apps in filename (for custom images)
  for (const [key, logo] of Object.entries(appLogos)) {
    if (distro.includes(key)) {
      return logo;
    }
  }

  // Check Ubuntu codenames
  if (distro.includes('ubuntu') || ubuntuCodenames.some(c => distro.includes(c))) {
    return osLogos.ubuntu;
  }

  // Check Debian codenames
  if (distro.includes('debian') || debianCodenames.some(c => distro.includes(c))) {
    return osLogos.debian;
  }

  // Default to Armbian
  return osLogos.armbian;
}

/**
 * Get the OS name from distro release
 */
export function getOsName(distroRelease: string): string {
  const distro = distroRelease.toLowerCase();

  if (distro.includes('ubuntu') || ubuntuCodenames.some(c => distro.includes(c))) {
    return 'Ubuntu';
  }

  if (distro.includes('debian') || debianCodenames.some(c => distro.includes(c))) {
    return 'Debian';
  }

  return 'Armbian';
}

/**
 * Configuration exports
 */

// Manufacturer configuration
export {
  MANUFACTURERS,
  getManufacturer,
  getManufacturerLogoUrl,
  type ManufacturerConfig,
} from './manufacturers';

// OS/App information
export {
  OS_INFO,
  APP_INFO,
  getOsInfo,
  getAppInfo,
  type OsInfoConfig,
  type AppInfoConfig,
} from './os-info';

// Badge configuration
export {
  DESKTOP_BADGES,
  KERNEL_BADGES,
  DESKTOP_ENVIRONMENTS,
  getDesktopEnv,
  getKernelType,
  type BadgeConfig,
} from './badges';

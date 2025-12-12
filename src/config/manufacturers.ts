/**
 * Manufacturer definitions for board categorization
 */

export interface ManufacturerConfig {
  name: string;
  color: string;
  keywords: string[];
  logo?: string;
}

export const MANUFACTURERS: Record<string, ManufacturerConfig> = {
  'radxa': { name: 'Radxa', color: '#8b5cf6', keywords: ['radxa', 'rock-', 'rock5', 'rock3', 'rock4', 'rockpi'], logo: 'radxa.com' },
  'orangepi': { name: 'Orange Pi', color: '#f97316', keywords: ['orangepi', 'orange-pi'], logo: 'orangepi.org' },
  'bananapi': { name: 'Banana Pi', color: '#f59e0b', keywords: ['bananapi', 'bpi-'], logo: 'banana-pi.org' },
  'khadas': { name: 'Khadas', color: '#10b981', keywords: ['khadas', 'vim1', 'vim2', 'vim3', 'vim4', 'edge'], logo: 'khadas.com' },
  'hardkernel': { name: 'Hardkernel (ODROID)', color: '#3b82f6', keywords: ['odroid'], logo: 'hardkernel.com' },
  'pine64': { name: 'Pine64', color: '#06b6d4', keywords: ['pine64', 'pinebook', 'pinephone', 'rock64', 'quartz64', 'sopine', 'pinetab', 'star64', 'ox64'], logo: 'pine64.org' },
  'friendlyarm': { name: 'FriendlyElec', color: '#ec4899', keywords: ['nanopi', 'nanopc', 'friendlyelec', 'zeropi'], logo: 'friendlyelec.com' },
  'olimex': { name: 'Olimex', color: '#84cc16', keywords: ['olimex', 'lime', 'olinuxino'], logo: 'olimex.com' },
  'armsom': { name: 'ArmSoM', color: '#0ea5e9', keywords: ['armsom'], logo: 'armsom.org' },
  'libre': { name: 'Libre Computer', color: '#22c55e', keywords: ['lepotato', 'lafrite', 'libre', 'tritium', 'renegade', 'solitude', 'sweet-potato', 'libretech', 'potato', 'frite'], logo: 'libre.computer' },
  'asus': { name: 'ASUS Tinker', color: '#00529b', keywords: ['asus', 'tinker'], logo: 'asus.com' },
  'nvidia': { name: 'NVIDIA Jetson', color: '#76b900', keywords: ['jetson', 'nvidia', 'tegra'], logo: 'nvidia.com' },
  'beagle': { name: 'BeagleBoard', color: '#2e8b57', keywords: ['beagle', 'bone', 'pocketbeagle'], logo: 'beagleboard.org' },
  'solidrun': { name: 'SolidRun', color: '#dc2626', keywords: ['solidrun', 'hummingboard', 'cubox', 'clearfog', 'honeycomb', 'lx2k'], logo: 'solid-run.com' },
  'firefly': { name: 'Firefly', color: '#ff6600', keywords: ['firefly', 'roc-rk'], logo: 'en.t-firefly.com' },
  'starfive': { name: 'StarFive', color: '#7c3aed', keywords: ['starfive', 'visionfive', 'jh71'], logo: 'starfivetech.com' },
  'sipeed': { name: 'Sipeed', color: '#ea580c', keywords: ['sipeed', 'lichee', 'tang', 'maix'], logo: 'sipeed.com' },
  'milkv': { name: 'Milk-V', color: '#be185d', keywords: ['milkv', 'milk-v', 'mars', 'duo', 'pioneer'], logo: 'milkv.io' },
  'amlogic': { name: 'Amlogic TV Boxes', color: '#a855f7', keywords: ['aml-', 'wetek', 'ugoos', 'beelink', 'tanix', 'tx6', 'phicomm', 'n1', 'x96', 't95', 'h96', 'mecool'], logo: 'amlogic.com' },
  'rockchip': { name: 'Rockchip Generic', color: '#6366f1', keywords: ['rk3', 'station-m', 'station-p', 'miqi'], logo: 'rock-chips.com' },
  'allwinner': { name: 'Allwinner Generic', color: '#14b8a6', keywords: ['cubieboard', 'cubietruck', 'lamobo', 'pcduino', 'banana-pro', 'sunxi', 'a10', 'a20', 'h3', 'h5', 'h6', 'a64', 'h616'], logo: 'allwinnertech.com' },
  'marvell': { name: 'Marvell', color: '#2563eb', keywords: ['espressobin', 'marvell', 'macchiatobin', 'globalscale'], logo: 'marvell.com' },
  'helios': { name: 'Kobol/Helios', color: '#0891b2', keywords: ['helios', 'kobol'], logo: 'kobol.io' },
  'mediatek': { name: 'MediaTek', color: '#ffc107', keywords: ['mediatek', 'mt7', 'mt8'], logo: 'mediatek.com' },
  'bigtreetech': { name: 'BigTreeTech', color: '#16a34a', keywords: ['bigtreetech', 'btt', 'cb1', 'cb2'], logo: 'bigtree-tech.com' },
  'hinlink': { name: 'Hinlink', color: '#0891b2', keywords: ['hinlink', 'h28k', 'h66k', 'h68k', 'h88k'] },
  'embedfire': { name: 'EmbedFire', color: '#dc2626', keywords: ['embedfire', 'lubancat', 'wildfire'], logo: 'embedfire.com' },
  'mixtile': { name: 'Mixtile', color: '#0284c7', keywords: ['mixtile', 'blade'], logo: 'mixtile.com' },
  'cool-pi': { name: 'Cool Pi', color: '#0ea5e9', keywords: ['coolpi', 'cool-pi'], logo: 'cool-pi.com' },
  'uefi': { name: 'UEFI/Generic', color: '#64748b', keywords: ['uefi', 'generic', 'uefi-arm64', 'uefi-x86'] },
  'other': { name: 'Other Boards', color: '#64748b', keywords: [] },
};

/**
 * Get manufacturer ID from board slug and name
 */
export function getManufacturer(slug: string, name: string): string {
  const searchStr = (slug + ' ' + name).toLowerCase();
  for (const [key, config] of Object.entries(MANUFACTURERS)) {
    if (key === 'other') continue;
    if (config.keywords.some(kw => searchStr.includes(kw))) {
      return key;
    }
  }
  return 'other';
}

/**
 * Get manufacturer logo URL from domain
 */
export function getManufacturerLogoUrl(domain: string | undefined): string | null {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}?size=128`;
}

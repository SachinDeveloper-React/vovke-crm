import type { CustomShadows } from '../types';

import { themeVar } from '../theme-config';
import { varAlpha } from '../styles/utils';
import { opacity } from './opacity';
import { primary, secondary, info, success, warning, error, common } from './palette';

// ----------------------------------------------------------------------

/** Same per-scheme channel used by the elevation scale, see `./shadows.ts`. */
const shadowChannel = themeVar('palette-shadowChannel');

function colored(channel: string): string {
  return `0 8px 16px 0 ${varAlpha(channel, opacity.shadowColored)}`;
}

/**
 * Softer, offset-aware shadows used by cards, dropdowns and dialogs.
 * Every color comes from `colors.json`, through the palette channels.
 */
export function createCustomShadows(): CustomShadows {
  const soft = varAlpha(shadowChannel, opacity.shadowCustom);

  return {
    z1: `0 1px 2px 0 ${soft}`,
    z4: `0 4px 8px 0 ${soft}`,
    z8: `0 8px 16px 0 ${soft}`,
    z12: `0 12px 24px -4px ${soft}`,
    z16: `0 16px 32px -4px ${soft}`,
    z20: `0 20px 40px -4px ${soft}`,
    z24: `0 24px 48px 0 ${soft}`,
    card: `0 0 2px 0 ${varAlpha(shadowChannel, opacity.shadowKey)}, 0 12px 24px -4px ${varAlpha(
      shadowChannel,
      opacity.shadowAmbient
    )}`,
    dropdown: `0 0 2px 0 ${varAlpha(
      shadowChannel,
      opacity.shadowColored
    )}, -20px 20px 40px -4px ${varAlpha(shadowChannel, opacity.shadowColored)}`,
    /** Dialogs always sit on a black shadow so they read on both schemes. */
    dialog: `-40px 40px 80px -8px ${varAlpha(common.blackChannel, opacity.shadowColored)}`,
    primary: colored(primary.mainChannel),
    secondary: colored(secondary.mainChannel),
    info: colored(info.mainChannel),
    success: colored(success.mainChannel),
    warning: colored(warning.mainChannel),
    error: colored(error.mainChannel),
  };
}

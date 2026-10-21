import { getContrastRatio } from '@mui/material/styles';

import { createPaletteChannel, varAlpha } from '../styles/utils';
import { opacity } from './opacity';
import COLORS from './colors.json';

// ----------------------------------------------------------------------

/**
 * Colors
 *
 * `colors.json` is the single source of truth: every value below is either read
 * from it or derived from one of its channels.
 */
export const primary = createPaletteChannel(COLORS.primary);

export const secondary = createPaletteChannel(COLORS.secondary);

export const info = createPaletteChannel(COLORS.info);

export const success = createPaletteChannel(COLORS.success);

export const warning = createPaletteChannel(COLORS.warning);

export const error = createPaletteChannel(COLORS.error);

export const common = createPaletteChannel(COLORS.common);

export const grey = createPaletteChannel({
  ...COLORS.grey,
  /*
   * `colors.json` has no accent shades, but Material UI reads them for a few
   * component tokens (`Button.inheritContainedHoverBg`, `Avatar.defaultBg`, ...).
   * They are mapped onto the nearest tone of the scale above so no grey from
   * outside `colors.json` can leak into the theme.
   */
  A100: COLORS.grey['100'],
  A200: COLORS.grey['200'],
  A400: COLORS.grey['400'],
  A700: COLORS.grey['700'],
});

// ----------------------------------------------------------------------

/*
 * Text
 */
export const text = {
  light: createPaletteChannel({
    primary: grey['800'],
    secondary: grey['600'],
    disabled: grey['500'],
  }),
  dark: createPaletteChannel({
    primary: common.white,
    secondary: grey['500'],
    disabled: grey['600'],
  }),
};

/*
 * Background
 */
export const background = {
  light: createPaletteChannel({
    paper: common.white,
    default: common.white,
    neutral: grey['200'],
  }),
  dark: {
    ...createPaletteChannel({
      paper: grey['800'],
      default: grey['900'],
    }),
    /*
     * `colors.json` has no dedicated dark surface between `grey.900` and `grey.800`,
     * so the neutral surface is derived from the grey 500 channel.
     */
    neutral: varAlpha(grey['500Channel'], opacity.neutral),
    neutralChannel: grey['500Channel'],
  },
};

/*
 * Action
 *
 * Interaction states are the grey 500 channel at the shared alpha tokens.
 */
const baseAction = {
  hover: varAlpha(grey['500Channel'], opacity.hover),
  selected: varAlpha(grey['500Channel'], opacity.selected),
  focus: varAlpha(grey['500Channel'], opacity.focus),
  disabled: varAlpha(grey['500Channel'], opacity.disabled),
  disabledBackground: varAlpha(grey['500Channel'], opacity.disabledBackground),
  selectedChannel: grey['500Channel'],
  hoverOpacity: opacity.hover,
  selectedOpacity: opacity.selected,
  focusOpacity: opacity.focus,
  disabledOpacity: opacity.disabled,
  activatedOpacity: opacity.activated,
};

export const action = {
  light: {
    ...baseAction,
    active: grey['600'],
    activeChannel: grey['600Channel'],
  },
  dark: {
    ...baseAction,
    active: grey['500'],
    activeChannel: grey['500Channel'],
  },
};

// ----------------------------------------------------------------------

/*
 * CRM status colors, shared by both color schemes.
 */
export const statusPalette = {
  pending: {
    main: '#6D67E4',
    dark: '#6D67E4',
  },
  tkted: {
    main: '#28a745',
    dark: '#28a745',
  },
  manltkt: {
    main: '#218838',
    dark: '#218838',
  },
  holdtkt: {
    main: '#20c997',
    dark: '#20c997',
  },
  cancel: {
    main: '#dc3545',
    dark: '#dc3545',
  },
  test: {
    main: '#000',
    dark: '#000',
  },
  dupe: {
    main: '#6c757d',
    dark: '#6c757d',
  },
  refrqst: {
    main: '#FF71CD',
    dark: '#FF71CD',
  },
  refprcs: {
    main: '#D6589F',
    dark: '#D6589F',
  },
  refund: {
    main: '#D20062',
    dark: '#D20062',
  },
  bkgfail: {
    main: '#FF5B00',
    dark: '#FF5B00',
  },
  prehold: {
    main: '#B8621B',
    dark: '#B8621B',
  },
  inprogress: {
    main: '#050C9C',
    dark: '#050C9C',
  },
  new: {
    main: '#003355',
    dark: '#003355',
  },
  hot: {
    main: '#dc3545',
    dark: '#dc3545',
  },
  warm: {
    main: '#FF5B00',
    dark: '#FF5B00',
  },
  cold: {
    main: '#28a745',
    dark: '#28a745',
  },
};

// ----------------------------------------------------------------------

/**
 * Contrast text resolver, used by Material UI for the tokens it computes itself
 * (filled Alert, SnackbarContent, ...). The built-in version answers with its own
 * `#fff` / `rgba(0,0,0,0.87)` constants, this one answers from `colors.json`.
 *
 * `3` is Material UI's default `contrastThreshold`.
 */
export function getContrastText(background: string): string {
  return getContrastRatio(background, common.white) >= 3 ? common.white : grey['800'];
}

// ----------------------------------------------------------------------

/*
 * Base palette
 */
export const basePalette = {
  getContrastText,
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: varAlpha(grey['500Channel'], opacity.divider),
  dividerChannel: grey['500Channel'],
  ...statusPalette,
};

export const lightPalette = {
  ...basePalette,
  text: text.light,
  background: background.light,
  action: action.light,
  /**
   * `common.background` / `common.onBackground` back the canvas tokens Material UI
   * reads for overlays. They are pinned here so the defaults it would otherwise
   * inject (`#fff` / `#000`) come from `colors.json` instead.
   */
  common: {
    ...common,
    background: common.white,
    backgroundChannel: common.whiteChannel,
    onBackground: common.black,
    onBackgroundChannel: common.blackChannel,
  },
  /** Light surfaces cast a grey shadow. */
  shadowChannel: grey['500Channel'],
};

export const darkPalette = {
  ...basePalette,
  text: text.dark,
  background: background.dark,
  action: action.dark,
  common: {
    ...common,
    background: common.black,
    backgroundChannel: common.blackChannel,
    onBackground: common.white,
    onBackgroundChannel: common.whiteChannel,
  },
  /** Dark surfaces cast a black shadow. */
  shadowChannel: common.blackChannel,
};

// ----------------------------------------------------------------------

export const colorSchemes = {
  light: { palette: lightPalette },
  dark: { palette: darkPalette },
};

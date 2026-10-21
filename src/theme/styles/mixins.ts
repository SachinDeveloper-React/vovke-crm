
import type { CSSProperties } from 'react';

import type { Theme, SxProps } from '@mui/material/styles';

import { dividerClasses } from '@mui/material/Divider';
import { checkboxClasses } from '@mui/material/Checkbox';
import { menuItemClasses } from '@mui/material/MenuItem';
import { autocompleteClasses } from '@mui/material/Autocomplete';

import { CONFIG } from '@/src/config-global';

import { remToPx, varAlpha, mediaQueries } from './utils';

// ----------------------------------------------------------------------

type StyleObject = Record<string, unknown>;

type GradientProps = {
  color?: string;
  padding?: string | number;
};

type BgGradientProps = {
  color: string;
  imgUrl?: string;
  bgSize?: string;
};

type BgBlurProps = {
  color: string;
  blur?: number;
  imgUrl?: string;
};

type ResponsiveStyle = {
  fontSize?: string | number;
  lineHeight?: string | number;
  [key: string]: unknown;
};

type MaxLineProps = {
  line: number;
  persistent?: ResponsiveStyle;
};

type PaperProps = {
  theme: Theme;
  color?: string;
  dropdown?: boolean;
};

// ----------------------------------------------------------------------
// Hide Scrollbars
// ----------------------------------------------------------------------

export const hideScrollX = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
} satisfies SxProps<Theme>;

export const hideScrollY = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
} satisfies SxProps<Theme>;

// ----------------------------------------------------------------------
// Text Gradient
// ----------------------------------------------------------------------

export function textGradient(color: string): CSSProperties {
  return {
    background: `linear-gradient(${color})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  };
}

// ----------------------------------------------------------------------
// Border Gradient
// ----------------------------------------------------------------------

export function borderGradient({
  color,
  padding = '2px',
}: GradientProps): StyleObject {
  return {
    inset: 0,
    width: '100%',
    content: '""',
    height: '100%',
    margin: 'auto',
    position: 'absolute',
    borderRadius: 'inherit',
    padding,
    ...(color && {
      background: `linear-gradient(${color})`,
    }),
  };
}

// ----------------------------------------------------------------------
// Background Gradient
// ----------------------------------------------------------------------

export function bgGradient({
  color,
  imgUrl,
  bgSize,
}: BgGradientProps): StyleObject {
  if (imgUrl) {
    return {
      background: `linear-gradient(${color}), url(${imgUrl})`,
      backgroundSize: bgSize || 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
    };
  }

  return {
    background: `linear-gradient(${color})`,
  };
}

// ----------------------------------------------------------------------
// Background Blur
// ----------------------------------------------------------------------

export function bgBlur({
  color,
  blur = 6,
  imgUrl,
}: BgBlurProps): StyleObject {
  if (imgUrl) {
    return {
      position: 'relative',
      backgroundImage: `url(${imgUrl})`,
      '&::before': {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9,
        content: '""',
        width: '100%',
        height: '100%',
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backgroundColor: color,
      },
    };
  }

  return {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: color,
  };
}

// ----------------------------------------------------------------------
// Max Lines
// ----------------------------------------------------------------------

function getFontSize(
  fontSize: string | number | undefined
): number | undefined {
  if (fontSize === undefined) return undefined;

  return typeof fontSize === 'string' ? remToPx(fontSize) : fontSize;
}

function getLineHeight(
  lineHeight: string | number | undefined,
  fontSize: number | undefined
): number | undefined {
  if (lineHeight === undefined) return undefined;

  if (typeof lineHeight === 'string') {
    return fontSize ? remToPx(lineHeight) / fontSize : 1;
  }

  return lineHeight;
}

export function maxLine({
  line,
  persistent,
}: MaxLineProps): StyleObject {
  const baseStyles: StyleObject = {
    overflow: 'hidden',
    display: '-webkit-box',
    textOverflow: 'ellipsis',
    WebkitLineClamp: line,
    WebkitBoxOrient: 'vertical',
  };

  if (!persistent) return baseStyles;

  const fontSizeBase = getFontSize(persistent.fontSize);

  const getResponsiveFontSize = (key: string) => {
    const responsive = persistent[key] as ResponsiveStyle | undefined;
    return getFontSize(responsive?.fontSize);
  };

  const fontSizeSm = getResponsiveFontSize(mediaQueries.upSm);
  const fontSizeMd = getResponsiveFontSize(mediaQueries.upMd);
  const fontSizeLg = getResponsiveFontSize(mediaQueries.upLg);

  const lineHeight = getLineHeight(
    persistent.lineHeight,
    fontSizeBase
  );

  return {
    ...baseStyles,
    ...(lineHeight && {
      ...(fontSizeBase !== undefined && {
        height: fontSizeBase * lineHeight * line,
      }),
      ...(fontSizeSm !== undefined && {
        [mediaQueries.upSm]: {
          height: fontSizeSm * lineHeight * line,
        },
      }),
      ...(fontSizeMd !== undefined && {
        [mediaQueries.upMd]: {
          height: fontSizeMd * lineHeight * line,
        },
      }),
      ...(fontSizeLg !== undefined && {
        [mediaQueries.upLg]: {
          height: fontSizeLg * lineHeight * line,
        },
      }),
    }),
  };
}

// ----------------------------------------------------------------------
// Paper
// ----------------------------------------------------------------------


function getBorderRadius(theme: Theme): number {
  const { borderRadius } = theme.shape;

  return typeof borderRadius === 'number'
    ? borderRadius
    : Number.parseFloat(borderRadius) || 0;
}


export function paper({
  theme,
  color,
  dropdown = false,
}: PaperProps): StyleObject {
  return {
    ...bgBlur({
      color:
        color ??
        varAlpha(theme.vars.palette.background.paperChannel, 0.9),
      blur: 20,
    }),
    backgroundImage: `url(${CONFIG.assetsDir}/assets/core/cyan-blur.png), url(${CONFIG.assetsDir}/assets/core/red-blur.png)`,
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'top right, left bottom',
    backgroundSize: '50%, 50%',
    ...(theme.direction === 'rtl' && {
      backgroundPosition: 'top left, right bottom',
    }),
    ...(dropdown && {
      padding: theme.spacing(0.5),
      boxShadow: theme.customShadows.dropdown,
      borderRadius: `${getBorderRadius(theme) * 1.25}px`,
    }),
  };
}

// ----------------------------------------------------------------------
// Menu Item
// ----------------------------------------------------------------------

export function menuItem(theme: Theme): StyleObject {
  return {
    ...theme.typography.body2,
    padding: theme.spacing(0.75, 1),
    borderRadius: getBorderRadius(theme) * 0.75,
    '&:not(:last-of-type)': {
      marginBottom: 4,
    },
    [`&.${menuItemClasses.selected}`]: {
      fontWeight: theme.typography.fontWeightSemiBold,
      backgroundColor: theme.vars.palette.action.selected,
      '&:hover': {
        backgroundColor: theme.vars.palette.action.hover,
      },
    },
    [`& .${checkboxClasses.root}`]: {
      padding: theme.spacing(0.5),
      marginLeft: theme.spacing(-0.5),
      marginRight: theme.spacing(0.5),
    },
    [`&.${autocompleteClasses.option}[aria-selected="true"]`]: {
      backgroundColor: theme.vars.palette.action.selected,
      '&:hover': {
        backgroundColor: theme.vars.palette.action.hover,
      },
    },
    [`&+.${dividerClasses.root}`]: {
      margin: theme.spacing(0.5, 0),
    },
  };
}
// ----------------------------------------------------------------------

const HEX_REGEX = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;

export const stylesMode = {
  light: '[data-mui-color-scheme="light"] &',
  dark: '[data-mui-color-scheme="dark"] &',
};

export const mediaQueries = {
  upXs: '@media (min-width:0px)',
  upSm: '@media (min-width:600px)',
  upMd: '@media (min-width:900px)',
  upLg: '@media (min-width:1200px)',
  upXl: '@media (min-width:1536px)',
};


/**
 * Converts a hex color into the `R G B` channel format used by the
 * CSS theme variables, so it can be consumed with an arbitrary alpha.
 *
 * @example hexToRgbChannel('#00A76F') // '0 167 111'
 */
export function hexToRgbChannel(hex: string): string {
  if (!HEX_REGEX.test(hex)) {
    throw new Error(`[hexToRgbChannel] Invalid hex color: ${hex}`);
  }

  const value =
    hex.length === 4
      ? hex
          .slice(1)
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex.slice(1);

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

// ----------------------------------------------------------------------

export type PaletteChannel<T extends Record<string, string>> = T & {
  [K in keyof T & string as `${K}Channel`]: string;
};

/**
 * Adds a `{key}Channel` token next to every hex value of a palette node.
 *
 * Material UI only generates channels for its own palette keys, so the extra
 * tones coming from `colors.json` (`lighter`, `darker`, the grey scale, ...)
 * need their channels created here.
 */
export function createPaletteChannel<T extends Record<string, string>>(
  hexPalette: T
): PaletteChannel<T> {
  const palette: Record<string, string> = { ...hexPalette };

  for (const [key, value] of Object.entries(hexPalette)) {
    palette[`${key}Channel`] = hexToRgbChannel(value);
  }

  return palette as PaletteChannel<T>;
}

// ----------------------------------------------------------------------

/**
 * Applies an alpha to a channel token or to a CSS variable holding one.
 *
 * @example varAlpha(grey['500Channel'], 0.2) // 'rgba(145 158 171 / 0.2)'
 */
export function varAlpha(color: string, opacity = 1): string {
  const unsupported =
    color.startsWith('#') ||
    color.startsWith('rgb') ||
    color.startsWith('rgba') ||
    (!color.includes('var') && color.includes('Channel'));

  if (unsupported) {
    throw new Error(
      `[varAlpha] Unsupported color format: "${color}". Expected a channel value ("0 167 111") or a channel CSS variable.`
    );
  }

  return `rgba(${color} / ${opacity})`;
}

// ----------------------------------------------------------------------

const FONT_FALLBACKS = [
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(', ');

/**
 * Builds a font stack. `next/font` families are passed in as CSS variables
 * (see `src/app/layout.tsx`), anything else is quoted as a family name.
 */
export function setFont(fontFamily?: string): string {
  if (!fontFamily) {
    return FONT_FALLBACKS;
  }

  return fontFamily.startsWith('var(')
    ? `${fontFamily}, ${FONT_FALLBACKS}`
    : `"${fontFamily}", ${FONT_FALLBACKS}`;
}

// ----------------------------------------------------------------------

/**
 * `16px` based rem converter, kept aligned with `typography.htmlFontSize`.
 */
export function pxToRem(value: number): string {
  return `${value / 16}rem`;
}

export function remToPx(value: string): number {
  return Math.round(parseFloat(value) * 16);
}

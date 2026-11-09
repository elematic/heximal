import {css} from '@heximal/element';
import type {CSSResultOrNative} from 'lit';
import paletteStyles from '@radica/base/styles/palette.css' with {type: 'css'};
import colorStyles from '@radica/base/styles/color.css' with {type: 'css'};
import sizeStyles from '@radica/base/styles/size.css' with {type: 'css'};
import typographyStyles from '@radica/base/styles/typography.css' with {type: 'css'};
import controlStyles from '@radica/base/styles/control.css' with {type: 'css'};
import surfaceStyles from '@radica/base/styles/surface.css' with {type: 'css'};
import darkStyles from '@radica/base/styles/themes/dark.css' with {type: 'css'};

/**
 * Light / Default Theme Stylesheet for Radica.
 *
 * Maps all `--rad-*` tokens to their `--rad-default-*` values on `:root`,
 * `:host`, and `.rad-theme-light` so consumer stylesheets and slides can use
 * `var(--rad-*)` directly without needing `var(--rad-*, var(--rad-default-*))`
 * fallbacks.
 */
export const radicaLightThemeStyles = css`
  :root,
  :host,
  .rad-theme-light {
    --rad-lightness-direction: var(--rad-default-lightness-direction);

    /* Role Color Scales */
    --rad-color-primary-50: var(--rad-default-color-primary-50);
    --rad-color-primary-100: var(--rad-default-color-primary-100);
    --rad-color-primary-200: var(--rad-default-color-primary-200);
    --rad-color-primary-300: var(--rad-default-color-primary-300);
    --rad-color-primary-400: var(--rad-default-color-primary-400);
    --rad-color-primary-500: var(--rad-default-color-primary-500);
    --rad-color-primary-600: var(--rad-default-color-primary-600);
    --rad-color-primary-700: var(--rad-default-color-primary-700);
    --rad-color-primary-800: var(--rad-default-color-primary-800);
    --rad-color-primary-900: var(--rad-default-color-primary-900);
    --rad-color-primary-950: var(--rad-default-color-primary-950);

    --rad-color-success-50: var(--rad-default-color-success-50);
    --rad-color-success-100: var(--rad-default-color-success-100);
    --rad-color-success-200: var(--rad-default-color-success-200);
    --rad-color-success-300: var(--rad-default-color-success-300);
    --rad-color-success-400: var(--rad-default-color-success-400);
    --rad-color-success-500: var(--rad-default-color-success-500);
    --rad-color-success-600: var(--rad-default-color-success-600);
    --rad-color-success-700: var(--rad-default-color-success-700);
    --rad-color-success-800: var(--rad-default-color-success-800);
    --rad-color-success-900: var(--rad-default-color-success-900);
    --rad-color-success-950: var(--rad-default-color-success-950);

    --rad-color-warning-50: var(--rad-default-color-warning-50);
    --rad-color-warning-100: var(--rad-default-color-warning-100);
    --rad-color-warning-200: var(--rad-default-color-warning-200);
    --rad-color-warning-300: var(--rad-default-color-warning-300);
    --rad-color-warning-400: var(--rad-default-color-warning-400);
    --rad-color-warning-500: var(--rad-default-color-warning-500);
    --rad-color-warning-600: var(--rad-default-color-warning-600);
    --rad-color-warning-700: var(--rad-default-color-warning-700);
    --rad-color-warning-800: var(--rad-default-color-warning-800);
    --rad-color-warning-900: var(--rad-default-color-warning-900);
    --rad-color-warning-950: var(--rad-default-color-warning-950);

    --rad-color-danger-50: var(--rad-default-color-danger-50);
    --rad-color-danger-100: var(--rad-default-color-danger-100);
    --rad-color-danger-200: var(--rad-default-color-danger-200);
    --rad-color-danger-300: var(--rad-default-color-danger-300);
    --rad-color-danger-400: var(--rad-default-color-danger-400);
    --rad-color-danger-500: var(--rad-default-color-danger-500);
    --rad-color-danger-600: var(--rad-default-color-danger-600);
    --rad-color-danger-700: var(--rad-default-color-danger-700);
    --rad-color-danger-800: var(--rad-default-color-danger-800);
    --rad-color-danger-900: var(--rad-default-color-danger-900);
    --rad-color-danger-950: var(--rad-default-color-danger-950);

    --rad-color-neutral-0: var(--rad-default-color-neutral-0);
    --rad-color-neutral-50: var(--rad-default-color-neutral-50);
    --rad-color-neutral-100: var(--rad-default-color-neutral-100);
    --rad-color-neutral-200: var(--rad-default-color-neutral-200);
    --rad-color-neutral-300: var(--rad-default-color-neutral-300);
    --rad-color-neutral-400: var(--rad-default-color-neutral-400);
    --rad-color-neutral-500: var(--rad-default-color-neutral-500);
    --rad-color-neutral-600: var(--rad-default-color-neutral-600);
    --rad-color-neutral-700: var(--rad-default-color-neutral-700);
    --rad-color-neutral-800: var(--rad-default-color-neutral-800);
    --rad-color-neutral-900: var(--rad-default-color-neutral-900);
    --rad-color-neutral-950: var(--rad-default-color-neutral-950);
    --rad-color-neutral-1000: var(--rad-default-color-neutral-1000);

    /* Primary Intensity Tokens */
    --rad-primary-fill-ghost: var(--rad-default-primary-fill-ghost);
    --rad-primary-fill-subtle: var(--rad-default-primary-fill-subtle);
    --rad-primary-fill-soft: var(--rad-default-primary-fill-soft);
    --rad-primary-fill-moderate: var(--rad-default-primary-fill-moderate);
    --rad-primary-fill-solid: var(--rad-default-primary-fill-solid);
    --rad-primary-fill-bold: var(--rad-default-primary-fill-bold);
    --rad-primary-fill-intense: var(--rad-default-primary-fill-intense);
    --rad-primary-stroke-faint: var(--rad-default-primary-stroke-faint);
    --rad-primary-stroke-subtle: var(--rad-default-primary-stroke-subtle);
    --rad-primary-stroke-moderate: var(--rad-default-primary-stroke-moderate);
    --rad-primary-stroke-strong: var(--rad-default-primary-stroke-strong);
    --rad-primary-text-on-solid: var(--rad-default-primary-text-on-solid);
    --rad-primary-text-emphasis: var(--rad-default-primary-text-emphasis);
    --rad-primary-text-normal: var(--rad-default-primary-text-normal);
    --rad-primary-text-muted: var(--rad-default-primary-text-muted);

    /* Success Intensity Tokens */
    --rad-success-fill-ghost: var(--rad-default-success-fill-ghost);
    --rad-success-fill-subtle: var(--rad-default-success-fill-subtle);
    --rad-success-fill-soft: var(--rad-default-success-fill-soft);
    --rad-success-fill-moderate: var(--rad-default-success-fill-moderate);
    --rad-success-fill-solid: var(--rad-default-success-fill-solid);
    --rad-success-fill-bold: var(--rad-default-success-fill-bold);
    --rad-success-fill-intense: var(--rad-default-success-fill-intense);
    --rad-success-stroke-faint: var(--rad-default-success-stroke-faint);
    --rad-success-stroke-subtle: var(--rad-default-success-stroke-subtle);
    --rad-success-stroke-moderate: var(--rad-default-success-stroke-moderate);
    --rad-success-stroke-strong: var(--rad-default-success-stroke-strong);
    --rad-success-text-on-solid: var(--rad-default-success-text-on-solid);
    --rad-success-text-emphasis: var(--rad-default-success-text-emphasis);
    --rad-success-text-normal: var(--rad-default-success-text-normal);
    --rad-success-text-muted: var(--rad-default-success-text-muted);

    /* Warning Intensity Tokens */
    --rad-warning-fill-ghost: var(--rad-default-warning-fill-ghost);
    --rad-warning-fill-subtle: var(--rad-default-warning-fill-subtle);
    --rad-warning-fill-soft: var(--rad-default-warning-fill-soft);
    --rad-warning-fill-moderate: var(--rad-default-warning-fill-moderate);
    --rad-warning-fill-solid: var(--rad-default-warning-fill-solid);
    --rad-warning-fill-bold: var(--rad-default-warning-fill-bold);
    --rad-warning-fill-intense: var(--rad-default-warning-fill-intense);
    --rad-warning-stroke-faint: var(--rad-default-warning-stroke-faint);
    --rad-warning-stroke-subtle: var(--rad-default-warning-stroke-subtle);
    --rad-warning-stroke-moderate: var(--rad-default-warning-stroke-moderate);
    --rad-warning-stroke-strong: var(--rad-default-warning-stroke-strong);
    --rad-warning-text-on-solid: var(--rad-default-warning-text-on-solid);
    --rad-warning-text-emphasis: var(--rad-default-warning-text-emphasis);
    --rad-warning-text-normal: var(--rad-default-warning-text-normal);
    --rad-warning-text-muted: var(--rad-default-warning-text-muted);

    /* Danger Intensity Tokens */
    --rad-danger-fill-ghost: var(--rad-default-danger-fill-ghost);
    --rad-danger-fill-subtle: var(--rad-default-danger-fill-subtle);
    --rad-danger-fill-soft: var(--rad-default-danger-fill-soft);
    --rad-danger-fill-moderate: var(--rad-default-danger-fill-moderate);
    --rad-danger-fill-solid: var(--rad-default-danger-fill-solid);
    --rad-danger-fill-bold: var(--rad-default-danger-fill-bold);
    --rad-danger-fill-intense: var(--rad-default-danger-fill-intense);
    --rad-danger-stroke-faint: var(--rad-default-danger-stroke-faint);
    --rad-danger-stroke-subtle: var(--rad-default-danger-stroke-subtle);
    --rad-danger-stroke-moderate: var(--rad-default-danger-stroke-moderate);
    --rad-danger-stroke-strong: var(--rad-default-danger-stroke-strong);
    --rad-danger-text-on-solid: var(--rad-default-danger-text-on-solid);
    --rad-danger-text-emphasis: var(--rad-default-danger-text-emphasis);
    --rad-danger-text-normal: var(--rad-default-danger-text-normal);
    --rad-danger-text-muted: var(--rad-default-danger-text-muted);

    /* Neutral Intensity Tokens */
    --rad-neutral-fill-ghost: var(--rad-default-neutral-fill-ghost);
    --rad-neutral-fill-subtle: var(--rad-default-neutral-fill-subtle);
    --rad-neutral-fill-soft: var(--rad-default-neutral-fill-soft);
    --rad-neutral-fill-moderate: var(--rad-default-neutral-fill-moderate);
    --rad-neutral-fill-solid: var(--rad-default-neutral-fill-solid);
    --rad-neutral-fill-bold: var(--rad-default-neutral-fill-bold);
    --rad-neutral-fill-intense: var(--rad-default-neutral-fill-intense);
    --rad-neutral-stroke-faint: var(--rad-default-neutral-stroke-faint);
    --rad-neutral-stroke-subtle: var(--rad-default-neutral-stroke-subtle);
    --rad-neutral-stroke-moderate: var(--rad-default-neutral-stroke-moderate);
    --rad-neutral-stroke-strong: var(--rad-default-neutral-stroke-strong);
    --rad-neutral-text-on-solid: var(--rad-default-neutral-text-on-solid);
    --rad-neutral-text-emphasis: var(--rad-default-neutral-text-emphasis);
    --rad-neutral-text-normal: var(--rad-default-neutral-text-normal);
    --rad-neutral-text-muted: var(--rad-default-neutral-text-muted);

    /* Surface & Container Tokens */
    --rad-surface: var(--rad-default-surface);
    --rad-on-surface: var(--rad-default-on-surface);
    --rad-on-surface-muted: var(--rad-default-neutral-text-muted);
    --rad-surface-raised: var(--rad-default-surface-raised);
    --rad-on-surface-raised: var(--rad-default-on-surface-raised);
    --rad-on-surface-raised-muted: var(--rad-default-neutral-text-muted);
    --rad-surface-sunken: var(--rad-default-surface-sunken);
    --rad-on-surface-sunken: var(--rad-default-on-surface-sunken);
    --rad-on-surface-sunken-muted: var(--rad-default-neutral-text-muted);
    --rad-surface-overlay: var(--rad-default-surface-overlay);
    --rad-on-surface-overlay: var(--rad-default-on-surface-overlay);
    --rad-on-surface-overlay-muted: var(--rad-default-neutral-text-muted);
    --rad-surface-chrome: var(--rad-default-surface-chrome);
    --rad-on-surface-chrome: var(--rad-default-on-surface-chrome);
    --rad-on-surface-chrome-muted: var(--rad-default-neutral-text-muted);

    --rad-primary-container: var(--rad-default-primary-container);
    --rad-on-primary-container: var(--rad-default-on-primary-container);
    --rad-success-container: var(--rad-default-success-container);
    --rad-on-success-container: var(--rad-default-on-success-container);
    --rad-warning-container: var(--rad-default-warning-container);
    --rad-on-warning-container: var(--rad-default-on-warning-container);
    --rad-danger-container: var(--rad-default-danger-container);
    --rad-on-danger-container: var(--rad-default-on-danger-container);

    --rad-shadow-x-small: var(--rad-default-shadow-x-small);
    --rad-shadow-small: var(--rad-default-shadow-small);
    --rad-shadow-medium: var(--rad-default-shadow-medium);
    --rad-shadow-large: var(--rad-default-shadow-large);
    --rad-shadow-x-large: var(--rad-default-shadow-x-large);
    --rad-overlay-background-color: var(--rad-default-overlay-background-color);
    --rad-panel-border-width: var(--rad-default-panel-border-width);
    --rad-menu-max-width: var(--rad-default-menu-max-width);
    --rad-z-index-drawer: var(--rad-default-z-index-drawer);
    --rad-z-index-dialog: var(--rad-default-z-index-dialog);
    --rad-z-index-dropdown: var(--rad-default-z-index-dropdown);
    --rad-z-index-toast: var(--rad-default-z-index-toast);
    --rad-z-index-tooltip: var(--rad-default-z-index-tooltip);

    /* Sizes - Semantic & Numeric */
    --rad-size-xx-small: var(--rad-default-size-xx-small);
    --rad-size-x-small: var(--rad-default-size-x-small);
    --rad-size-small: var(--rad-default-size-small);
    --rad-size-medium: var(--rad-default-size-medium);
    --rad-size-large: var(--rad-default-size-large);
    --rad-size-x-large: var(--rad-default-size-x-large);
    --rad-size-xx-large: var(--rad-default-size-xx-large);

    --rad-size-1: var(--rad-default-size-1);
    --rad-size-2: var(--rad-default-size-2);
    --rad-size-3: var(--rad-default-size-3);
    --rad-size-4: var(--rad-default-size-4);
    --rad-size-5: var(--rad-default-size-5);
    --rad-size-6: var(--rad-default-size-6);
    --rad-size-7: var(--rad-default-size-7);
    --rad-size-8: var(--rad-default-size-8);
    --rad-size-9: var(--rad-default-size-9);
    --rad-size-10: var(--rad-default-size-10);
    --rad-size-11: var(--rad-default-size-11);
    --rad-size-12: var(--rad-default-size-12);
    --rad-size-13: var(--rad-default-size-13);
    --rad-size-14: var(--rad-default-size-14);
    --rad-size-15: var(--rad-default-size-15);

    --rad-size-fluid-1: var(--rad-default-size-fluid-1);
    --rad-size-fluid-2: var(--rad-default-size-fluid-2);
    --rad-size-fluid-3: var(--rad-default-size-fluid-3);
    --rad-size-fluid-4: var(--rad-default-size-fluid-4);
    --rad-size-fluid-5: var(--rad-default-size-fluid-5);

    --rad-size-content-1: var(--rad-default-size-content-1);
    --rad-size-content-2: var(--rad-default-size-content-2);
    --rad-size-content-3: var(--rad-default-size-content-3);
    --rad-size-header-1: var(--rad-default-size-header-1);
    --rad-size-header-2: var(--rad-default-size-header-2);
    --rad-size-header-3: var(--rad-default-size-header-3);

    /* Spacing */
    --rad-spacing-3x-small: var(--rad-default-spacing-3x-small);
    --rad-spacing-2x-small: var(--rad-default-spacing-2x-small);
    --rad-spacing-x-small: var(--rad-default-spacing-x-small);
    --rad-spacing-small: var(--rad-default-spacing-small);
    --rad-spacing-medium: var(--rad-default-spacing-medium);
    --rad-spacing-large: var(--rad-default-spacing-large);
    --rad-spacing-x-large: var(--rad-default-spacing-x-large);
    --rad-spacing-2x-large: var(--rad-default-spacing-2x-large);
    --rad-spacing-3x-large: var(--rad-default-spacing-3x-large);
    --rad-spacing-4x-large: var(--rad-default-spacing-4x-large);

    /* Border Radii */
    --rad-radius-1: var(--rad-default-radius-1);
    --rad-radius-2: var(--rad-default-radius-2);
    --rad-radius-3: var(--rad-default-radius-3);
    --rad-radius-4: var(--rad-default-radius-4);
    --rad-radius-5: var(--rad-default-radius-5);
    --rad-radius-6: var(--rad-default-radius-6);
    --rad-radius-round: var(--rad-default-radius-round);
    --rad-radius-pill: var(--rad-default-radius-pill);

    --rad-border-radius-x-small: var(--rad-default-border-radius-x-small);
    --rad-border-radius-small: var(--rad-default-border-radius-small);
    --rad-border-radius-medium: var(--rad-default-border-radius-medium);
    --rad-border-radius-large: var(--rad-default-border-radius-large);
    --rad-border-radius-x-large: var(--rad-default-border-radius-x-large);
    --rad-border-radius-xx-large: var(--rad-default-border-radius-xx-large);
    --rad-border-radius-circle: var(--rad-default-border-radius-circle);
    --rad-border-radius-pill: var(--rad-default-border-radius-pill);

    /* Border Widths & Shadows */
    --rad-border-size-1: var(--rad-default-border-size-1);
    --rad-border-size-2: var(--rad-default-border-size-2);
    --rad-border-size-3: var(--rad-default-border-size-3);
    --rad-border-size-4: var(--rad-default-border-size-4);
    --rad-border-size-5: var(--rad-default-border-size-5);

    --rad-shadow-1: var(--rad-default-shadow-1);
    --rad-shadow-2: var(--rad-default-shadow-2);
    --rad-shadow-3: var(--rad-default-shadow-3);
    --rad-shadow-4: var(--rad-default-shadow-4);
    --rad-shadow-5: var(--rad-default-shadow-5);
    --rad-shadow-6: var(--rad-default-shadow-6);

    /* Typography */
    --rad-font-sans: var(--rad-default-font-sans);
    --rad-font-mono: var(--rad-default-font-mono);
    --rad-font-serif: var(--rad-default-font-serif);

    --rad-font-size-2x-small: var(--rad-default-font-size-2x-small);
    --rad-font-size-x-small: var(--rad-default-font-size-x-small);
    --rad-font-size-small: var(--rad-default-font-size-small);
    --rad-font-size-medium: var(--rad-default-font-size-medium);
    --rad-font-size-large: var(--rad-default-font-size-large);
    --rad-font-size-x-large: var(--rad-default-font-size-x-large);
    --rad-font-size-2x-large: var(--rad-default-font-size-2x-large);
    --rad-font-size-3x-large: var(--rad-default-font-size-3x-large);
    --rad-font-size-4x-large: var(--rad-default-font-size-4x-large);

    --rad-font-size-00: var(--rad-default-font-size-00);
    --rad-font-size-0: var(--rad-default-font-size-0);
    --rad-font-size-1: var(--rad-default-font-size-1);
    --rad-font-size-2: var(--rad-default-font-size-2);
    --rad-font-size-3: var(--rad-default-font-size-3);
    --rad-font-size-4: var(--rad-default-font-size-4);
    --rad-font-size-5: var(--rad-default-font-size-5);
    --rad-font-size-6: var(--rad-default-font-size-6);
    --rad-font-size-7: var(--rad-default-font-size-7);
    --rad-font-size-8: var(--rad-default-font-size-8);

    --rad-font-weight-light: var(--rad-default-font-weight-light);
    --rad-font-weight-normal: var(--rad-default-font-weight-normal);
    --rad-font-weight-medium: var(--rad-default-font-weight-medium);
    --rad-font-weight-semibold: var(--rad-default-font-weight-semibold);
    --rad-font-weight-bold: var(--rad-default-font-weight-bold);

    --rad-font-weight-1: var(--rad-default-font-weight-1);
    --rad-font-weight-2: var(--rad-default-font-weight-2);
    --rad-font-weight-3: var(--rad-default-font-weight-3);
    --rad-font-weight-4: var(--rad-default-font-weight-4);
    --rad-font-weight-5: var(--rad-default-font-weight-5);
    --rad-font-weight-6: var(--rad-default-font-weight-6);
    --rad-font-weight-7: var(--rad-default-font-weight-7);
    --rad-font-weight-8: var(--rad-default-font-weight-8);
    --rad-font-weight-9: var(--rad-default-font-weight-9);

    --rad-line-height-none: var(--rad-default-line-height-none);
    --rad-line-height-tight: var(--rad-default-line-height-tight);
    --rad-line-height-snug: var(--rad-default-line-height-snug);
    --rad-line-height-normal: var(--rad-default-line-height-normal);
    --rad-line-height-relaxed: var(--rad-default-line-height-relaxed);
    --rad-line-height-loose: var(--rad-default-line-height-loose);

    --rad-line-height-00: var(--rad-default-line-height-00);
    --rad-line-height-0: var(--rad-default-line-height-0);
    --rad-line-height-1: var(--rad-default-line-height-1);
    --rad-line-height-2: var(--rad-default-line-height-2);
    --rad-line-height-3: var(--rad-default-line-height-3);
    --rad-line-height-4: var(--rad-default-line-height-4);
    --rad-line-height-5: var(--rad-default-line-height-5);

    --rad-letter-spacing-tighter: var(--rad-default-letter-spacing-tighter);
    --rad-letter-spacing-tight: var(--rad-default-letter-spacing-tight);
    --rad-letter-spacing-normal: var(--rad-default-letter-spacing-normal);
    --rad-letter-spacing-wide: var(--rad-default-letter-spacing-wide);
    --rad-letter-spacing-wider: var(--rad-default-letter-spacing-wider);
    --rad-letter-spacing-widest: var(--rad-default-letter-spacing-widest);

    --rad-text-title: var(--rad-default-text-title);
    --rad-text-heading: var(--rad-default-text-heading);
    --rad-text-subheading: var(--rad-default-text-subheading);
    --rad-text-body: var(--rad-default-text-body);
    --rad-text-caption: var(--rad-default-text-caption);
    --rad-text-link: var(--rad-default-text-link);
    --rad-text-link-hover: var(--rad-default-text-link-hover);
    --rad-text-link-visited: var(--rad-default-text-link-visited);
  }
`;

/**
 * Radica normalize styles adapted for Shadow DOM (`:where(html, :host)`).
 * Uses `:where()` so custom slide and component styles layer on top cleanly.
 */
export const radicaNormalizeStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :where(html, :host) {
    font-family: var(--rad-font-sans);
    line-height: var(--rad-line-height-3);
    color: var(--rad-on-surface);
    -webkit-text-size-adjust: none;

    --link: var(--rad-primary-text-normal);
    --link-visited: var(--rad-primary-text-muted);
    --text-1: var(--rad-on-surface);
    --text-2: var(--rad-neutral-text-muted);
    --surface-1: var(--rad-surface);
    --surface-2: var(--rad-surface-sunken);
    --surface-3: var(--rad-neutral-fill-soft);
    --surface-4: var(--rad-neutral-stroke-subtle);
  }

  :where(h1, h2, h3, h4, h5, h6) {
    line-height: var(--rad-line-height-1);
    font-weight: var(--rad-font-weight-7);
    text-wrap: balance;
    margin: 0;
  }

  :where(h1) {
    font-size: var(--rad-font-size-7);
  }
  :where(h2) {
    font-size: var(--rad-font-size-6);
  }
  :where(h3) {
    font-size: var(--rad-font-size-5);
    font-weight: var(--rad-font-weight-6);
  }
  :where(h4) {
    font-size: var(--rad-font-size-4);
  }
  :where(h5) {
    font-size: var(--rad-font-size-3);
  }

  :where(p, ul, ol, dl, h6) {
    font-size: var(--rad-font-size-2);
    margin-block: 0;
  }

  :where(a) {
    color: var(--link);
    text-underline-offset: 2px;
  }

  :where(a:not(:hover)) {
    text-decoration: none;
  }

  :where(img, svg, video, canvas, audio, iframe, embed, object) {
    display: block;
  }

  :where(input, button, textarea, select) {
    font: inherit;
    font-size: inherit;
    color: inherit;
    letter-spacing: inherit;
  }

  :where(input:not([type='range']), textarea) {
    padding-inline: var(--rad-size-2);
    padding-block: var(--rad-size-1);
  }

  :where(
    textarea,
    select,
    input:not([type='button'], [type='submit'], [type='reset'])
  ) {
    background-color: var(--surface-2);
    border: var(--rad-border-size-1) solid var(--surface-4);
    border-radius: var(--rad-radius-2);
  }

  :where(code, kbd, samp, pre) {
    font-family: var(--rad-font-mono);
  }

  :where(:not(pre) > code, kbd) {
    white-space: nowrap;
  }

  :where(pre) {
    white-space: pre;
    min-inline-size: 0;
    margin: 0;
  }

  :where(:not(pre) > code) {
    padding: var(--rad-size-1) var(--rad-size-2);
    background: var(--surface-2);
    border-radius: var(--rad-radius-2);
  }

  :where(ol, ul) {
    padding-inline-start: var(--rad-size-6);
  }

  :where(li) {
    padding-inline-start: var(--rad-size-1);
  }

  :where(blockquote) {
    display: grid;
    gap: var(--rad-size-3);
    padding-block: var(--rad-size-3);
    padding-inline: var(--rad-size-4);
    border-inline-start: var(--rad-border-size-3) solid
      var(--rad-primary-stroke-strong);
  }

  :where(hr) {
    border: none;
    height: var(--rad-border-size-1);
    background-color: var(--surface-4);
  }
`;

export const radicaStyles: CSSResultOrNative[] = [
  paletteStyles,
  colorStyles,
  sizeStyles,
  typographyStyles,
  controlStyles,
  surfaceStyles,
  radicaLightThemeStyles,
  darkStyles,
  radicaNormalizeStyles,
];

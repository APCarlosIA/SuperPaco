/**
 * @file Caché de los gráficos generados para cada tema (baldosas y fondo).
 *
 * Generar un fondo cuesta unos milisegundos; con esta caché solo se hace la
 * primera vez que se visita cada ciudad, no cada vez que Paco pierde una vida.
 */
import { THEMES } from '../world/themes.js';
import { createTileImages } from './tileImages.js';
import { createBackgroundImages } from './backgroundImages.js';

/** @type {Map<string, {theme: Object, tileImages: Object, backgroundImages: Object}>} */
const assetsByThemeName = new Map();

/**
 * Devuelve (creándolos si hace falta) el tema y sus gráficos.
 * @param {string} themeName Clave de THEMES.
 * @returns {{theme: import('../world/themes.js').Theme,
 *            tileImages: import('./tileImages.js').TileImages,
 *            backgroundImages: import('./backgroundImages.js').BackgroundImages}}
 */
export function getThemeAssets(themeName) {
  if (!assetsByThemeName.has(themeName)) {
    const theme = THEMES[themeName];
    assetsByThemeName.set(themeName, {
      theme,
      tileImages: createTileImages(theme),
      backgroundImages: createBackgroundImages(theme)
    });
  }
  return assetsByThemeName.get(themeName);
}

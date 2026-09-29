/**
 * @file Paleta de colores del pixel art.
 *
 * Los sprites se escriben como texto: cada carácter es un píxel y la letra
 * indica su color según esta tabla. El punto '.' significa transparente.
 * Cada sprite puede sustituir algunos colores (por ejemplo, el chándal verde
 * de Paco cuando come un pimiento de Padrón).
 */

/** Carácter que representa un píxel transparente. */
export const TRANSPARENT_PIXEL = '.';

/** Color de cada letra usada en los mapas de píxeles. */
export const PIXEL_COLORS = Object.freeze({
  K: '#000000', // negro
  k: '#3c3c44', // gris muy oscuro
  g: '#7c7c84', // gris medio
  w: '#bcbcc4', // gris claro
  W: '#fcfcfc', // blanco
  S: '#fcbc8c', // piel
  s: '#d8845c', // piel en sombra
  p: '#f87858', // piel quemada por el sol (guiris)
  q: '#c83c28', // quemadura intensa
  R: '#d82800', // rojo
  r: '#881400', // rojo oscuro
  O: '#fc7c00', // naranja
  Y: '#fcd800', // amarillo
  y: '#c89800', // amarillo oscuro
  B: '#8c4c1c', // marrón
  b: '#502800', // marrón oscuro
  T: '#f0d0a0', // beige / pan
  t: '#c8a070', // beige oscuro
  G: '#00a844', // verde
  L: '#8cd818', // verde lima
  D: '#005820', // verde oscuro
  U: '#2050e8', // azul
  u: '#1c2878', // azul marino
  C: '#3cbcfc', // celeste
  c: '#0070b8', // azul océano
  M: '#a048d8', // morado
  m: '#5c2088', // morado oscuro
  P: '#fca0c0', // rosa
  V: '#c83c78', // magenta
  v: '#7c1c48'  // magenta oscuro
});

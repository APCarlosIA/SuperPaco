/**
 * @file Medidas compartidas de los fondos (sin dependencias, para no crear
 * ciclos entre el generador de fondos y sus herramientas).
 */

/** Ancho de las capas del fondo; se repiten para cubrir el nivel entero. */
export const BACKGROUND_LAYER_WIDTH = 512;

/** Fracción del movimiento de la cámara que recorre cada capa (más lejos = más lento). */
export const PARALLAX_FACTORS = Object.freeze({ farLayer: 0.1, midLayer: 0.28, nearLayer: 0.55, frontLayer: 1.35 });

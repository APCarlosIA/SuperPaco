/**
 * @file Plataforma que va y viene en horizontal o en vertical (colchonetas,
 * vagones de metro, tablones…). Paco puede subirse encima y lo transporta.
 */
import { TILE_SIZE } from '../config/constants.js';
import { fillRectangle } from '../core/canvas.js';
import { Entity } from './Entity.js';

const PLATFORM_THICKNESS = 8;

export class MovingPlatform extends Entity {
  /**
   * @param {number} column Columna inicial.
   * @param {number} row Fila inicial de su superficie.
   * @param {Object} settings
   * @param {number} settings.lengthInTiles
   * @param {'horizontal'|'vertical'} settings.axis
   * @param {number} settings.travelInTiles Recorrido (negativo = hacia la izquierda o arriba).
   * @param {number} settings.speed Píxeles por paso.
   * @param {string} look Aspecto según el tema ('wood', 'inflatable', 'metroCar', 'stone').
   */
  constructor(column, row, { lengthInTiles, axis, travelInTiles, speed }, look) {
    super(column * TILE_SIZE, row * TILE_SIZE, lengthInTiles * TILE_SIZE, PLATFORM_THICKNESS);
    this.isMovingPlatform = true;
    this.axis = axis;
    this.speed = speed;
    this.look = look;
    // Extremos del recorrido en píxeles.
    const start = axis === 'horizontal' ? this.x : this.y;
    const end = start + travelInTiles * TILE_SIZE;
    this.travelMinimum = Math.min(start, end);
    this.travelMaximum = Math.max(start, end);
    /** Sentido actual del movimiento: 1 hacia la derecha/abajo, -1 al revés. */
    this.travelDirection = travelInTiles < 0 ? -1 : 1;
    /** Cuánto se ha movido en el último paso; Paco se mueve lo mismo si va encima. */
    this.deltaX = 0;
    this.deltaY = 0;
  }

  /** Avanza por su recorrido y da la vuelta en los extremos. */
  update() {
    const previousX = this.x;
    const previousY = this.y;
    const property = this.axis === 'horizontal' ? 'x' : 'y';
    this[property] += this.speed * this.travelDirection;
    if (this[property] >= this.travelMaximum) {
      this[property] = this.travelMaximum;
      this.travelDirection = -1;
    } else if (this[property] <= this.travelMinimum) {
      this[property] = this.travelMinimum;
      this.travelDirection = 1;
    }
    this.deltaX = this.x - previousX;
    this.deltaY = this.y - previousY;
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = Math.round(this.x - cameraX);
    const y = Math.round(this.y);
    switch (this.look) {
      case 'inflatable': // Colchoneta hinchable de rayas.
        for (let offset = 0; offset < this.width; offset += 8) fillRectangle(context, x + offset, y, 8, 7, (offset / 8) % 2 ? '#fcfcfc' : '#fc5ca8');
        fillRectangle(context, x, y, this.width, 1, '#fcd0e8');
        fillRectangle(context, x, y + 7, this.width, 1, '#a02c68');
        break;
      case 'metroCar': // Techo de un vagón de metro.
        fillRectangle(context, x, y, this.width, 8, '#e8e8f0');
        fillRectangle(context, x, y + 3, this.width, 2, '#2c50c8');
        fillRectangle(context, x, y + 7, this.width, 1, '#5c5c6c');
        for (let offset = 6; offset < this.width - 6; offset += 12) fillRectangle(context, x + offset, y + 1, 6, 2, '#3c4458');
        break;
      case 'stone': // Losa de piedra con remaches.
        fillRectangle(context, x, y, this.width, 8, '#6c6474');
        fillRectangle(context, x, y, this.width, 1, '#a89cb0');
        fillRectangle(context, x, y + 7, this.width, 1, '#2c2434');
        for (let offset = 4; offset < this.width; offset += 8) fillRectangle(context, x + offset, y + 3, 2, 2, '#2c2434');
        break;
      default: // Tablón de madera.
        fillRectangle(context, x, y, this.width, 7, '#a0642c');
        fillRectangle(context, x, y, this.width, 1, '#dca060');
        fillRectangle(context, x, y + 7, this.width, 1, '#4c2c10');
        for (let offset = 0; offset < this.width; offset += 16) fillRectangle(context, x + offset + 2, y + 3, 1, 1, '#4c2c10');
    }
  }
}

/**
 * @file Plataforma que va y viene en horizontal o en vertical (colchonetas,
 * vagones de metro, tablones…). Paco puede subirse encima y lo transporta.
 */
import { TILE_SIZE } from '../config/constants.js';
import { roundedPath, fillWithOutline } from '../graphics/shapes.js';
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
    const x = this.x - cameraX;
    const y = this.y;
    const width = this.width;
    switch (this.look) {
      case 'inflatable': { // Colchoneta hinchable de rayas.
        roundedPath(context, x, y, width, 8, 4);
        fillWithOutline(context, '#ff9acb', '#d83c88', y, y + 8, 0.9);
        context.save();
        roundedPath(context, x, y, width, 8, 4);
        context.clip();
        context.fillStyle = '#ffffff';
        for (let offset = 4; offset < width; offset += 16) context.fillRect(x + offset, y, 8, 8);
        context.fillStyle = 'rgba(255,255,255,0.45)';
        context.fillRect(x + 3, y + 1, width - 6, 1.6);
        context.restore();
        break;
      }
      case 'metroCar': { // Techo de un vagón de metro.
        roundedPath(context, x, y, width, 8, 2);
        fillWithOutline(context, '#ffffff', '#b8bed0', y, y + 8, 0.9);
        context.fillStyle = '#2c50c8';
        context.fillRect(x + 1, y + 3, width - 2, 2);
        context.fillStyle = '#fff2a8';
        for (let offset = 5; offset < width - 8; offset += 12) { roundedPath(context, x + offset, y + 0.8, 6, 1.8, 0.8); context.fill(); }
        break;
      }
      case 'stone': { // Losa de piedra con remaches.
        roundedPath(context, x, y, width, 8, 1.6);
        fillWithOutline(context, '#a89cb8', '#4a4258', y, y + 8, 0.9);
        context.fillStyle = 'rgba(255,255,255,0.35)';
        context.fillRect(x + 1, y + 0.8, width - 2, 0.8);
        for (let offset = 4; offset < width; offset += 8) {
          context.fillStyle = '#2c2434';
          context.beginPath(); context.arc(x + offset, y + 4.4, 0.9, 0, Math.PI * 2); context.fill();
        }
        break;
      }
      default: { // Tablón de madera.
        roundedPath(context, x, y, width, 8, 1.6);
        fillWithOutline(context, '#d49a58', '#8a5a28', y, y + 8, 0.9);
        context.strokeStyle = 'rgba(70,36,10,0.45)';
        context.lineWidth = 0.4;
        for (const lineY of [2.6, 5]) { context.beginPath(); context.moveTo(x + 1, y + lineY); context.bezierCurveTo(x + width * 0.3, y + lineY - 0.7, x + width * 0.7, y + lineY + 0.7, x + width - 1, y + lineY); context.stroke(); }
        context.fillStyle = '#3a2008';
        for (let offset = 3; offset < width; offset += 16) { context.beginPath(); context.arc(x + offset, y + 4, 0.6, 0, Math.PI * 2); context.fill(); }
        context.fillStyle = 'rgba(255,255,255,0.3)';
        context.fillRect(x + 1.2, y + 0.9, width - 2.4, 0.7);
      }
    }
  }
}

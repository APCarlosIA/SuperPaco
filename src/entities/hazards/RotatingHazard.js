/**
 * @file Peligros que giran alrededor de un eje:
 *   - Barra de churros ardientes del castillo (un solo brazo).
 *   - Aspas de los molinos de La Mancha (cuatro brazos en cruz).
 *
 * La colisión no es un rectángulo: cada brazo se aproxima con una serie de
 * círculos pequeños y se comprueba si alguno toca la caja de Paco.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { clamp, random } from '../../core/math.js';
import { fillCircle, fillRectangle } from '../../core/canvas.js';
import { Entity } from '../Entity.js';

/** Separación (px) entre los círculos de colisión de un brazo. */
const SEGMENT_SPACING = 8;

export class RotatingHazard extends Entity {
  /**
   * @param {Object} settings
   * @param {number} settings.pivotX Centro de giro (px).
   * @param {number} settings.pivotY
   * @param {number} settings.armCount Número de brazos repartidos en círculo.
   * @param {number} settings.segmentsPerArm Círculos de colisión por brazo.
   * @param {number} settings.innerRadius Distancia al eje del primer círculo.
   * @param {number} settings.collisionRadius Radio de cada círculo.
   * @param {number} settings.angularSpeed Radianes por paso.
   * @param {number} settings.startAngle
   * @param {'churros'|'windmill'} settings.look
   */
  constructor({ pivotX, pivotY, armCount, segmentsPerArm, innerRadius, collisionRadius, angularSpeed, startAngle, look }) {
    super(pivotX - 8, pivotY - 8, 16, 16);
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.armCount = armCount;
    this.segmentsPerArm = segmentsPerArm;
    this.innerRadius = innerRadius;
    this.collisionRadius = collisionRadius;
    this.angularSpeed = angularSpeed;
    this.angle = startAngle;
    this.look = look;
  }

  /**
   * Barra de churros anclada en el centro de una baldosa.
   * @param {number} column
   * @param {number} row
   * @param {{segments: number, angularSpeed: number}} settings
   */
  static createFireBar(column, row, { segments, angularSpeed }) {
    return new RotatingHazard({
      pivotX: column * TILE_SIZE + 8, pivotY: row * TILE_SIZE + 8,
      armCount: 1, segmentsPerArm: segments, innerRadius: 0, collisionRadius: 3.5,
      angularSpeed, startAngle: 0, look: 'churros'
    });
  }

  /**
   * Aspas de molino. Solo hacen daño las velas (desde 16 px del eje), y su
   * alcance no llega al suelo: Paco puede pasar caminando, pero no saltando
   * a lo loco.
   * @param {number} column Columna del eje.
   * @param {number} row Fila del eje (el eje queda en su borde superior).
   */
  static createWindmillBlades(column, row) {
    return new RotatingHazard({
      pivotX: column * TILE_SIZE + 8, pivotY: row * TILE_SIZE,
      armCount: 4, segmentsPerArm: 6, innerRadius: 16, collisionRadius: 4,
      angularSpeed: 0.018, startAngle: random() * Math.PI * 2, look: 'windmill'
    });
  }

  update() {
    this.angle += this.angularSpeed;
  }

  /**
   * Posiciones de todos los círculos de colisión en este momento.
   * @returns {Array<[number, number]>}
   */
  getCollisionPoints() {
    const points = [];
    for (let arm = 0; arm < this.armCount; arm++) {
      const armAngle = this.angle + arm * (Math.PI * 2 / this.armCount);
      const directionX = Math.cos(armAngle);
      const directionY = Math.sin(armAngle);
      for (let segment = 0; segment < this.segmentsPerArm; segment++) {
        const distance = this.innerRadius + segment * SEGMENT_SPACING;
        points.push([this.pivotX + directionX * distance, this.pivotY + directionY * distance]);
      }
    }
    return points;
  }

  /**
   * ¿Toca algún círculo la caja de Paco? Se calcula el punto de la caja más
   * cercano a cada círculo y se mide la distancia.
   * @param {import('../Player.js').Player} player
   * @returns {boolean}
   */
  collidesWithPlayer(player) {
    for (const [pointX, pointY] of this.getCollisionPoints()) {
      const nearestX = clamp(pointX, player.x, player.x + player.width);
      const nearestY = clamp(pointY, player.y, player.y + player.height);
      const distanceSquared = (nearestX - pointX) ** 2 + (nearestY - pointY) ** 2;
      if (distanceSquared < this.collisionRadius * this.collisionRadius) return true;
    }
    return false;
  }

  onPlayerContact(player, world) {
    if (!player.isInvincible) player.takeHit(world);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    if (this.look === 'windmill') this.drawWindmillBlades(context, cameraX);
    else this.drawChurrosBar(context, cameraX);
  }

  /** @private Cuatro palos de madera con velas de lona entramada. */
  drawWindmillBlades(context, cameraX) {
    for (let arm = 0; arm < this.armCount; arm++) {
      const armAngle = this.angle + arm * (Math.PI * 2 / this.armCount);
      const alongX = Math.cos(armAngle);
      const alongY = Math.sin(armAngle);
      // Perpendicular al brazo: hacia ese lado se despliega la vela.
      const acrossX = -alongY;
      const acrossY = alongX;
      for (let distance = 4; distance <= 60; distance += 2) {
        fillRectangle(context, this.pivotX + alongX * distance - cameraX - 1, this.pivotY + alongY * distance - 1, 3, 3, '#4c2c14');
      }
      for (let distance = 18; distance <= 60; distance += 3) {
        for (let width = 2; width <= 9; width += 3) {
          const color = (distance + width) % 2 ? '#e8e0cc' : '#b8b0a0';
          fillRectangle(context, this.pivotX + alongX * distance + acrossX * width - cameraX - 1, this.pivotY + alongY * distance + acrossY * width - 1, 2, 2, color);
        }
      }
    }
    fillCircle(context, this.pivotX - cameraX, this.pivotY, 4, '#2c1c0c');
  }

  /** @private Churros dorados unidos a un eje blanco. */
  drawChurrosBar(context, cameraX) {
    for (const [pointX, pointY] of this.getCollisionPoints()) {
      fillCircle(context, pointX - cameraX, pointY, 4, '#c87830');
      fillRectangle(context, pointX - cameraX - 2, pointY - 1, 5, 1, '#8c4c1c');
      fillRectangle(context, pointX - cameraX - 1, pointY - 3, 2, 1, '#fcd070');
    }
    fillCircle(context, this.pivotX - cameraX, this.pivotY, 2, '#fcfcfc');
  }
}

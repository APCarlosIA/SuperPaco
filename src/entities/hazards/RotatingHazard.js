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
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { roundedPath, fillWithOutline, outlinedCircle } from '../../graphics/shapes.js';
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
    const pivotX = this.pivotX - cameraX;
    const pivotY = this.pivotY;
    for (let arm = 0; arm < this.armCount; arm++) {
      const armAngle = this.angle + arm * (Math.PI * 2 / this.armCount);
      context.save();
      context.translate(pivotX, pivotY);
      context.rotate(armAngle);
      // Vela de lona con entramado.
      context.beginPath();
      context.rect(16, 0.8, 44, 10);
      const sail = context.createLinearGradient(0, 0.8, 0, 10.8);
      sail.addColorStop(0, '#f6f0dc');
      sail.addColorStop(1, '#c8bea4');
      context.fillStyle = sail;
      context.fill();
      context.strokeStyle = OUTLINE_COLOR;
      context.lineWidth = 0.8;
      context.stroke();
      context.strokeStyle = 'rgba(90, 70, 40, 0.55)';
      context.lineWidth = 0.4;
      for (let slat = 22; slat < 60; slat += 6) { context.beginPath(); context.moveTo(slat, 0.8); context.lineTo(slat, 10.8); context.stroke(); }
      context.beginPath(); context.moveTo(16, 5.8); context.lineTo(60, 5.8); context.stroke();
      // Palo principal.
      roundedPath(context, 2, -1.2, 59, 2.4, 1);
      fillWithOutline(context, '#8a5a30', '#4c2c14', -1.2, 1.2, 0.7);
      context.restore();
    }
    outlinedCircle(context, pivotX, pivotY, 4.4, '#6a4a30', '#2c1c0c', 0.9);
    outlinedCircle(context, pivotX, pivotY, 1.6, '#ffd89a', '#c88a40', 0.5);
  }

  /** @private Churros dorados unidos a un eje blanco. */
  drawChurrosBar(context, cameraX) {
    const points = this.getCollisionPoints();
    const pivotX = this.pivotX - cameraX;
    context.strokeStyle = OUTLINE_COLOR;
    context.lineWidth = 2.6;
    context.lineCap = 'round';
    context.beginPath();
    for (const [pointX, pointY] of points) { context.moveTo(pivotX, this.pivotY); context.lineTo(pointX - cameraX, pointY); }
    context.stroke();
    context.strokeStyle = '#f4f0ec';
    context.lineWidth = 1.2;
    context.beginPath();
    for (const [pointX, pointY] of points) { context.moveTo(pivotX, this.pivotY); context.lineTo(pointX - cameraX, pointY); }
    context.stroke();
    for (const [pointX, pointY] of points) {
      const x = pointX - cameraX;
      context.save();
      context.translate(x, pointY);
      context.rotate(this.angle);
      roundedPath(context, -4.6, -2.4, 9.2, 4.8, 2.4);
      fillWithOutline(context, '#ffd070', '#c07a28', -2.4, 2.4, 0.8);
      context.strokeStyle = 'rgba(120, 60, 10, 0.55)';
      context.lineWidth = 0.4;
      for (let ridge = -2.4; ridge <= 2.4; ridge += 1.6) { context.beginPath(); context.moveTo(ridge, -2); context.lineTo(ridge, 2); context.stroke(); }
      context.fillStyle = 'rgba(255,255,255,0.8)';
      context.fillRect(-3, -1.7, 1, 0.6); context.fillRect(1.4, -1.2, 0.8, 0.6);
      context.restore();
    }
    outlinedCircle(context, pivotX, this.pivotY, 2.2, '#ffffff', '#c8c8d8', 0.8);
  }
}

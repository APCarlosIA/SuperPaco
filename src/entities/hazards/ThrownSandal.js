/**
 * @file Chancla voladora que lanza la madre. Vuela en arco girando, atraviesa
 * las paredes y hace daño a Paco. Un pimiento picante la destruye.
 */
import { SCREEN_HEIGHT } from '../../config/constants.js';
import { clamp } from '../../core/math.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { Entity } from '../Entity.js';

const LAUNCH_SPEED = 4.4;
const GRAVITY = 0.18;
/** Pasos aproximados que tarda en caer (se usa para apuntar a Paco). */
const EXPECTED_FLIGHT_STEPS = 48;
const MAX_HORIZONTAL_SPEED = 2.4;
const MIN_HORIZONTAL_SPEED = 0.6;
const SPIN_PER_STEP = 0.35;

export class ThrownSandal extends Entity {
  /**
   * @param {number} startX Centro horizontal desde el que se lanza.
   * @param {number} startY
   * @param {number} targetX Hacia dónde apunta (normalmente, el centro de Paco).
   */
  constructor(startX, startY, targetX) {
    super(startX - 4, startY, 8, 8);
    const distance = targetX - startX;
    // Velocidad para caer más o menos donde está Paco, con un mínimo para que siempre avance.
    this.velocityX = clamp(distance / EXPECTED_FLIGHT_STEPS, -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
    if (Math.abs(this.velocityX) < MIN_HORIZONTAL_SPEED) this.velocityX = (distance < 0 ? -1 : 1) * MIN_HORIZONTAL_SPEED;
    this.velocityY = -LAUNCH_SPEED;
    this.rotation = 0;
  }

  update() {
    this.velocityY += GRAVITY;
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.rotation += SPIN_PER_STEP * Math.sign(this.velocityX);
    if (this.y > SCREEN_HEIGHT + 16) this.shouldBeRemoved = true;
  }

  onPlayerContact(player, world) {
    if (player.isInvincible) {
      this.shouldBeRemoved = true;
      world.spawnPuff(this.centerX, this.centerY);
      return;
    }
    player.takeHit(world);
  }

  onHitByFireball(fireball, world) {
    this.shouldBeRemoved = true;
    world.spawnPuff(this.centerX, this.centerY);
    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    drawSprite(context, SPRITES.chancla, this.x - cameraX, this.y, { rotation: this.rotation });
  }
}

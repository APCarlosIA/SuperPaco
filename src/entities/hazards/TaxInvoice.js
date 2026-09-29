/**
 * @file Factura que lanza Don Hacienda. Puede volar en arco (con gravedad) o
 * en línea recta flotando un poco arriba y abajo.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { Entity } from '../Entity.js';

const ARC_LAUNCH_SPEED = 4.5;
const ARC_GRAVITY = 0.18;
const STRAIGHT_SPEED = 2.3;
const FLOAT_AMPLITUDE = 0.6;
const SPIN_PER_STEP = 0.2;

export class TaxInvoice extends Entity {
  /**
   * @param {number} centerX
   * @param {number} y
   * @param {number} velocityX
   * @param {number} velocityY
   * @param {number} gravity 0 para vuelo recto.
   */
  constructor(centerX, y, velocityX, velocityY, gravity) {
    super(centerX - 4, y, 8, 9);
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.gravity = gravity;
    this.rotation = 0;
  }

  /** Factura lanzada hacia arriba que cae en parábola. */
  static createArcing(centerX, y, horizontalSpeed) {
    return new TaxInvoice(centerX, y, horizontalSpeed, -ARC_LAUNCH_SPEED, ARC_GRAVITY);
  }

  /** Factura que vuela en horizontal. */
  static createStraight(centerX, y, direction) {
    return new TaxInvoice(centerX, y, direction * STRAIGHT_SPEED, 0, 0);
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    this.velocityY += this.gravity;
    this.x += this.velocityX;
    const floatingWobble = this.gravity ? 0 : Math.sin(this.ageInSteps * 0.2) * FLOAT_AMPLITUDE;
    this.y += this.velocityY + floatingWobble;
    this.rotation += SPIN_PER_STEP;
    const isOffScreen = this.y > SCREEN_HEIGHT + 16 || this.x < world.cameraX - 32 || this.x > world.cameraX + SCREEN_WIDTH + 32;
    if (isOffScreen) this.shouldBeRemoved = true;
  }

  onPlayerContact(player, world) {
    if (player.isInvincible) {
      this.shouldBeRemoved = true;
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
    drawSprite(context, SPRITES.factura, this.x - cameraX, this.y, { rotation: this.rotation });
  }
}

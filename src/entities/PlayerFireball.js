/**
 * @file Pimiento picante que lanza Paco cuando ha comido un pimiento de Padrón.
 * Avanza rebotando por el suelo y derrota al primer enemigo que toca.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants.js';
import { rectanglesOverlap } from '../core/math.js';
import { SPRITES, drawSprite } from '../graphics/sprites.js';
import { moveHorizontally, moveVertically } from '../world/tileCollision.js';
import { Entity } from './Entity.js';

const HORIZONTAL_SPEED = 4.2;
const INITIAL_FALL_SPEED = 1.5;
const GRAVITY = 0.35;
const MAX_FALL_SPEED = 5;
const BOUNCE_SPEED = 3.2;
const SPIN_PER_STEP = 0.5;

export class PlayerFireball extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} direction -1 izquierda, 1 derecha.
   */
  constructor(x, y, direction) {
    super(x, y, 8, 8);
    this.velocityX = direction * HORIZONTAL_SPEED;
    this.velocityY = INITIAL_FALL_SPEED;
    this.rotation = 0;
    this.isPlayerFireball = true;
  }

  /** @param {import('../game/World.js').World} world */
  update(world) {
    this.rotation += SPIN_PER_STEP * Math.sign(this.velocityX);
    this.velocityY = Math.min(this.velocityY + GRAVITY, MAX_FALL_SPEED);
    if (moveHorizontally(this, world.tileMap)) {
      this.explode(world);
      return;
    }
    moveVertically(this, world.tileMap);
    if (this.isOnGround) this.velocityY = -BOUNCE_SPEED;

    const isOffScreen = this.x < world.cameraX - 16 || this.x > world.cameraX + SCREEN_WIDTH + 16 || this.y > SCREEN_HEIGHT;
    if (isOffScreen) {
      this.shouldBeRemoved = true;
      return;
    }
    this.hitFirstTarget(world);
  }

  /** @private Busca algo a lo que dar (enemigos o proyectiles) y se deshace al impactar. */
  hitFirstTarget(world) {
    for (const target of world.entities) {
      if (target === this || target.shouldBeRemoved || target.isDefeated || !target.onHitByFireball) continue;
      if (rectanglesOverlap(this, target.getHitbox())) {
        target.onHitByFireball(this, world);
        this.explode(world);
        return;
      }
    }
  }

  /** @private */
  explode(world) {
    this.shouldBeRemoved = true;
    world.spawnPuff(this.centerX, this.centerY);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    drawSprite(context, SPRITES.pimiento_lanzado, this.x - cameraX, this.y, { rotation: this.rotation });
  }
}

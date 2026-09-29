/**
 * @file Petardo de la mascletà que cae del cielo en Valencia y explota al tocar
 * el suelo (o a Paco). La mecha va soltando chispas mientras cae.
 */
import { SCREEN_HEIGHT } from '../../config/constants.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { TILE, isSolidTile } from '../../world/tileTypes.js';
import { pixelToTile } from '../../world/tileCollision.js';
import { Entity } from '../Entity.js';
import { Explosion } from './Explosion.js';

const INITIAL_FALL_SPEED = 1;
const FALL_ACCELERATION = 0.05;
const MAX_FALL_SPEED = 3;
const SPAWN_Y = -14;

export class FallingFirecracker extends Entity {
  /** @param {number} x Posición horizontal desde la que cae. */
  constructor(x) {
    super(x, SPAWN_Y, 6, 11);
    this.velocityY = INITIAL_FALL_SPEED;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    this.velocityY = Math.min(this.velocityY + FALL_ACCELERATION, MAX_FALL_SPEED);
    this.y += this.velocityY;
    if (this.ageInSteps % 3 === 0) world.spawnSpark(this.centerX, this.y, '#fcd800');

    const tileBelow = world.tileMap.getTile(pixelToTile(this.centerX), pixelToTile(this.bottom));
    const hitsGround = this.bottom >= 0 && (isSolidTile(tileBelow) || tileBelow === TILE.ONE_WAY_PLATFORM);
    if (hitsGround) this.explode(world);
    if (this.y > SCREEN_HEIGHT) this.shouldBeRemoved = true;
  }

  /** @private Se sustituye por una explosión. */
  explode(world) {
    if (this.shouldBeRemoved) return;
    this.shouldBeRemoved = true;
    world.addEntity(new Explosion(this.centerX, this.bottom - 4, world));
  }

  onPlayerContact(player, world) {
    this.explode(world);
  }

  onHitByFireball(fireball, world) {
    this.explode(world);
    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    drawSprite(context, SPRITES.petardo, this.x - cameraX, this.y);
  }
}

/**
 * @file Peseta que cae del cielo durante la maravilla "lluvia de pesetas".
 */
import { Entity } from '../Entity.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { addGlow } from '../../graphics/shapes.js';
import { isSolidTile } from '../../world/tileTypes.js';
import { TILE_SIZE, SCREEN_HEIGHT } from '../../config/constants.js';

const FALL_SPEED = 1.5;
const COIN_FRAMES = [0, 1, 2, 1];

export class FallingCoin extends Entity {
  /**
   * @param {number} x Centro horizontal.
   * @param {number} y Altura inicial (arriba de la pantalla).
   */
  constructor(x, y) {
    super(x - 6, y, 12, 12);
    this.velocityY = FALL_SPEED;
    /** Ilumina un poco a su alrededor en los apagones. */
    this.isWonderLight = true;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    this.y += this.velocityY;
    const row = Math.floor((this.y + this.height) / TILE_SIZE);
    const column = Math.floor(this.centerX / TILE_SIZE);
    if (isSolidTile(world.tileMap.getTile(column, row)) || this.y > SCREEN_HEIGHT) this.shouldBeRemoved = true;
  }

  /** @param {import('../../game/World.js').World} world */
  onPlayerContact(player, world) {
    if (this.shouldBeRemoved) return;
    this.shouldBeRemoved = true;
    world.collectCoin();
    world.spawnSparkle(this.centerX, this.centerY);
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const frame = COIN_FRAMES[(this.ageInSteps >> 3) % COIN_FRAMES.length];
    const x = this.centerX - cameraX;
    addGlow(context, x, this.centerY, 12, '255, 214, 90', 0.5);
    drawSprite(context, SPRITES[`peseta_spin${frame}`], x - 8, this.centerY - 7);
  }
}

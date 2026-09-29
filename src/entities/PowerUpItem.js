/**
 * @file Objetos que salen de los bloques:
 *   - Bocadillo de jamón: Paco crece. Se desliza por el suelo.
 *   - Pimiento de Padrón: Paco puede lanzar pimientos. Se queda quieto.
 *   - Churros con chocolate: invencibilidad temporal. Va dando botes.
 *   - Décimo de lotería: vida extra. Se desliza deprisa.
 */
import { SCREEN_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { SPRITES, drawSprite } from '../graphics/sprites.js';
import { moveHorizontally, moveVertically } from '../world/tileCollision.js';
import { Entity } from './Entity.js';

/** Tipos de objeto (coinciden con el nombre de su sprite). */
export const POWER_UP_KIND = Object.freeze({
  BOCADILLO: 'bocadillo',
  PIMIENTO: 'pimiento',
  CHURROS: 'churros',
  LOTERIA: 'loteria'
});

/** Velocidad horizontal de cada objeto (0 = no se mueve). */
const SLIDE_SPEED = Object.freeze({
  [POWER_UP_KIND.BOCADILLO]: 1,
  [POWER_UP_KIND.PIMIENTO]: 0,
  [POWER_UP_KIND.CHURROS]: 1.4,
  [POWER_UP_KIND.LOTERIA]: 1.3
});
/** Pasos que tarda en salir del bloque (sube medio píxel por paso). */
const EMERGE_STEPS = 32;
/** A partir de cuántos pasos de salida ya se puede recoger. */
const COLLECTIBLE_AFTER_EMERGE_STEPS_LEFT = 8;
const GRAVITY = 0.3;
const MAX_FALL_SPEED = 6;
const CHURROS_BOUNCE_SPEED = 4.5;

export class PowerUpItem extends Entity {
  /**
   * @param {string} kind Uno de {@link POWER_UP_KIND}.
   * @param {number} blockColumn Columna del bloque del que sale.
   * @param {number} blockRow Fila del bloque del que sale.
   */
  constructor(kind, blockColumn, blockRow) {
    super(blockColumn * TILE_SIZE + 1, blockRow * TILE_SIZE + 2, 14, 14);
    this.kind = kind;
    this.isPowerUp = true;
    this.facing = 1;
    this.emergeStepsLeft = EMERGE_STEPS;
    // Mientras sale del bloque se dibuja detrás para que parezca que brota de él.
    this.drawsBehindTiles = true;
  }

  /** ¿Sigue saliendo del bloque? */
  get isEmerging() {
    return this.emergeStepsLeft > 0;
  }

  /** @param {import('../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    if (this.isEmerging) {
      this.y -= 0.5;
      this.emergeStepsLeft--;
      if (!this.isEmerging) this.drawsBehindTiles = false;
      return;
    }
    const slideSpeed = SLIDE_SPEED[this.kind];
    if (!slideSpeed) return;
    this.velocityY = Math.min(this.velocityY + GRAVITY, MAX_FALL_SPEED);
    this.velocityX = this.facing * slideSpeed;
    if (moveHorizontally(this, world.tileMap)) this.facing *= -1;
    moveVertically(this, world.tileMap);
    if (this.kind === POWER_UP_KIND.CHURROS && this.isOnGround) this.velocityY = -CHURROS_BOUNCE_SPEED;
    if (this.y > SCREEN_HEIGHT + 20 || this.x < world.cameraX - 64) this.shouldBeRemoved = true;
  }

  /**
   * Impulso hacia arriba cuando golpean desde abajo el bloque sobre el que está.
   * @param {number} direction Hacia dónde sale despedido (-1 o 1).
   */
  bounceFromBlockBelow(direction) {
    this.velocityY = -4;
    this.facing = direction;
  }

  /** Paco lo recoge. */
  onPlayerContact(player, world) {
    if (this.emergeStepsLeft > COLLECTIBLE_AFTER_EMERGE_STEPS_LEFT) return;
    this.shouldBeRemoved = true;
    world.collectPowerUp(this);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const sprite = SPRITES[this.kind];
    const hoverOffset = this.kind === POWER_UP_KIND.PIMIENTO && (this.ageInSteps >> 4) & 1 ? -1 : 0;
    const mirrored = this.kind === POWER_UP_KIND.CHURROS && Boolean((this.ageInSteps >> 3) & 1);
    drawSprite(context, sprite, this.centerX - sprite.width / 2 - cameraX, this.bottom - sprite.height + hoverOffset, { mirrored });
  }
}

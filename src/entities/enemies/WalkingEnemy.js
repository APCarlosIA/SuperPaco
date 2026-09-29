/**
 * @file Enemigo que camina en línea recta: guiris, palomas, ejecutivos,
 * cucarachas, ovejas y lagartos. Se da la vuelta al chocar con una pared y,
 * si es "listo", también al llegar al borde de una plataforma.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { moveHorizontally, moveVertically, hasGroundAhead } from '../../world/tileCollision.js';
import { Enemy } from './Enemy.js';

const HITBOX_WIDTH = 12;
const HITBOX_HEIGHT = 14;

export class WalkingEnemy extends Enemy {
  /**
   * @param {number} column Columna en la que aparece.
   * @param {number} row Fila que pisa.
   * @param {import('./enemyCatalog.js').EnemyProfile} profile
   */
  constructor(column, row, profile) {
    super(column * TILE_SIZE + 2, (row + 1) * TILE_SIZE - HITBOX_HEIGHT, HITBOX_WIDTH, HITBOX_HEIGHT);
    this.profile = profile;
    this.catchphrases = profile.catchphrases || null;
    this.turnsAroundOnEnemyContact = true;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    this.applyGravity();
    this.velocityX = this.facing * this.profile.walkSpeed;
    if (moveHorizontally(this, world.tileMap)) this.facing *= -1;
    moveVertically(this, world.tileMap);
    if (this.profile.turnsAtEdges && this.isOnGround && !hasGroundAhead(this, world.tileMap)) this.facing *= -1;
    this.removeIfOutsideWorld(world);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const spriteName = this.squashedStepsLeft > 0
      ? `${this.profile.spriteName}_squashed`
      : `${this.profile.spriteName}_frame${this.getAnimationFrame()}`;
    // Los sprites de enemigos miran a la izquierda: se reflejan al ir a la derecha.
    this.drawCenteredSprite(context, spriteName, cameraX, { mirrored: this.facing > 0 });
  }
}

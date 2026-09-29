/**
 * @file Pulpo gallego que asoma por la boca de los toneles.
 *
 * Ciclo: escondido → subiendo → fuera → bajando → escondido…
 * No sale si Paco está justo al lado (para no ser injusto) y no se puede pisar;
 * solo se le vence con pimientos, caparazones o siendo invencible.
 */
import { TILE_SIZE, GAME_RULES } from '../../config/constants.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { Enemy } from './Enemy.js';

/** Estados del pulpo. */
export const OCTOPUS_STATE = Object.freeze({ HIDDEN: 'hidden', RISING: 'rising', EXPOSED: 'exposed', SINKING: 'sinking' });
const BODY_HEIGHT = 22;
const HIDDEN_STEPS = 90;
const EXPOSED_STEPS = 70;
const FIRST_APPEARANCE_DELAY = 40;
/** Si Paco está a menos de esta distancia horizontal, el pulpo no sale. */
const SHY_DISTANCE = 30;
const RETRY_DELAY_WHEN_PLAYER_NEAR = 20;

export class PopUpOctopus extends Enemy {
  /**
   * @param {number} barrelColumn Columna izquierda del tonel.
   * @param {number} barrelTopRow Fila de la tapa del tonel.
   */
  constructor(barrelColumn, barrelTopRow) {
    super((barrelColumn + 1) * TILE_SIZE - 6, barrelTopRow * TILE_SIZE + 2, 12, BODY_HEIGHT);
    this.barrelTopY = barrelTopRow * TILE_SIZE;
    this.hiddenY = this.barrelTopY + 2;
    this.exposedY = this.barrelTopY - BODY_HEIGHT;
    this.state = OCTOPUS_STATE.HIDDEN;
    this.stateStepsLeft = FIRST_APPEARANCE_DELAY;
    this.canBeStomped = false;
    this.drawsBehindTiles = true;
    this.catchphrases = ['¡A FEIRA!', '¡PULPO!'];
  }

  /** Solo cuenta como tocable la parte que asoma por encima del tonel. */
  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: Math.max(0, this.barrelTopY - this.y) };
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    switch (this.state) {
      case OCTOPUS_STATE.HIDDEN:
        if (--this.stateStepsLeft <= 0) {
          const playerIsNear = Math.abs(world.player.centerX - this.centerX) < SHY_DISTANCE;
          if (playerIsNear) this.stateStepsLeft = RETRY_DELAY_WHEN_PLAYER_NEAR;
          else this.state = OCTOPUS_STATE.RISING;
        }
        break;
      case OCTOPUS_STATE.RISING:
        this.y -= 1;
        if (this.y <= this.exposedY) {
          this.y = this.exposedY;
          this.state = OCTOPUS_STATE.EXPOSED;
          this.stateStepsLeft = EXPOSED_STEPS;
        }
        break;
      case OCTOPUS_STATE.EXPOSED:
        if (--this.stateStepsLeft <= 0) this.state = OCTOPUS_STATE.SINKING;
        break;
      case OCTOPUS_STATE.SINKING:
        this.y += 1;
        if (this.y >= this.hiddenY) {
          this.y = this.hiddenY;
          this.state = OCTOPUS_STATE.HIDDEN;
          this.stateStepsLeft = HIDDEN_STEPS;
        }
        break;
    }
    // Solo hace daño si asoma lo suficiente.
    this.isHarmful = this.y < this.barrelTopY - 3;
    this.removeIfOutsideWorld(world);
  }

  /** @param {import('../Player.js').Player} player */
  onPlayerContact(player, world) {
    if (!this.isHarmful) return;
    if (player.isInvincible) {
      this.knockOut(0);
      world.awardPoints(GAME_RULES.pointsForEnemyDefeatedByFire, this.centerX, this.y);
      soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
      return;
    }
    player.takeHit(world);
  }

  /** Los pimientos solo le alcanzan si está fuera del tonel. */
  onHitByFireball(fireball, world) {
    if (!this.isHarmful) return false;
    return super.onHitByFireball(fireball, world);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const sprite = SPRITES[`pulpo_frame${this.getAnimationFrame(16)}`];
    // Se dibuja detrás de las baldosas: el tonel tapa la parte que está dentro.
    drawSprite(context, sprite, this.centerX - 8 - cameraX, this.y - 1, { upsideDown: this.isKnockedOut });
  }
}

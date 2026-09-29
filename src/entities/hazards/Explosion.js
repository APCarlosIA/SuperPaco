/**
 * @file Explosión de un petardo: una bola de fuego que crece y se apaga.
 * Hace daño a Paco durante la primera parte y derrota a los enemigos cercanos.
 */
import { GAME_RULES } from '../../config/constants.js';
import { rectanglesOverlap } from '../../core/math.js';
import { fillCircle } from '../../core/canvas.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { Entity } from '../Entity.js';

const EXPLOSION_SIZE = 36;
const LIFETIME_STEPS = 22;
/** Pasos durante los que la explosión todavía hace daño a Paco. */
const DANGEROUS_STEPS = 16;
/** Paso en el que la onda expansiva derrota a los enemigos cercanos. */
const ENEMY_BLAST_STEP = 2;

export class Explosion extends Entity {
  /**
   * @param {number} centerX
   * @param {number} centerY
   * @param {import('../../game/World.js').World} world
   */
  constructor(centerX, centerY, world) {
    super(centerX - EXPLOSION_SIZE / 2, centerY - EXPLOSION_SIZE / 2, EXPLOSION_SIZE, EXPLOSION_SIZE);
    if (world.isVisible(this, 32)) {
      soundEngine.playSoundEffect(SOUND_EFFECT.EXPLOSION);
      world.shakeScreen(6);
    }
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    if (this.ageInSteps === ENEMY_BLAST_STEP) this.blastNearbyEnemies(world);
    if (this.ageInSteps > LIFETIME_STEPS) this.shouldBeRemoved = true;
  }

  /** @private */
  blastNearbyEnemies(world) {
    for (const enemy of world.entities) {
      if (!enemy.isEnemy || enemy.isDefeated || enemy.resistsShellsAndExplosions) continue;
      if (rectanglesOverlap(this, enemy.getHitbox())) {
        enemy.knockOut(0);
        world.awardPoints(GAME_RULES.pointsForEnemyDefeatedByFire, enemy.centerX, enemy.y);
      }
    }
  }

  onPlayerContact(player, world) {
    if (this.ageInSteps < DANGEROUS_STEPS && !player.isInvincible) player.takeHit(world);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const progress = this.ageInSteps / LIFETIME_STEPS;
    const x = this.centerX - cameraX;
    const y = this.centerY;
    fillCircle(context, x, y, Math.round(8 + progress * 12), progress < 0.5 ? '#fcfcfc' : '#fc7c00');
    fillCircle(context, x, y, Math.round(4 + progress * 10), progress < 0.5 ? '#fcd800' : '#d82800');
    if (progress > 0.6) fillCircle(context, x, y, Math.round(progress * 9), '#5c5c5c');
  }
}

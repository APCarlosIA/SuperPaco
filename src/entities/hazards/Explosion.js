/**
 * @file Explosión de un petardo: una bola de fuego que crece y se apaga.
 * Hace daño a Paco durante la primera parte y derrota a los enemigos cercanos.
 */
import { GAME_RULES } from '../../config/constants.js';
import { rectanglesOverlap } from '../../core/math.js';
import { addGlow } from '../../graphics/shapes.js';
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
    const radius = 8 + progress * 14;
    addGlow(context, x, y, radius * 2.6, '255, 140, 40', 0.8 * (1 - progress));
    // Onda expansiva.
    context.save();
    context.globalAlpha = Math.max(0, 1 - progress * 1.4);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, radius * 1.25, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    // Bola de fuego.
    context.save();
    context.globalAlpha = Math.max(0, 1 - progress * 0.7);
    const fire = context.createRadialGradient(x, y, 0, x, y, radius);
    fire.addColorStop(0, '#ffffff');
    fire.addColorStop(0.35, '#ffe45a');
    fire.addColorStop(0.7, '#ff7a1c');
    fire.addColorStop(1, 'rgba(216, 40, 0, 0)');
    context.fillStyle = fire;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
    // Humo que sube al final.
    if (progress > 0.45) {
      const smoke = (progress - 0.45) / 0.55;
      context.save();
      context.globalAlpha = 0.5 * (1 - smoke);
      for (const [offsetX, offsetY, size] of [[-5, -3, 6], [4, -6, 7], [0, -10, 5]]) {
        const puff = context.createRadialGradient(x + offsetX, y + offsetY - smoke * 8, 0, x + offsetX, y + offsetY - smoke * 8, size + smoke * 4);
        puff.addColorStop(0, '#6a6470');
        puff.addColorStop(1, 'rgba(60, 56, 66, 0)');
        context.fillStyle = puff;
        context.beginPath();
        context.arc(x + offsetX, y + offsetY - smoke * 8, size + smoke * 4, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
  }
}

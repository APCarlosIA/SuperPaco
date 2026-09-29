/**
 * @file Chispa de lava que salta verticalmente desde un foso cada cierto tiempo.
 * No se puede pisar ni apagar con pimientos; hay que esquivarla.
 */
import { TILE_SIZE, SCREEN_HEIGHT } from '../../config/constants.js';
import { randomInteger } from '../../core/math.js';
import { fillCircle, fillRectangle } from '../../core/canvas.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { Enemy } from './Enemy.js';

/** Posición de reposo, escondida bajo la pantalla. */
const RESTING_Y = SCREEN_HEIGHT + 8;
const LAUNCH_SPEED = 7.2;
const GRAVITY = 0.18;
const FIRST_JUMP_DELAY = { min: 20, max: 90 };
const PAUSE_BETWEEN_JUMPS = { min: 60, max: 130 };

export class LavaBubble extends Enemy {
  /** @param {number} column Columna del foso de lava. */
  constructor(column) {
    super(column * TILE_SIZE + 2, RESTING_Y, 12, 12);
    this.stepsUntilJump = randomInteger(FIRST_JUMP_DELAY.min, FIRST_JUMP_DELAY.max);
    this.canBeStomped = false;
    this.isFireproof = true;
    this.resistsInvincibleTouch = true;
    this.resistsShellsAndExplosions = true;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    if (this.stepsUntilJump > 0) {
      this.y = RESTING_Y;
      this.stepsUntilJump--;
      if (this.stepsUntilJump === 0) {
        this.velocityY = -LAUNCH_SPEED;
        if (world.isVisible(this)) soundEngine.playSoundEffect(SOUND_EFFECT.LAVA_HISS);
      }
      return;
    }
    this.velocityY += GRAVITY;
    this.y += this.velocityY;
    if (this.y >= RESTING_Y) {
      this.y = RESTING_Y;
      this.stepsUntilJump = randomInteger(PAUSE_BETWEEN_JUMPS.min, PAUSE_BETWEEN_JUMPS.max);
    }
    // Deja una estela de chispas.
    if (this.ageInSteps % 4 === 0 && this.y < SCREEN_HEIGHT) {
      world.spawnSpark(this.centerX, this.y + (this.velocityY < 0 ? this.height : 0), '#fc9c00');
    }
    if (this.x < world.cameraX - 96) this.shouldBeRemoved = true;
  }

  /** Quema a Paco salvo que sea invencible. */
  onPlayerContact(player, world) {
    if (!player.isInvincible) player.takeHit(world);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = Math.round(this.centerX - cameraX);
    const y = Math.round(this.centerY);
    const coreOffset = this.velocityY < 0 ? 1 : -1;
    fillCircle(context, x, y, 6, '#e83c00');
    fillCircle(context, x, y + coreOffset, 4, '#fc9c00');
    fillCircle(context, x, y, 2, '#fcf0a0');
    // Ojitos.
    fillRectangle(context, x - 3, y - 2, 2, 2, '#101010');
    fillRectangle(context, x + 1, y - 2, 2, 2, '#101010');
  }
}

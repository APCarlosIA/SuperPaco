/**
 * @file Chispa de lava que salta verticalmente desde un foso cada cierto tiempo.
 * No se puede pisar ni apagar con pimientos; hay que esquivarla.
 */
import { TILE_SIZE, SCREEN_HEIGHT } from '../../config/constants.js';
import { randomInteger } from '../../core/math.js';
import { addGlow, outlinedCircle } from '../../graphics/shapes.js';
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
    const x = this.centerX - cameraX;
    const y = this.centerY;
    const stretch = this.velocityY < 0 ? 1.12 : 0.94;
    addGlow(context, x, y, 22, '255, 110, 30', 0.6);
    context.save();
    context.translate(x, y);
    context.scale(1 / stretch, stretch);
    // Lengüetas de fuego.
    context.fillStyle = '#ff9a1c';
    for (const [offsetX, height] of [[-3, 4], [0, 6], [3, 4]]) {
      context.beginPath(); context.moveTo(offsetX - 2, -4); context.quadraticCurveTo(offsetX, -4 - height, offsetX + 0.6, -4 - height * 1.1); context.quadraticCurveTo(offsetX + 1.6, -6, offsetX + 2, -4); context.fill();
    }
    outlinedCircle(context, 0, 0, 6.4, '#ffb030', '#e0380a', 0.9);
    const core = context.createRadialGradient(-1, -1.5, 0, -1, -1.5, 4);
    core.addColorStop(0, '#fff6b8');
    core.addColorStop(1, 'rgba(255, 200, 60, 0)');
    context.fillStyle = core;
    context.beginPath(); context.arc(0, 0, 5, 0, Math.PI * 2); context.fill();
    // Ojitos enfadados.
    context.fillStyle = '#ffffff';
    context.beginPath(); context.arc(-2.4, -1.2, 1.6, 0, Math.PI * 2); context.arc(2.4, -1.2, 1.6, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#140c20';
    context.beginPath(); context.arc(-2.1, -1, 0.8, 0, Math.PI * 2); context.arc(2.7, -1, 0.8, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#140c20'; context.lineWidth = 0.7;
    context.beginPath(); context.moveTo(-4.2, -3.4); context.lineTo(-1.2, -2.4); context.moveTo(4.2, -3.4); context.lineTo(1.2, -2.4); context.stroke();
    context.restore();
  }
}

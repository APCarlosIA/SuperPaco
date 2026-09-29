/**
 * @file La madre con rulos que lanza chanclas voladoras en arco hacia Paco.
 * Siempre mira hacia él, da algún saltito y suelta alguna frase de madre.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { random, randomInteger, randomItem } from '../../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { moveVertically } from '../../world/tileCollision.js';
import { ThrownSandal } from '../hazards/ThrownSandal.js';
import { Enemy } from './Enemy.js';

const HITBOX_HEIGHT = 22;
const FIRST_THROW_DELAY = { min: 40, max: 90 };
const THROW_INTERVAL = { min: 90, max: 150 };
/** Pasos que mantiene la postura de lanzar. */
const THROW_POSE_STEPS = 16;
/** Probabilidad por paso de dar un saltito cuando está en el suelo. */
const HOP_PROBABILITY = 0.004;
const HOP_SPEED = 3.5;
/** Probabilidad de gritar algo al lanzar. */
const SHOUT_PROBABILITY = 0.2;
const SHOUTS = ['¡VEN AQUÍ!', '¡QUE TE ESTOY VIENDO!', '¡NI UN PASO MÁS!'];

export class SandalThrowingMother extends Enemy {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   */
  constructor(column, row) {
    super(column * TILE_SIZE + 2, (row + 1) * TILE_SIZE - HITBOX_HEIGHT, 12, HITBOX_HEIGHT);
    this.stepsUntilThrow = randomInteger(FIRST_THROW_DELAY.min, FIRST_THROW_DELAY.max);
    this.throwPoseStepsLeft = 0;
    this.catchphrases = ['¡YA HABLAREMOS EN CASA!', '¡QUE SE LO DIGO A TU PADRE!', '¡TÁPATE, QUE HACE FRESCO!'];
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    this.applyGravity();
    moveVertically(this, world.tileMap);
    const player = world.player;
    this.facing = player.centerX < this.centerX ? -1 : 1;
    if (this.throwPoseStepsLeft > 0) this.throwPoseStepsLeft--;

    if (--this.stepsUntilThrow <= 0) {
      this.stepsUntilThrow = randomInteger(THROW_INTERVAL.min, THROW_INTERVAL.max);
      // Solo lanza si está en pantalla (no ataca desde fuera de la vista).
      if (world.isVisible(this, -16) && !player.isDead) this.throwSandal(world);
    }
    if (this.isOnGround && random() < HOP_PROBABILITY) this.velocityY = -HOP_SPEED;
    this.removeIfOutsideWorld(world);
  }

  /** @private */
  throwSandal(world) {
    this.throwPoseStepsLeft = THROW_POSE_STEPS;
    world.addEntity(new ThrownSandal(this.centerX, this.y + 6, world.player.centerX));
    soundEngine.playSoundEffect(SOUND_EFFECT.THROW);
    if (random() < SHOUT_PROBABILITY) world.showFloatingText(randomItem(SHOUTS), this.centerX, this.y - 8, '#fcb8d8');
  }

  /** Al pisarla sale despedida (y suelta su frase). */
  onStomped(player, world) {
    this.knockOut(0);
    world.rewardStomp(this, player);
    soundEngine.playSoundEffect(SOUND_EFFECT.STOMP);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    let spriteName = 'madre_standing';
    if (this.throwPoseStepsLeft > 0) spriteName = 'madre_throwing';
    else if (!this.isOnGround) spriteName = 'madre_hopping';
    this.drawCenteredSprite(context, spriteName, cameraX, { mirrored: this.facing > 0 });
  }
}

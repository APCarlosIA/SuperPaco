/**
 * @file Enemigo volador: gaviotas, mosquitos, meigas, murciélagos y cucarachas
 * voladoras. Avanza hacia la izquierda subiendo y bajando en ondas y atraviesa
 * las baldosas. Pisarlo lo derriba.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { random } from '../../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { Enemy } from './Enemy.js';

/** Velocidad angular de la onda de vuelo (radianes por paso). */
const WAVE_ANGULAR_SPEED = 0.05;

export class FlyingEnemy extends Enemy {
  /**
   * @param {number} column
   * @param {number} row Fila central de su vuelo.
   * @param {import('./enemyCatalog.js').EnemyProfile} profile
   */
  constructor(column, row, profile) {
    super(column * TILE_SIZE + 1, row * TILE_SIZE + 2, 14, 12);
    this.profile = profile;
    this.catchphrases = profile.catchphrases || null;
    this.cruiseY = this.y;
    // Cada volador empieza en un punto distinto de la onda para que no vayan sincronizados.
    this.wavePhase = random() * Math.PI * 2;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    this.x += this.facing * this.profile.flySpeed;
    this.y = this.cruiseY + Math.sin(this.ageInSteps * WAVE_ANGULAR_SPEED + this.wavePhase) * this.profile.waveAmplitude;
    this.removeIfOutsideWorld(world);
  }

  /** Al pisarlo cae derribado en vez de aplastarse. */
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
    this.drawCenteredSprite(context, `${this.profile.spriteName}_frame${this.getAnimationFrame()}`, cameraX, { mirrored: this.facing > 0 });
  }
}

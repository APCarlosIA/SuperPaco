/**
 * @file Toro gigante de la maravilla "estampida": persigue a Paco desde atrás
 * a velocidad constante. No se puede pisar; hay que correr más que él.
 */
import { Entity } from '../Entity.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { addGlow } from '../../graphics/shapes.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { screenFx } from '../../graphics/screenFx.js';
import { GROUND_SURFACE_Y } from '../../config/constants.js';

const SPEED = 1.9;
const SCALE = 2.6;

export class StampedeBull extends Entity {
  /** @param {number} startX Posición inicial (detrás de Paco). */
  constructor(startX) {
    super(startX, GROUND_SURFACE_Y - 30, 46, 30);
    this.facing = 1;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    this.x += SPEED;
    if (this.ageInSteps % 6 === 0) world.spawnDust(this.x + 10, GROUND_SURFACE_Y - 1);
    if (this.ageInSteps % 40 === 0) { soundEngine.playSoundEffect(SOUND_EFFECT.BULL_SNORT); screenFx.shake(1.4, 12); }
    // Si se ha quedado muy atrás, avanza hasta ponerse a distancia de Paco.
    const gap = world.player.x - this.x;
    if (gap > 150) this.x = world.player.x - 150;
  }

  /** @param {import('../../game/World.js').World} world */
  onPlayerContact(player, world) {
    player.takeHit(world);
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const frameCount = 4;
    const frame = (Math.floor(this.ageInSteps / 3) % frameCount) + 1;
    const sprite = SPRITES[`toro_angry_frame${frame}`];
    const x = this.x - cameraX + this.width / 2;
    addGlow(context, x, GROUND_SURFACE_Y - 16, 46, '255, 80, 30', 0.35);
    drawSprite(context, sprite, x - sprite.width / 2, GROUND_SURFACE_Y - sprite.height, { mirrored: true, scaleX: SCALE, scaleY: SCALE });
  }
}

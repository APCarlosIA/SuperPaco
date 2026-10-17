/**
 * @file Personaje que charla cuando Paco se acerca: flores cotillas con
 * consejos y chistes, y cameos escondidos por los niveles.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { Entity } from '../Entity.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { drawText, measureTextWidth } from '../../graphics/font.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { roundedPath, outlinedCircle } from '../../graphics/shapes.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { eye, mouth } from '../../graphics/creatureKit.js';

/** Distancia (px) a la que empieza a hablar. */
const TALK_DISTANCE = 52;
/** Letras que escribe por paso. */
const LETTERS_PER_STEP = 0.55;

export class Talker extends Entity {
  /**
   * @param {number} column
   * @param {number} row
   * @param {{lines: string[], look: string}} settings
   */
  constructor(column, row, settings) {
    super(column * TILE_SIZE, (row + 1) * TILE_SIZE - 16, 16, 16);
    this.lines = settings.lines;
    this.look = settings.look;
    this.lineIndex = 0;
    this.talkProgress = 0;
    this.isPlayerNear = false;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    const isNear = Math.abs(world.player.centerX - this.centerX) < TALK_DISTANCE && Math.abs(world.player.centerY - this.centerY) < 48;
    if (isNear && !this.isPlayerNear) this.talkProgress = 0;
    if (!isNear && this.isPlayerNear) this.lineIndex = (this.lineIndex + 1) % this.lines.length;
    this.isPlayerNear = isNear;
    if (!isNear) return;
    const before = Math.floor(this.talkProgress);
    this.talkProgress = Math.min(this.currentLine.length, this.talkProgress + LETTERS_PER_STEP);
    if (Math.floor(this.talkProgress) !== before && Math.floor(this.talkProgress) % 2 === 0) soundEngine.playSoundEffect(SOUND_EFFECT.TALK);
    // Se da la vuelta para mirar a Paco.
    this.facing = world.player.centerX < this.centerX ? -1 : 1;
  }

  /** Frase que toca ahora. */
  get currentLine() {
    return this.lines[this.lineIndex];
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = this.centerX - cameraX;
    const talking = this.isPlayerNear && this.talkProgress < this.currentLine.length;
    if (this.look === 'flower') this.drawFlower(context, x, talking);
    else drawSprite(context, SPRITES[this.look], x - SPRITES[this.look].width / 2, this.bottom - SPRITES[this.look].height + Math.sin(this.ageInSteps / 10) * 0.6, { mirrored: this.facing > 0 });
    if (this.isPlayerNear) this.drawBubble(context, x);
  }

  /** @private Flor cotilla: pétalos naranjas y cara que mueve la boca al hablar. */
  drawFlower(context, x, talking) {
    const sway = Math.sin(this.ageInSteps / 18) * 1.2;
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 3; context.lineCap = 'round';
    context.beginPath(); context.moveTo(x, this.bottom); context.quadraticCurveTo(x + sway * 0.4, this.bottom - 6, x + sway, this.bottom - 9); context.stroke();
    context.strokeStyle = '#3ac85a'; context.lineWidth = 1.8;
    context.beginPath(); context.moveTo(x, this.bottom); context.quadraticCurveTo(x + sway * 0.4, this.bottom - 6, x + sway, this.bottom - 9); context.stroke();
    const headX = x + sway;
    const headY = this.bottom - 10;
    for (let petal = 0; petal < 8; petal++) {
      const angle = petal * Math.PI / 4;
      outlinedCircle(context, headX + Math.cos(angle) * 4.4, headY + Math.sin(angle) * 4.4, 2.8, '#ffc86a', '#e8601c', 0.6);
    }
    outlinedCircle(context, headX, headY, 4.2, '#fff0a0', '#ffc02a', 0.8);
    const look = this.facing > 0 ? 0.6 : -0.6;
    eye(context, headX - 1.5, headY - 0.7, 1, { lookX: look }); eye(context, headX + 1.5, headY - 0.7, 1, { lookX: look });
    mouth(context, headX, headY + 1.8, 2, talking && Math.floor(this.ageInSteps / 4) % 2 ? 'open' : 'smile');
  }

  /** @private Bocadillo de cómic con el texto escribiéndose. */
  drawBubble(context, x) {
    const text = this.currentLine.slice(0, Math.floor(this.talkProgress));
    const rows = this.currentLine.split('\n');
    const widest = Math.max(...rows.map(row => measureTextWidth(row)));
    const width = widest + 10;
    const height = rows.length * 10 + 6;
    const left = Math.max(2, Math.min(318 - width, x - width / 2));
    const top = this.y - height - 14;
    roundedPath(context, left, top, width, height, 3);
    context.fillStyle = '#fffdf2'; context.fill();
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 1; context.stroke();
    context.beginPath(); context.moveTo(x - 3, top + height - 0.3); context.lineTo(x + 3, top + height - 0.3); context.lineTo(x + (this.facing > 0 ? 3 : -3), top + height + 5); context.closePath();
    context.fillStyle = '#fffdf2'; context.fill(); context.stroke();
    context.beginPath(); context.moveTo(x - 2.6, top + height - 0.6); context.lineTo(x + 2.6, top + height - 0.6); context.strokeStyle = '#fffdf2'; context.lineWidth = 1.6; context.stroke();
    text.split('\n').forEach((row, index) => drawText(context, row, left + 5, top + 4 + index * 10, '#2a1a3a'));
  }
}

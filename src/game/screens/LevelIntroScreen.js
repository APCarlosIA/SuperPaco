/**
 * @file Pantalla negra que presenta el nivel: número, ciudad, frase y vidas.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { fillRectangle } from '../../core/canvas.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText } from '../../graphics/font.js';
import { LEVELS } from '../../world/levels.js';

/** Pasos que se muestra antes de empezar el nivel automáticamente. */
const DISPLAY_STEPS = 150;
/** A partir de este paso se puede saltar con Enter. */
const SKIPPABLE_AFTER_STEPS = 30;

export class LevelIntroScreen {
  /**
   * @param {import('../Game.js').Game} game
   * @param {import('../GameSession.js').GameSession} session
   */
  constructor(game, session) {
    this.game = game;
    this.session = session;
    this.stepCounter = 0;
    soundEngine.stopMusic();
  }

  update() {
    this.stepCounter++;
    const isSkipped = this.stepCounter > SKIPPABLE_AFTER_STEPS && this.game.controls.wasConfirmPressed();
    if (this.stepCounter > DISPLAY_STEPS || isSkipped) this.game.startCurrentLevel();
  }

  draw(context) {
    const level = LEVELS[this.session.levelIndex];
    fillRectangle(context, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#000000');
    drawText(context, `NIVEL ${this.session.levelIndex + 1}`, SCREEN_WIDTH / 2, 56, '#fcfcfc', { align: 'center', scale: 2 });
    drawText(context, level.name, SCREEN_WIDTH / 2, 82, '#fcd800', { align: 'center', scale: 3 });
    drawText(context, `"${level.subtitle}"`, SCREEN_WIDTH / 2, 118, '#8cc8fc', { align: 'center' });
    drawSprite(context, SPRITES[pacoSpriteName('small', 'stand', 'normal')], 132, 148);
    drawText(context, `×  ${this.session.lives}`, 156, 153, '#fcfcfc');
    drawText(context, `PUNTOS ${String(this.session.score).padStart(6, '0')}`, SCREEN_WIDTH / 2, 196, '#9c9cb0', { align: 'center' });
  }
}

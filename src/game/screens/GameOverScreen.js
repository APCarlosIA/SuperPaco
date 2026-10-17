/**
 * @file Pantalla de fin de partida ("Se acabó lo que se daba").
 */
import { SCREEN_WIDTH } from '../../config/constants.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText } from '../../graphics/font.js';
import { drawBackdrop } from '../../graphics/uiKit.js';

/** Pasos antes de poder volver al título (para no saltárselo sin querer). */
const MINIMUM_DISPLAY_STEPS = 120;

export class GameOverScreen {
  /**
   * @param {import('../Game.js').Game} game
   * @param {number} finalScore
   */
  constructor(game, finalScore) {
    this.game = game;
    this.finalScore = finalScore;
    this.stepCounter = 0;
    soundEngine.playMusic('gameOver', { restart: true });
  }

  update() {
    this.stepCounter++;
    if (this.stepCounter > MINIMUM_DISPLAY_STEPS && this.game.controls.wasConfirmPressed()) this.game.showTitleScreen();
  }

  draw(context) {
    drawBackdrop(context, this.stepCounter, { top: '#4a1224', bottom: '#050208', accent: '#ff6a6a' });
    drawText(context, 'SE ACABÓ LO QUE', SCREEN_WIDTH / 2, 70, '#ffffff', { align: 'center', scale: 2, outlineColor: '#140c20' });
    drawText(context, 'SE DABA', SCREEN_WIDTH / 2, 92, '#ff6a6a', { align: 'center', scale: 2, outlineColor: '#140c20' });
    drawText(context, `PUNTOS ${String(this.finalScore).padStart(6, '0')}`, SCREEN_WIDTH / 2, 130, '#fcd800', { align: 'center' });
    drawSprite(context, SPRITES[pacoSpriteName('small', 'dead', 'normal')], 152, 150);
    if (this.stepCounter > MINIMUM_DISPLAY_STEPS) {
      const blinkColor = Math.floor(this.stepCounter / 16) % 2 ? '#fcfcfc' : '#6c6c80';
      drawText(context, '¿OTRA PARTIDITA? PULSA ENTER', SCREEN_WIDTH / 2, 200, blinkColor, { align: 'center' });
    }
  }
}

/**
 * @file Historia inicial, escrita letra a letra como en las consolas clásicas.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { fillRectangle } from '../../core/canvas.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { drawText, measureTextWidth } from '../../graphics/font.js';
import { STORY_LINES } from '../../world/texts.js';

/** Letras que aparecen por cada paso de simulación. */
const LETTERS_PER_STEP = 1.2;
/** Pausa (en letras) entre una línea y la siguiente. */
const PAUSE_BETWEEN_LINES = 4;
const INPUT_COOLDOWN_STEPS = 30;
const HIGHLIGHTED_LINE_INDEX = 4;

export class StoryScreen {
  /** @param {import('../Game.js').Game} game */
  constructor(game) {
    this.game = game;
    this.stepCounter = 0;
    soundEngine.playMusic('feria', { restart: true });
  }

  update() {
    this.stepCounter++;
    if (this.stepCounter > INPUT_COOLDOWN_STEPS && this.game.controls.wasConfirmPressed()) {
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_CONFIRM);
      this.game.showLevelIntro();
    }
  }

  draw(context) {
    fillRectangle(context, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#100c1c');
    const lettersToShow = Math.floor(this.stepCounter * LETTERS_PER_STEP);
    let lettersBeforeThisLine = 0;
    STORY_LINES.forEach((line, index) => {
      const visiblePart = line.slice(0, Math.max(0, lettersToShow - lettersBeforeThisLine));
      lettersBeforeThisLine += line.length + PAUSE_BETWEEN_LINES;
      const lineLeft = SCREEN_WIDTH / 2 - measureTextWidth(line) / 2;
      drawText(context, visiblePart, lineLeft, 30 + index * 13, index === HIGHLIGHTED_LINE_INDEX ? '#fcd800' : '#fcfcfc');
    });
    drawSprite(context, SPRITES.tortilla, 152, 158);
    const hasFinishedWriting = lettersToShow > lettersBeforeThisLine;
    if (hasFinishedWriting) drawText(context, '¡VAMOS, QUE NOS VAMOS!', SCREEN_WIDTH / 2, 190, '#fcd800', { align: 'center' });
    if (this.stepCounter > INPUT_COOLDOWN_STEPS) {
      const blinkColor = Math.floor(this.stepCounter / 16) % 2 ? '#fcfcfc' : '#6c6c80';
      drawText(context, 'PULSA ENTER', SCREEN_WIDTH / 2, 220, blinkColor, { align: 'center' });
    }
  }
}

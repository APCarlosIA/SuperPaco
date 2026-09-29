/**
 * @file Escena final en la cocina de la abuela.
 *
 * Pasos:
 *   1. La abuela da las gracias por recuperar la receta.
 *   2. Pregunta la gran cuestión: ¿la tortilla lleva cebolla? (se elige con las flechas).
 *   3. Respuesta según lo elegido.
 *   4. Créditos con la puntuación final.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../config/constants.js';
import { BUTTON } from '../../core/input.js';
import { fillRectangle, fillCircle } from '../../core/canvas.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite, drawScaledSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText, drawTextLines } from '../../graphics/font.js';
import { ENDING_TEXTS } from '../../world/texts.js';

const ENDING_STEP = Object.freeze({ GRANDMA_THANKS: 0, ONION_QUESTION: 1, ANSWER: 2, CREDITS: 3 });
const ONION_CHOICE = Object.freeze({ WITH_ONION: 0, WITHOUT_ONION: 1 });
/** Letras del diálogo que aparecen por paso. */
const LETTERS_PER_STEP = 1.5;
const INPUT_COOLDOWN_STEPS = 30;

export class EndingScreen {
  /**
   * @param {import('../Game.js').Game} game
   * @param {number} finalScore
   */
  constructor(game, finalScore) {
    this.game = game;
    this.finalScore = finalScore;
    this.endingStep = ENDING_STEP.GRANDMA_THANKS;
    this.onionChoice = ONION_CHOICE.WITH_ONION;
    this.stepsInCurrentPart = 0;
    soundEngine.playMusic('feria', { restart: true });
  }

  update() {
    this.stepsInCurrentPart++;
    if (this.endingStep === ENDING_STEP.ONION_QUESTION) this.updateOnionChoice();
    if (this.stepsInCurrentPart > INPUT_COOLDOWN_STEPS && this.game.controls.wasConfirmPressed()) this.advance();
  }

  /** @private Cualquier flecha alterna entre "con cebolla" y "sin cebolla". */
  updateOnionChoice() {
    const arrowPressed = [BUTTON.LEFT, BUTTON.RIGHT, BUTTON.UP, BUTTON.DOWN].some(button => this.game.controls.wasPressed(button));
    if (!arrowPressed) return;
    this.onionChoice = this.onionChoice === ONION_CHOICE.WITH_ONION ? ONION_CHOICE.WITHOUT_ONION : ONION_CHOICE.WITH_ONION;
    soundEngine.playSoundEffect(SOUND_EFFECT.MENU_MOVE);
  }

  /** @private Pasa a la siguiente parte del final o vuelve al título. */
  advance() {
    soundEngine.playSoundEffect(SOUND_EFFECT.MENU_CONFIRM);
    if (this.endingStep === ENDING_STEP.CREDITS) {
      this.game.showTitleScreen();
      return;
    }
    this.endingStep++;
    this.stepsInCurrentPart = 0;
    if (this.endingStep === ENDING_STEP.ANSWER) {
      // La abuela se alegra… o no tanto.
      soundEngine.playMusic(this.onionChoice === ONION_CHOICE.WITH_ONION ? 'fanfare' : 'lifeLost', { restart: true });
    } else if (this.endingStep === ENDING_STEP.CREDITS) {
      soundEngine.playMusic('feria', { restart: true });
    }
  }

  draw(context) {
    if (this.endingStep === ENDING_STEP.CREDITS) this.drawCredits(context);
    else {
      this.drawKitchenScene(context);
      this.drawDialogue(context);
    }
    if (this.stepsInCurrentPart > INPUT_COOLDOWN_STEPS) {
      const blinkColor = Math.floor(this.stepsInCurrentPart / 16) % 2 ? '#fcd800' : '#6c6c80';
      drawText(context, 'ENTER', SCREEN_WIDTH - 16, 222, blinkColor, { align: 'right' });
    }
  }

  /** @private La abuela, Paco y la tortilla sobre la mesa. */
  drawKitchenScene(context) {
    fillRectangle(context, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#1c1420');
    fillRectangle(context, 0, 150, SCREEN_WIDTH, 90, '#3c2c28');
    fillRectangle(context, 0, 150, SCREEN_WIDTH, 2, '#5c443c');
    for (let x = 0; x < SCREEN_WIDTH; x += 32) fillRectangle(context, x, 40, 20, 30, '#2c2030');
    // Mesa con la tortilla.
    fillRectangle(context, 120, 118, 80, 8, '#8c5c30');
    fillRectangle(context, 128, 126, 6, 24, '#5c3c20');
    fillRectangle(context, 186, 126, 6, 24, '#5c3c20');
    fillCircle(context, 160, 114, 12, '#fcfcfc');
    drawSprite(context, SPRITES.tortilla, 152, 104);
    drawScaledSprite(context, SPRITES.abuela, 56, 102, 2);
    drawScaledSprite(context, SPRITES[pacoSpriteName('big', 'stand', 'normal')], 226, 86, 2, true);
  }

  /** @private Cuadro de diálogo con el texto escribiéndose letra a letra. */
  drawDialogue(context) {
    fillRectangle(context, 8, 160, SCREEN_WIDTH - 16, 72, '#000000');
    fillRectangle(context, 9, 161, SCREEN_WIDTH - 18, 70, '#fcfcfc');
    fillRectangle(context, 11, 163, SCREEN_WIDTH - 22, 66, '#141024');
    const visibleLetters = Math.floor(this.stepsInCurrentPart * LETTERS_PER_STEP);
    const writeLetterByLetter = text => drawTextLines(context, text.slice(0, visibleLetters), 20, 170, '#fcfcfc', { lineHeight: 12 });

    if (this.endingStep === ENDING_STEP.GRANDMA_THANKS) {
      writeLetterByLetter(ENDING_TEXTS.grandmaThanks);
    } else if (this.endingStep === ENDING_STEP.ONION_QUESTION) {
      writeLetterByLetter(ENDING_TEXTS.onionQuestion);
      this.drawOnionOptions(context);
    } else {
      writeLetterByLetter(this.onionChoice === ONION_CHOICE.WITH_ONION ? ENDING_TEXTS.withOnionAnswer : ENDING_TEXTS.withoutOnionAnswer);
    }
  }

  /** @private */
  drawOnionOptions(context) {
    const isCursorVisible = Math.floor(this.stepsInCurrentPart / 16) % 2 === 1;
    const options = [
      { label: ENDING_TEXTS.withOnionOption, x: 40, choice: ONION_CHOICE.WITH_ONION },
      { label: ENDING_TEXTS.withoutOnionOption, x: 180, choice: ONION_CHOICE.WITHOUT_ONION }
    ];
    for (const option of options) {
      const isSelected = option.choice === this.onionChoice;
      const cursor = isSelected && isCursorVisible ? '▶ ' : '  ';
      drawText(context, cursor + option.label, option.x, 208, isSelected ? '#fcd800' : '#8c8ca0');
    }
  }

  /** @private */
  drawCredits(context) {
    fillRectangle(context, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#000000');
    drawText(context, 'FIN', SCREEN_WIDTH / 2, 40, '#fcd800', { align: 'center', scale: 4 });
    drawText(context, `PUNTOS ${String(this.finalScore).padStart(6, '0')}`, SCREEN_WIDTH / 2, 92, '#fcfcfc', { align: 'center' });
    drawText(context, ENDING_TEXTS.thanksForPlaying, SCREEN_WIDTH / 2, 120, '#fcfcfc', { align: 'center', scale: 2 });
    drawText(context, ENDING_TEXTS.farewell, SCREEN_WIDTH / 2, 150, '#8cc8fc', { align: 'center' });
    drawSprite(context, SPRITES.tortilla, 152, 170);
  }
}

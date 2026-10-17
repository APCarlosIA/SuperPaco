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
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite, drawScaledSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText, drawTextLines } from '../../graphics/font.js';
import { drawBackdrop, drawPanel } from '../../graphics/uiKit.js';
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

  /** @private La abuela, Paco y la tortilla sobre la mesa, en una cocina acogedora. */
  drawKitchenScene(context) {
    const wall = context.createLinearGradient(0, 0, 0, 150);
    wall.addColorStop(0, '#3a2840');
    wall.addColorStop(1, '#6a4a48');
    context.fillStyle = wall;
    context.fillRect(0, 0, SCREEN_WIDTH, 150);
    // Ventana con luz cálida de atardecer.
    context.fillStyle = '#1c1020';
    context.fillRect(212, 22, 70, 62);
    const sky = context.createLinearGradient(0, 26, 0, 80);
    sky.addColorStop(0, '#ff9a5a'); sky.addColorStop(1, '#ffd890');
    context.fillStyle = sky;
    context.fillRect(215, 25, 64, 56);
    context.fillStyle = '#1c1020';
    context.fillRect(246, 25, 2, 56); context.fillRect(215, 52, 64, 2);
    context.save();
    context.globalCompositeOperation = 'lighter';
    const light = context.createRadialGradient(247, 54, 4, 247, 54, 110);
    light.addColorStop(0, 'rgba(255,190,110,0.45)'); light.addColorStop(1, 'rgba(255,150,80,0)');
    context.fillStyle = light;
    context.fillRect(100, 0, 220, 190);
    context.restore();
    // Azulejos de la pared y suelo de madera.
    for (let x = 0; x < SCREEN_WIDTH; x += 20) {
      for (let y = 100; y < 150; y += 10) {
        context.fillStyle = (x / 20 + y / 10) % 2 ? '#e8dcc4' : '#d8c8aa';
        context.fillRect(x, y, 19.4, 9.4);
      }
    }
    const floor = context.createLinearGradient(0, 150, 0, SCREEN_HEIGHT);
    floor.addColorStop(0, '#7a5230'); floor.addColorStop(1, '#3a2418');
    context.fillStyle = floor;
    context.fillRect(0, 150, SCREEN_WIDTH, 90);
    context.strokeStyle = 'rgba(0,0,0,0.25)'; context.lineWidth = 0.6;
    for (let x = 0; x < SCREEN_WIDTH; x += 26) { context.beginPath(); context.moveTo(x, 150); context.lineTo(x - 18, SCREEN_HEIGHT); context.stroke(); }
    // Mesa con mantel y la tortilla en su plato.
    context.fillStyle = '#5a3820'; context.fillRect(128, 126, 6, 26); context.fillRect(186, 126, 6, 26);
    context.beginPath(); context.moveTo(112, 118); context.lineTo(208, 118); context.lineTo(216, 132); context.lineTo(104, 132); context.closePath();
    const cloth = context.createLinearGradient(0, 118, 0, 132);
    cloth.addColorStop(0, '#fff6e6'); cloth.addColorStop(1, '#e05a5a');
    context.fillStyle = cloth; context.fill();
    context.strokeStyle = '#140c20'; context.lineWidth = 1; context.stroke();
    context.beginPath(); context.ellipse(160, 117, 22, 5, 0, 0, Math.PI * 2);
    context.fillStyle = '#ffffff'; context.fill(); context.stroke();
    drawSprite(context, SPRITES.tortilla, 152, 104);
    drawScaledSprite(context, SPRITES.abuela, 56, 102, 2);
    drawScaledSprite(context, SPRITES[pacoSpriteName('big', 'stand', 'normal')], 226, 86, 2, true);
  }

  /** @private Cuadro de diálogo con el texto escribiéndose letra a letra. */
  drawDialogue(context) {
    drawPanel(context, 8, 160, SCREEN_WIDTH - 16, 72);
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
    drawBackdrop(context, this.stepsInCurrentPart, { top: '#3a2470', bottom: '#050208' });
    drawText(context, 'FIN', SCREEN_WIDTH / 2, 40, '#ffd84a', { align: 'center', scale: 4, outlineColor: '#140c20' });
    drawText(context, `PUNTOS ${String(this.finalScore).padStart(6, '0')}`, SCREEN_WIDTH / 2, 92, '#fcfcfc', { align: 'center' });
    drawText(context, ENDING_TEXTS.thanksForPlaying, SCREEN_WIDTH / 2, 120, '#fcfcfc', { align: 'center', scale: 2 });
    drawText(context, ENDING_TEXTS.farewell, SCREEN_WIDTH / 2, 150, '#8cc8fc', { align: 'center' });
    drawSprite(context, SPRITES.tortilla, 152, 170);
  }
}

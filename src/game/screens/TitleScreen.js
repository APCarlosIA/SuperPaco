/**
 * @file Pantalla de título con el logotipo sobre una bandera, el récord y el menú.
 *
 * Opciones del menú:
 *   - NUEVA PARTIDA: empieza desde Madrid (con la historia).
 *   - CONTINUAR: solo si se ha desbloqueado algún nivel; se elige con ◀ ▶.
 *   - CONTROLES: explica las teclas y los objetos.
 */
import { SCREEN_WIDTH, TILE_SIZE, GROUND_SURFACE_Y } from '../../config/constants.js';
import { BUTTON } from '../../core/input.js';
import { loadProgress, recordAchievement } from '../../core/storage.js';
import { createSecretCodeTracker, CHEF_CODE } from '../../core/secretCode.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText } from '../../graphics/font.js';
import { drawPanel, drawFlagBanner } from '../../graphics/uiKit.js';
import { getThemeAssets } from '../../graphics/themeAssets.js';
import { LEVELS } from '../../world/levels.js';
import { TITLE_TAGLINES } from '../../world/texts.js';
import { drawBackground } from '../worldRenderer.js';

const MENU_OPTION = Object.freeze({ NEW_GAME: 'newGame', CONTINUE: 'continue', CONTROLS: 'controls' });
/** Velocidad (px por paso) a la que se desplaza el fondo de Madrid. */
const BACKGROUND_SCROLL_SPEED = 0.6;
/** Pasos que se muestra cada frase de la portada. */
const TAGLINE_DURATION_STEPS = 240;
/** Pasos al entrar durante los que se ignoran pulsaciones (evita saltarse la pantalla sin querer). */
const INPUT_COOLDOWN_STEPS = 10;

export class TitleScreen {
  /** @param {import('../Game.js').Game} game */
  constructor(game) {
    this.game = game;
    this.stepCounter = 0;
    this.selectedOptionIndex = 0;
    this.taglineIndex = 0;
    const progress = loadProgress();
    this.highScore = progress.highScore;
    this.savedSeeds = (progress.seeds || []).length;
    this.savedBigCoins = (progress.bigCoins || []).length;
    this.highestUnlockedLevel = Math.min(progress.highestUnlockedLevel, LEVELS.length - 1);
    this.continueLevelIndex = this.highestUnlockedLevel;
    this.chefCodeTracker = createSecretCodeTracker(CHEF_CODE);
    /** Pasos que quedan de mostrar el aviso del truco del cocinero. */
    this.chefToastSteps = 0;
    soundEngine.playMusic('flamenco', { restart: true });
  }

  /** Opciones visibles del menú (CONTINUAR solo si hay niveles desbloqueados). */
  get menuOptions() {
    return this.highestUnlockedLevel > 0
      ? [MENU_OPTION.NEW_GAME, MENU_OPTION.CONTINUE, MENU_OPTION.CONTROLS]
      : [MENU_OPTION.NEW_GAME, MENU_OPTION.CONTROLS];
  }

  update() {
    this.stepCounter++;
    const options = this.menuOptions;
    if (this.game.controls.wasPressed(BUTTON.DOWN)) this.moveSelection(1, options.length);
    if (this.game.controls.wasPressed(BUTTON.UP)) this.moveSelection(-1, options.length);

    const unlockedChefMode = this.checkSecretCode();
    const selectedOption = options[this.selectedOptionIndex];
    if (selectedOption === MENU_OPTION.CONTINUE) this.updateContinueLevelChoice();
    if (this.stepCounter % TAGLINE_DURATION_STEPS === 0) this.taglineIndex = (this.taglineIndex + 1) % TITLE_TAGLINES.length;

    if (this.stepCounter > INPUT_COOLDOWN_STEPS && !unlockedChefMode && this.game.controls.wasConfirmPressed()) {
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_CONFIRM);
      if (selectedOption === MENU_OPTION.NEW_GAME) this.game.startNewGame(0);
      else if (selectedOption === MENU_OPTION.CONTINUE) this.game.startNewGame(this.continueLevelIndex);
      else this.game.showControlsScreen();
    }
  }

  /**
   * @private
   * Vigila el truco secreto ↑↑↓↓◀▶◀▶ B A: activa el modo cocinero.
   * @returns {boolean} true si se ha completado en este paso.
   */
  checkSecretCode() {
    if (this.chefToastSteps > 0) this.chefToastSteps--;
    let completed = false;
    for (const button of [BUTTON.UP, BUTTON.DOWN, BUTTON.LEFT, BUTTON.RIGHT, BUTTON.RUN, BUTTON.JUMP]) {
      if (this.game.controls.wasPressed(button) && this.chefCodeTracker.feed(button)) completed = true;
    }
    if (!completed) return false;
    this.game.session.chefMode = !this.game.session.chefMode;
    recordAchievement({ chefMode: this.game.session.chefMode });
    this.chefToastSteps = 150;
    soundEngine.playSoundEffect(SOUND_EFFECT.SECRET);
    return true;
  }

  /** @private */
  moveSelection(direction, optionCount) {
    this.selectedOptionIndex = (this.selectedOptionIndex + direction + optionCount) % optionCount;
    soundEngine.playSoundEffect(SOUND_EFFECT.MENU_MOVE);
  }

  /** @private Con ◀ ▶ se elige desde qué nivel desbloqueado continuar. */
  updateContinueLevelChoice() {
    if (this.game.controls.wasPressed(BUTTON.LEFT)) {
      this.continueLevelIndex = Math.max(1, this.continueLevelIndex - 1);
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_MOVE);
    }
    if (this.game.controls.wasPressed(BUTTON.RIGHT)) {
      this.continueLevelIndex = Math.min(this.highestUnlockedLevel, this.continueLevelIndex + 1);
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_MOVE);
    }
  }

  draw(context) {
    const madridAssets = getThemeAssets('madrid');
    const scrollX = this.stepCounter * BACKGROUND_SCROLL_SPEED;
    drawBackground(context, madridAssets.backgroundImages, madridAssets.theme, scrollX, [], this.stepCounter);
    this.drawScrollingGround(context, madridAssets.tileImages, scrollX);
    this.drawLogo(context);
    this.drawMenu(context);
    this.drawWalkingCharacters(context);
    if (this.chefToastSteps > 0) {
      drawPanel(context, 60, 150, 200, 20);
      drawText(context, this.game.session.chefMode ? '¡MODO COCINERO ACTIVADO!' : 'MODO COCINERO APAGADO', SCREEN_WIDTH / 2, 157, '#ffffff', { align: 'center', outlineColor: '#140c20' });
    }
    drawText(context, TITLE_TAGLINES[this.taglineIndex], SCREEN_WIDTH / 2, 226, '#fcfcfc', { align: 'center', outlineColor: '#140c20' });
  }

  /** @private */
  drawScrollingGround(context, tileImages, scrollX) {
    const { groundSurface, groundFill } = tileImages;
    const offset = -Math.floor(scrollX % TILE_SIZE);
    for (let x = offset; x < SCREEN_WIDTH; x += TILE_SIZE) {
      context.drawImage(groundSurface, x, GROUND_SURFACE_Y, TILE_SIZE, TILE_SIZE);
      context.drawImage(groundFill, x, GROUND_SURFACE_Y + TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  /** @private Logotipo sobre una cinta ondulante con los colores de la bandera. */
  drawLogo(context) {
    drawFlagBanner(context, 24, 62, this.stepCounter);
    const bounce = Math.sin(this.stepCounter / 18) * 1.6;
    context.save();
    context.translate(SCREEN_WIDTH / 2, 55 + bounce);
    context.rotate(Math.sin(this.stepCounter / 40) * 0.015);
    drawText(context, 'SÚPER PACO', 0, -10, '#e4162f', { align: 'center', scale: 3, outlineColor: '#140c20' });
    context.restore();
    drawText(context, 'LA TORTILLA PERDIDA', SCREEN_WIDTH / 2, 94, '#ffffff', { align: 'center', scale: 2, outlineColor: '#140c20' });
    drawText(context, `RÉCORD ${String(this.highScore).padStart(6, '0')}   SEMILLAS ${this.savedSeeds}/${LEVELS.length}   MONEDAS ${this.savedBigCoins}/${LEVELS.length * 3}`, SCREEN_WIDTH / 2, 116, '#ffd84a', { align: 'center', outlineColor: '#140c20' });
  }

  /** @private */
  drawMenu(context) {
    const labels = this.menuOptions.map(option => {
      if (option === MENU_OPTION.NEW_GAME) return 'NUEVA PARTIDA';
      if (option === MENU_OPTION.CONTINUE) return `CONTINUAR  ◀ NIVEL ${this.continueLevelIndex + 1} ▶`;
      return 'CONTROLES';
    });
    const lineHeight = 16;
    drawPanel(context, 70, 128, 180, labels.length * lineHeight + 10);
    labels.forEach((label, index) => {
      const y = 134 + index * lineHeight;
      const isSelected = index === this.selectedOptionIndex;
      if (isSelected) {
        const pulse = 0.5 + 0.5 * Math.sin(this.stepCounter / 8);
        context.fillStyle = `rgba(255, 216, 74, ${0.16 + pulse * 0.1})`;
        context.fillRect(76, y - 3, 168, 13);
        drawText(context, '▶', 80 + Math.sin(this.stepCounter / 6) * 1.5, y, '#ffd84a');
      }
      drawText(context, label, 92, y, isSelected ? '#ffd84a' : '#f4f0ff', { shadowColor: '#140c20' });
    });
  }

  /** @private Paco pasea por delante perseguido por un guiri. */
  drawWalkingCharacters(context) {
    const walkerX = ((this.stepCounter * 1.2) % (SCREEN_WIDTH + 60)) - 30;
    const runFrame = (Math.floor(this.stepCounter / 3) % 8) + 1;
    const guiriFrame = Math.floor(this.stepCounter / 8) % 2 ? 1 : 2;
    drawSprite(context, SPRITES[pacoSpriteName('small', `run${runFrame}`, this.game.session.chefMode ? 'chef' : 'normal')], walkerX, GROUND_SURFACE_Y - 16);
    drawSprite(context, SPRITES[`guiri_frame${guiriFrame}`], walkerX - 60, GROUND_SURFACE_Y - 16, { mirrored: true });
  }
}

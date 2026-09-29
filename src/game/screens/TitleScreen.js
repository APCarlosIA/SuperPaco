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
import { fillRectangle } from '../../core/canvas.js';
import { loadProgress } from '../../core/storage.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText } from '../../graphics/font.js';
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
    this.highestUnlockedLevel = Math.min(progress.highestUnlockedLevel, LEVELS.length - 1);
    this.continueLevelIndex = this.highestUnlockedLevel;
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

    const selectedOption = options[this.selectedOptionIndex];
    if (selectedOption === MENU_OPTION.CONTINUE) this.updateContinueLevelChoice();
    if (this.stepCounter % TAGLINE_DURATION_STEPS === 0) this.taglineIndex = (this.taglineIndex + 1) % TITLE_TAGLINES.length;

    if (this.stepCounter > INPUT_COOLDOWN_STEPS && this.game.controls.wasConfirmPressed()) {
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_CONFIRM);
      if (selectedOption === MENU_OPTION.NEW_GAME) this.game.startNewGame(0);
      else if (selectedOption === MENU_OPTION.CONTINUE) this.game.startNewGame(this.continueLevelIndex);
      else this.game.showControlsScreen();
    }
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
    drawBackground(context, madridAssets.backgroundImages, madridAssets.theme, scrollX);
    this.drawScrollingGround(context, madridAssets.tileImages, scrollX);
    this.drawLogo(context);
    this.drawMenu(context);
    this.drawWalkingCharacters(context);
    drawText(context, TITLE_TAGLINES[this.taglineIndex], SCREEN_WIDTH / 2, 226, '#fcfcfc', { align: 'center', outlineColor: '#000000' });
  }

  /** @private */
  drawScrollingGround(context, tileImages, scrollX) {
    const { groundSurface, groundFill } = tileImages;
    const offset = -Math.floor(scrollX % TILE_SIZE);
    for (let x = offset; x < SCREEN_WIDTH; x += TILE_SIZE) {
      context.drawImage(groundSurface, x, GROUND_SURFACE_Y);
      context.drawImage(groundFill, x, GROUND_SURFACE_Y + TILE_SIZE);
    }
  }

  /** @private Logotipo sobre una franja roja y amarilla. */
  drawLogo(context) {
    fillRectangle(context, 0, 26, SCREEN_WIDTH, 14, '#c8102e');
    fillRectangle(context, 0, 40, SCREEN_WIDTH, 30, '#fcd800');
    fillRectangle(context, 0, 70, SCREEN_WIDTH, 14, '#c8102e');
    fillRectangle(context, 0, 25, SCREEN_WIDTH, 1, '#000000');
    fillRectangle(context, 0, 84, SCREEN_WIDTH, 1, '#000000');
    drawText(context, 'SÚPER PACO', SCREEN_WIDTH / 2, 45, '#c8102e', { align: 'center', scale: 3, outlineColor: '#000000' });
    drawText(context, 'LA TORTILLA PERDIDA', SCREEN_WIDTH / 2, 92, '#fcfcfc', { align: 'center', scale: 2, outlineColor: '#000000' });
    drawText(context, `RÉCORD ${String(this.highScore).padStart(6, '0')}`, SCREEN_WIDTH / 2, 112, '#fcd800', { align: 'center', shadowColor: '#000000' });
  }

  /** @private */
  drawMenu(context) {
    const labels = this.menuOptions.map(option => {
      if (option === MENU_OPTION.NEW_GAME) return 'NUEVA PARTIDA';
      if (option === MENU_OPTION.CONTINUE) return `CONTINUAR  ◀ NIVEL ${this.continueLevelIndex + 1} ▶`;
      return 'CONTROLES';
    });
    const lineHeight = 14;
    context.fillStyle = 'rgba(8,6,20,0.6)';
    context.fillRect(70, 126, 180, labels.length * lineHeight + 8);
    const isCursorVisible = Math.floor(this.stepCounter / 16) % 2 === 1;
    labels.forEach((label, index) => {
      const y = 132 + index * lineHeight;
      const isSelected = index === this.selectedOptionIndex;
      if (isSelected && isCursorVisible) drawText(context, '▶', 80, y, '#fcd800');
      drawText(context, label, 92, y, isSelected ? '#fcd800' : '#fcfcfc');
    });
  }

  /** @private Paco pasea por delante perseguido por un guiri. */
  drawWalkingCharacters(context) {
    const walkerX = ((this.stepCounter * 1.2) % (SCREEN_WIDTH + 60)) - 30;
    const walkFrame = Math.floor(this.stepCounter / 8) % 2 ? 1 : 2;
    drawSprite(context, SPRITES[pacoSpriteName('small', `walk${walkFrame}`, 'normal')], walkerX, GROUND_SURFACE_Y - 16);
    drawSprite(context, SPRITES[`guiri_frame${walkFrame}`], walkerX - 60, GROUND_SURFACE_Y - 16, { mirrored: true });
  }
}

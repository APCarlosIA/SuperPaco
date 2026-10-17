/**
 * @file Pantalla que presenta el nivel: número, ciudad, frase y vidas, sobre un fondo con los colores de la ciudad.
 */
import { SCREEN_WIDTH } from '../../config/constants.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { pacoSpriteName } from '../../graphics/spriteData.js';
import { drawText } from '../../graphics/font.js';
import { drawBackdrop, drawPanel } from '../../graphics/uiKit.js';
import { THEMES } from '../../world/themes.js';
import { drawCollectibleCounters } from '../hud.js';

/** Todos los niveles tienen tres monedas gigantes. */
const BIG_COINS_PER_LEVEL = 3;
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
    const theme = THEMES[level.themeName] || THEMES.madrid;
    drawBackdrop(context, this.stepCounter, { top: theme.skyColors[0], bottom: '#07040f', accent: theme.skyColors[2] });
    const slide = Math.min(1, this.stepCounter / 14);
    const ease = 1 - Math.pow(1 - slide, 3);
    drawText(context, `NIVEL ${this.session.levelIndex + 1}`, SCREEN_WIDTH / 2, 50 - (1 - ease) * 30, '#ffffff', { align: 'center', scale: 2, outlineColor: '#140c20' });
    drawText(context, level.name, SCREEN_WIDTH / 2 + (1 - ease) * 200, 78, '#ffd84a', { align: 'center', scale: 3, outlineColor: '#140c20' });
    drawText(context, `"${level.subtitle}"`, SCREEN_WIDTH / 2, 118, '#bfe6ff', { align: 'center', shadowColor: '#140c20' });
    drawPanel(context, 116, 140, 88, 30);
    const bob = Math.abs(Math.sin(this.stepCounter / 7)) * 2;
    drawSprite(context, SPRITES[pacoSpriteName('small', `run${(Math.floor(this.stepCounter / 3) % 8) + 1}`, 'normal')], 126, 147 - bob);
    drawText(context, `×  ${this.session.lives}`, 152, 151, '#ffffff', { shadowColor: '#140c20', scale: 2 });
    drawText(context, 'EN ESTE NIVEL', SCREEN_WIDTH / 2, 178, '#c8c8e0', { align: 'center', shadowColor: '#140c20' });
    drawCollectibleCounters(context, {
      hasSeed: this.session.seeds.has(this.session.levelIndex),
      bigCoins: this.session.countBigCoinsInLevel(this.session.levelIndex),
      bigCoinTotal: BIG_COINS_PER_LEVEL
    }, SCREEN_WIDTH / 2 - 26, 198);
    drawText(context, `PUNTOS ${String(this.session.score).padStart(6, '0')}`, SCREEN_WIDTH / 2, 214, '#c8c8e0', { align: 'center', shadowColor: '#140c20' });
  }
}

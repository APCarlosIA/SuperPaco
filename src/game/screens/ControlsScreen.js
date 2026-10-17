/**
 * @file Pantalla que explica los controles y para qué sirve cada objeto.
 */
import { SCREEN_WIDTH } from '../../config/constants.js';
import { BUTTON } from '../../core/input.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../../graphics/sprites.js';
import { drawText } from '../../graphics/font.js';
import { drawBackdrop, drawPanel } from '../../graphics/uiKit.js';
import { CONTROLS_HELP_ROWS, ITEM_HELP_ROWS } from '../../world/texts.js';

const INPUT_COOLDOWN_STEPS = 10;
const ITEMS_PER_COLUMN = 3;

export class ControlsScreen {
  /** @param {import('../Game.js').Game} game */
  constructor(game) {
    this.game = game;
    this.stepCounter = 0;
  }

  update() {
    this.stepCounter++;
    const wantsToGoBack = this.game.controls.wasConfirmPressed() || this.game.controls.wasPressed(BUTTON.PAUSE);
    if (this.stepCounter > INPUT_COOLDOWN_STEPS && wantsToGoBack) {
      soundEngine.playSoundEffect(SOUND_EFFECT.MENU_CONFIRM);
      this.game.showTitleScreen();
    }
  }

  draw(context) {
    drawBackdrop(context, this.stepCounter, { top: '#2a1e58', bottom: '#07040f' });
    drawPanel(context, 6, 30, SCREEN_WIDTH - 12, 92);
    drawPanel(context, 6, 126, SCREEN_WIDTH - 12, 90);
    drawText(context, 'CONTROLES', SCREEN_WIDTH / 2, 10, '#ffd84a', { align: 'center', scale: 2, outlineColor: '#140c20' });
    CONTROLS_HELP_ROWS.forEach(([keys, action], index) => {
      drawText(context, keys, 14, 38 + index * 12, '#8cc8fc');
      drawText(context, action, 118, 38 + index * 12, '#fcfcfc');
    });

    drawText(context, 'OBJETOS', SCREEN_WIDTH / 2, 130, '#ffd84a', { align: 'center', outlineColor: '#140c20' });
    ITEM_HELP_ROWS.forEach(([spriteName, description], index) => {
      const x = index < ITEMS_PER_COLUMN ? 14 : 170;
      const y = 142 + (index % ITEMS_PER_COLUMN) * 20;
      drawSprite(context, SPRITES[spriteName], x, y - 4);
      drawText(context, description, x + 20, y + 2, '#fcfcfc');
    });

    const blinkColor = Math.floor(this.stepCounter / 16) % 2 ? '#fcd800' : '#9c9cb0';
    drawText(context, 'PULSA ENTER PARA VOLVER', SCREEN_WIDTH / 2, 226, blinkColor, { align: 'center' });
  }
}

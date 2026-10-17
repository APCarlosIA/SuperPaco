/**
 * @file Marcador superior (HUD): puntos, vidas, pesetas, nivel y tiempo.
 */
import { LEVEL_TIMER, SCREEN_WIDTH } from '../config/constants.js';
import { SPRITES, drawSpriteFitted } from '../graphics/sprites.js';
import { drawText } from '../graphics/font.js';

const LABEL_ROW_Y = 5;
const VALUE_ROW_Y = 15;
const STYLE = { outlineColor: '#140c20' };

/**
 * Dibuja el marcador.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Object} status
 * @param {import('./GameSession.js').GameSession} status.session
 * @param {number} status.levelNumber Número del nivel (desde 1).
 * @param {string} status.levelName
 * @param {number} status.timeRemaining
 * @param {number} status.stepCounter Para hacer parpadear el tiempo cuando se acaba.
 */
export function drawHud(context, { session, levelNumber, levelName, timeRemaining, stepCounter }) {
  // Franja oscura translúcida para que se lea sobre cualquier fondo.
  const bar = context.createLinearGradient(0, 0, 0, 30);
  bar.addColorStop(0, 'rgba(10, 6, 28, 0.6)');
  bar.addColorStop(1, 'rgba(10, 6, 28, 0)');
  context.fillStyle = bar;
  context.fillRect(0, 0, SCREEN_WIDTH, 30);

  drawText(context, 'PACO', 12, LABEL_ROW_Y, '#ffd84a', STYLE);
  drawText(context, String(session.score).padStart(6, '0'), 12, VALUE_ROW_Y, '#ffffff', STYLE);

  drawText(context, `♥×${session.lives}`, 96, LABEL_ROW_Y, '#ff7a8a', STYLE);
  drawSpriteFitted(context, SPRITES.peseta_spin0, 94, 13, 9, 8);
  drawText(context, `×${String(session.coins).padStart(2, '0')}`, 104, VALUE_ROW_Y, '#ffffff', STYLE);

  drawText(context, 'NIVEL', 160, LABEL_ROW_Y, '#ffd84a', STYLE);
  drawText(context, `${levelNumber} ${levelName}`, 160, VALUE_ROW_Y, '#ffffff', STYLE);

  const isRunningOut = timeRemaining <= LEVEL_TIMER.hurryWarningTime;
  const blinkRed = isRunningOut && Math.floor(stepCounter / 16) % 2 === 1;
  drawText(context, 'TIEMPO', 308, LABEL_ROW_Y, '#ffd84a', { ...STYLE, align: 'right' });
  drawText(context, String(timeRemaining), 308, VALUE_ROW_Y, blinkRed ? '#ff5a5a' : '#ffffff', { ...STYLE, align: 'right' });
}

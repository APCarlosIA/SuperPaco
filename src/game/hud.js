/**
 * @file Marcador superior (HUD): puntos, vidas, pesetas, nivel y tiempo.
 */
import { LEVEL_TIMER } from '../config/constants.js';
import { SPRITES, drawSpriteFitted } from '../graphics/sprites.js';
import { drawText } from '../graphics/font.js';

const LABEL_ROW_Y = 5;
const VALUE_ROW_Y = 15;
const SHADOW = { shadowColor: '#000000' };

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
  drawText(context, 'PACO', 12, LABEL_ROW_Y, '#fcfcfc', SHADOW);
  drawText(context, String(session.score).padStart(6, '0'), 12, VALUE_ROW_Y, '#fcfcfc', SHADOW);

  drawText(context, `♥×${session.lives}`, 96, LABEL_ROW_Y, '#fc7c7c', SHADOW);
  drawSpriteFitted(context, SPRITES.peseta_spin0, 94, 13, 9, 8);
  drawText(context, `×${String(session.coins).padStart(2, '0')}`, 104, VALUE_ROW_Y, '#fcfcfc', SHADOW);

  drawText(context, 'NIVEL', 160, LABEL_ROW_Y, '#fcfcfc', SHADOW);
  drawText(context, `${levelNumber} ${levelName}`, 160, VALUE_ROW_Y, '#fcd800', SHADOW);

  const isRunningOut = timeRemaining <= LEVEL_TIMER.hurryWarningTime;
  const blinkRed = isRunningOut && Math.floor(stepCounter / 16) % 2 === 1;
  drawText(context, 'TIEMPO', 308, LABEL_ROW_Y, '#fcfcfc', { ...SHADOW, align: 'right' });
  drawText(context, String(timeRemaining), 308, VALUE_ROW_Y, blinkRed ? '#fc5c5c' : '#fcfcfc', { ...SHADOW, align: 'right' });
}

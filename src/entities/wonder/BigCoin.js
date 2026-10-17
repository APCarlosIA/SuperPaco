/**
 * @file Moneda gigante escondida (tres por nivel). Se guarda en la partida.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { Entity } from '../Entity.js';
import { addGlow } from '../../graphics/shapes.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { shadedEllipse, sheen } from '../../graphics/creatureKit.js';

export class BigCoin extends Entity {
  /**
   * @param {number} column
   * @param {number} row
   * @param {{number: number}} settings Número de la moneda dentro del nivel.
   */
  constructor(column, row, settings) {
    super(column * TILE_SIZE, row * TILE_SIZE, 16, 16);
    this.coinNumber = settings.number;
    /** Ilumina un poco a su alrededor en los apagones. */
    this.isWonderLight = true;
  }

  update() {
    this.ageInSteps++;
  }

  /** @param {import('../../game/World.js').World} world */
  onPlayerContact(player, world) {
    if (this.shouldBeRemoved) return;
    this.shouldBeRemoved = true;
    world.collectBigCoin(this);
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   * @param {boolean} [alreadyOwned] Si ya se consiguió, se dibuja apagada.
   */
  draw(context, cameraX) {
    const x = this.centerX - cameraX;
    const y = this.centerY + Math.sin(this.ageInSteps / 16) * 1.6;
    const spin = Math.abs(Math.cos(this.ageInSteps / 22)) * 0.85 + 0.15;
    addGlow(context, x, y, 22, '255, 120, 230', 0.55);
    context.save();
    context.translate(x, y);
    context.scale(spin, 1);
    shadedEllipse(context, 0, 0, 7.6, 7.6, '#e85adc', { light: '#ffc0f4', dark: '#8a1a82' });
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.9; context.beginPath(); context.arc(0, 0, 7.6, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = '#ffe0fa'; context.lineWidth = 0.7; context.beginPath(); context.arc(0, 0, 5.6, 0, Math.PI * 2); context.stroke();
    context.fillStyle = '#ffe0fa';
    context.beginPath();
    for (let point = 0; point < 10; point++) { const radius = point % 2 ? 1.7 : 4; const angle = -Math.PI / 2 + point * Math.PI / 5; context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
    context.closePath(); context.fill();
    sheen(context, -3, -3.6, 2, 0.9, -0.6, 0.7);
    context.restore();
  }
}

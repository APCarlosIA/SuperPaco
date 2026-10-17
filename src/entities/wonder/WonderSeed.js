/**
 * @file Semilla Maravilla: premio por superar el tramo de una Flor Maravilla.
 * Es una tortilla dorada con una estrella; da puntos y se guarda en la partida.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { Entity } from '../Entity.js';
import { addGlow } from '../../graphics/shapes.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { shadedEllipse, sparkle, sheen } from '../../graphics/creatureKit.js';

export class WonderSeed extends Entity {
  /**
   * @param {number} column
   * @param {number} row Fila central.
   */
  constructor(column, row) {
    super(column * TILE_SIZE, row * TILE_SIZE, 16, 16);
    this.popSteps = 0;
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
    world.collectSeed(this);
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = this.centerX - cameraX;
    const appear = Math.min(1, this.ageInSteps / 14);
    const scale = appear < 1 ? 1 + Math.sin(appear * Math.PI) * 0.5 : 1;
    const y = this.centerY + Math.sin(this.ageInSteps / 12) * 2.4;
    addGlow(context, x, y, 30, '255, 220, 110', 0.7);
    context.save();
    context.translate(x, y);
    context.scale(scale * appear, scale * appear);
    context.rotate(Math.sin(this.ageInSteps / 24) * 0.15);
    shadedEllipse(context, 0, 0, 7.4, 7.4, '#ffd23a', { light: '#fff6a8', dark: '#c8861c' });
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.9; context.beginPath(); context.arc(0, 0, 7.4, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = '#c8861c'; context.lineWidth = 0.6; context.beginPath(); context.arc(0, 0, 5.4, 0, Math.PI * 2); context.stroke();
    sparkle(context, 0, 0, 4.4, '#fffbe0');
    sheen(context, -3, -3.4, 2, 0.9, -0.6, 0.7);
    context.restore();
    // Destellos que giran alrededor.
    for (let star = 0; star < 3; star++) {
      const angle = this.ageInSteps / 20 + star * 2.1;
      sparkle(context, x + Math.cos(angle) * 11, y + Math.sin(angle) * 9, 1.8 + Math.sin(this.ageInSteps / 6 + star), '#ffffff');
    }
  }
}

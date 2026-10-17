/**
 * @file Flor Maravilla: al tocarla, el nivel se transforma durante un tramo
 * (gravedad lunar, lluvia de pesetas, plataformas al ritmo, apagón, estampida
 * de toros o desfile). Al terminar el tramo aparece la Semilla Maravilla.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { Entity } from '../Entity.js';
import { addGlow, outlinedCircle } from '../../graphics/shapes.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { eye, mouth } from '../../graphics/creatureKit.js';

const PETAL_COUNT = 8;
const PETAL_COLORS = [['#ff7ad8', '#b02aa0'], ['#7ad8ff', '#2a6ad8'], ['#ffe45a', '#e08a1c'], ['#9aff8a', '#2a9a4a']];

export class WonderFlower extends Entity {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   * @param {{eventKind: string, endColumn: number}} settings
   */
  constructor(column, row, settings) {
    super(column * TILE_SIZE + 1, (row + 1) * TILE_SIZE - 15, 14, 14);
    this.eventKind = settings.eventKind;
    this.endColumn = settings.endColumn;
    /** Ilumina un poco a su alrededor en los apagones. */
    this.isWonderLight = true;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    if (this.ageInSteps % 18 === 0) world.spawnSparkle(this.centerX + (Math.random() - 0.5) * 22, this.centerY + (Math.random() - 0.5) * 22);
  }

  /** @param {import('../../game/World.js').World} world */
  onPlayerContact(player, world) {
    if (this.shouldBeRemoved) return;
    this.shouldBeRemoved = true;
    world.triggerWonder(this);
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = this.centerX - cameraX;
    const bob = Math.sin(this.ageInSteps / 14) * 1.2;
    const y = this.centerY + bob;
    const pulse = 0.5 + 0.5 * Math.sin(this.ageInSteps / 9);
    addGlow(context, x, y, 26 + pulse * 6, '255, 150, 255', 0.5);
    // Tallo.
    context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 3; context.lineCap = 'round';
    context.beginPath(); context.moveTo(x, y + 5); context.quadraticCurveTo(x + 1.5, y + 9, x, this.bottom); context.stroke();
    context.strokeStyle = '#3ac85a'; context.lineWidth = 1.8;
    context.beginPath(); context.moveTo(x, y + 5); context.quadraticCurveTo(x + 1.5, y + 9, x, this.bottom); context.stroke();
    // Pétalos de colores que giran.
    context.save();
    context.translate(x, y);
    context.rotate(this.ageInSteps / 40);
    for (let petal = 0; petal < PETAL_COUNT; petal++) {
      const [light, dark] = PETAL_COLORS[petal % PETAL_COLORS.length];
      context.save();
      context.rotate(petal * Math.PI * 2 / PETAL_COUNT);
      context.beginPath(); context.ellipse(0, -6.2, 3, 4.4, 0, 0, Math.PI * 2);
      const gradient = context.createLinearGradient(0, -10, 0, -2);
      gradient.addColorStop(0, light); gradient.addColorStop(1, dark);
      context.fillStyle = gradient; context.fill();
      context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.7; context.stroke();
      context.restore();
    }
    context.restore();
    // Cara sonriente en el centro.
    outlinedCircle(context, x, y, 4.2, '#fff6a8', '#ffb02a', 0.8);
    eye(context, x - 1.5, y - 0.6, 0.95, { lookX: 0, lookY: 0.2 }); eye(context, x + 1.5, y - 0.6, 0.95, { lookX: 0, lookY: 0.2 });
    mouth(context, x, y + 1.8, 2, 'smile');
  }
}

/**
 * @file Entrada y salida de las salas secretas: alcantarillas (ABAJO) y
 * puertas (ARRIBA).
 */
import { TILE_SIZE } from '../../config/constants.js';
import { BUTTON } from '../../core/input.js';
import { Entity } from '../Entity.js';
import { OUTLINE_COLOR } from '../../graphics/hd.js';
import { roundedPath, fillWithOutline } from '../../graphics/shapes.js';

/** Pasos de espera antes de poder volver a usar una puerta. */
const COOLDOWN_STEPS = 40;

export class Doorway extends Entity {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   * @param {{look: 'manhole'|'door', roomId: string|null, direction: 'enter'|'exit'}} settings
   */
  constructor(column, row, settings) {
    super(column * TILE_SIZE, (row + 1) * TILE_SIZE - 16, 16, 16);
    this.look = settings.look;
    this.roomId = settings.roomId;
    this.direction = settings.direction;
    this.drawsBehindTiles = false;
    this.cooldown = COOLDOWN_STEPS;
    this.isPlayerNear = false;
  }

  /** Botón que hay que pulsar para usarla. */
  get triggerButton() {
    return this.look === 'manhole' ? BUTTON.DOWN : BUTTON.UP;
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    this.ageInSteps++;
    if (this.cooldown > 0) this.cooldown--;
    const player = world.player;
    const centered = Math.abs(player.centerX - this.centerX) < 8;
    this.isPlayerNear = centered && player.isOnGround && Math.abs(player.bottom - this.bottom) < 4;
    if (this.isPlayerNear && this.cooldown === 0 && world.isPlayerControllable() && (world.controls.wasPressed(this.triggerButton) || world.controls.isHeld(this.triggerButton))) {
      this.cooldown = COOLDOWN_STEPS;
      world.useDoor(this);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    const x = this.x - cameraX;
    if (this.look === 'manhole') {
      // Tapa de alcantarilla a ras de suelo.
      context.beginPath(); context.ellipse(x + 8, this.bottom - 0.6, 7.6, 1.8, 0, 0, Math.PI * 2);
      fillWithOutline(context, '#8a8a9a', '#4a4a5a', this.bottom - 2.6, this.bottom + 1, 0.7);
      context.strokeStyle = 'rgba(20,12,32,0.6)'; context.lineWidth = 0.5;
      for (let line = -4; line <= 4; line += 2) { context.beginPath(); context.moveTo(x + 8 + line, this.bottom - 1.9); context.lineTo(x + 8 + line, this.bottom + 0.4); context.stroke(); }
    } else {
      // Puerta de madera con marco y pomo dorado.
      roundedPath(context, x + 1, this.y - 4, 14, 20, 5);
      fillWithOutline(context, '#a8683a', '#5a3018', this.y - 4, this.bottom, 1);
      roundedPath(context, x + 3.4, this.y - 1.4, 9.2, 17.4, 3.6);
      context.fillStyle = 'rgba(30,12,4,0.35)'; context.fill();
      context.strokeStyle = 'rgba(255,220,160,0.35)'; context.lineWidth = 0.5; context.stroke();
      context.fillStyle = '#ffd24a'; context.beginPath(); context.arc(x + 11.4, this.y + 7, 1, 0, Math.PI * 2); context.fill();
      context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.4; context.stroke();
    }
    if (this.isPlayerNear) {
      const bounce = Math.sin(this.ageInSteps / 6) * 1.4;
      const up = this.look !== 'manhole';
      const arrowY = this.y - (up ? 12 : 6) + bounce;
      context.beginPath();
      if (up) { context.moveTo(x + 8, arrowY - 4); context.lineTo(x + 13, arrowY + 2); context.lineTo(x + 3, arrowY + 2); }
      else { context.moveTo(x + 8, arrowY + 4); context.lineTo(x + 13, arrowY - 2); context.lineTo(x + 3, arrowY - 2); }
      context.closePath();
      fillWithOutline(context, '#fff6a8', '#ffc02a', arrowY - 4, arrowY + 4, 0.9);
    }
  }
}

/**
 * @file Dibujo vectorial de los objetos: peseta, bocadillo, pimiento, churros,
 * décimo de lotería, proyectiles, jamón, tortilla, receta y maleta.
 */
import { TAU, curveTube, shadedEllipse, shadedRect, sheen, sparkle } from './creatureKit.js';
import { roundedPath } from './shapes.js';

export const ITEM_ART = {
  peseta: {
    width: 16, height: 14, frames: 3, frameNames: index => `peseta_spin${index}`,
    paint(context, frame) {
      const squeeze = [1, 0.55, 0.16][frame];
      context.save();
      context.translate(8, 7);
      context.scale(squeeze, 1);
      shadedEllipse(context, 0, 0, 6.2, 6.2, '#ffd23a', { light: '#fff6a8', dark: '#c8861c' });
      context.strokeStyle = '#c8861c'; context.lineWidth = 0.7; context.beginPath(); context.arc(0, 0, 4.4, 0, TAU); context.stroke();
      context.fillStyle = '#c8861c'; context.font = 'bold 6px sans-serif';
      roundedPath(context, -1.4, -2.4, 2.8, 4.8, 1); context.fill();
      context.fillStyle = '#fff6a8'; context.fillRect(-0.6, -1.6, 0.8, 3);
      sheen(context, -2.2, -3, 1.6, 0.8, -0.7, 0.7);
      context.restore();
    }
  },
  bocadillo: {
    width: 16, height: 16, frames: 1,
    paint(context) {
      shadedEllipse(context, 8, 11.6, 7.4, 3.6, '#e0a050', { light: '#ffd890', dark: '#8a5420' });
      // Relleno: lechuga, jamón y queso.
      context.fillStyle = '#58c850'; context.beginPath(); context.moveTo(1.4, 9.6); for (let x = 1.4; x <= 14.6; x += 2.4) context.quadraticCurveTo(x + 1.2, 11.4, x + 2.4, 9.6); context.lineTo(14.6, 8.6); context.lineTo(1.4, 8.6); context.fill();
      shadedRect(context, 1.6, 7.4, 12.8, 2, 0.8, '#ff8a9a');
      shadedRect(context, 2, 6.2, 12, 1.6, 0.6, '#ffd84a');
      // Pan de arriba con semillas.
      shadedEllipse(context, 8, 5.6, 7.2, 3.8, '#e8ac5c', { light: '#ffe0a0', dark: '#9a6028' });
      context.fillStyle = '#fff2c8'; for (const [x, y] of [[4.4, 4.2], [7.6, 3], [10.6, 4], [6, 6], [9.6, 6.2]]) { context.beginPath(); context.ellipse(x, y, 0.7, 0.4, 0.4, 0, TAU); context.fill(); }
      sheen(context, 5.4, 3, 2.2, 0.8, -0.2, 0.5);
    }
  },
  pimiento: {
    width: 16, height: 16, frames: 1,
    paint(context) {
      context.save(); context.translate(8, 9); context.rotate(0.35);
      context.beginPath(); context.moveTo(-3.4, -5); context.quadraticCurveTo(-6, 2, -1.2, 7); context.quadraticCurveTo(1.2, 8, 2.2, 4.4); context.quadraticCurveTo(6.2, -1, 3.4, -5); context.quadraticCurveTo(0, -7, -3.4, -5); context.closePath();
      const gradient = context.createLinearGradient(-5, -5, 5, 6); gradient.addColorStop(0, '#9af060'); gradient.addColorStop(0.5, '#2eb83a'); gradient.addColorStop(1, '#0e6a28');
      context.fillStyle = gradient; context.fill();
      sheen(context, -1.8, -2, 1.2, 3, 0.2, 0.55);
      curveTube(context, [[0, -6], [0.8, -8], [2.4, -8.6]], 1.4, '#3a8a2a');
      context.restore();
    }
  },
  churros: {
    width: 16, height: 16, frames: 1,
    paint(context) {
      for (const [x, tilt] of [[4.4, -0.2], [8, 0], [11.6, 0.2]]) {
        context.save(); context.translate(x, 7); context.rotate(tilt);
        shadedRect(context, -1.5, -6, 3, 12, 1.4, '#e8a848', { light: '#ffe0a0', dark: '#a8641c' });
        context.strokeStyle = 'rgba(120,60,10,0.55)'; context.lineWidth = 0.35; for (let y = -5; y < 5; y += 1.6) { context.beginPath(); context.moveTo(-1.2, y); context.lineTo(1.2, y + 0.6); context.stroke(); }
        context.restore();
      }
      // Taza de chocolate.
      context.beginPath(); context.moveTo(1.6, 8.6); context.lineTo(14.4, 8.6); context.quadraticCurveTo(14, 15.4, 8, 15.4); context.quadraticCurveTo(2, 15.4, 1.6, 8.6); context.closePath();
      const cup = context.createLinearGradient(0, 8, 0, 15.4); cup.addColorStop(0, '#ffffff'); cup.addColorStop(1, '#b8bcd0'); context.fillStyle = cup; context.fill();
      shadedEllipse(context, 8, 8.6, 6.8, 1.6, '#5a2c14', { light: '#8a4a2a' });
      context.strokeStyle = '#d8dce8'; context.lineWidth = 1; context.beginPath(); context.arc(14.6, 11.4, 1.8, -1.4, 1.4); context.stroke();
      context.fillStyle = '#2a64d8'; context.fillRect(3.4, 11.8, 9.2, 0.9);
    }
  },
  loteria: {
    width: 16, height: 14, frames: 1,
    paint(context) {
      shadedRect(context, 0.6, 0.6, 14.8, 12.8, 1.6, '#3cb86a', { vertical: true });
      shadedRect(context, 1.8, 1.8, 12.4, 10.4, 1, '#fff8e8', { vertical: true });
      context.fillStyle = '#d41c1c'; context.fillRect(2.4, 8.6, 5.6, 2.8);
      context.fillStyle = '#ffc42a'; context.fillRect(9.6, 8.6, 3.6, 2.8);
      context.fillStyle = '#3a2a20'; for (let digit = 0; digit < 5; digit++) context.fillRect(2.8 + digit * 2.2, 3, 1.4, 3.2);
      sheen(context, 4, 2.2, 3, 0.5, 0, 0.5);
    }
  },
  pimiento_lanzado: {
    width: 8, height: 8, frames: 1,
    paint(context) {
      context.fillStyle = '#ffb02a'; context.beginPath(); context.moveTo(5.4, 2.2); context.quadraticCurveTo(8, 4, 5.6, 6); context.quadraticCurveTo(6.6, 4, 5.4, 2.2); context.fill();
      shadedEllipse(context, 3.6, 4, 3.2, 2.4, '#e02a2a', { light: '#ff8a7a', dark: '#8a0e10' });
      curveTube(context, [[1.4, 3], [0.4, 2], [0.2, 1]], 0.8, '#2eb83a');
    }
  },
  chancla: {
    width: 8, height: 8, frames: 1,
    paint(context) {
      shadedEllipse(context, 4, 4.4, 3.6, 2.4, '#2a8af0', { light: '#9ad0ff', dark: '#1448a8' });
      context.strokeStyle = '#ffffff'; context.lineWidth = 0.9; context.beginPath(); context.moveTo(2.4, 5.4); context.lineTo(4.4, 2.8); context.lineTo(5.4, 5.4); context.stroke();
    }
  },
  factura: {
    width: 8, height: 9, frames: 1,
    paint(context) {
      shadedRect(context, 0.4, 0.4, 7.2, 8.2, 0.8, '#fffdf4', { dark: '#c8c8d8' });
      context.fillStyle = '#4a4a5a'; for (const y of [1.8, 3.2, 4.6]) context.fillRect(1.2, y, 5.6, 0.6);
      context.strokeStyle = '#d41c1c'; context.lineWidth = 0.7; context.beginPath(); context.arc(4.8, 6.6, 1.3, 0, TAU); context.stroke();
    }
  },
  petardo: {
    width: 6, height: 11, frames: 1,
    paint(context) {
      shadedRect(context, 0.6, 3, 4.8, 7.6, 1, '#e02a2a', { light: '#ff8a7a', dark: '#8a0e10' });
      context.fillStyle = '#ffd84a'; context.fillRect(0.6, 5.6, 4.8, 1);
      curveTube(context, [[3, 3], [3.6, 1.6], [2.4, 0.8]], 0.6, '#3a3a44');
      sparkle(context, 2.2, 0.6, 1.8, '#fff2a0');
    }
  },
  jamon: {
    width: 12, height: 12, frames: 1,
    paint(context) {
      context.fillStyle = '#e8d8c0'; roundedPath(context, 5.2, 0.6, 1.8, 3.4, 0.8); context.fill();
      context.beginPath(); context.moveTo(2.6, 4); context.quadraticCurveTo(0, 7.4, 2.6, 10.6); context.quadraticCurveTo(7.4, 12, 10.4, 8.2); context.quadraticCurveTo(10.4, 3.6, 6, 3.2); context.closePath();
      const meat = context.createLinearGradient(1, 3, 10, 11); meat.addColorStop(0, '#d8545a'); meat.addColorStop(0.6, '#a82c34'); meat.addColorStop(1, '#6a1218'); context.fillStyle = meat; context.fill();
      context.fillStyle = '#ffe8d8'; context.beginPath(); context.ellipse(4.4, 8, 1.6, 2.4, 0.4, 0, TAU); context.fill();
      sheen(context, 4, 4.8, 1.4, 0.7, -0.6, 0.55);
      context.fillStyle = '#4a3a30'; roundedPath(context, 5.4, -0.6, 1.4, 1.4, 0.6); context.fill();
    }
  },
  tortilla: {
    width: 16, height: 12, frames: 1,
    paint(context) {
      shadedEllipse(context, 8, 9, 7.8, 2.6, '#ffffff', { dark: '#b8bcd0' });
      shadedEllipse(context, 8, 7, 6.8, 3.8, '#f4c850', { light: '#fff0a0', dark: '#b87a1c' });
      context.fillStyle = 'rgba(255,255,255,0.4)'; for (const [x, y] of [[5, 6], [8.6, 5], [11, 7]]) { context.beginPath(); context.ellipse(x, y, 1, 0.5, 0, 0, TAU); context.fill(); }
      context.fillStyle = '#d89a2a'; for (const [x, y] of [[4.6, 8], [10.4, 8.4], [7.6, 8.6]]) { context.beginPath(); context.arc(x, y, 0.55, 0, TAU); context.fill(); }
      sheen(context, 6, 4.6, 2.6, 0.8, -0.2, 0.5);
    }
  },
  receta: {
    width: 12, height: 11, frames: 1,
    paint(context) {
      shadedRect(context, 0.8, 1, 10.4, 9, 1.2, '#f6dfa8', { dark: '#c8a060' });
      context.fillStyle = '#c8a060'; roundedPath(context, 0, 0.2, 12, 2.2, 1.1); context.fill(); roundedPath(context, 0, 8.6, 12, 2.2, 1.1); context.fill();
      context.fillStyle = '#6a4a28'; for (const [y, width] of [[3.4, 7], [5, 5.6], [6.6, 6.4]]) context.fillRect(2.2, y, width, 0.7);
      context.fillStyle = '#d41c1c'; context.beginPath(); context.arc(9, 6.8, 1, 0, TAU); context.fill();
    }
  },
  maleta: {
    width: 16, height: 16, frames: 1,
    paint(context) {
      curveTube(context, [[5, 4.6], [5, 1.6], [11, 1.6], [11, 4.6]], 1.2, '#4a3a30');
      shadedRect(context, 0.8, 4, 14.4, 11, 2, '#b8662a', { light: '#e8a060', dark: '#6a3414' });
      context.fillStyle = '#4a2a10'; context.fillRect(0.8, 8, 14.4, 0.9); context.fillRect(4, 4.4, 1, 10.4); context.fillRect(11, 4.4, 1, 10.4);
      context.fillStyle = '#ffd84a'; context.beginPath(); context.arc(8, 10, 1.1, 0, TAU); context.fill();
      for (const [x, y, color] of [[2.6, 12, '#3ab8ff'], [12.4, 6, '#ff5a8a'], [12, 12.4, '#7ad048']]) { context.fillStyle = color; context.beginPath(); context.arc(x, y, 1.2, 0, TAU); context.fill(); }
      sheen(context, 4, 6, 1.6, 0.7, -0.4, 0.45);
    }
  }
};

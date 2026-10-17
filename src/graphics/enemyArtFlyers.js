/**
 * @file Dibujo vectorial de los enemigos voladores: cucaracha voladora,
 * mosquito, gaviota, meiga y murciélago. Todos miran a la IZQUIERDA.
 */
import { TAU, tone, tube, curveTube, shadedEllipse, eye, mouth, sheen } from './creatureKit.js';

/** Ala en forma de lágrima que sale de (x, y) con un ángulo de aleteo. */
function wing(context, x, y, length, width, angle, color, { alpha = 1, edge = null } = {}) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.globalAlpha = alpha;
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(length * 0.4, -width, length, -width * 0.1);
  context.quadraticCurveTo(length * 0.5, width * 0.5, 0, 0);
  context.closePath();
  const gradient = context.createLinearGradient(0, -width, length, 0);
  gradient.addColorStop(0, tone(color, 0.45));
  gradient.addColorStop(1, color);
  context.fillStyle = gradient;
  context.fill();
  if (edge) { context.strokeStyle = edge; context.lineWidth = 0.5; context.stroke(); }
  context.restore();
}

export const FLYER_ENEMIES = {
  cucavol: {
    width: 16, height: 14, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const flap = Math.sin(phase);
      wing(context, 9, 6.4, 8, 5, -0.9 - flap * 0.8, '#d8f0ff', { alpha: 0.75, edge: 'rgba(60,100,140,0.6)' });
      wing(context, 11, 6.8, 7, 4, -0.3 - flap * 0.6, '#c0e0f8', { alpha: 0.6 });
      for (const [x, dy] of [[6, 11.8], [9, 12.2], [12, 11.8]]) tube(context, x, 9.4, x + (dy > 12 ? 0 : -0.8), dy, 0.8, '#5a2a10');
      const wiggle = Math.sin(phase * 2) * 0.6;
      curveTube(context, [[3, 7.4], [1, 5.4 + wiggle], [-0.4, 2.6]], 0.6, '#5a2a10');
      shadedEllipse(context, 9.4, 8.8, 5.8, 3.2, '#b8662a', { light: '#f0a456', dark: '#5a2a10' });
      shadedEllipse(context, 3.8, 8.6, 2.6, 2.4, '#7a3a14');
      eye(context, 3, 7.8, 0.9, { lookX: -0.9, angry: 0.6 });
    }
  },

  mosquito: {
    width: 16, height: 13, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const flap = Math.sin(phase * 2);
      for (const [x, dy] of [[7, 10.6], [9, 11.2], [11, 10.6]]) tube(context, x, 8, x + 0.6, dy, 0.55, '#3a3a48');
      wing(context, 8.6, 5.8, 8, 4.4, -1.1 - flap * 0.7, '#ffffff', { alpha: 0.6, edge: 'rgba(80,80,100,0.6)' });
      wing(context, 10.2, 6.2, 6.6, 3.4, -0.5 - flap * 0.5, '#e8f0ff', { alpha: 0.5 });
      shadedEllipse(context, 11.4, 7.6, 4.4, 2, '#4a4a5a', { light: '#8a8aa0' });
      context.strokeStyle = '#d8d8e8'; context.lineWidth = 0.5; for (const x of [10, 11.8, 13.6]) { context.beginPath(); context.moveTo(x, 6); context.lineTo(x, 9.2); context.stroke(); }
      shadedEllipse(context, 6.6, 7.4, 2.8, 2.7, '#5a5a6e', { light: '#9a9ab4' });
      // Trompa-aguja.
      context.strokeStyle = '#140c20'; context.lineWidth = 1.2; context.beginPath(); context.moveTo(4.6, 8); context.lineTo(0.2, 9.6); context.stroke();
      context.strokeStyle = '#e8d8d8'; context.lineWidth = 0.55; context.beginPath(); context.moveTo(4.6, 8); context.lineTo(0.2, 9.6); context.stroke();
      eye(context, 6, 6.8, 1.2, { lookX: -0.9, angry: 0.7, pupil: '#d41c1c' });
    }
  },

  gaviota: {
    width: 16, height: 13, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const flap = Math.sin(phase);
      wing(context, 9, 6, 11, 5, -0.5 - flap * 0.95, '#cfd4e0', { edge: 'rgba(40,40,70,0.5)' });
      context.fillStyle = '#2a2e48'; context.save(); context.translate(9, 6); context.rotate(-0.5 - flap * 0.95); context.beginPath(); context.moveTo(8.4, -0.6); context.lineTo(11, -0.5); context.lineTo(8.8, 1.2); context.closePath(); context.fill(); context.restore();
      shadedEllipse(context, 10.2, 8.2, 5.4, 3, '#ffffff', { light: '#ffffff', dark: '#a8b0c8' });
      curveTube(context, [[14, 8.4], [16, 9], [17, 8]], 1.6, '#e8ecf4');
      wing(context, 9.6, 7, 9, 4, 0.4 + flap * 0.5, '#ffffff', { alpha: 0.9, edge: 'rgba(40,40,70,0.4)' });
      shadedEllipse(context, 4.8, 6.6, 3, 2.7, '#ffffff', { dark: '#b8c0d8' });
      context.fillStyle = '#ffc42a'; context.beginPath(); context.moveTo(2.2, 6.4); context.lineTo(-0.6, 7.2); context.lineTo(2.4, 8.2); context.closePath(); context.fill();
      context.fillStyle = '#e8402a'; context.fillRect(0.2, 7.4, 0.9, 0.5);
      eye(context, 4.4, 6, 1.1, { lookX: -0.9, angry: 0.7 });
      tube(context, 9, 10.4, 8, 12.4, 0.7, '#ffa42a');
    }
  },

  meiga: {
    width: 16, height: 14, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const bob = Math.sin(phase) * 0.5;
      context.save();
      context.translate(0, bob);
      // Escoba.
      context.strokeStyle = '#6a4220'; context.lineWidth = 1.2; context.beginPath(); context.moveTo(0, 12); context.lineTo(14, 11); context.stroke();
      context.fillStyle = '#d8a850';
      context.beginPath(); context.moveTo(13, 9.8); context.quadraticCurveTo(17.6, 10.6, 18, 13.6); context.lineTo(13, 12.4); context.closePath(); context.fill();
      context.strokeStyle = '#8a5a20'; context.lineWidth = 0.4; for (const dy of [10.8, 11.6, 12.4]) { context.beginPath(); context.moveTo(14, dy); context.lineTo(17.4, dy + 1); context.stroke(); }
      // Capa ondeando.
      context.fillStyle = '#6a2a9a';
      const flutter = Math.sin(phase * 2) * 1.2;
      context.beginPath(); context.moveTo(7, 6.4); context.quadraticCurveTo(11, 6 + flutter, 15.4, 9 + flutter); context.lineTo(14, 11); context.lineTo(6, 11); context.closePath(); context.fill();
      const cloak = context.createLinearGradient(6, 6, 14, 11); cloak.addColorStop(0, 'rgba(255,255,255,0.25)'); cloak.addColorStop(1, 'rgba(0,0,0,0.3)');
      context.fillStyle = cloak; context.fill();
      // Cabeza verde con sombrero puntiagudo.
      shadedEllipse(context, 5.4, 7.6, 3.2, 3, '#7ad048', { light: '#c0f088', dark: '#2a7a24' });
      context.fillStyle = '#2a1a4a';
      context.beginPath(); context.moveTo(0.4, 5.2); context.lineTo(10.4, 5.4); context.lineTo(7.4, 4.4); context.quadraticCurveTo(5.6, -1, 2.2, -3.4); context.quadraticCurveTo(3, 1.4, 0.4, 5.2); context.closePath(); context.fill();
      context.fillStyle = '#e8b82a'; context.fillRect(3, 3.6, 4.2, 0.9);
      context.fillStyle = '#7ad048'; context.beginPath(); context.moveTo(2.4, 8.6); context.lineTo(0, 10.8); context.lineTo(3.4, 9.8); context.closePath(); context.fill();
      eye(context, 4.4, 7.4, 1.1, { lookX: -0.9, angry: 0.7, pupil: '#d41c1c' });
      mouth(context, 5.4, 9.6, 2.2, 'grin');
      context.restore();
    }
  },

  murcielago: {
    width: 16, height: 12, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const flap = Math.sin(phase);
      for (const side of [-1, 1]) {
        context.save();
        context.translate(8, 5.6);
        context.scale(side, 1);
        context.rotate(-flap * 0.6);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(7, -3 + flap * 2); context.quadraticCurveTo(7.4, 0.6, 6.4, 1.6); context.quadraticCurveTo(5, 0.4, 4.2, 2.2); context.quadraticCurveTo(3, 0.8, 1.6, 2.6);
        context.closePath();
        const membrane = context.createLinearGradient(0, -3, 7, 3);
        membrane.addColorStop(0, '#9a6ad8'); membrane.addColorStop(1, '#4a2a7a');
        context.fillStyle = membrane; context.fill();
        context.strokeStyle = '#2a1648'; context.lineWidth = 0.4; context.stroke();
        context.restore();
      }
      shadedEllipse(context, 8, 7, 3, 3.6, '#6a4a9a', { light: '#b090e8', dark: '#2a1648' });
      // Orejas y cara.
      context.fillStyle = '#6a4a9a'; for (const x of [5.6, 10.4]) { context.beginPath(); context.moveTo(x - 0.9, 4.4); context.lineTo(x, 1.2); context.lineTo(x + 0.9, 4.4); context.closePath(); context.fill(); }
      eye(context, 6.8, 5.6, 1.1, { lookX: -0.8, angry: 0.6, pupil: '#d41c1c' }); eye(context, 9.4, 5.6, 1.1, { lookX: -0.8, angry: -0.6, pupil: '#d41c1c' });
      context.fillStyle = '#ffffff'; context.beginPath(); context.moveTo(7.2, 8); context.lineTo(7.6, 9.2); context.lineTo(8, 8); context.moveTo(8.6, 8); context.lineTo(9, 9.2); context.lineTo(9.4, 8); context.fill();
      sheen(context, 7.4, 5.4, 0.9, 0.4, -0.3, 0.3);
    }
  }
};

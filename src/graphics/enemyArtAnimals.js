/**
 * @file Dibujo vectorial de los animales de tierra: paloma, cucaracha, oveja,
 * lagarto, caracol, toro y pulpo. Todos miran a la IZQUIERDA.
 */
import {
  TAU, tone, tube, curveTube, shadedEllipse, eye, mouth, sheen
} from './creatureKit.js';

export const ANIMAL_ENEMIES = {
  paloma: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const bob = -Math.abs(Math.sin(phase)) * 0.5;
      // Patas anaranjadas andando.
      for (const [offset, shade] of [[Math.PI, -0.25], [0, 0]]) {
        const footX = 8 + Math.cos(phase + offset) * 1.6;
        const footY = 15.6 - Math.max(0, Math.sin(phase + offset)) * 1.1;
        tube(context, 8 + (offset ? -0.6 : 0.8), 12.4, footX, footY, 1, shade ? tone('#ff9a2a', shade) : '#ff9a2a');
        tube(context, footX, footY, footX - 1.6, footY + 0.1, 0.9, '#ff9a2a');
      }
      context.save();
      context.translate(0, bob);
      // Cola y cuerpo.
      context.fillStyle = '#6a6e82'; context.beginPath(); context.moveTo(12, 8); context.lineTo(16, 6.6); context.lineTo(15.2, 11); context.lineTo(12, 11.6); context.closePath(); context.fill();
      shadedEllipse(context, 8.6, 9.6, 5.6, 4.2, '#a4a8bc', { light: '#dcdeea', dark: '#5a5e74' });
      // Ala.
      context.fillStyle = '#7e8298'; context.beginPath(); context.ellipse(9.8, 9.6, 3.4, 2.2, -0.3, 0, TAU); context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.35)'; context.lineWidth = 0.4; context.beginPath(); context.moveTo(8, 9); context.lineTo(11.6, 10.4); context.stroke();
      // Cuello iridiscente y cabeza que cabecea.
      const headBob = Math.sin(phase * 2) * 0.5;
      const neck = context.createLinearGradient(2, 5, 6, 9);
      neck.addColorStop(0, '#3ac888'); neck.addColorStop(1, '#8a4ad8');
      context.fillStyle = neck; context.beginPath(); context.ellipse(5.4, 8, 2.6, 2.8, 0, 0, TAU); context.fill();
      shadedEllipse(context, 4, 5.8 + headBob, 2.9, 2.8, '#b4b8cc', { light: '#e8eaf4' });
      context.fillStyle = '#ffa42a'; context.beginPath(); context.moveTo(1.4, 5.6 + headBob); context.lineTo(-0.8, 6.4 + headBob); context.lineTo(1.6, 7 + headBob); context.closePath(); context.fill();
      eye(context, 3.6, 5.2 + headBob, 1, { lookX: -0.9, pupil: '#8a1c10', angry: 0.5 });
      context.restore();
    },
    squashed(context) {
      shadedEllipse(context, 8, 13, 6.6, 2.6, '#a4a8bc');
      context.fillStyle = '#ffa42a'; context.beginPath(); context.moveTo(2, 12.6); context.lineTo(0, 13.2); context.lineTo(2, 13.8); context.closePath(); context.fill();
      eye(context, 4, 12.4, 0.9, { blink: true });
    }
  },

  cucaracha: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      // Seis patas que corretean.
      for (let index = 0; index < 3; index++) {
        for (const side of [-1, 1]) {
          const alternate = (index + (side > 0 ? 1 : 0)) % 2 ? Math.PI : 0;
          const reach = Math.cos(phase * 2 + alternate) * 1.4;
          const baseX = 5.2 + index * 3;
          tube(context, baseX, 13, baseX + reach, side > 0 ? 15.7 : 14.9, 0.8, '#5a2a10');
        }
      }
      // Antenas que vibran.
      const wiggle = Math.sin(phase * 2) * 0.7;
      curveTube(context, [[3, 10.4], [0.8, 8 + wiggle], [-0.6, 5.4]], 0.6, '#5a2a10');
      curveTube(context, [[3.6, 10.2], [2, 7.4 - wiggle], [1.4, 4.6]], 0.6, '#5a2a10');
      shadedEllipse(context, 9, 11.4, 6.6, 3.8, '#b8662a', { light: '#f0a456', dark: '#5a2a10' });
      context.strokeStyle = 'rgba(60,24,6,0.7)'; context.lineWidth = 0.5; context.beginPath(); context.moveTo(9, 7.8); context.lineTo(9, 15); context.stroke();
      sheen(context, 7, 9.6, 2.4, 0.8, -0.2, 0.55);
      shadedEllipse(context, 3.8, 11.6, 2.6, 2.4, '#7a3a14');
      eye(context, 3, 10.6, 0.9, { lookX: -0.9, angry: 0.5 });
    },
    squashed(context) {
      shadedEllipse(context, 8, 13.8, 7, 2, '#b8662a');
      context.strokeStyle = '#5a2a10'; context.lineWidth = 0.7;
      for (const x of [3, 6, 10, 13]) { context.beginPath(); context.moveTo(x, 14.8); context.lineTo(x + (x > 8 ? 1.6 : -1.6), 15.8); context.stroke(); }
      eye(context, 3.6, 13.6, 0.8, { blink: true });
    }
  },

  oveja: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const bob = -Math.abs(Math.sin(phase)) * 0.5;
      for (const [x, offset, shade] of [[4.6, Math.PI, -0.3], [6.4, 0, 0], [10.6, 0, -0.3], [12.4, Math.PI, 0]]) {
        const swing = Math.cos(phase + offset) * 1.1;
        tube(context, x, 12, x + swing, 15.6 - Math.max(0, Math.sin(phase + offset)) * 0.8, 1.4, shade ? tone('#4a4458', shade) : '#4a4458');
      }
      context.save();
      context.translate(0, bob);
      // Lana: muchas bolitas.
      const puffs = [[6, 9.4, 3.4], [9, 8, 3.6], [12, 9.4, 3.4], [7.6, 11.6, 3.2], [11, 11.8, 3.2], [9.6, 10, 3.8], [5.4, 11, 2.6], [13, 11.4, 2.4]];
      for (const [x, y, radius] of puffs) shadedEllipse(context, x, y, radius, radius, '#fdfaf0', { light: '#ffffff', dark: '#b8b4c8' });
      // Cabeza oscura con orejas.
      shadedEllipse(context, 2.8, 9.2, 2.8, 3.1, '#5a5468', { light: '#8a849a', dark: '#2c2838' });
      shadedEllipse(context, 4.6, 7, 1.7, 0.9, '#5a5468', { rotation: -0.5 });
      shadedEllipse(context, 4.8, 8.2, 1.7, 0.9, '#5a5468', { rotation: 0.4 });
      shadedEllipse(context, 4.6, 5.8, 3.4, 2, '#fdfaf0', { light: '#ffffff' });
      eye(context, 2.4, 8.6, 0.95, { lookX: -0.9, angry: 0.4 });
      context.fillStyle = '#ff9aa8'; context.beginPath(); context.ellipse(0.9, 10.4, 0.8, 0.6, 0, 0, TAU); context.fill();
      context.restore();
    },
    squashed(context) {
      for (const [x, y, r] of [[5, 12.6, 3], [8.6, 12, 3.4], [12, 12.6, 3]]) shadedEllipse(context, x, y, r, r * 0.7, '#fdfaf0', { dark: '#b8b4c8' });
      shadedEllipse(context, 2.4, 13.4, 2.4, 1.6, '#5a5468');
      eye(context, 2.2, 13, 0.8, { blink: true });
    }
  },

  lagarto: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const tail = Math.sin(phase) * 1.2;
      curveTube(context, [[10, 12.4], [13, 12.6 + tail], [15.4, 10 - tail * 0.5]], 2.2, '#3ab04a');
      for (const [x, offset] of [[4.2, Math.PI], [6.2, 0], [10.4, 0], [12, Math.PI]]) {
        const swing = Math.cos(phase + offset) * 1.2;
        tube(context, x, 13.6, x + swing, 15.6 - Math.max(0, Math.sin(phase + offset)) * 0.8, 1.2, '#2a8a3a');
      }
      shadedEllipse(context, 8.4, 12, 5.6, 2.8, '#46c258', { light: '#98f088', dark: '#1c6a2c' });
      context.fillStyle = 'rgba(255,255,255,0.35)'; context.beginPath(); context.ellipse(8.4, 12.8, 4.2, 1, 0, 0, TAU); context.fill();
      context.fillStyle = '#2a8a3a';
      for (let spike = 0; spike < 5; spike++) { context.beginPath(); context.moveTo(5.6 + spike * 1.6, 9.6 + Math.abs(spike - 2) * 0.2); context.lineTo(6.4 + spike * 1.6, 8.4); context.lineTo(7.2 + spike * 1.6, 9.6); context.fill(); }
      shadedEllipse(context, 3.4, 11, 3.2, 2.4, '#52cc62', { light: '#a8f89a' });
      eye(context, 3, 10, 1.1, { lookX: -0.9, angry: 0.5, pupil: '#8a1c10' });
      if (frame % 2 === 0) { context.strokeStyle = '#ff4a5a'; context.lineWidth = 0.6; context.beginPath(); context.moveTo(0.6, 11.8); context.lineTo(-1.2, 11.4); context.lineTo(-1.8, 10.8); context.moveTo(-1.2, 11.4); context.lineTo(-1.8, 12); context.stroke(); }
    },
    squashed(context) {
      shadedEllipse(context, 8, 14, 7, 1.8, '#46c258');
      eye(context, 3.4, 13.6, 0.8, { blink: true });
    }
  },

  caracol: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      const stretch = Math.sin(phase) * 0.7;
      // Cuerpo baboso.
      context.fillStyle = '#d8b88c'; context.beginPath();
      context.moveTo(-0.6 - stretch, 15.6); context.quadraticCurveTo(-1.4 - stretch, 11.4, 2.6, 10.6); context.lineTo(5, 13); context.lineTo(15, 13.6); context.quadraticCurveTo(16, 15.6, 14, 15.8); context.closePath(); context.fill();
      const body = context.createLinearGradient(0, 10, 0, 16); body.addColorStop(0, 'rgba(255,255,255,0.35)'); body.addColorStop(1, 'rgba(120,80,40,0.3)');
      context.fillStyle = body; context.fill();
      // Antenas con ojos.
      for (const [x, sway] of [[1.4, 0.6], [3.2, -0.6]]) {
        const bend = Math.sin(phase + (x > 2 ? 1.5 : 0)) * sway;
        curveTube(context, [[x + 0.6, 10.8], [x - 0.8 + bend, 7.6], [x - 1.4 + bend, 5.2]], 0.9, '#d8b88c');
        eye(context, x - 1.4 + bend, 4.8, 1.2, { lookX: -0.8 });
      }
      // Concha en espiral.
      shadedEllipse(context, 10, 8.4, 5.6, 5.4, '#d8782a', { light: '#ffc07a', dark: '#7a3a10' });
      context.strokeStyle = '#7a3a10'; context.lineWidth = 0.7; context.beginPath();
      for (let angle = 0; angle < 11; angle += 0.4) context.lineTo(10 + Math.cos(angle) * angle * 0.42, 8.4 + Math.sin(angle) * angle * 0.4);
      context.stroke();
      sheen(context, 7.8, 5.4, 1.8, 0.8, -0.6, 0.5);
    },
    squashed(context) {
      shadedEllipse(context, 8, 14.2, 7, 1.8, '#d8b88c');
      shadedEllipse(context, 10, 12.6, 4, 1.8, '#d8782a');
      eye(context, 2.4, 13.6, 0.8, { blink: true });
    }
  },

  concha: {
    width: 16, height: 15, frames: 1,
    paint(context) {
      shadedEllipse(context, 8, 8, 7, 6.6, '#d8782a', { light: '#ffc07a', dark: '#7a3a10' });
      context.strokeStyle = '#7a3a10'; context.lineWidth = 0.8; context.beginPath();
      for (let angle = 0; angle < 13; angle += 0.4) context.lineTo(8 + Math.cos(angle) * angle * 0.48, 8 + Math.sin(angle) * angle * 0.46);
      context.stroke();
      sheen(context, 5.4, 4.4, 2.4, 1, -0.6, 0.5);
      context.fillStyle = '#d8b88c'; context.beginPath(); context.ellipse(8, 14.2, 6.6, 1.2, 0, 0, TAU); context.fill();
    }
  },

  toro: {
    width: 24, height: 16, frames: 4,
    poses: ['frame', 'angry'],
    paint(context, frame, frames, pose) {
      const angry = pose === 'angry';
      const phase = frame / frames * TAU;
      const gallop = angry ? 1.8 : 1.1;
      for (const [x, offset, shade] of [[6.4, Math.PI, -0.3], [9, 0, 0], [16.6, 0, -0.3], [19, Math.PI, 0]]) {
        const swing = Math.cos(phase + offset) * gallop;
        tube(context, x, 11, x + swing, 15.2 - Math.max(0, Math.sin(phase + offset)) * 1.3, 2.4, shade ? tone('#3a2218', shade) : '#3a2218');
        shadedEllipse(context, x + swing - 0.3, 15.5 - Math.max(0, Math.sin(phase + offset)) * 1.3, 1.8, 0.9, '#140c20');
      }
      const bob = -Math.abs(Math.sin(phase)) * (angry ? 0.9 : 0.5);
      context.save();
      context.translate(0, bob);
      curveTube(context, [[20.6, 6.6], [23.4, 8], [22.4, 12]], 1, '#2a180e');
      shadedEllipse(context, 14, 8.2, 8.6, 5.2, angry ? '#5a2a1a' : '#4a2c1c', { light: '#8a5a40', dark: '#1c0e08' });
      // Joroba y cabeza agachada.
      shadedEllipse(context, 8.4, 5.4, 4.6, 3.8, angry ? '#6a2e1c' : '#573322', { light: '#946248' });
      shadedEllipse(context, 4.6, 9, 4.4, 3.6, angry ? '#6a2e1c' : '#573322', { light: '#946248', rotation: 0.2 });
      shadedEllipse(context, 1.8, 10.8, 2.2, 1.7, '#d8b0a0', { light: '#fff0e8' });
      context.fillStyle = '#140c20'; context.beginPath(); context.arc(1, 10.6, 0.4, 0, TAU); context.arc(2.4, 11.2, 0.4, 0, TAU); context.fill();
      // Cuernos blancos.
      for (const [bx, by, curl] of [[5.6, 6, -1], [7.6, 6.4, 0.6]]) {
        context.fillStyle = '#fff6e0';
        context.beginPath(); context.moveTo(bx - 1, by + 1); context.quadraticCurveTo(bx - 3 * Math.abs(curl) - 1, by - 3, bx - 5, by - 2.6 + curl); context.quadraticCurveTo(bx - 1.6, by - 1.6, bx + 0.6, by - 0.2); context.closePath(); context.fill();
        context.strokeStyle = '#a89878'; context.lineWidth = 0.4; context.stroke();
      }
      eye(context, 4, 8.4, 1.2, { lookX: -0.9, angry: 0.9, pupil: angry ? '#d41c1c' : '#140c20' });
      if (angry) {
        context.fillStyle = 'rgba(255,255,255,0.7)';
        for (let puff = 0; puff < 2; puff++) { context.beginPath(); context.arc(-1 - puff * 1.4, 10.4 + Math.sin(phase + puff) * 0.6, 0.9 + puff * 0.4, 0, TAU); context.fill(); }
      }
      context.restore();
    }
  },

  pulpo: {
    width: 16, height: 24, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      // Tentáculos ondulantes.
      for (let index = 0; index < 4; index++) {
        const baseX = 3.6 + index * 3;
        const wave = Math.sin(phase + index * 1.3) * 1.6;
        curveTube(context, [[baseX, 14], [baseX + wave, 18], [baseX - wave * 0.6 + (index - 1.5) * 0.6, 23]], 2.6, '#e84a9a', '#8a1c5a');
        context.fillStyle = 'rgba(255,200,230,0.8)';
        for (const t of [0.5, 0.8]) { context.beginPath(); context.arc(baseX + wave * t * 0.5, 14 + t * 8, 0.45, 0, TAU); context.fill(); }
      }
      shadedEllipse(context, 8, 9, 7, 7.6, '#f05aa8', { light: '#ffb0d8', dark: '#9a1c5c' });
      for (const [dx, dy] of [[4, 4], [11, 5], [7, 3]]) { context.fillStyle = 'rgba(255,255,255,0.28)'; context.beginPath(); context.arc(dx, dy, 0.9, 0, TAU); context.fill(); }
      eye(context, 5.4, 9, 2.2, { lookX: -0.7, angry: 0.7 }); eye(context, 10.6, 9, 2.2, { lookX: -0.7, angry: -0.7 });
      mouth(context, 8, 13.2, 3, 'open', '#7a1048');
    }
  }
};

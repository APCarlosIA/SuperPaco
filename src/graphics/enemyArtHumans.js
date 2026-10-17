/**
 * @file Dibujo vectorial de los personajes humanos: guiri, turista, ejecutivo,
 * madre con chancla, Don Hacienda y la abuela. Todos miran a la IZQUIERDA.
 *
 * Cada entrada indica el tamaño de su caja, cuántos fotogramas tiene su ciclo
 * de animación y la función que pinta un fotograma.
 */
import {
  TAU, tone, tube, leg, shoe, shadedEllipse, shadedRect, eye, mouth, sheen
} from './creatureKit.js';
import { roundedPath } from './shapes.js';

/** Posición de un pie en un ciclo de paso: avanza y se levanta. */
function stepFoot(centerX, groundY, phase, offset, stride, lift) {
  const angle = phase + offset;
  return { x: centerX + Math.cos(angle) * stride, y: groundY - Math.max(0, Math.sin(angle)) * lift };
}

/** Dos piernas andando con calcetín y zapato; devuelve nada. */
function walkingLegs(context, { cx, hipY, groundY, phase, stride, lift, thigh, shin, width, color, sock = null, shoeColor, shoeLength = 4.2 }) {
  for (const [offset, shade] of [[Math.PI, -0.25], [0, 0]]) {
    const foot = stepFoot(cx, groundY, phase, offset, stride, lift);
    const hipX = cx + (offset ? -0.9 : 0.9);
    const leaf = leg(context, hipX, hipY, foot.x, foot.y - 0.7, thigh, shin, width, shade ? tone(color, shade) : color);
    if (sock) { tube(context, leaf.x, leaf.y - 0.3, leaf.x, leaf.y - 1.5, width * 0.95, sock, tone(sock, -0.25)); }
    shoe(context, leaf.x, leaf.y + 0.2, shoeLength, shade ? tone(shoeColor, shade) : shoeColor);
  }
}

/** Camisa hawaiana con flores. */
function hawaiianShirt(context, x, y, width, height) {
  shadedRect(context, x, y, width, height, 1.8, '#1fb868');
  const flowers = [[0.25, 0.3, '#ff6a9a'], [0.65, 0.25, '#ffe45a'], [0.45, 0.65, '#ffffff'], [0.8, 0.7, '#ff6a9a'], [0.15, 0.78, '#ffe45a']];
  for (const [fx, fy, color] of flowers) {
    context.fillStyle = color;
    context.beginPath(); context.arc(x + width * fx, y + height * fy, 0.9, 0, TAU); context.fill();
    context.fillStyle = '#ff8a1c';
    context.beginPath(); context.arc(x + width * fx, y + height * fy, 0.32, 0, TAU); context.fill();
  }
}

export const HUMAN_ENEMIES = {
  guiri: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      walkingLegs(context, { cx: 8, hipY: 12.3, groundY: 15.8, phase, stride: 1.8, lift: 1.2, thigh: 1.8, shin: 1.8, width: 2, color: '#ff8a68', sock: '#ffffff', shoeColor: '#8a5a2a' });
      const bob = -Math.abs(Math.sin(phase)) * 0.6;
      context.save();
      context.translate(0, bob);
      // Brazos balanceándose.
      for (const [side, shade] of [[1, -0.25], [-1, 0]]) {
        const swing = Math.cos(phase + (side > 0 ? Math.PI : 0)) * 1.4;
        tube(context, 8 + side * 3.2, 9, 8 + side * 3.6 + swing * 0.3, 11.4, 1.7, shade ? tone('#ff8a68', shade) : '#ff8a68');
      }
      hawaiianShirt(context, 4.8, 8, 6.6, 5);
      // Cámara colgada.
      shadedRect(context, 6.2, 10.4, 3.4, 2.2, 0.6, '#33323c');
      context.fillStyle = '#9ad8ff'; context.beginPath(); context.arc(7.9, 11.5, 0.7, 0, TAU); context.fill();
      // Cabeza quemada con pelo rubio.
      shadedEllipse(context, 7.4, 4.6, 4.6, 4.2, '#ff8a68', { light: '#ffb89a', dark: '#c8483a' });
      shadedEllipse(context, 7.6, 1.6, 4.4, 2.2, '#ffd84a', { light: '#fff09a' });
      context.fillStyle = '#ffd84a'; context.beginPath(); context.ellipse(11.6, 3.6, 1, 1.8, 0, 0, TAU); context.fill();
      eye(context, 5.6, 4.4, 1.35, { lookX: -0.9 }); eye(context, 8.6, 4.4, 1.35, { lookX: -0.9 });
      context.fillStyle = '#ffffff'; roundedPath(context, 3.2, 5.2, 2.2, 1.1, 0.5); context.fill();
      mouth(context, 6.4, 7, 2.6, 'grin');
      context.restore();
    },
    squashed(context) {
      shadedEllipse(context, 8, 12.6, 6.4, 2.6, '#ff8a68');
      hawaiianShirt(context, 3.5, 12, 9, 2.6);
      eye(context, 5, 12.4, 1.1, { blink: true }); eye(context, 9, 12.4, 1.1, { blink: true });
      context.fillStyle = '#ffd84a'; context.beginPath(); context.ellipse(8, 10.6, 4.6, 1.6, 0, 0, TAU); context.fill();
    }
  },

  turista: {
    width: 16, height: 24, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      walkingLegs(context, { cx: 8, hipY: 17.4, groundY: 23.8, phase, stride: 1.8, lift: 1.3, thigh: 3.2, shin: 3.2, width: 2.2, color: '#ff9a7a', sock: '#ffffff', shoeColor: '#2c6ad8' });
      const bob = -Math.abs(Math.sin(phase)) * 0.6;
      context.save();
      context.translate(0, bob);
      // Mochila a la espalda (a la derecha, mira a la izquierda).
      shadedRect(context, 9.4, 9.4, 5.2, 7, 1.6, '#e8402a');
      context.fillStyle = '#ffd84a'; context.fillRect(10.2, 12.4, 3.6, 0.8);
      // Pantalón corto y camiseta.
      shadedRect(context, 4.4, 15.2, 7.4, 3.2, 1, '#e8d8a8');
      shadedRect(context, 4.4, 9.4, 7.4, 6.4, 2, '#3a8af0');
      context.fillRect(6, 11.4, 4, 0.9); context.fillRect(6, 13, 3, 0.9);
      for (const [side, shade] of [[1, -0.25], [-1, 0]]) {
        const swing = Math.cos(phase + (side > 0 ? Math.PI : 0)) * 1.6;
        tube(context, 8 + side * 3.8, 10.6, 8 + side * 4.2 + swing * 0.3, 14.4, 1.9, shade ? tone('#ff9a7a', shade) : '#ff9a7a');
      }
      // Cámara de fotos enorme.
      shadedRect(context, 3.4, 12.4, 4.2, 2.8, 0.7, '#2c2a34');
      context.fillStyle = '#9ad8ff'; context.beginPath(); context.arc(5.4, 13.8, 1, 0, TAU); context.fill();
      sheen(context, 5, 13.3, 0.4, 0.3);
      // Cabeza con gorra visera.
      shadedEllipse(context, 7.6, 5.2, 4.6, 4.4, '#ffa88a', { light: '#ffd0b8', dark: '#d0584a' });
      shadedEllipse(context, 7.8, 2.4, 5, 2.8, '#e8402a');
      context.fillStyle = '#e8402a'; roundedPath(context, 1, 3.2, 6, 1.6, 0.8); context.fill();
      eye(context, 6, 5.4, 1.4, { lookX: -0.8 }); eye(context, 9.2, 5.4, 1.4, { lookX: -0.8 });
      mouth(context, 6.8, 8.2, 2.8, 'open');
      context.restore();
    }
  },

  ejecutivo: {
    width: 16, height: 16, frames: 4,
    paint(context, frame, frames) {
      const phase = frame / frames * TAU;
      walkingLegs(context, { cx: 8, hipY: 12.4, groundY: 15.8, phase, stride: 2, lift: 1.3, thigh: 1.8, shin: 1.8, width: 2.1, color: '#2a2d44', shoeColor: '#14101c', shoeLength: 4.6 });
      const bob = -Math.abs(Math.sin(phase)) * 0.7;
      context.save();
      context.translate(0, bob);
      shadedRect(context, 4.2, 7.8, 7.8, 5.6, 2, '#3a3f66');
      // Camisa y corbata roja.
      context.fillStyle = '#ffffff'; context.beginPath(); context.moveTo(7, 7.9); context.lineTo(9.6, 7.9); context.lineTo(8.3, 11.6); context.closePath(); context.fill();
      context.fillStyle = '#e02a2a'; context.beginPath(); context.moveTo(7.7, 8.4); context.lineTo(8.9, 8.4); context.lineTo(9.2, 12); context.lineTo(8.3, 12.8); context.lineTo(7.4, 12); context.closePath(); context.fill();
      // Brazo con maletín.
      tube(context, 5, 9, 3.4, 12, 1.8, '#3a3f66');
      shadedRect(context, 0.8, 11.4, 4.6, 3.4, 0.8, '#7a4a28');
      context.fillStyle = '#d8a850'; context.fillRect(2.4, 11.9, 1.4, 0.8);
      tube(context, 11, 9, 12.4, 11.8 + Math.sin(phase) * 0.6, 1.8, '#3a3f66');
      // Cabeza enfadada.
      shadedEllipse(context, 8, 4.4, 4.2, 4, '#ffcaa0', { dark: '#d08a60' });
      context.fillStyle = '#3a2a20'; context.beginPath(); context.ellipse(8.2, 1.8, 4.2, 2, 0, Math.PI, TAU); context.fill();
      context.beginPath(); context.ellipse(12, 3.4, 0.9, 1.4, 0, 0, TAU); context.fill();
      eye(context, 6.2, 4.4, 1.3, { lookX: -0.9, angry: 0.7 }); eye(context, 9.4, 4.4, 1.3, { lookX: -0.9, angry: -0.7 });
      mouth(context, 7.2, 7, 2.8, 'flat');
      context.restore();
    },
    squashed(context) {
      shadedEllipse(context, 8, 12.8, 6.2, 2.4, '#3a3f66');
      shadedEllipse(context, 8, 11.2, 4, 1.8, '#ffcaa0');
      eye(context, 6.4, 11.2, 1, { blink: true }); eye(context, 9.6, 11.2, 1, { blink: true });
      shadedRect(context, 0.6, 12.4, 4.6, 3, 0.8, '#7a4a28');
    }
  },

  madre: {
    width: 16, height: 24, frames: 1,
    poses: ['standing', 'hopping', 'throwing'],
    paint(context, frame, frames, pose) {
      const hopping = pose === 'hopping';
      const throwing = pose === 'throwing';
      const lift = hopping ? 2.2 : 0;
      for (const [x, shade] of [[6.2, -0.2], [9.8, 0]]) {
        tube(context, x, 17.4 - lift, x, 22.6 - lift, 2.1, shade ? tone('#ffb89a', shade) : '#ffb89a');
        shoe(context, x - 0.2, 23.4 - lift, 4.4, '#2c6ad8');
      }
      context.save();
      context.translate(0, -lift);
      // Vestido de lunares con delantal.
      context.beginPath(); context.moveTo(4.4, 9.6); context.lineTo(11.8, 9.6); context.lineTo(13.2, 19); context.lineTo(3, 19); context.closePath();
      const dress = context.createLinearGradient(3, 0, 13, 0);
      dress.addColorStop(0, '#ff9ad0'); dress.addColorStop(0.5, '#e8509a'); dress.addColorStop(1, '#a8286a');
      context.fillStyle = dress; context.fill();
      context.fillStyle = '#ffffff';
      for (const [dx, dy] of [[5, 12], [9, 11.4], [11, 15], [4.6, 16], [8, 17]]) { context.beginPath(); context.arc(dx, dy, 0.7, 0, TAU); context.fill(); }
      shadedRect(context, 5.4, 12, 5.4, 7, 1.4, '#ffffff');
      // Brazos: uno sostiene la chancla.
      tube(context, 11.6, 10.6, 13, throwing ? 6.4 : 13, 1.9, '#ffb89a');
      if (throwing) shoe(context, 13.6, 5.6, 4.4, '#2c8af0', { tilt: -0.6 });
      tube(context, 4.6, 10.6, 3.4, 14.4, 1.9, '#ffb89a');
      // Cabeza con moño y rulos.
      shadedEllipse(context, 7.8, 5.6, 4.4, 4.2, '#ffcaa8', { dark: '#d08a68' });
      shadedEllipse(context, 8.4, 1.4, 3.2, 2.4, '#8a8a98', { light: '#d0d0dc' });
      shadedEllipse(context, 7.8, 2.8, 4.8, 2.2, '#8a8a98', { light: '#d0d0dc' });
      eye(context, 6.2, 5.8, 1.3, { lookX: -0.8, angry: 0.6 }); eye(context, 9.4, 5.8, 1.3, { lookX: -0.8, angry: -0.6 });
      mouth(context, 7, 8.6, 3, throwing ? 'open' : 'flat');
      context.fillStyle = 'rgba(255,90,120,0.5)'; context.beginPath(); context.arc(4.6, 7.4, 1, 0, TAU); context.arc(11, 7.4, 1, 0, TAU); context.fill();
      context.restore();
    }
  },

  hacienda: {
    width: 32, height: 32, frames: 2,
    poses: ['frame', 'hurt'], poseFrames: { hurt: 1 },
    paint(context, frame, frames, pose) {
      const hurt = pose === 'hurt';
      const phase = frame / frames * TAU;
      const bob = hurt ? 0 : Math.sin(phase) * 0.8;
      const suit = hurt ? '#ffffff' : '#2c2f52';
      // Piernas.
      for (const [x, shade] of [[11, -0.2], [20, 0]]) {
        tube(context, x, 23, x - 0.5, 29.6, 4.2, shade ? tone(suit, shade) : suit);
        shoe(context, x - 1.6, 30.8, 8, '#14101c');
      }
      context.save();
      context.translate(0, bob);
      // Cuerpo trajeado enorme.
      shadedRect(context, 6, 10, 20, 16, 5, suit);
      context.fillStyle = '#ffffff'; context.beginPath(); context.moveTo(13, 10.4); context.lineTo(19, 10.4); context.lineTo(16, 20); context.closePath(); context.fill();
      context.fillStyle = hurt ? '#ff3a3a' : '#e02a2a'; context.beginPath(); context.moveTo(14.8, 11); context.lineTo(17.2, 11); context.lineTo(17.8, 22); context.lineTo(16, 24); context.lineTo(14.2, 22); context.closePath(); context.fill();
      // Brazos y maletín lleno de facturas.
      tube(context, 7.6, 14, 4, 22, 4.2, suit);
      shadedRect(context, 0, 21, 9, 7, 1.4, '#7a4a28');
      context.fillStyle = '#d8a850'; context.fillRect(3.8, 22, 1.8, 1.4);
      context.fillStyle = '#ffffff'; context.fillRect(1.4, 19.8, 6, 1.6);
      tube(context, 24.4, 14, 27.6, 19, 4.2, suit);
      shadedEllipse(context, 27.8, 19.6, 2, 2, '#ffcaa0');
      // Cabeza calva con gafas redondas y bigote.
      shadedEllipse(context, 15, 6.6, 8, 7.4, hurt ? '#ff8a8a' : '#ffcaa0', { dark: '#d08a60' });
      context.fillStyle = '#ffffff'; context.beginPath(); context.arc(10.6, 6.4, 3, 0, TAU); context.arc(18.6, 6.4, 3, 0, TAU); context.fill();
      context.strokeStyle = '#140c20'; context.lineWidth = 0.9; context.stroke();
      context.fillStyle = '#140c20'; context.beginPath(); context.arc(9.8, 6.6, 1.2, 0, TAU); context.arc(17.8, 6.6, 1.2, 0, TAU); context.fill();
      context.strokeStyle = '#140c20'; context.lineWidth = 1.2;
      context.beginPath(); context.moveTo(7.4, 3); context.lineTo(12.6, 4.4); context.moveTo(21.8, 3); context.lineTo(16.6, 4.4); context.stroke();
      context.fillStyle = '#3a2a20'; roundedPath(context, 9.4, 10.2, 11, 2.2, 1.1); context.fill();
      mouth(context, 14.6, 13.4, 4.2, hurt ? 'open' : 'flat');
      context.fillStyle = '#ffcaa0'; context.beginPath(); context.ellipse(6.6, 6.8, 1.2, 2, 0, 0, TAU); context.fill();
      context.restore();
    }
  },

  abuela: {
    width: 16, height: 24, frames: 1,
    paint(context) {
      for (const x of [6.4, 9.6]) { tube(context, x, 18, x, 22.8, 2, '#d8d8e0'); shoe(context, x - 0.2, 23.6, 4.2, '#14101c'); }
      context.beginPath(); context.moveTo(4.4, 9.6); context.lineTo(11.6, 9.6); context.lineTo(13.4, 19.6); context.lineTo(2.8, 19.6); context.closePath();
      const dress = context.createLinearGradient(3, 0, 13, 0);
      dress.addColorStop(0, '#4a4a68'); dress.addColorStop(1, '#14141e');
      context.fillStyle = dress; context.fill();
      shadedRect(context, 5.6, 12.6, 5, 6.4, 1.2, '#ffffff');
      tube(context, 11.4, 10.6, 12.6, 15, 1.9, '#ffd0b0');
      tube(context, 4.6, 10.6, 3.6, 15, 1.9, '#ffd0b0');
      // Bastón.
      context.strokeStyle = '#6a4220'; context.lineWidth = 1; context.beginPath(); context.moveTo(1.6, 14.4); context.lineTo(1.6, 23.6); context.stroke();
      context.beginPath(); context.arc(2.6, 14.4, 1, Math.PI, TAU); context.stroke();
      shadedEllipse(context, 8, 5.8, 4.4, 4.2, '#ffd8bc', { dark: '#d09a78' });
      shadedEllipse(context, 8, 2.6, 5.2, 3, '#e8e8f0', { light: '#ffffff', dark: '#a0a0b4' });
      shadedEllipse(context, 8, 0.8, 2.4, 1.6, '#e8e8f0', { light: '#ffffff' });
      context.strokeStyle = '#14101c'; context.lineWidth = 0.55;
      context.beginPath(); context.arc(6.4, 6, 1.4, 0, TAU); context.arc(9.8, 6, 1.4, 0, TAU); context.moveTo(7.8, 6); context.lineTo(8.4, 6); context.stroke();
      context.fillStyle = '#140c20'; context.beginPath(); context.arc(6.2, 6, 0.55, 0, TAU); context.arc(9.6, 6, 0.55, 0, TAU); context.fill();
      mouth(context, 8, 8.6, 2.4, 'smile');
    }
  }
};

/**
 * @file Dibujo vectorial de los personajes de cameo que charlan por los
 * niveles: el oso del madroño, un gato callejero, Don Quijote, Sancho y una
 * bailaora. Miran a la IZQUIERDA como el resto.
 */
import { TAU, tube, curveTube, shadedEllipse, shadedRect, eye, mouth, sheen } from './creatureKit.js';
import { roundedPath } from './shapes.js';

export const CAMEO_ART = {
  oso: {
    width: 20, height: 24, frames: 1,
    paint(context) {
      // Madroño detrás con frutos rojos.
      tube(context, 17, 24, 17, 12, 2.4, '#8a5a30');
      for (const [x, y, r] of [[14, 8, 4.4], [19, 9, 3.6], [16.4, 5, 3.8]]) shadedEllipse(context, x, y, r, r, '#3aa04a', { light: '#8af08a', dark: '#145a2a' });
      for (const [x, y] of [[13, 9], [18, 6], [19.6, 11], [15, 4.4]]) { shadedEllipse(context, x, y, 1.1, 1.1, '#e02a2a', { light: '#ff8a8a' }); }
      // Oso erguido.
      for (const x of [5, 9.6]) { tube(context, x, 19, x, 23.2, 3, '#7a4a28'); shadedEllipse(context, x - 0.4, 23.6, 2.4, 1, '#4a2a14'); }
      shadedEllipse(context, 7.6, 15, 5.8, 6.2, '#8a5a30', { light: '#c08a58', dark: '#4a2a14' });
      shadedEllipse(context, 7.6, 16.4, 3.4, 4, '#d8b080', { light: '#f4d8a8' });
      tube(context, 3, 12.4, 1.4, 16.4, 2.6, '#8a5a30');
      tube(context, 12.6, 12.4, 14.4, 15.4, 2.6, '#8a5a30');
      shadedEllipse(context, 7.6, 7.4, 4.8, 4.4, '#8a5a30', { light: '#c08a58', dark: '#4a2a14' });
      shadedEllipse(context, 3.6, 3.6, 1.8, 1.8, '#8a5a30'); shadedEllipse(context, 11.6, 3.6, 1.8, 1.8, '#8a5a30');
      shadedEllipse(context, 5.4, 9, 2.6, 2.2, '#d8b080', { light: '#f4d8a8' });
      shadedEllipse(context, 3.6, 8.4, 1.1, 0.8, '#140c20');
      eye(context, 5.6, 6.2, 1, { lookX: -0.9 }); eye(context, 9.4, 6.2, 1, { lookX: -0.9 });
    }
  },

  gato: {
    width: 16, height: 16, frames: 1,
    paint(context) {
      curveTube(context, [[11, 13.6], [15, 13], [15.6, 9.6], [13.6, 8.4]], 1.8, '#2a2636');
      shadedEllipse(context, 8.4, 12, 4.8, 4, '#3a3548', { light: '#6a6480', dark: '#14101c' });
      for (const x of [5.6, 9]) { tube(context, x, 13.6, x - 0.6, 15.6, 1.8, '#3a3548'); }
      shadedEllipse(context, 5.2, 7.2, 3.6, 3.4, '#3a3548', { light: '#6a6480', dark: '#14101c' });
      for (const [x, tilt] of [[2.8, -0.2], [7.6, 0.2]]) { context.fillStyle = '#3a3548'; context.beginPath(); context.moveTo(x - 1.4, 5); context.lineTo(x + tilt * 3, 1.6); context.lineTo(x + 1.4, 5); context.closePath(); context.fill(); }
      context.fillStyle = '#ff9aa8'; context.beginPath(); context.moveTo(3.4, 4.4); context.lineTo(2.9, 3); context.lineTo(4.2, 4.2); context.fill();
      for (const x of [4, 6.6]) { context.fillStyle = '#ffe45a'; context.beginPath(); context.ellipse(x, 7, 1.2, 1.4, 0, 0, TAU); context.fill(); context.fillStyle = '#140c20'; context.beginPath(); context.ellipse(x - 0.3, 7, 0.4, 1.1, 0, 0, TAU); context.fill(); }
      context.fillStyle = '#ff9aa8'; context.beginPath(); context.arc(2.8, 8.6, 0.5, 0, TAU); context.fill();
      context.strokeStyle = '#e8e8f4'; context.lineWidth = 0.35; for (const dy of [-0.5, 0.4]) { context.beginPath(); context.moveTo(2, 8.6 + dy); context.lineTo(-0.6, 8.2 + dy * 2); context.stroke(); }
    }
  },

  quijote: {
    width: 16, height: 24, frames: 1,
    paint(context) {
      // Lanza.
      context.strokeStyle = '#8a5a30'; context.lineWidth = 1; context.beginPath(); context.moveTo(14, 26); context.lineTo(14, -2); context.stroke();
      context.fillStyle = '#d8dce8'; context.beginPath(); context.moveTo(13, -1.6); context.lineTo(14, -5); context.lineTo(15, -1.6); context.closePath(); context.fill();
      for (const x of [6.4, 9.2]) { tube(context, x, 16, x, 22.6, 1.8, '#b8bcc8'); shadedEllipse(context, x - 0.3, 23.2, 2.4, 1, '#6a6e7a'); }
      shadedRect(context, 4.4, 8.6, 7, 9, 2, '#c8ccd8', { light: '#f0f2f8', dark: '#6a6e7a' });
      context.fillStyle = '#d83a3a'; context.fillRect(4.4, 12.4, 7, 1.4);
      tube(context, 11.2, 10, 13.6, 13.4, 1.8, '#b8bcc8');
      shadedEllipse(context, 14, 13.8, 1.4, 1.4, '#ffd0b0');
      tube(context, 4.8, 10, 3.4, 14, 1.8, '#b8bcc8');
      // Cabeza alargada con bacía por yelmo y perilla.
      shadedEllipse(context, 8, 5.6, 3.4, 4, '#ffd0a8', { dark: '#c8906a' });
      shadedEllipse(context, 8, 2.2, 4.6, 2.2, '#e8d070', { light: '#fff4a8', dark: '#a8861c' });
      context.fillStyle = '#e8d070'; context.beginPath(); context.arc(8, 0.8, 1.1, 0, TAU); context.fill();
      eye(context, 6.6, 5.4, 1.1, { lookX: -0.8 }); eye(context, 9.4, 5.4, 1.1, { lookX: -0.8 });
      context.fillStyle = '#5a3a20'; roundedPath(context, 4.6, 7.2, 4.8, 1, 0.5); context.fill();
      context.beginPath(); context.moveTo(7, 9.2); context.lineTo(8.4, 11.2); context.lineTo(9.4, 9.2); context.closePath(); context.fill();
    }
  },

  sancho: {
    width: 16, height: 20, frames: 1,
    paint(context) {
      for (const x of [6, 10]) { tube(context, x, 15, x, 18.8, 2.2, '#a8683a'); shadedEllipse(context, x - 0.3, 19.4, 2.6, 1, '#4a2a14'); }
      shadedEllipse(context, 8, 12, 6.2, 5.4, '#e8d8a8', { light: '#fffbe0', dark: '#a89860' });
      shadedRect(context, 3.4, 10, 9.2, 2.2, 1, '#8a5a30');
      // Bota de vino.
      shadedEllipse(context, 13.6, 13, 2.6, 3.4, '#a8322c', { light: '#e87a6a' });
      tube(context, 4, 8.6, 2.6, 12, 2, '#ffd0b0');
      tube(context, 12, 8.6, 13.6, 11.4, 2, '#ffd0b0');
      shadedEllipse(context, 8, 5, 4.2, 4, '#ffd0b0', { dark: '#c8906a' });
      shadedEllipse(context, 8, 1.8, 5.6, 1.6, '#8a5a30'); shadedEllipse(context, 8, 1.2, 3, 1.8, '#a8683a');
      eye(context, 6.2, 5, 1.1, { lookX: -0.8 }); eye(context, 9.6, 5, 1.1, { lookX: -0.8 });
      mouth(context, 7.6, 7.6, 2.6, 'grin');
    }
  },

  bailaora: {
    width: 16, height: 24, frames: 1,
    paint(context) {
      for (const x of [6.4, 9.6]) { tube(context, x, 18, x, 22.6, 1.8, '#ffc8a0'); shadedEllipse(context, x - 0.3, 23.4, 2.6, 1, '#e02a2a'); }
      // Falda de volantes.
      context.beginPath(); context.moveTo(5.6, 11); context.lineTo(10.6, 11); context.lineTo(15.2, 21); context.quadraticCurveTo(8, 23.6, 0.6, 21); context.closePath();
      const dress = context.createLinearGradient(0, 11, 16, 22); dress.addColorStop(0, '#ff5a6a'); dress.addColorStop(1, '#a8102a'); context.fillStyle = dress; context.fill();
      context.fillStyle = '#ffffff'; for (const [x, y] of [[4, 17], [8, 15], [12, 18], [6, 20], [10, 21]]) { context.beginPath(); context.arc(x, y, 0.7, 0, TAU); context.fill(); }
      context.strokeStyle = 'rgba(255,255,255,0.5)'; context.lineWidth = 0.5; context.beginPath(); context.moveTo(1.4, 19.4); context.quadraticCurveTo(8, 22, 14.6, 19.4); context.stroke();
      shadedRect(context, 5.4, 8.6, 5.6, 4.6, 1.6, '#e02a3a');
      tube(context, 10.4, 9.4, 13.6, 4.6, 1.6, '#ffc8a0');
      tube(context, 5.4, 9.4, 3.4, 13, 1.6, '#ffc8a0');
      // Cabeza con moño y rosa.
      shadedEllipse(context, 8, 5.2, 3.8, 3.8, '#ffc8a0', { dark: '#c8906a' });
      shadedEllipse(context, 8, 2.4, 4, 2.4, '#2a1a22', { light: '#5a3a44' });
      shadedEllipse(context, 11.4, 2.8, 1.8, 1.8, '#2a1a22');
      shadedEllipse(context, 5, 1.6, 1.8, 1.6, '#ff5a8a', { light: '#ffb0c8' });
      eye(context, 6.6, 5, 1, { lookX: -0.8 }); eye(context, 9.4, 5, 1, { lookX: -0.8 });
      context.fillStyle = '#e02a3a'; context.beginPath(); context.ellipse(7.8, 7.4, 1.2, 0.5, 0, 0, TAU); context.fill();
      sheen(context, 6.4, 3, 1.4, 0.5, -0.3, 0.4);
    }
  }
};

/**
 * @file Pintores de los fondos de cada ciudad, en alta resolución.
 *
 * Cada pintor recibe tres capas (lejana, intermedia y cercana) ya ampliadas a
 * RENDER_SCALE y un generador aleatorio con semilla. Se pinta en píxeles
 * lógicos (512 de ancho, suelo en y = 208). Lo lejano se funde con el color del
 * cielo (perspectiva atmosférica) y lo cercano lleva contorno, luz y sombra.
 */
import { GROUND_SURFACE_Y } from '../config/constants.js';
import { BACKGROUND_LAYER_WIDTH } from './backgroundConstants.js';
import {
  TAU, mix, shade, linearGradient, wrapDraw, roundedRect, ridge, haze, glow,
  strokeSoft, buildingBody, windowPane, roundTree, palmTree, polygon
} from './backgroundKit.js';
import { drawText, measureTextWidth } from './font.js';

const GY = GROUND_SURFACE_Y;
const W = BACKGROUND_LAYER_WIDTH;

/** Elige un elemento de una lista con el generador con semilla. */
const pick = (list, random) => list[Math.floor(random() * list.length)];

/**
 * Reparte edificios a lo ancho de la capa (la suma de anchos es exactamente W,
 * así la capa se repite sin costuras).
 * @returns {{x:number, width:number, height:number}[]}
 */
function layoutBuildings(random, { minWidth, maxWidth, minHeight, maxHeight, gap = 0 }) {
  const items = [];
  let total = 0;
  while (total < W) {
    const width = minWidth + random() * (maxWidth - minWidth);
    items.push({ width, height: minHeight + random() * (maxHeight - minHeight) });
    total += width + gap;
  }
  const scale = W / total;
  let x = 0;
  for (const item of items) {
    item.width *= scale;
    item.x = x;
    x += item.width + gap * scale;
  }
  return items;
}

/** Rejilla de ventanas dentro de un edificio. */
function windowGrid(context, random, { x, y, width, height, columns, rows, glass, frame, litChance = 0, arched = false, marginX = 4, marginTop = 6, marginBottom = 4 }) {
  const cellWidth = (width - marginX * 2) / columns;
  const cellHeight = (height - marginTop - marginBottom) / rows;
  const paneWidth = Math.min(cellWidth * 0.58, 7);
  const paneHeight = Math.min(cellHeight * 0.62, 11);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      windowPane(context, x + marginX + column * cellWidth + (cellWidth - paneWidth) / 2, y + marginTop + row * cellHeight + (cellHeight - paneHeight) / 2, paneWidth, paneHeight, {
        glass, frame, arched, lit: random() < litChance
      });
    }
  }
}

/** Silueta lejana con degradado que se funde con la neblina. */
function distantSilhouette(context, x, top, width, bottom, color, hazeColor) {
  context.fillStyle = linearGradient(context, 0, top, 0, bottom, [[0, color], [1, mix(color, hazeColor, 0.6)]]);
  context.fillRect(x, top, width, bottom - top);
}

/** Farola de forja con globo luminoso. */
function streetLamp(context, x, color = '#1c1a26', lit = true) {
  context.fillStyle = color;
  context.fillRect(x - 0.9, GY - 46, 1.8, 46);
  context.fillRect(x - 3, GY - 3, 6, 3);
  context.fillRect(x - 2, GY - 48, 4, 2);
  context.beginPath(); context.moveTo(x - 4, GY - 48); context.lineTo(x + 4, GY - 48); context.lineTo(x + 2, GY - 53); context.lineTo(x - 2, GY - 53); context.closePath(); context.fill();
  context.fillStyle = lit ? '#fff2b0' : '#bba';
  roundedRect(context, x - 2.6, GY - 62, 5.2, 9, 2.2); context.fill();
  strokeSoft(context, color, 0.8, 0);
  if (lit) glow(context, x, GY - 57, 20, '#ffe28a', 0.32);
}

/** Guirnalda de banderines entre dos puntos. */
function bunting(context, x0, y0, x1, y1, colors, sag = 8) {
  context.strokeStyle = 'rgba(30,20,40,0.7)';
  context.lineWidth = 0.6;
  const midY = (y0 + y1) / 2 + sag;
  context.beginPath(); context.moveTo(x0, y0); context.quadraticCurveTo((x0 + x1) / 2, midY, x1, y1); context.stroke();
  const flags = Math.floor(Math.abs(x1 - x0) / 7);
  for (let flag = 1; flag < flags; flag++) {
    const t = flag / flags;
    const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
    const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * midY + t * t * y1;
    polygon(context, [[px - 2.2, py], [px + 2.2, py], [px, py + 5]], colors[flag % colors.length], -0.5);
  }
}

/** Gotas de luz del sol sobre el mar (reflejos horizontales). */
function seaSparkles(context, random, y0, y1, color, count) {
  context.fillStyle = color;
  for (let index = 0; index < count; index++) {
    const x = random() * W;
    const y = y0 + random() * (y1 - y0);
    const width = 3 + random() * 7;
    context.globalAlpha = 0.25 + random() * 0.5;
    context.fillRect(x, y, width, 0.7);
  }
  context.globalAlpha = 1;
}

/* ================================================================== */
/* Pintores                                                            */
/* ================================================================== */

export const CITY_PAINTERS = {
  madrid({ far, mid, near }, random, { skyHorizon }) {
    const silhouette = mix(skyHorizon, '#7f9be0', 0.55);
    for (const building of layoutBuildings(random, { minWidth: 22, maxWidth: 38, minHeight: 50, maxHeight: 105 })) {
      distantSilhouette(far, building.x, GY - building.height, building.width + 0.5, GY + 10, silhouette, skyHorizon);
    }
    // Edificio con cúpula, linterna y estatua alada.
    wrapDraw(far, 120, 60, x => {
      far.fillStyle = shade(silhouette, 0.04);
      far.fillRect(x, GY - 118, 44, 120);
      far.beginPath(); far.arc(x + 22, GY - 118, 21, Math.PI, 0); far.fill();
      far.fillRect(x + 20.5, GY - 150, 3, 12);
      far.beginPath(); far.arc(x + 22, GY - 152, 3, 0, TAU); far.fill();
    });
    // Torres inclinadas la una hacia la otra.
    wrapDraw(far, 300, 60, x => {
      for (const side of [-1, 1]) {
        const baseX = x + 24 + side * 14;
        polygon(far, [[baseX - 8, GY], [baseX + 8, GY], [baseX + 8 - side * 20, GY - 150], [baseX - 8 - side * 20, GY - 150]], silhouette);
      }
    });
    // Cuatro rascacielos con cristal.
    [[420, 150], [444, 165], [468, 140], [490, 158]].forEach(([x, height]) => {
      far.fillStyle = linearGradient(far, x, 0, x + 16, 0, [[0, shade(silhouette, 0.12)], [1, shade(silhouette, -0.1)]]);
      far.fillRect(x, GY - height, 15, height + 10);
      far.fillStyle = 'rgba(255,255,255,0.18)';
      far.fillRect(x + 1.5, GY - height, 1.2, height);
    });
    haze(far, GY - 60, GY, skyHorizon, 0, 0.7);

    // Plano intermedio: casas bajas con tejados rojos.
    const lowColors = ['#e9c9a4', '#e3b49a', '#efd8b2', '#d9b9a0'];
    for (const building of layoutBuildings(random, { minWidth: 30, maxWidth: 46, minHeight: 52, maxHeight: 84, gap: 2 })) {
      const color = mix(pick(lowColors, random), skyHorizon, 0.32);
      buildingBody(mid, { x: building.x, y: GY - building.height, width: building.width, height: building.height + 8, color, outline: false, roof: 'tile', roofColor: mix('#b5503a', skyHorizon, 0.25) });
      windowGrid(mid, random, { x: building.x, y: GY - building.height, width: building.width, height: building.height, columns: Math.max(2, Math.round(building.width / 11)), rows: Math.round(building.height / 18), glass: mix('#5c6ea8', skyHorizon, 0.2), frame: mix('#fff6e4', color, 0.4), litChance: 0 });
    }
    haze(mid, GY - 50, GY, skyHorizon, 0, 0.45);

    // Plano cercano: fachadas grandes con balcones, contraventanas y plantas.
    const facades = ['#e9a88c', '#f0cf9a', '#e2907a', '#efd9b4', '#d9b690'];
    const row = layoutBuildings(random, { minWidth: 46, maxWidth: 64, minHeight: 84, maxHeight: 120, gap: 34 });
    for (const building of row) {
      const color = pick(facades, random);
      const top = GY - building.height;
      buildingBody(near, { x: building.x, y: top, width: building.width, height: building.height + 8, color });
      const rows = Math.floor(building.height / 26);
      const columns = Math.max(2, Math.round(building.width / 17));
      const cellWidth = (building.width - 8) / columns;
      for (let r = 0; r < rows; r++) {
        const rowY = top + 10 + r * 26;
        for (let c = 0; c < columns; c++) {
          const wx = building.x + 4 + c * cellWidth + (cellWidth - 8) / 2;
          windowPane(near, wx, rowY, 8, 14, { glass: '#445587', frame: '#fff4de', arched: r === 0 });
          // Contraventanas verdes.
          near.fillStyle = '#4a8a5a';
          near.fillRect(wx - 3.2, rowY, 2.6, 14); near.fillRect(wx + 8.6, rowY, 2.6, 14);
          near.fillStyle = 'rgba(0,0,0,0.2)';
          for (let slat = 1; slat < 14; slat += 2) { near.fillRect(wx - 3.2, rowY + slat, 2.6, 0.4); near.fillRect(wx + 8.6, rowY + slat, 2.6, 0.4); }
        }
        // Balcón con barandilla y macetas.
        const balconyY = rowY + 15;
        near.fillStyle = '#2d2a38';
        near.fillRect(building.x + 2, balconyY, building.width - 4, 1.4);
        for (let bar = building.x + 3; bar < building.x + building.width - 3; bar += 2.6) near.fillRect(bar, balconyY - 4.5, 0.6, 4.5);
        near.fillRect(building.x + 2, balconyY - 4.6, building.width - 4, 0.8);
        for (let c = 0; c < columns; c += 2) {
          const px = building.x + 6 + c * cellWidth;
          near.fillStyle = '#b8603c'; near.fillRect(px, balconyY - 3, 4, 3);
          near.fillStyle = random() > 0.5 ? '#d83a54' : '#f0c030';
          near.beginPath(); near.arc(px + 2, balconyY - 4.6, 2.4, 0, TAU); near.fill();
        }
      }
      // Portal y toldo.
      near.fillStyle = '#3a2a22';
      roundedRect(near, building.x + building.width / 2 - 5, GY - 24, 10, 26, 4); near.fill();
      near.fillStyle = pick(['#d83a3a', '#2a64c8', '#e8a020'], random);
      near.beginPath(); near.moveTo(building.x + building.width / 2 - 8, GY - 22); near.lineTo(building.x + building.width / 2 + 8, GY - 22); near.lineTo(building.x + building.width / 2 + 10, GY - 17); near.lineTo(building.x + building.width / 2 - 10, GY - 17); near.closePath(); near.fill();
    }
    for (const lampX of [20, 230, 400]) streetLamp(near, lampX);
    bunting(near, 140, GY - 120, 214, GY - 112, ['#d83a3a', '#f0c030', '#d83a3a', '#fff'], 7);
    bunting(near, 300, GY - 130, 392, GY - 118, ['#2a64c8', '#fff', '#d83a3a', '#f0c030'], 9);
    haze(near, GY - 24, GY, '#2a1c3c', 0, 0.28);
  },

  benidorm({ far, mid, near }, random, { skyHorizon }) {
    const sea = '#2f86d6';
    far.fillStyle = linearGradient(far, 0, GY - 52, 0, GY + 2, [[0, mix(sea, skyHorizon, 0.55)], [1, shade(sea, -0.15)]]);
    far.fillRect(0, GY - 52, W, 60);
    seaSparkles(far, random, GY - 50, GY - 4, '#ffffff', 90);
    // Isla y rascacielos lejanos.
    ridge(far, { baseY: GY - 52, amplitude: 10, periods: 1, phase: 1.2, fill: mix('#7a9ab8', skyHorizon, 0.45), bottom: GY - 50 });
    for (const building of layoutBuildings(random, { minWidth: 14, maxWidth: 24, minHeight: 50, maxHeight: 105, gap: 10 })) {
      const color = mix('#e6eef8', skyHorizon, 0.35);
      far.fillStyle = linearGradient(far, building.x, 0, building.x + building.width, 0, [[0, shade(color, 0.1)], [1, shade(color, -0.12)]]);
      far.fillRect(building.x, GY - 52 - building.height, building.width, building.height);
      far.fillStyle = 'rgba(80,110,150,0.35)';
      for (let y = GY - 52 - building.height + 4; y < GY - 56; y += 5) far.fillRect(building.x + 2, y, building.width - 4, 1.6);
    }
    // Torre con arco dorado.
    wrapDraw(far, 330, 60, x => {
      for (const tx of [x, x + 30]) { far.fillStyle = '#eef3fb'; far.fillRect(tx, GY - 205, 18, 160); far.fillStyle = 'rgba(80,110,150,0.4)'; for (let y = GY - 200; y < GY - 52; y += 5) far.fillRect(tx + 2, y, 14, 1.8); }
      far.strokeStyle = '#f0b830'; far.lineWidth = 3.2; far.beginPath(); far.arc(x + 24, GY - 195, 24, Math.PI * 1.02, Math.PI * 1.98); far.stroke();
    });
    haze(far, GY - 70, GY, skyHorizon, 0, 0.6);

    // Intermedio: hoteles blancos con balcones azules.
    for (const building of layoutBuildings(random, { minWidth: 28, maxWidth: 40, minHeight: 60, maxHeight: 118, gap: 6 })) {
      const color = mix('#f6f6f0', skyHorizon, 0.18);
      buildingBody(mid, { x: building.x, y: GY - building.height, width: building.width, height: building.height + 8, color, outline: false });
      for (let y = GY - building.height + 6; y < GY - 8; y += 9) {
        mid.fillStyle = mix('#3aa0e8', skyHorizon, 0.2); mid.fillRect(building.x + 3, y, building.width - 6, 5);
        mid.fillStyle = '#ffffff'; mid.fillRect(building.x + 2, y + 5, building.width - 4, 1.4);
      }
    }
    haze(mid, GY - 40, GY, skyHorizon, 0, 0.4);

    // Cercano: palmeras, sombrillas y casetas de playa.
    for (let x = 30; x < W; x += 128) {
      wrapDraw(near, x, 80, px => palmTree(near, px, GY, 78 + random() * 20, 8 + random() * 6));
    }
    for (let x = 90; x < W; x += 170) {
      wrapDraw(near, x, 60, px => {
        near.fillStyle = '#4a4a50'; near.fillRect(px - 0.6, GY - 36, 1.2, 36);
        const colors = ['#ff4d5a', '#ffffff'];
        for (let seg = 0; seg < 6; seg++) {
          const a0 = Math.PI + seg * Math.PI / 6; const a1 = a0 + Math.PI / 6;
          near.beginPath(); near.moveTo(px, GY - 36); near.arc(px, GY - 36, 18, a0, a1); near.closePath(); near.fillStyle = colors[seg % 2]; near.fill();
        }
        near.beginPath(); near.arc(px, GY - 36, 18, Math.PI, 0); strokeSoft(near, '#ff4d5a', 0.8, -0.6);
      });
    }
    for (let x = 200; x < W; x += 250) {
      wrapDraw(near, x, 28, px => {
        for (let stripe = 0; stripe < 4; stripe++) { near.fillStyle = stripe % 2 ? '#ffffff' : '#2a8ae0'; near.fillRect(px + stripe * 6, GY - 26, 6, 26); }
        polygon(near, [[px - 2, GY - 26], [px + 26, GY - 26], [px + 12, GY - 38]], '#2a8ae0', -0.5);
        near.fillStyle = '#6a4a2a'; near.fillRect(px + 8, GY - 14, 8, 14);
      });
    }
    haze(near, GY - 20, GY, '#c8a060', 0, 0.35);
  },

  sevilla({ far, mid, near }, random, { skyHorizon }) {
    const silhouette = mix(skyHorizon, '#c8845c', 0.5);
    for (const building of layoutBuildings(random, { minWidth: 24, maxWidth: 40, minHeight: 36, maxHeight: 62 })) {
      distantSilhouette(far, building.x, GY - building.height, building.width + 0.5, GY + 10, silhouette, skyHorizon);
    }
    // La Giralda.
    wrapDraw(far, 236, 40, x => {
      const stone = mix('#d9945c', skyHorizon, 0.35);
      far.fillStyle = linearGradient(far, x, 0, x + 28, 0, [[0, shade(stone, 0.12)], [1, shade(stone, -0.18)]]);
      far.fillRect(x, GY - 150, 28, 152);
      far.fillStyle = shade(stone, -0.25);
      for (let y = GY - 140; y < GY - 30; y += 22) { windowPane(far, x + 5, y, 4, 12, { glass: '#4a3028', frame: shade(stone, 0.2), arched: true, sill: false }); windowPane(far, x + 19, y, 4, 12, { glass: '#4a3028', frame: shade(stone, 0.2), arched: true, sill: false }); }
      far.fillStyle = stone; far.fillRect(x + 3, GY - 178, 22, 28);
      for (let arch = 0; arch < 3; arch++) windowPane(far, x + 6 + arch * 6.2, GY - 174, 4, 14, { glass: '#3a2418', frame: shade(stone, 0.15), arched: true, sill: false });
      far.fillRect(x + 7, GY - 190, 14, 12); far.fillRect(x + 10, GY - 200, 8, 10);
      far.beginPath(); far.arc(x + 14, GY - 202, 3, 0, TAU); far.fillStyle = '#e8b848'; far.fill();
      far.fillRect(x + 13.4, GY - 214, 1.2, 10);
    });
    haze(far, GY - 70, GY, skyHorizon, 0, 0.6);

    // Intermedio: casas blancas encaladas con tejados naranjas y arcos.
    for (const building of layoutBuildings(random, { minWidth: 30, maxWidth: 48, minHeight: 50, maxHeight: 80, gap: 2 })) {
      const color = mix('#fbf1e0', skyHorizon, 0.22);
      buildingBody(mid, { x: building.x, y: GY - building.height, width: building.width, height: building.height + 8, color, outline: false, roof: 'tile', roofColor: mix('#d8683a', skyHorizon, 0.2) });
      windowGrid(mid, random, { x: building.x, y: GY - building.height, width: building.width, height: building.height, columns: Math.max(2, Math.round(building.width / 14)), rows: Math.round(building.height / 22), glass: '#5a4a58', frame: '#3a8a4a', arched: true, marginTop: 8 });
    }
    haze(mid, GY - 44, GY, skyHorizon, 0, 0.4);

    // Cercano: casetas de feria a rayas, farolillos y naranjos.
    const pairs = [['#e8302c', '#ffffff'], ['#1a9a4a', '#ffffff'], ['#2a5ac8', '#ffffff']];
    for (let x = 6; x < W; x += 102) {
      const [main, stripe] = pick(pairs, random);
      wrapDraw(near, x, 80, px => {
        for (let s = 0; s < 8; s++) { near.fillStyle = s % 2 ? stripe : main; near.fillRect(px + s * 6, GY - 42, 6, 42); }
        near.strokeStyle = shade(main, -0.55); near.lineWidth = 0.9; near.strokeRect(px, GY - 42, 48, 42);
        polygon(near, [[px - 4, GY - 42], [px + 52, GY - 42], [px + 24, GY - 66]], main, -0.55);
        near.fillStyle = 'rgba(255,255,255,0.18)'; near.beginPath(); near.moveTo(px - 4, GY - 42); near.lineTo(px + 24, GY - 66); near.lineTo(px + 24, GY - 42); near.closePath(); near.fill();
        near.fillStyle = '#3a2418'; roundedRect(near, px + 16, GY - 24, 14, 24, 6); near.fill();
        near.fillStyle = '#ffe9a8'; near.fillRect(px + 20, GY - 20, 6, 8);
      });
    }
    const lantern = ['#ff3a3a', '#27c060', '#ffd020', '#ffffff'];
    for (let x = 0; x < W; x += 64) {
      near.strokeStyle = 'rgba(40,30,30,0.7)'; near.lineWidth = 0.6;
      near.beginPath(); near.moveTo(x, GY - 76); near.quadraticCurveTo(x + 32, GY - 58, x + 64, GY - 76); near.stroke();
      for (let l = 1; l < 8; l++) {
        const t = l / 8; const px = x + 64 * t; const py = (1 - t) * (1 - t) * (GY - 76) + 2 * (1 - t) * t * (GY - 58) + t * t * (GY - 76);
        const color = lantern[l % 4];
        near.fillStyle = color; near.beginPath(); near.ellipse(px, py + 3.2, 2, 3, 0, 0, TAU); near.fill();
        glow(near, px, py + 3.2, 9, color, 0.55);
      }
    }
    for (let x = 60; x < W; x += 200) wrapDraw(near, x, 30, px => roundTree(near, px, GY, 46, { leaves: '#4aa040' }));
    haze(near, GY - 20, GY, '#8a4a22', 0, 0.3);
  },

  pamplona({ far, mid, near }, random, { skyHorizon }) {
    // Pirineos nevados.
    const mountainColor = mix('#6f8fb8', skyHorizon, 0.45);
    ridge(far, { baseY: GY - 70, amplitude: 70, periods: 3, phase: 0.4, fill: linearGradient(far, 0, GY - 150, 0, GY, [[0, mountainColor], [1, mix(mountainColor, skyHorizon, 0.7)]]), sharpness: 0.7 });
    ridge(far, { baseY: GY - 46, amplitude: 34, periods: 4, phase: 2.1, fill: mix('#5f8a78', skyHorizon, 0.5), sharpness: 0.3 });
    haze(far, GY - 90, GY, skyHorizon, 0, 0.6);
    // Colinas verdes con árboles y campanario.
    ridge(mid, { baseY: GY - 40, amplitude: 22, periods: 3, phase: 1, fill: linearGradient(mid, 0, GY - 70, 0, GY, [[0, mix('#4a9a58', skyHorizon, 0.3)], [1, mix('#2e7a44', skyHorizon, 0.3)]]), rim: 'rgba(200,255,180,0.35)' });
    for (let x = 14; x < W; x += 38) roundTree(mid, x + random() * 14, GY - 18 + random() * 8, 24 + random() * 10, { leaves: mix('#2f8a3c', skyHorizon, 0.25), outline: false });
    wrapDraw(mid, 260, 20, x => {
      mid.fillStyle = mix('#c9b79a', skyHorizon, 0.3); mid.fillRect(x, GY - 82, 12, 70);
      polygon(mid, [[x - 1, GY - 82], [x + 13, GY - 82], [x + 6, GY - 102]], mix('#8a4a30', skyHorizon, 0.3));
      windowPane(mid, x + 4, GY - 70, 4, 9, { glass: '#4a3a30', frame: '#e8d8b8', arched: true, sill: false });
    });
    haze(mid, GY - 40, GY, skyHorizon, 0, 0.4);
    // Casas de piedra con balcones de madera y pañuelos rojos.
    const stone = ['#d3c3a2', '#c4b090', '#dccdae'];
    for (const building of layoutBuildings(random, { minWidth: 48, maxWidth: 70, minHeight: 100, maxHeight: 140, gap: 3 })) {
      const color = pick(stone, random);
      const top = GY - building.height;
      buildingBody(near, { x: building.x, y: top, width: building.width, height: building.height + 8, color, roof: 'tile', roofColor: '#9a4c30' });
      // Sillares.
      near.strokeStyle = 'rgba(70,50,30,0.22)'; near.lineWidth = 0.4;
      for (let y = top + 6; y < GY; y += 7) { near.beginPath(); near.moveTo(building.x, y); near.lineTo(building.x + building.width, y); near.stroke(); }
      for (let r = 0; r < Math.floor(building.height / 30); r++) {
        const rowY = top + 14 + r * 30;
        near.fillStyle = '#6a4220'; near.fillRect(building.x + 3, rowY + 14, building.width - 6, 3);
        near.fillStyle = shade('#6a4220', -0.4); near.fillRect(building.x + 3, rowY + 16, building.width - 6, 1);
        for (let post = building.x + 4; post < building.x + building.width - 4; post += 5) { near.fillStyle = '#7a5230'; near.fillRect(post, rowY + 7, 1, 7); }
        const doors = Math.max(2, Math.round(building.width / 22));
        for (let d = 0; d < doors; d++) {
          const dx = building.x + 6 + d * ((building.width - 12) / doors);
          windowPane(near, dx, rowY - 2, 7, 15, { glass: '#3c3048', frame: '#6a4220', sill: false });
          if (random() > 0.35) { // pañuelo rojo
            polygon(near, [[dx + 8, rowY + 15], [dx + 12.5, rowY + 15], [dx + 12.5, rowY + 22], [dx + 10.2, rowY + 20], [dx + 8, rowY + 22]], '#d92020', -0.5);
          }
        }
      }
    }
    // Vallado de madera.
    for (let x = 0; x < W; x += 7) { near.fillStyle = '#7a4a24'; near.fillRect(x, GY - 14, 5, 14); near.fillStyle = 'rgba(255,255,255,0.15)'; near.fillRect(x, GY - 14, 1.2, 14); }
    near.fillStyle = '#5a3418'; near.fillRect(0, GY - 11, W, 2.4); near.fillRect(0, GY - 5, W, 2.4);
    haze(near, GY - 24, GY, '#2a1c14', 0, 0.3);
  },

  metro({ far, mid, near }, random) {
    // Pared de azulejos blancos y azules con reflejos.
    far.fillStyle = linearGradient(far, 0, 0, 0, 240, [[0, '#161a2a'], [0.5, '#222a40'], [1, '#2e3852']]);
    far.fillRect(0, 0, W, 240);
    for (let y = 36; y < GY; y += 9) {
      for (let x = (Math.floor(y / 9) % 2) ? 0 : 7; x < W + 14; x += 14) {
        far.fillStyle = (Math.floor(x / 14) + Math.floor(y / 9)) % 7 === 0 ? '#2e4a8c' : '#3a4562';
        roundedRect(far, x + 0.5, y + 0.5, 13, 8, 1.4); far.fill();
        far.fillStyle = 'rgba(255,255,255,0.08)'; far.fillRect(x + 1.5, y + 1, 11, 1.4);
      }
    }
    far.fillStyle = '#1b3cae'; far.fillRect(0, 100, W, 12);
    far.fillStyle = '#6b8cff'; far.fillRect(0, 101.4, W, 1.8);
    far.fillStyle = 'rgba(0,0,0,0.35)'; far.fillRect(0, 112, W, 2);
    // Arcos de túnel con luces.
    for (let x = 0; x < W; x += 128) {
      mid.fillStyle = linearGradient(mid, 0, 0, 0, GY, [[0, 'rgba(10,12,22,0.95)'], [1, 'rgba(20,24,40,0.7)']]);
      mid.beginPath(); mid.moveTo(x + 6, GY); mid.lineTo(x + 6, 76); mid.arc(x + 64, 76, 58, Math.PI, 0); mid.lineTo(x + 122, GY); mid.closePath(); mid.fill();
      strokeSoft(mid, '#566086', 1.4, 0);
      // Perspectiva del túnel: rieles brillantes.
      mid.strokeStyle = 'rgba(160,180,255,0.25)'; mid.lineWidth = 0.8;
      mid.beginPath(); mid.moveTo(x + 40, GY); mid.lineTo(x + 60, 140); mid.moveTo(x + 88, GY); mid.lineTo(x + 68, 140); mid.stroke();
    }
    for (let x = 0; x < W; x += 64) { glow(mid, x + 32, 22, 38, '#cfe0ff', 0.5); mid.fillStyle = '#eaf2ff'; roundedRect(mid, x + 20, 18, 24, 4, 2); mid.fill(); }
    // Carteles de estación luminosos.
    ['SOL', 'CALLAO', 'ÓPERA', 'TRIBUNAL'].forEach((name, index) => {
      const signWidth = measureTextWidth(name) + 20;
      const signX = index * 128 + 64 - signWidth / 2;
      glow(near, signX + signWidth / 2, 78, signWidth, '#4a7cff', 0.35);
      near.fillStyle = '#0f2a8c'; roundedRect(near, signX, 68, signWidth, 20, 3); near.fill();
      near.fillStyle = linearGradient(near, 0, 69, 0, 87, [[0, '#4a78ff'], [1, '#2144c8']]); roundedRect(near, signX + 1, 69, signWidth - 2, 18, 2.4); near.fill();
      near.fillStyle = '#ffffff'; near.beginPath(); near.arc(signX + 9, 78, 4.2, 0, TAU); near.fill();
      near.fillStyle = '#d4222a'; near.fillRect(signX + 5.6, 76.8, 6.8, 2.4);
      drawText(near, name, signX + 16, 74, '#ffffff');
    });
    // Columnas de hierro con luz.
    for (let x = 0; x < W; x += 128) {
      wrapDraw(near, x - 6, 12, pillarX => {
        near.fillStyle = linearGradient(near, pillarX, 0, pillarX + 12, 0, [[0, '#4a5274'], [0.4, '#2c3350'], [1, '#12162a']]);
        near.fillRect(pillarX, 26, 12, GY - 26);
        near.fillStyle = '#6a739a'; near.fillRect(pillarX - 3, 26, 18, 4); near.fillRect(pillarX - 3, GY - 6, 18, 6);
        near.fillStyle = 'rgba(255,255,255,0.16)'; near.fillRect(pillarX + 1, 30, 1.4, GY - 36);
      });
    }
    haze(near, GY - 30, GY, '#05060e', 0, 0.45);
  },

  galicia({ far, mid, near }, random, { skyHorizon }) {
    // Colinas en capas entre la niebla.
    const greens = ['#8aa898', '#6f9482', '#527a68'];
    greens.forEach((color, index) => {
      ridge(far, { baseY: GY - 78 + index * 22, amplitude: 24 - index * 4, periods: 2 + index, phase: index * 1.7, fill: linearGradient(far, 0, GY - 110 + index * 22, 0, GY, [[0, mix(color, skyHorizon, 0.45 - index * 0.1)], [1, mix(color, skyHorizon, 0.75)]]) });
      haze(far, GY - 100 + index * 22, GY - 30 + index * 22, skyHorizon, 0, 0.35);
    });
    // Faro.
    wrapDraw(far, 410, 20, x => {
      polygon(far, [[x, GY - 28], [x + 12, GY - 28], [x + 10, GY - 92], [x + 2, GY - 92]], mix('#e8e6e2', skyHorizon, 0.3));
      far.fillStyle = mix('#d02828', skyHorizon, 0.25); far.fillRect(x + 2.6, GY - 60, 7, 8); far.fillRect(x + 2, GY - 80, 8, 6);
      far.fillStyle = mix('#3a3a44', skyHorizon, 0.3); far.fillRect(x + 1.5, GY - 100, 9, 8);
      glow(far, x + 6, GY - 96, 30, '#fff2b0', 0.5);
    });
    // Intermedio: eucaliptos altos entre la bruma.
    for (let x = 10; x < W; x += 52) {
      wrapDraw(mid, x, 20, px => {
        const h = 90 + random() * 40;
        mid.fillStyle = mix('#8a7864', skyHorizon, 0.35); mid.fillRect(px, GY - h, 2.6, h);
        for (const [dx, dy, r] of [[0, 0, 12], [-6, 18, 9], [7, 24, 10], [0, 36, 8]]) {
          mid.beginPath(); mid.ellipse(px + dx + 1, GY - h + dy, r * 0.8, r * 1.4, 0, 0, TAU);
          mid.fillStyle = linearGradient(mid, 0, GY - h + dy - r, 0, GY - h + dy + r, [[0, mix('#5e9a74', skyHorizon, 0.3)], [1, mix('#2f6a4a', skyHorizon, 0.3)]]); mid.fill();
        }
      });
    }
    haze(mid, GY - 70, GY, skyHorizon, 0, 0.5);
    // Cercano: hórreos de piedra sobre pilares y muros con musgo.
    for (let x = 14; x < W; x += 150) {
      wrapDraw(near, x, 70, px => {
        for (const pillarX of [px + 4, px + 40]) { near.fillStyle = '#8a8a90'; near.fillRect(pillarX, GY - 18, 5, 18); near.fillStyle = '#b8b8c0'; near.fillRect(pillarX - 2, GY - 20, 9, 3); near.fillStyle = 'rgba(255,255,255,0.2)'; near.fillRect(pillarX, GY - 18, 1.2, 18); }
        near.fillStyle = linearGradient(near, px, 0, px + 50, 0, [[0, '#a89576'], [1, '#7a6a52']]); near.fillRect(px + 1, GY - 52, 48, 32);
        near.strokeStyle = '#4a3a28'; near.lineWidth = 0.9; near.strokeRect(px + 1, GY - 52, 48, 32);
        near.strokeStyle = 'rgba(40,28,16,0.55)'; near.lineWidth = 0.6;
        for (let s = px + 6; s < px + 48; s += 5) { near.beginPath(); near.moveTo(s, GY - 50); near.lineTo(s, GY - 22); near.stroke(); }
        polygon(near, [[px - 5, GY - 52], [px + 55, GY - 52], [px + 25, GY - 72]], '#5e6270', -0.5);
        near.fillStyle = '#3e424e'; near.fillRect(px + 24, GY - 82, 2, 12); near.fillRect(px + 20.6, GY - 79, 8.8, 2);
      });
    }
    for (let x = 90; x < W; x += 150) {
      wrapDraw(near, x, 60, px => {
        near.fillStyle = linearGradient(near, 0, GY - 22, 0, GY, [[0, '#8e8e92'], [1, '#5e5e66']]); near.fillRect(px, GY - 22, 58, 22);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) { near.strokeStyle = 'rgba(30,30,40,0.45)'; near.lineWidth = 0.5; near.strokeRect(px + col * 12 + (row % 2) * 6, GY - 22 + row * 7.4, 12, 7.4); }
        near.fillStyle = 'rgba(70,140,60,0.55)'; for (let m = 0; m < 9; m++) { near.beginPath(); near.arc(px + 4 + m * 6.4, GY - 22, 2.4 + (m % 3), Math.PI, 0); near.fill(); }
      });
    }
    haze(near, GY - 50, GY, '#aebdc8', 0, 0.45);
  },

  valencia({ far, mid, near }, random, { skyHorizon }) {
    const dusk = mix('#3a2a5a', skyHorizon, 0.18);
    for (const building of layoutBuildings(random, { minWidth: 18, maxWidth: 30, minHeight: 40, maxHeight: 96 })) {
      distantSilhouette(far, building.x, GY - building.height, building.width + 0.5, GY + 10, dusk, mix(skyHorizon, '#6a3a70', 0.4));
      for (let y = GY - building.height + 5; y < GY - 6; y += 8) for (let x = building.x + 3; x < building.x + building.width - 3; x += 6) if (random() > 0.45) { far.fillStyle = 'rgba(255,214,120,0.85)'; far.fillRect(x, y, 2.2, 3); }
    }
    // Ciudad de las Artes: arco blanco y esfera ocular.
    wrapDraw(far, 200, 120, x => {
      far.fillStyle = linearGradient(far, x, 0, x + 100, 0, [[0, '#f4f2ff'], [1, '#a8a8d8']]);
      far.beginPath(); far.moveTo(x, GY); far.quadraticCurveTo(x + 50, GY - 110, x + 100, GY); far.lineTo(x + 94, GY); far.quadraticCurveTo(x + 50, GY - 96, x + 6, GY); far.closePath(); far.fill();
      far.fillStyle = 'rgba(120,120,190,0.8)'; far.beginPath(); far.ellipse(x + 50, GY - 20, 34, 12, 0, 0, TAU); far.fill();
      far.fillStyle = '#e8e8ff'; far.beginPath(); far.ellipse(x + 50, GY - 24, 22, 7, 0, 0, TAU); far.fill();
    });
    haze(far, GY - 80, GY, '#d0686c', 0, 0.55);

    // Intermedio: monumentos de falla lejanos con luces de colores.
    for (let x = 20; x < W; x += 128) {
      wrapDraw(mid, x, 60, px => {
        mid.fillStyle = mix('#5a3a5c', skyHorizon, 0.25); mid.fillRect(px, GY - 40, 56, 40);
        mid.beginPath(); mid.arc(px + 28, GY - 52, 22, 0, TAU); mid.fill();
        polygon(mid, [[px + 18, GY - 70], [px + 38, GY - 70], [px + 28, GY - 96]], mix('#7a3a5c', skyHorizon, 0.2));
        for (let l = 0; l < 7; l++) { const c = ['#ffd24a', '#ff5a8a', '#6adcff', '#ffffff'][l % 4]; mid.fillStyle = c; mid.beginPath(); mid.arc(px + 4 + l * 8, GY - 38 - (l % 2) * 6, 1.6, 0, TAU); mid.fill(); glow(mid, px + 4 + l * 8, GY - 38 - (l % 2) * 6, 8, c, 0.5); }
      });
    }
    haze(mid, GY - 50, GY, '#6a2a58', 0, 0.45);

    // Cercano: ninots de colores con contorno grueso.
    for (let x = 22; x < W; x += 128) {
      wrapDraw(near, x, 60, px => {
        near.fillStyle = '#7a4a30'; roundedRect(near, px, GY - 20, 54, 22, 3); near.fill(); strokeSoft(near, '#7a4a30', 1, -0.6);
        const clothes = pick(['#ff7aa8', '#6ad0ff', '#ffd45a', '#9af07a'], random);
        near.fillStyle = linearGradient(near, px + 14, 0, px + 40, 0, [[0, shade(clothes, 0.18)], [1, shade(clothes, -0.2)]]);
        roundedRect(near, px + 14, GY - 76, 26, 56, 8); near.fill(); strokeSoft(near, clothes, 1.1, -0.6);
        for (const sx of [px + 4, px + 40]) { near.fillStyle = clothes; roundedRect(near, sx, GY - 66, 10, 30, 5); near.fill(); strokeSoft(near, clothes, 1, -0.6); near.fillStyle = '#ffd0b0'; near.beginPath(); near.arc(sx + 5, GY - 35, 4.6, 0, TAU); near.fill(); strokeSoft(near, '#ffd0b0', 0.8, -0.5); }
        near.fillStyle = linearGradient(near, 0, GY - 112, 0, GY - 76, [[0, '#ffe0c4'], [1, '#f0b890']]);
        near.beginPath(); near.arc(px + 27, GY - 92, 18, 0, TAU); near.fill(); strokeSoft(near, '#f0b890', 1.1, -0.55);
        near.fillStyle = '#ff7a7a'; near.beginPath(); near.ellipse(px + 27, GY - 84, 7, 4.2, 0, 0, TAU); near.fill();
        near.fillStyle = '#ffffff'; near.beginPath(); near.arc(px + 20, GY - 96, 4.4, 0, TAU); near.arc(px + 34, GY - 96, 4.4, 0, TAU); near.fill();
        near.fillStyle = '#10101a'; near.beginPath(); near.arc(px + 21, GY - 95, 2, 0, TAU); near.arc(px + 33, GY - 95, 2, 0, TAU); near.fill();
        near.fillStyle = '#2a2a38'; roundedRect(near, px + 10, GY - 108, 34, 7, 3); near.fill(); roundedRect(near, px + 17, GY - 124, 20, 18, 4); near.fill();
      });
    }
    bunting(near, 0, GY - 120, 128, GY - 120, ['#ff7a3a', '#ffd24a', '#ff5a8a', '#6adcff'], 10);
    bunting(near, 128, GY - 120, 256, GY - 120, ['#ff7a3a', '#ffd24a', '#ff5a8a', '#6adcff'], 10);
    bunting(near, 256, GY - 120, 384, GY - 120, ['#ff7a3a', '#ffd24a', '#ff5a8a', '#6adcff'], 10);
    bunting(near, 384, GY - 120, 512, GY - 120, ['#ff7a3a', '#ffd24a', '#ff5a8a', '#6adcff'], 10);
    haze(near, GY - 24, GY, '#2a0e30', 0, 0.35);
  },

  mancha({ far, mid, near }, random) {
    // Estrellas con brillo.
    for (let s = 0; s < 150; s++) {
      const x = random() * W; const y = random() * 150; const bright = random();
      far.fillStyle = bright > 0.85 ? '#ffffff' : bright > 0.5 ? '#b8c8ff' : '#7a8ac0';
      far.beginPath(); far.arc(x, y, bright > 0.85 ? 1 : 0.55, 0, TAU); far.fill();
      if (bright > 0.93) glow(far, x, y, 7, '#cfe0ff', 0.5);
    }
    // Luna llena con cráteres y halo.
    glow(far, 400, 54, 70, '#c8d4ff', 0.35);
    far.fillStyle = linearGradient(far, 384, 38, 416, 70, [[0, '#fffbe4'], [1, '#e0d8a8']]);
    far.beginPath(); far.arc(400, 54, 17, 0, TAU); far.fill();
    far.fillStyle = 'rgba(160,150,110,0.45)';
    for (const [dx, dy, r] of [[-5, -4, 3.2], [5, 3, 2.4], [-2, 7, 2], [6, -7, 1.6]]) { far.beginPath(); far.arc(400 + dx, 54 + dy, r, 0, TAU); far.fill(); }
    ridge(far, { baseY: GY - 56, amplitude: 22, periods: 3, phase: 0.8, fill: linearGradient(far, 0, GY - 90, 0, GY, [[0, '#26306a'], [1, '#161c44']]), rim: 'rgba(160,180,255,0.35)' });
    haze(far, GY - 80, GY, '#2a3a8a', 0, 0.45);
    ridge(mid, { baseY: GY - 28, amplitude: 16, periods: 4, phase: 2.4, fill: linearGradient(mid, 0, GY - 60, 0, GY, [[0, '#1c2352'], [1, '#101533']]), rim: 'rgba(140,160,255,0.28)' });
    // Molinos lejanos.
    for (let x = 60; x < W; x += 170) {
    wrapDraw(mid, x, 50, px => {
      mid.fillStyle = '#12183a'; polygon(mid, [[px - 6, GY - 16], [px + 6, GY - 16], [px + 4, GY - 46], [px - 4, GY - 46]], '#12183a');
      polygon(mid, [[px - 6, GY - 46], [px + 6, GY - 46], [px, GY - 56]], '#0c1030');
      mid.strokeStyle = '#0c1030'; mid.lineWidth = 1.2; for (let b = 0; b < 4; b++) { const a = b * Math.PI / 2 + 0.5; mid.beginPath(); mid.moveTo(px, GY - 44); mid.lineTo(px + Math.cos(a) * 20, GY - 44 + Math.sin(a) * 20); mid.stroke(); }
    });
    }
    haze(mid, GY - 40, GY, '#1c2460', 0, 0.4);
    // Molinos cercanos con luz en la ventana y aspas.
    for (let x = 40; x < W; x += 170) {
      wrapDraw(near, x, 64, px => {
        near.fillStyle = linearGradient(near, px - 14, 0, px + 14, 0, [[0, '#d8d8f0'], [0.6, '#9a9ac0'], [1, '#585888']]);
        polygon(near, [[px - 14, GY], [px + 14, GY], [px + 9, GY - 64], [px - 9, GY - 64]], near.fillStyle);
        near.strokeStyle = '#2c2c58'; near.lineWidth = 1; near.beginPath(); near.moveTo(px - 14, GY); near.lineTo(px - 9, GY - 64); near.lineTo(px + 9, GY - 64); near.lineTo(px + 14, GY); near.stroke();
        near.fillStyle = '#2c2440'; polygon(near, [[px - 12, GY - 64], [px + 12, GY - 64], [px, GY - 80]], '#2c2440', -0.4);
        near.fillStyle = '#ffd36a'; roundedRect(near, px - 2.6, GY - 44, 5.2, 7, 2.4); near.fill(); glow(near, px, GY - 41, 18, '#ffcf70', 0.5);
        near.fillStyle = '#3a2418'; roundedRect(near, px - 3.4, GY - 16, 6.8, 16, 3); near.fill();
        const hubY = GY - 62;
        near.lineCap = 'round';
        for (let b = 0; b < 4; b++) {
          const a = b * Math.PI / 2 + 0.6;
          const bx = px + Math.cos(a) * 30; const by = hubY + Math.sin(a) * 30;
          near.strokeStyle = '#3a2a1c'; near.lineWidth = 1.6; near.beginPath(); near.moveTo(px, hubY); near.lineTo(bx, by); near.stroke();
          const nx = -Math.sin(a) * 6; const ny = Math.cos(a) * 6;
          near.fillStyle = 'rgba(210,200,170,0.85)'; near.beginPath(); near.moveTo(px + Math.cos(a) * 8, hubY + Math.sin(a) * 8); near.lineTo(bx, by); near.lineTo(bx + nx, by + ny); near.lineTo(px + Math.cos(a) * 8 + nx, hubY + Math.sin(a) * 8 + ny); near.closePath(); near.fill();
          strokeSoft(near, '#a09878', 0.6, -0.6);
        }
        near.fillStyle = '#2a1c14'; near.beginPath(); near.arc(px, hubY, 2.6, 0, TAU); near.fill();
      });
    }
    haze(near, GY - 30, GY, '#080a20', 0, 0.45);
  },

  canarias({ far, mid, near }, random, { skyHorizon }) {
    // Mar rojizo al atardecer y el Teide humeante.
    far.fillStyle = linearGradient(far, 0, GY - 38, 0, GY + 4, [[0, mix('#3a5a9c', skyHorizon, 0.45)], [1, '#1c3a78']]);
    far.fillRect(0, GY - 38, W, 46);
    seaSparkles(far, random, GY - 36, GY - 2, '#ffd2a0', 70);
    wrapDraw(far, 200, 220, x => {
      const grad = linearGradient(far, 0, GY - 150, 0, GY - 30, [[0, '#f2e6e2'], [0.14, '#f2e6e2'], [0.2, '#8a4a36'], [1, '#4a281e']]);
      polygon(far, [[x, GY - 36], [x + 100, GY - 150], [x + 104, GY - 150], [x + 200, GY - 36]], grad);
      far.fillStyle = '#ff7a30'; far.fillRect(x + 94, GY - 154, 16, 5); glow(far, x + 102, GY - 154, 30, '#ff8a30', 0.7);
      for (let puff = 0; puff < 7; puff++) { far.fillStyle = `rgba(160,140,140,${0.5 - puff * 0.05})`; far.beginPath(); far.arc(x + 102 + puff * 7, GY - 164 - puff * 9, 5 + puff * 1.4, 0, TAU); far.fill(); }
    });
    haze(far, GY - 70, GY, skyHorizon, 0, 0.55);
    ridge(mid, { baseY: GY - 24, amplitude: 22, periods: 3, phase: 0.2, fill: linearGradient(mid, 0, GY - 50, 0, GY, [[0, mix('#5a2e28', skyHorizon, 0.3)], [1, '#2a1612']]), sharpness: 0.5, rim: 'rgba(255,170,100,0.4)' });
    haze(mid, GY - 40, GY, '#e86040', 0, 0.35);
    // Dragos (árboles) en silueta con brillo de lava abajo.
    for (let x = 46; x < W; x += 128) {
      wrapDraw(near, x, 64, px => {
        near.fillStyle = '#2c2430';
        polygon(near, [[px - 5, GY], [px + 5, GY], [px + 3, GY - 40], [px - 3, GY - 40]], '#2c2430');
        for (let branch = -3; branch <= 3; branch++) {
          const bx = px + branch * 9; const by = GY - 56 - Math.abs(branch) * -3 - (3 - Math.abs(branch)) * 3;
          near.strokeStyle = '#2c2430'; near.lineWidth = 2.2; near.beginPath(); near.moveTo(px, GY - 38); near.quadraticCurveTo(px + branch * 4, GY - 54, bx, by); near.stroke();
          near.fillStyle = linearGradient(near, 0, by - 10, 0, by + 8, [[0, '#4a9a50'], [1, '#1e5a34']]);
          for (let leaf = 0; leaf < 7; leaf++) { const a = -Math.PI * (leaf / 6); near.beginPath(); near.moveTo(bx, by); near.quadraticCurveTo(bx + Math.cos(a) * 6, by + Math.sin(a) * 8 - 3, bx + Math.cos(a) * 11, by + Math.sin(a) * 6 + 4); near.quadraticCurveTo(bx + Math.cos(a) * 5, by - 1, bx, by); near.fill(); }
        }
        glow(near, px, GY, 36, '#ff6a20', 0.45);
      });
    }
    near.fillStyle = '#1c1418'; ridge(near, { baseY: GY - 6, amplitude: 4, periods: 9, phase: 0, fill: '#1c1418', rim: 'rgba(255,120,60,0.5)' });
    haze(near, GY - 24, GY, '#ff5a20', 0, 0.28);
  },

  hacienda({ far, mid, near }, random) {
    // Muro de sillares de piedra oscura.
    far.fillStyle = linearGradient(far, 0, 0, 0, 240, [[0, '#14101c'], [1, '#2a2236']]);
    far.fillRect(0, 0, W, 240);
    for (let y = 30; y < GY + 6; y += 9) {
      for (let x = (Math.floor(y / 9) % 2) ? -8 : 0; x < W + 16; x += 22) {
        const tone = 0.04 + ((x * 7 + y * 13) % 11) / 160;
        far.fillStyle = mix('#2a2236', '#4a4058', tone * 3);
        roundedRect(far, x + 0.6, y + 0.6, 20.8, 7.8, 1.2); far.fill();
        far.fillStyle = 'rgba(255,255,255,0.05)'; far.fillRect(x + 1.4, y + 1, 19, 1.2);
      }
    }
    // Ventanales enrejados con luz azulada.
    for (let x = 60; x < W; x += 128) {
      mid.fillStyle = '#080610'; mid.beginPath(); mid.moveTo(x, 140); mid.lineTo(x, 90); mid.arc(x + 16, 90, 16, Math.PI, 0); mid.lineTo(x + 32, 140); mid.closePath(); mid.fill();
      glow(mid, x + 16, 100, 34, '#6a7ad8', 0.35);
      mid.strokeStyle = '#6a627a'; mid.lineWidth = 1.2; for (let bar = 5; bar < 32; bar += 7) { mid.beginPath(); mid.moveTo(x + bar, 76); mid.lineTo(x + bar, 140); mid.stroke(); }
      strokeSoft(mid, '#5a5068', 2, 0.1);
    }
    // Estandartes de impuestos.
    ['IVA', 'IRPF', '21%', 'IBI'].forEach((name, index) => {
      const bx = index * 128 + 22;
      near.fillStyle = '#c8a040'; roundedRect(near, bx - 5, 42, 46, 5, 2); near.fill();
      near.fillStyle = linearGradient(near, bx, 0, bx + 36, 0, [[0, '#c42a2a'], [1, '#7a1414']]);
      polygon(near, [[bx, 47], [bx + 36, 47], [bx + 36, 118], [bx + 18, 106], [bx, 118]], near.fillStyle, -0.5);
      near.strokeStyle = '#e8c860'; near.lineWidth = 1; near.strokeRect(bx + 3, 51, 30, 52);
      drawText(near, name, bx + 18, 70, '#ffd84a', { align: 'center', shadowColor: '#3a0808' });
    });
    // Antorchas con llama y halo (la llama parpadea en directo).
    for (let x = 0; x < W; x += 128) {
      near.fillStyle = '#4a3220'; near.fillRect(x + 100, 128, 3, 18);
      near.fillStyle = '#6a625a'; near.fillRect(x + 97, 124, 9, 5);
    }
    haze(near, GY - 40, GY, '#05030a', 0, 0.55);
  },

  /** Taberna: paredes de madera, estantes de botellas, jamones colgando y lámparas cálidas. */
  taberna({ far, mid, near }, random) {
    far.fillStyle = linearGradient(far, 0, 0, 0, 240, [[0, '#24120a'], [1, '#4a2a16']]);
    far.fillRect(0, 0, W, 240);
    for (let x = 0; x < W; x += 16) {
      far.fillStyle = (x / 16) % 2 ? '#5a361c' : '#4e2e18';
      far.fillRect(x, 30, 15.4, 190);
      far.fillStyle = 'rgba(255,200,140,0.07)'; far.fillRect(x + 1, 30, 2, 190);
      far.strokeStyle = 'rgba(20,8,0,0.35)'; far.lineWidth = 0.4; far.beginPath(); far.moveTo(x + 6, 40); far.bezierCurveTo(x + 8, 90, x + 4, 140, x + 7, 210); far.stroke();
    }
    // Estantes con botellas de colores.
    for (let x = 6; x < W; x += 128) {
      wrapDraw(mid, x, 100, px => {
        for (const shelfY of [70, 100, 130]) {
          mid.fillStyle = '#2a1608'; mid.fillRect(px, shelfY, 96, 3);
          mid.fillStyle = 'rgba(255,255,255,0.15)'; mid.fillRect(px, shelfY, 96, 0.8);
          for (let bottle = 0; bottle < 12; bottle++) {
            const color = pick(['#2c9c3c', '#a8322c', '#e8b848', '#3a6ae0', '#ffffff'], random);
            const bx = px + 3 + bottle * 7.8;
            mid.fillStyle = color; roundedRect(mid, bx, shelfY - 14, 4.2, 14, 1.4); mid.fill();
            mid.fillRect(bx + 1.2, shelfY - 18, 1.8, 5);
            mid.fillStyle = 'rgba(255,255,255,0.45)'; mid.fillRect(bx + 0.7, shelfY - 12, 0.9, 9);
          }
        }
      });
    }
    // Jamones colgados y farolas.
    for (let x = 60; x < W; x += 96) {
      near.strokeStyle = '#2a1608'; near.lineWidth = 0.7; near.beginPath(); near.moveTo(x, 30); near.lineTo(x, 56); near.stroke();
      near.beginPath(); near.moveTo(x - 4, 56); near.quadraticCurveTo(x - 7, 70, x - 2, 80); near.quadraticCurveTo(x + 5, 84, x + 6, 66); near.quadraticCurveTo(x + 4, 54, x - 4, 56);
      near.fillStyle = linearGradient(near, x - 6, 56, x + 6, 84, [[0, '#d8545a'], [1, '#6a1218']]); near.fill(); strokeSoft(near, '#6a1218', 0.8, -0.5);
      near.fillStyle = '#ffe8d8'; near.beginPath(); near.ellipse(x - 1, 74, 1.6, 2.6, 0.3, 0, TAU); near.fill();
    }
    for (let x = 30; x < W; x += 128) {
      near.strokeStyle = '#2a1608'; near.lineWidth = 0.7; near.beginPath(); near.moveTo(x, 20); near.lineTo(x, 44); near.stroke();
      near.beginPath(); near.moveTo(x - 9, 56); near.lineTo(x + 9, 56); near.lineTo(x + 4, 44); near.lineTo(x - 4, 44); near.closePath();
      near.fillStyle = '#d83a2a'; near.fill(); strokeSoft(near, '#d83a2a', 0.8, -0.6);
      glow(near, x, 62, 56, '#ffc070', 0.7);
      near.fillStyle = '#fff2b0'; near.beginPath(); near.ellipse(x, 57, 5, 2, 0, 0, TAU); near.fill();
    }
    // Barra del fondo con taburetes.
    for (let x = 0; x < W; x += 128) {
      near.fillStyle = linearGradient(near, 0, GY - 34, 0, GY, [[0, '#7a4a28'], [1, '#3a2010']]); near.fillRect(x + 24, GY - 34, 80, 34);
      near.fillStyle = '#c8905a'; near.fillRect(x + 22, GY - 37, 84, 4);
      near.fillStyle = 'rgba(255,255,255,0.25)'; near.fillRect(x + 22, GY - 37, 84, 1);
    }
    haze(near, GY - 30, GY, '#1a0a04', 0, 0.45);
  },

  /** Bodega: arcos de piedra, hileras de toneles y faroles. */
  bodega({ far, mid, near }) {
    far.fillStyle = linearGradient(far, 0, 0, 0, 240, [[0, '#120818'], [1, '#2a1838']]);
    far.fillRect(0, 0, W, 240);
    for (let x = 0; x < W; x += 64) {
      far.fillStyle = '#1a0e24'; far.beginPath(); far.moveTo(x + 4, GY); far.lineTo(x + 4, 90); far.arc(x + 32, 90, 28, Math.PI, 0); far.lineTo(x + 60, GY); far.closePath(); far.fill();
      strokeSoft(far, '#5a4a70', 1, 0.1);
    }
    for (let x = 0; x < W; x += 80) {
      wrapDraw(mid, x, 76, px => {
        const barrel = (bx, by, scale) => {
          mid.fillStyle = linearGradient(mid, bx - 14 * scale, 0, bx + 14 * scale, 0, [[0, '#9a5a2a'], [0.5, '#c88040'], [1, '#5a3014']]);
          mid.beginPath(); mid.ellipse(bx, by, 14 * scale, 18 * scale, 0, 0, TAU); mid.fill(); strokeSoft(mid, '#5a3014', 1, -0.5);
          mid.strokeStyle = '#8a8e98'; mid.lineWidth = 1.2; for (const t of [-0.5, 0.5]) { mid.beginPath(); mid.ellipse(bx, by + t * 10 * scale, 14 * scale, 3 * scale, 0, 0, Math.PI); mid.stroke(); }
          mid.fillStyle = '#d8b060'; mid.beginPath(); mid.arc(bx, by + 4 * scale, 2.2 * scale, 0, TAU); mid.fill();
        };
        barrel(px + 20, GY - 20, 1); barrel(px + 52, GY - 20, 1); barrel(px + 36, GY - 52, 0.9);
      });
    }
    for (let x = 30; x < W; x += 128) {
      near.strokeStyle = '#2a2030'; near.lineWidth = 0.8; near.beginPath(); near.moveTo(x, 30); near.lineTo(x, 74); near.stroke();
      near.fillStyle = '#ffd070'; roundedRect(near, x - 5, 74, 10, 14, 3); near.fill(); strokeSoft(near, '#2a2030', 1, 0);
      glow(near, x, 82, 58, '#ffb050', 0.7);
    }
    haze(near, GY - 36, GY, '#0a0412', 0, 0.5);
  },

  /** Gruta de cristales: cuevas azules con cristales brillantes y setas luminosas. */
  gruta({ far, mid, near }, random) {
    far.fillStyle = linearGradient(far, 0, 0, 0, 240, [[0, '#02101a'], [1, '#0a3040']]);
    far.fillRect(0, 0, W, 240);
    for (let s = 0; s < 40; s++) { const x = random() * W; const y = random() * 190; far.fillStyle = 'rgba(160,255,240,0.5)'; far.beginPath(); far.arc(x, y, 0.5 + random() * 0.8, 0, TAU); far.fill(); }
    ridge(far, { baseY: 50, amplitude: 22, periods: 4, phase: 0.6, fill: '#06202c', bottom: 0 });
    const crystalColors = [['#7affea', '#1a8a9a'], ['#ff8aef', '#9a2a8a'], ['#8ab0ff', '#2a3aa8']];
    for (let x = 12; x < W; x += 54) {
      wrapDraw(mid, x, 40, px => {
        const [light, dark] = pick(crystalColors, random);
        for (let c = 0; c < 4; c++) {
          const cx = px + c * 7 + random() * 3; const h = 22 + random() * 30; const w = 6 + random() * 4; const lean = (random() - 0.5) * 6;
          polygon(mid, [[cx, GY], [cx + w, GY], [cx + w / 2 + lean, GY - h]], linearGradient(mid, cx, GY - h, cx + w, GY, [[0, light], [1, dark]]), -0.5);
          mid.fillStyle = 'rgba(255,255,255,0.4)'; mid.beginPath(); mid.moveTo(cx + w * 0.35, GY - h * 0.2); mid.lineTo(cx + w / 2 + lean, GY - h); mid.lineTo(cx + w * 0.5, GY - h * 0.2); mid.closePath(); mid.fill();
        }
        glow(mid, px + 14, GY - 24, 44, light, 0.5);
      });
    }
    // Estalactitas y setas luminosas.
    for (let x = 6; x < W; x += 22) {
      const h = 14 + random() * 36;
      polygon(near, [[x, 0], [x + 12, 0], [x + 6, h]], linearGradient(near, 0, 0, 0, h, [[0, '#0a2634'], [1, '#2a6a80']]), -0.5);
    }
    for (let x = 30; x < W; x += 90) {
      wrapDraw(near, x, 20, px => {
        near.fillStyle = '#e8f8ff'; near.fillRect(px + 4, GY - 12, 3, 12);
        near.fillStyle = linearGradient(near, 0, GY - 20, 0, GY - 10, [[0, '#7affea'], [1, '#1a8a9a']]); near.beginPath(); near.ellipse(px + 5.5, GY - 12, 9, 6, 0, Math.PI, 0); near.fill(); strokeSoft(near, '#1a8a9a', 0.8, -0.5);
        glow(near, px + 5.5, GY - 14, 34, '#7affea', 0.6);
      });
    }
    haze(near, GY - 30, GY, '#02141c', 0, 0.45);
  }
};

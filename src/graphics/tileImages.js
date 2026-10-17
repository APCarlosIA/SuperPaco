/**
 * @file Genera las imágenes de 16×16 píxeles de cada tipo de baldosa a partir
 * de los colores del tema (adoquines de Madrid, arena de Benidorm, albero de
 * Sevilla…). Se dibujan una vez por tema y luego solo se copian.
 */
import { TILE_SIZE, RENDER_SCALE } from '../config/constants.js';
import { createCanvas, fillRectangle } from '../core/canvas.js';
import { createSeededRandom } from '../core/math.js';
import { scale3x } from './hd.js';
import { drawText } from './font.js';

/* ------------------------------------------------------------------ */
/* Suelo (se pinta en alta resolución, en píxeles lógicos con decimales) */
/* ------------------------------------------------------------------ */

/** Crea una baldosa de alta resolución y deja pintar en coordenadas lógicas. */
function createHdTile(width, height, paint) {
  return createCanvas(width * RENDER_SCALE, height * RENDER_SCALE, context => {
    context.scale(RENDER_SCALE, RENDER_SCALE);
    context.imageSmoothingEnabled = true;
    paint(context);
  });
}

/** Rectángulo redondeado relleno con degradado de luz arriba-izquierda y contorno fino. */
function paintStone(context, x, y, width, height, radius, style, tone = 0) {
  context.beginPath();
  context.roundRect ? context.roundRect(x, y, width, height, radius) : context.rect(x, y, width, height);
  const gradient = context.createLinearGradient(x, y, x + width * 0.6, y + height);
  gradient.addColorStop(0, shiftHex(style.lightColor, tone));
  gradient.addColorStop(0.45, shiftHex(style.baseColor, tone));
  gradient.addColorStop(1, shiftHex(style.darkColor, tone));
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = style.mortarColor;
  context.lineWidth = 0.55;
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,0.26)';
  context.fillRect(x + radius * 0.6, y + 0.35, width - radius * 1.2, 0.55);
}

/** Aclara u oscurece un color #rrggbb (amount entre -1 y 1). */
function shiftHex(color, amount) {
  if (!amount) return color;
  const channels = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  const shifted = channels.map(value => Math.round(amount > 0 ? value + (255 - value) * amount : value * (1 + amount)));
  return `rgb(${shifted.join(',')})`;
}

/** Adoquines: piedras redondeadas de 8×8 desplazadas medio adoquín en cada hilera. */
function paintCobblestones(context, style, randomSource) {
  context.fillStyle = style.mortarColor;
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
    const horizontalOffset = courseIndex ? 4 : 0;
    for (let stoneIndex = -1; stoneIndex < 3; stoneIndex++) {
      const tone = (randomSource() - 0.5) * 0.14;
      paintStone(context, stoneIndex * 8 + horizontalOffset + 0.55, courseIndex * 8 + 0.55, 6.9, 6.9, 2.2, style, tone);
    }
  }
}

/** Sillares de piedra con juntas, grietas y motas. */
function paintStoneBlocks(context, style, randomSource) {
  context.fillStyle = style.mortarColor;
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  const blocks = [[0, 0, 11, 7.4], [11, 0, 5, 7.4], [0, 8, 4, 7.4], [4, 8, 12, 7.4]];
  for (const [x, y, width, height] of blocks) paintStone(context, x + 0.3, y + 0.3, width - 0.6, height - 0.3, 1.2, style, (randomSource() - 0.5) * 0.12);
  context.strokeStyle = 'rgba(0,0,0,0.22)';
  context.lineWidth = 0.35;
  for (let crack = 0; crack < 2; crack++) {
    const x = 2 + randomSource() * 12;
    const y = 1 + randomSource() * 13;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 1.2, y + 1.4); context.lineTo(x + 0.4, y + 2.6); context.stroke();
  }
  context.fillStyle = 'rgba(0,0,0,0.18)';
  for (let speck = 0; speck < 6; speck++) context.fillRect(randomSource() * 15.5, randomSource() * 15.5, 0.5, 0.5);
}

/** Baldosas de andén biseladas con desgaste. */
function paintFloorTiles(context, style, randomSource) {
  context.fillStyle = style.mortarColor;
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      const color = (column + row) % 2 ? style.baseColor : style.darkColor;
      const x = column * 8 + 0.4;
      const y = row * 8 + 0.4;
      context.fillStyle = color;
      context.fillRect(x, y, 7.2, 7.2);
      context.fillStyle = style.lightColor;
      context.globalAlpha = 0.55; context.fillRect(x, y, 7.2, 0.7); context.fillRect(x, y, 0.7, 7.2);
      context.globalAlpha = 1;
      context.fillStyle = 'rgba(0,0,0,0.3)'; context.fillRect(x, y + 6.5, 7.2, 0.7); context.fillRect(x + 6.5, y, 0.7, 7.2);
      context.fillStyle = 'rgba(255,255,255,0.08)';
      for (let scuff = 0; scuff < 3; scuff++) context.fillRect(x + 1 + randomSource() * 4.5, y + 1 + randomSource() * 4.5, 1.2, 0.4);
    }
  }
}

/** Tierra o arena con degradado, guijarros y vetas. */
function paintSpeckledGround(context, style, randomSource) {
  const gradient = context.createLinearGradient(0, 0, 0, TILE_SIZE);
  gradient.addColorStop(0, shiftHex(style.baseColor, 0.06));
  gradient.addColorStop(1, shiftHex(style.baseColor, -0.1));
  context.fillStyle = gradient;
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  context.strokeStyle = style.darkColor;
  context.globalAlpha = 0.35;
  context.lineWidth = 0.5;
  for (let strata = 0; strata < 2; strata++) {
    const y = 5 + strata * 6;
    context.beginPath(); context.moveTo(0, y);
    context.bezierCurveTo(5, y - 1.2, 10, y + 1.4, 16, y); context.stroke();
  }
  context.globalAlpha = 1;
  for (let pebble = 0; pebble < 9; pebble++) {
    const x = randomSource() * 15;
    const y = randomSource() * 15;
    const size = 0.5 + randomSource() * 0.9;
    context.fillStyle = pebble % 3 ? style.darkColor : style.lightColor;
    context.beginPath(); context.ellipse(x + 0.5, y + 0.5, size, size * 0.7, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = 'rgba(255,255,255,0.3)';
    context.beginPath(); context.ellipse(x + 0.3, y + 0.25, size * 0.4, size * 0.25, 0, 0, Math.PI * 2); context.fill();
  }
}

const GROUND_PATTERN_PAINTERS = {
  cobblestone: paintCobblestones,
  stoneBlocks: paintStoneBlocks,
  floorTiles: paintFloorTiles,
  speckled: paintSpeckledGround
};

/** Banda superior con borde festoneado (hierba, arena…). */
function paintTopBand(context, thickness, topColor, bottomColor, edgeColor, scallops = 8) {
  const gradient = context.createLinearGradient(0, 0, 0, thickness + 1.5);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(TILE_SIZE, 0);
  context.lineTo(TILE_SIZE, thickness);
  const step = TILE_SIZE / scallops;
  for (let index = scallops; index > 0; index--) context.quadraticCurveTo(index * step - step / 2, thickness + 1.6, (index - 1) * step, thickness);
  context.closePath();
  context.fill();
  context.strokeStyle = edgeColor;
  context.lineWidth = 0.5;
  context.beginPath();
  context.moveTo(0, thickness);
  for (let index = 0; index < scallops; index++) context.quadraticCurveTo(index * step + step / 2, thickness + 1.6, (index + 1) * step, thickness);
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,0.35)';
  context.fillRect(0, 0, TILE_SIZE, 0.7);
}

/** Capa superior de la baldosa de suelo que queda al aire (hierba, arena…). */
const GROUND_TOP_LAYER_PAINTERS = {
  grass(context) { paintTopBand(context, 3.6, '#7fe05a', '#2f9a3a', '#1b6a2a', 8); },
  sand(context, style) { paintTopBand(context, 2.6, shiftHex(style.lightColor, 0.2), style.lightColor, style.darkColor, 4); },
  albero(context, style) { paintTopBand(context, 2.4, shiftHex(style.lightColor, 0.2), style.lightColor, style.darkColor, 5); },
  dryGrass(context) { paintTopBand(context, 3.2, '#e0c068', '#a88a40', '#6a5420', 8); },
  rock(context, style) { paintTopBand(context, 2.4, shiftHex(style.lightColor, 0.25), style.lightColor, style.mortarColor, 3); },
  plain(context, style) {
    context.fillStyle = shiftHex(style.lightColor, 0.2);
    context.fillRect(0, 0, TILE_SIZE, 1);
  }
};

/**
 * Crea una baldosa de suelo en alta resolución.
 * @param {import('../world/themes.js').GroundStyle} style
 * @param {boolean} isSurface true si es la baldosa de arriba (la que se pisa).
 * @returns {HTMLCanvasElement}
 */
function createGroundTile(style, isSurface) {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    const randomSource = createSeededRandom(style.baseColor.length * 97 + (isSurface ? 13 : 0));
    GROUND_PATTERN_PAINTERS[style.pattern](context, style, randomSource);
    if (isSurface) GROUND_TOP_LAYER_PAINTERS[style.topLayer || 'plain'](context, style);
  });
}

/* ------------------------------------------------------------------ */
/* Bloques (alta resolución)                                           */
/* ------------------------------------------------------------------ */

/** Borde oscuro y biselado de luz que da aspecto de bloque sólido. */
function paintBlockFrame(context, borderColor, radius = 1.4) {
  context.strokeStyle = borderColor;
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect ? context.roundRect(0.5, 0.5, 15, 15, radius) : context.rect(0.5, 0.5, 15, 15);
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,0.32)';
  context.fillRect(1.2, 1.2, 13.6, 0.8);
  context.fillRect(1.2, 1.2, 0.8, 13.6);
  context.fillStyle = 'rgba(10,4,30,0.3)';
  context.fillRect(1.2, 14, 13.6, 0.8);
  context.fillRect(14, 1.2, 0.8, 13.6);
}

/** Remache redondo con brillo. */
function paintRivet(context, x, y, color) {
  context.fillStyle = color;
  context.beginPath(); context.arc(x, y, 0.95, 0, Math.PI * 2); context.fill();
  context.fillStyle = 'rgba(255,255,255,0.6)';
  context.beginPath(); context.arc(x - 0.25, y - 0.3, 0.35, 0, Math.PI * 2); context.fill();
}

/** Ladrillo rompible: hileras de ladrillos redondeados con juntas. */
function createBrickTile(colors) {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    context.fillStyle = colors.mortar;
    context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    const rows = [[[0, 7.6], [8, 7.6]], [[0, 3.4], [4, 7.4], [12, 4]]];
    rows.forEach((bricks, rowIndex) => {
      const y = rowIndex * 8 + 0.4;
      for (const [x, width] of bricks) {
        const gradient = context.createLinearGradient(x, y, x + width * 0.5, y + 7);
        gradient.addColorStop(0, colors.highlight);
        gradient.addColorStop(0.35, colors.base);
        gradient.addColorStop(1, shiftHex(colors.base, -0.28));
        context.fillStyle = gradient;
        context.beginPath();
        context.roundRect ? context.roundRect(x + 0.2, y, width - 0.4, 7.2, 1) : context.rect(x + 0.2, y, width - 0.4, 7.2);
        context.fill();
        context.fillStyle = 'rgba(255,255,255,0.3)';
        context.fillRect(x + 0.8, y + 0.3, width - 1.6, 0.55);
      }
    });
    paintBlockFrame(context, shiftHex(colors.mortar, -0.4), 1);
  });
}

/** Colores del brillo animado de los signos "¿?" en cada fotograma. */
const QUESTION_GLYPH_SHIMMER = ['#ffffff', '#fff2b8', '#ffd870', '#fff2b8'];

/** Bloque "¿?" con premio, en uno de sus fotogramas de brillo. */
function createQuestionBlockTile(frameIndex) {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    const gradient = context.createLinearGradient(0, 0, 0, 16);
    gradient.addColorStop(0, '#ffe27a');
    gradient.addColorStop(0.5, '#ffb52e');
    gradient.addColorStop(1, '#e8781a');
    context.fillStyle = gradient;
    context.beginPath();
    context.roundRect ? context.roundRect(0, 0, 16, 16, 1.8) : context.rect(0, 0, 16, 16);
    context.fill();
    // Destello que recorre el bloque.
    const sweep = -6 + frameIndex * 7;
    const shine = context.createLinearGradient(sweep, 0, sweep + 6, 6);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = shine;
    context.fillRect(0, 0, 16, 16);
    paintBlockFrame(context, '#7a3208', 1.8);
    for (const [x, y] of [[2.6, 2.6], [13.4, 2.6], [2.6, 13.4], [13.4, 13.4]]) paintRivet(context, x, y, '#b85a10');
    drawText(context, '¿?', 2.5, 4.4, QUESTION_GLYPH_SHIMMER[frameIndex], { outlineColor: '#7a3208', outlineWidth: 1 });
  });
}

/** Bloque ya golpeado (vacío). */
function createUsedBlockTile() {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    const gradient = context.createLinearGradient(0, 0, 0, 16);
    gradient.addColorStop(0, '#c89060');
    gradient.addColorStop(1, '#8a5a30');
    context.fillStyle = gradient;
    context.beginPath();
    context.roundRect ? context.roundRect(0, 0, 16, 16, 1.8) : context.rect(0, 0, 16, 16);
    context.fill();
    paintBlockFrame(context, '#4a2810', 1.8);
    for (const [x, y] of [[2.6, 2.6], [13.4, 2.6], [2.6, 13.4], [13.4, 13.4]]) paintRivet(context, x, y, '#6a4020');
    context.fillStyle = 'rgba(0,0,0,0.15)';
    context.beginPath(); context.roundRect ? context.roundRect(4.5, 4.5, 7, 7, 1.2) : context.rect(4.5, 4.5, 7, 7); context.fill();
  });
}

/** Azulejo de estilo talaverano: blanco con rombo azul y esquinas amarillas. */
function createAzulejoTile() {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    const blue = '#2c58c8';
    const yellow = '#fcc830';
    context.fillStyle = '#f7f3e8';
    context.fillRect(0, 0, 16, 16);
    context.strokeStyle = '#1c3c9c';
    context.lineWidth = 1;
    context.strokeRect(0.5, 0.5, 15, 15);
    context.fillStyle = blue;
    context.beginPath(); context.moveTo(8, 2.6); context.lineTo(13.4, 8); context.lineTo(8, 13.4); context.lineTo(2.6, 8); context.closePath(); context.fill();
    context.fillStyle = '#f7f3e8';
    context.beginPath(); context.moveTo(8, 4.6); context.lineTo(11.4, 8); context.lineTo(8, 11.4); context.lineTo(4.6, 8); context.closePath(); context.fill();
    context.fillStyle = yellow;
    context.beginPath(); context.arc(8, 8, 1.6, 0, Math.PI * 2); context.fill();
    for (const [x, y] of [[2.4, 2.4], [13.6, 2.4], [2.4, 13.6], [13.6, 13.6]]) {
      context.fillStyle = yellow; context.beginPath(); context.arc(x, y, 1.5, 0, Math.PI * 2); context.fill();
      context.fillStyle = blue; context.beginPath(); context.arc(x, y, 0.55, 0, Math.PI * 2); context.fill();
    }
    context.fillStyle = 'rgba(255,255,255,0.5)';
    context.fillRect(1.2, 1.2, 13.6, 0.6);
  });
}

/**
 * Tonel de vino de 2 baldosas de ancho. Se dibuja entero (32 px) y se corta en
 * mitades izquierda y derecha.
 */
function createBarrelTiles() {
  const staveColors = ['#a8642c', '#c07838', '#9c5c28', '#b86c30'];
  const body = createCanvas(32, 16, context => {
    for (let x = 0; x < 32; x += 4) fillRectangle(context, x, 0, 4, 16, staveColors[(x / 4) % 4]);
    fillRectangle(context, 0, 0, 2, 16, '#4c2408');
    fillRectangle(context, 30, 0, 2, 16, '#4c2408');
    fillRectangle(context, 4, 0, 1, 16, '#dc9c58');
    // Aros metálicos.
    for (const hoopY of [3, 11]) {
      fillRectangle(context, 0, hoopY, 32, 2, '#8c9098');
      fillRectangle(context, 0, hoopY, 32, 1, '#c8ccd4');
    }
  });
  const top = createCanvas(32, 16, context => {
    context.drawImage(body, 0, 0);
    fillRectangle(context, 0, 0, 32, 6, '#4c2408');
    fillRectangle(context, 1, 1, 30, 4, '#6c3814');
    fillRectangle(context, 3, 2, 26, 2, '#8c4c1c');
    fillRectangle(context, 0, 6, 32, 2, '#8c9098');
    fillRectangle(context, 0, 6, 32, 1, '#c8ccd4');
  });
  const cutHalf = (source, sourceX) => createCanvas(TILE_SIZE, TILE_SIZE, context => {
    context.drawImage(source, sourceX, 0, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
  });
  return { topLeft: cutHalf(top, 0), topRight: cutHalf(top, 16), bodyLeft: cutHalf(body, 0), bodyRight: cutHalf(body, 16) };
}

/** Plataforma de un solo sentido: balcón, toldo o tablón según el tema (alta resolución). */
function createOneWayPlatformTile(style) {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    if (style.kind === 'balcony') {
      const slab = context.createLinearGradient(0, 0, 0, 4.6);
      slab.addColorStop(0, '#ffffff');
      slab.addColorStop(1, style.primaryColor);
      context.fillStyle = slab;
      context.beginPath(); context.roundRect ? context.roundRect(0, 0, 16, 4.6, 1) : context.rect(0, 0, 16, 4.6); context.fill();
      context.strokeStyle = style.edgeColor; context.lineWidth = 0.7;
      context.beginPath(); context.roundRect ? context.roundRect(0.35, 0.35, 15.3, 4, 1) : context.rect(0.35, 0.35, 15.3, 4); context.stroke();
      context.fillStyle = style.secondaryColor;
      for (const x of [2.5, 10.5]) { context.beginPath(); context.moveTo(x, 4.8); context.lineTo(x + 3, 4.8); context.lineTo(x + 1.5, 10.5); context.closePath(); context.fill(); }
    } else if (style.kind === 'awning') {
      for (let x = 0; x < 16; x += 4) {
        context.fillStyle = (x / 4) % 2 ? style.secondaryColor : style.primaryColor;
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 4, 0); context.lineTo(x + 4, 5.4); context.quadraticCurveTo(x + 2, 8.2, x, 5.4); context.closePath(); context.fill();
      }
      context.fillStyle = 'rgba(255,255,255,0.35)'; context.fillRect(0, 0, 16, 0.8);
      context.strokeStyle = style.edgeColor; context.lineWidth = 0.6; context.strokeRect(0.3, 0.3, 15.4, 5);
    } else {
      const wood = context.createLinearGradient(0, 0, 0, 5.6);
      wood.addColorStop(0, shiftHex(style.primaryColor, 0.2));
      wood.addColorStop(1, shiftHex(style.primaryColor, -0.2));
      context.fillStyle = wood;
      context.beginPath(); context.roundRect ? context.roundRect(0, 0, 16, 5.6, 1) : context.rect(0, 0, 16, 5.6); context.fill();
      context.strokeStyle = style.secondaryColor; context.lineWidth = 0.35; context.globalAlpha = 0.6;
      for (const y of [1.6, 3.2]) { context.beginPath(); context.moveTo(0.5, y); context.bezierCurveTo(5, y - 0.5, 10, y + 0.6, 15.5, y); context.stroke(); }
      context.globalAlpha = 1;
      context.strokeStyle = style.edgeColor; context.lineWidth = 0.7;
      context.beginPath(); context.roundRect ? context.roundRect(0.35, 0.35, 15.3, 4.9, 1) : context.rect(0.35, 0.35, 15.3, 4.9); context.stroke();
      for (const x of [2, 14]) { context.fillStyle = style.edgeColor; context.beginPath(); context.arc(x, 2.8, 0.55, 0, Math.PI * 2); context.fill(); }
    }
  });
}

/** Puente de madera del castillo. */
function createBridgeTile() {
  return createHdTile(TILE_SIZE, TILE_SIZE, context => {
    for (const x of [0, 8]) {
      const gradient = context.createLinearGradient(0, 0, 0, 6);
      gradient.addColorStop(0, '#d49a58');
      gradient.addColorStop(1, '#8a5a28');
      context.fillStyle = gradient;
      context.beginPath(); context.roundRect ? context.roundRect(x + 0.2, 0, 7.6, 6, 1) : context.rect(x + 0.2, 0, 7.6, 6); context.fill();
      context.strokeStyle = '#3a2008'; context.lineWidth = 0.6;
      context.beginPath(); context.roundRect ? context.roundRect(x + 0.5, 0.3, 7, 5.4, 1) : context.rect(x + 0.5, 0.3, 7, 5.4); context.stroke();
      context.fillStyle = '#3a2008'; context.beginPath(); context.arc(x + 1.6, 3, 0.5, 0, Math.PI * 2); context.arc(x + 6.4, 3, 0.5, 0, Math.PI * 2); context.fill();
    }
    context.fillStyle = '#3a2008';
    context.fillRect(3, 6, 2, 3.4);
    context.fillRect(11, 6, 2, 3.4);
    context.fillStyle = 'rgba(255,255,255,0.3)'; context.fillRect(0, 0, 16, 0.7);
  });
}

/**
 * @typedef {Object} TileImages
 * @property {HTMLCanvasElement} groundSurface Suelo con su capa superior.
 * @property {HTMLCanvasElement} groundFill Suelo interior.
 * @property {HTMLCanvasElement} brick
 * @property {HTMLCanvasElement[]} questionBlockFrames
 * @property {HTMLCanvasElement} usedBlock
 * @property {HTMLCanvasElement} azulejo
 * @property {{topLeft:HTMLCanvasElement, topRight:HTMLCanvasElement, bodyLeft:HTMLCanvasElement, bodyRight:HTMLCanvasElement}} barrel
 * @property {HTMLCanvasElement} oneWayPlatform
 * @property {HTMLCanvasElement} bridge
 */

/**
 * Convierte una baldosa pixelada en su versión de alta resolución:
 * ampliación suavizada y, para los bloques, un biselado de luz y sombra.
 * @param {HTMLCanvasElement} tile
 * @param {{bevel?: boolean, depthShade?: number}} [options]
 * @returns {HTMLCanvasElement} Imagen de 3× el tamaño.
 */
function toHdTile(tile, { bevel = false, depthShade = 0 } = {}) {
  const big = scale3x(tile);
  const context = big.getContext('2d');
  context.globalCompositeOperation = 'source-atop';
  if (depthShade) {
    const gradient = context.createLinearGradient(0, 0, 0, big.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(12, 6, 36, ${depthShade})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, big.width, big.height);
  }
  if (bevel) {
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(0, 0, big.width, 2);
    context.fillRect(0, 0, 2, big.height);
    context.fillStyle = 'rgba(10, 4, 30, 0.38)';
    context.fillRect(0, big.height - 2, big.width, 2);
    context.fillRect(big.width - 2, 0, 2, big.height);
  }
  context.globalCompositeOperation = 'source-over';
  return big;
}

/**
 * Genera todas las imágenes de baldosas de un tema, en alta resolución.
 * @param {import('../world/themes.js').Theme} theme
 * @returns {TileImages}
 */
export function createTileImages(theme) {
  const barrel = createBarrelTiles();
  return {
    groundSurface: createGroundTile(theme.ground, true),
    groundFill: createGroundTile(theme.ground, false),
    brick: createBrickTile(theme.brickColors),
    questionBlockFrames: [0, 1, 2, 3].map(createQuestionBlockTile),
    usedBlock: createUsedBlockTile(),
    azulejo: createAzulejoTile(),
    barrel: {
      topLeft: toHdTile(barrel.topLeft), topRight: toHdTile(barrel.topRight),
      bodyLeft: toHdTile(barrel.bodyLeft), bodyRight: toHdTile(barrel.bodyRight)
    },
    oneWayPlatform: createOneWayPlatformTile(theme.oneWayPlatform),
    bridge: createBridgeTile()
  };
}

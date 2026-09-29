/**
 * @file Genera las imágenes de 16×16 píxeles de cada tipo de baldosa a partir
 * de los colores del tema (adoquines de Madrid, arena de Benidorm, albero de
 * Sevilla…). Se dibujan una vez por tema y luego solo se copian.
 */
import { TILE_SIZE } from '../config/constants.js';
import { createCanvas, fillRectangle, fillTriangle } from '../core/canvas.js';
import { createSeededRandom } from '../core/math.js';

/** Número de fotogramas de las animaciones de bloques, lava y agua. */
export const TILE_ANIMATION_FRAMES = 4;

/* ------------------------------------------------------------------ */
/* Suelo                                                               */
/* ------------------------------------------------------------------ */

/** Adoquines: piedras de 8×8 desplazadas medio adoquín en cada hilera. */
function paintCobblestones(context, style) {
  fillRectangle(context, 0, 0, TILE_SIZE, TILE_SIZE, style.mortarColor);
  for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
    const horizontalOffset = courseIndex ? 4 : 0;
    for (let stoneIndex = -1; stoneIndex < 3; stoneIndex++) {
      const left = stoneIndex * 8 + horizontalOffset;
      const top = courseIndex * 8;
      fillRectangle(context, left + 1, top + 1, 6, 6, style.baseColor);
      fillRectangle(context, left + 1, top + 1, 5, 1, style.lightColor);
      fillRectangle(context, left + 1, top + 1, 1, 5, style.lightColor);
      fillRectangle(context, left + 2, top + 6, 5, 1, style.darkColor);
      fillRectangle(context, left + 6, top + 2, 1, 5, style.darkColor);
    }
  }
}

/** Sillares de piedra de 16×8 con juntas y alguna mancha. */
function paintStoneBlocks(context, style, randomSource) {
  fillRectangle(context, 0, 0, 16, 16, style.baseColor);
  fillRectangle(context, 0, 7, 16, 1, style.mortarColor);
  fillRectangle(context, 0, 15, 16, 1, style.mortarColor);
  fillRectangle(context, 11, 0, 1, 7, style.mortarColor);
  fillRectangle(context, 4, 8, 1, 7, style.mortarColor);
  fillRectangle(context, 0, 0, 11, 1, style.lightColor);
  fillRectangle(context, 12, 0, 4, 1, style.lightColor);
  fillRectangle(context, 0, 8, 4, 1, style.lightColor);
  fillRectangle(context, 5, 8, 11, 1, style.lightColor);
  for (let speck = 0; speck < 5; speck++) {
    fillRectangle(context, Math.floor(randomSource() * 16), Math.floor(randomSource() * 16), 1, 1, style.darkColor);
  }
}

/** Baldosas de andén: cuadros de 8×8 alternando dos tonos. */
function paintFloorTiles(context, style) {
  fillRectangle(context, 0, 0, 16, 16, style.mortarColor);
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      fillRectangle(context, column * 8, row * 8, 7, 7, (column + row) % 2 ? style.baseColor : style.darkColor);
      fillRectangle(context, column * 8, row * 8, 7, 1, style.lightColor);
    }
  }
}

/** Tierra o arena moteada con puntos claros y oscuros. */
function paintSpeckledGround(context, style, randomSource) {
  fillRectangle(context, 0, 0, 16, 16, style.baseColor);
  for (let speck = 0; speck < 14; speck++) {
    fillRectangle(context, Math.floor(randomSource() * 16), Math.floor(randomSource() * 16), 1, 1, speck % 2 ? style.darkColor : style.lightColor);
  }
  for (let pebble = 0; pebble < 3; pebble++) {
    fillRectangle(context, Math.floor(randomSource() * 14), Math.floor(randomSource() * 15), 2, 1, style.mortarColor);
  }
}

const GROUND_PATTERN_PAINTERS = {
  cobblestone: paintCobblestones,
  stoneBlocks: paintStoneBlocks,
  floorTiles: paintFloorTiles,
  speckled: paintSpeckledGround
};

/** Capa superior de la baldosa de suelo que queda al aire (hierba, arena…). */
const GROUND_TOP_LAYER_PAINTERS = {
  grass(context) {
    fillRectangle(context, 0, 0, 16, 4, '#3ca83c');
    fillRectangle(context, 0, 0, 16, 1, '#7cd85c');
    for (let x = 0; x < 16; x += 2) fillRectangle(context, x, 4, 1, x % 4 === 0 ? 2 : 1, '#3ca83c');
  },
  sand(context, style) {
    fillRectangle(context, 0, 0, 16, 3, style.lightColor);
    fillRectangle(context, 3, 1, 1, 1, style.darkColor);
    fillRectangle(context, 11, 2, 1, 1, style.darkColor);
  },
  albero(context, style) {
    fillRectangle(context, 0, 0, 16, 2, style.lightColor);
    fillRectangle(context, 0, 2, 16, 1, style.baseColor);
  },
  dryGrass(context) {
    fillRectangle(context, 0, 0, 16, 2, '#b89850');
    for (let x = 1; x < 16; x += 3) fillRectangle(context, x, 2, 1, 2, '#b89850');
  },
  rock(context, style) {
    fillRectangle(context, 0, 0, 16, 2, style.lightColor);
    fillRectangle(context, 5, 2, 3, 1, style.lightColor);
  },
  plain(context, style) {
    fillRectangle(context, 0, 0, 16, 1, style.lightColor);
  }
};

/**
 * Crea una baldosa de suelo.
 * @param {import('../world/themes.js').GroundStyle} style
 * @param {boolean} isSurface true si es la baldosa de arriba (la que se pisa).
 * @returns {HTMLCanvasElement}
 */
function createGroundTile(style, isSurface) {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    const randomSource = createSeededRandom(style.baseColor.length * 97 + (isSurface ? 13 : 0));
    GROUND_PATTERN_PAINTERS[style.pattern](context, style, randomSource);
    if (isSurface) GROUND_TOP_LAYER_PAINTERS[style.topLayer || 'plain'](context, style);
  });
}

/* ------------------------------------------------------------------ */
/* Bloques                                                             */
/* ------------------------------------------------------------------ */

/** Ladrillo rompible: dos hileras con juntas desplazadas. */
function createBrickTile(colors) {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    fillRectangle(context, 0, 0, 16, 16, colors.base);
    fillRectangle(context, 0, 0, 16, 1, colors.highlight);
    fillRectangle(context, 0, 7, 16, 1, colors.mortar);
    fillRectangle(context, 0, 15, 16, 1, colors.mortar);
    fillRectangle(context, 7, 0, 1, 7, colors.mortar);
    fillRectangle(context, 15, 0, 1, 7, colors.mortar);
    fillRectangle(context, 3, 8, 1, 7, colors.mortar);
    fillRectangle(context, 11, 8, 1, 7, colors.mortar);
    fillRectangle(context, 0, 8, 3, 1, colors.highlight);
    fillRectangle(context, 4, 8, 7, 1, colors.highlight);
    fillRectangle(context, 12, 8, 4, 1, colors.highlight);
  });
}

/** Dibujo 4×7 del signo de interrogación de cierre "?". */
const QUESTION_MARK_PIXELS = ['.XX.', 'X..X', '...X', '..X.', '.X..', '....', '.X..'];
/** Dibujo 4×7 del signo de interrogación de apertura "¿" (muy español). */
const INVERTED_QUESTION_MARK_PIXELS = ['..X.', '....', '..X.', '.X..', 'X...', 'X..X', '.XX.'];
/** Colores del brillo animado de los signos "¿?" en cada fotograma. */
const QUESTION_GLYPH_SHIMMER = ['#fcfcfc', '#fce8a0', '#fcc860', '#fce8a0'];

/** Pinta un dibujo de 'X' y '.' en una posición. */
function paintPixelPattern(context, pattern, left, top, color) {
  pattern.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column++) {
      if (row[column] === 'X') fillRectangle(context, left + column, top + rowIndex, 1, 1, color);
    }
  });
}

/** Remaches en las cuatro esquinas de un bloque. */
function paintCornerRivets(context, color) {
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) fillRectangle(context, x, y, 1, 1, color);
}

/** Bloque "¿?" con premio, en uno de sus fotogramas de brillo. */
function createQuestionBlockTile(frameIndex) {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    const outline = '#7c3000';
    fillRectangle(context, 0, 0, 16, 16, outline);
    fillRectangle(context, 1, 1, 14, 14, '#fc9c38');
    fillRectangle(context, 1, 1, 14, 1, '#fcc878');
    paintCornerRivets(context, outline);
    // Sombra de los signos y después los signos con su brillo.
    paintPixelPattern(context, INVERTED_QUESTION_MARK_PIXELS, 3, 5, outline);
    paintPixelPattern(context, QUESTION_MARK_PIXELS, 9, 5, outline);
    paintPixelPattern(context, INVERTED_QUESTION_MARK_PIXELS, 2, 4, QUESTION_GLYPH_SHIMMER[frameIndex]);
    paintPixelPattern(context, QUESTION_MARK_PIXELS, 8, 4, QUESTION_GLYPH_SHIMMER[frameIndex]);
  });
}

/** Bloque ya golpeado (vacío). */
function createUsedBlockTile() {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    fillRectangle(context, 0, 0, 16, 16, '#4c2408');
    fillRectangle(context, 1, 1, 14, 14, '#9c5c2c');
    fillRectangle(context, 1, 1, 14, 1, '#bc7c44');
    paintCornerRivets(context, '#4c2408');
  });
}

/** Azulejo de estilo talaverano: blanco con rombo azul y esquinas amarillas. */
function createAzulejoTile() {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    const blue = '#2c58c8';
    const yellow = '#fcc830';
    fillRectangle(context, 0, 0, 16, 16, '#f4f0e4');
    fillRectangle(context, 0, 0, 16, 1, '#1c3c9c');
    fillRectangle(context, 0, 15, 16, 1, '#1c3c9c');
    fillRectangle(context, 0, 0, 1, 16, '#1c3c9c');
    fillRectangle(context, 15, 0, 1, 16, '#1c3c9c');
    for (let step = 0; step < 4; step++) {
      fillRectangle(context, 7 - step, 4 + step, 2 + step * 2, 1, blue);
      fillRectangle(context, 7 - step, 11 - step, 2 + step * 2, 1, blue);
    }
    fillRectangle(context, 7, 7, 2, 2, yellow);
    for (const [x, y] of [[1, 1], [12, 1], [1, 12], [12, 12]]) {
      fillRectangle(context, x, y, 3, 3, yellow);
      fillRectangle(context, x + 1, y + 1, 1, 1, blue);
    }
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

/** Plataforma de un solo sentido: balcón, toldo o tablón según el tema. */
function createOneWayPlatformTile(style) {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    if (style.kind === 'balcony') {
      fillRectangle(context, 0, 0, 16, 4, style.primaryColor);
      fillRectangle(context, 0, 0, 16, 1, '#fcfcfc');
      fillRectangle(context, 0, 4, 16, 1, style.secondaryColor);
      fillTriangle(context, 2, 10, 4, 5, style.secondaryColor);
      fillTriangle(context, 10, 10, 4, 5, style.secondaryColor);
    } else if (style.kind === 'awning') {
      for (let x = 0; x < 16; x += 4) fillRectangle(context, x, 0, 4, 6, (x / 4) % 2 ? style.secondaryColor : style.primaryColor);
      fillRectangle(context, 0, 0, 16, 1, style.edgeColor);
      // Flecos del toldo.
      for (let x = 0; x < 16; x += 4) fillRectangle(context, x + 1, 6, 2, 2, (x / 4) % 2 ? style.secondaryColor : style.primaryColor);
    } else {
      fillRectangle(context, 0, 0, 16, 5, style.primaryColor);
      fillRectangle(context, 0, 1, 16, 1, style.secondaryColor);
      fillRectangle(context, 0, 5, 16, 1, style.edgeColor);
      fillRectangle(context, 2, 2, 1, 1, style.edgeColor);
      fillRectangle(context, 13, 2, 1, 1, style.edgeColor);
    }
  });
}

/**
 * Crea los fotogramas animados de un líquido (lava o agua).
 * Cada fotograma tiene una baldosa de superficie (con olas) y otra de profundidad.
 * @returns {{surface: HTMLCanvasElement, depth: HTMLCanvasElement}[]}
 */
function createLiquidFrames({ surfaceColor, deepColor, waveColor, sparkleColor, waveBaseline }) {
  const frames = [];
  for (let frame = 0; frame < TILE_ANIMATION_FRAMES; frame++) {
    const surface = createCanvas(TILE_SIZE, TILE_SIZE, context => {
      fillRectangle(context, 0, waveBaseline, 16, 16 - waveBaseline, surfaceColor);
      fillRectangle(context, 0, 9, 16, 7, deepColor);
      for (let x = 0; x < 16; x++) {
        const waveHeight = Math.round(1.5 + Math.sin((x + frame * 4) / 16 * Math.PI * 2) * 1.5);
        fillRectangle(context, x, waveBaseline - waveHeight, 1, waveHeight + 1, waveColor);
      }
      fillRectangle(context, (frame * 5) % 16, 11, 3, 1, sparkleColor);
    });
    const depth = createCanvas(TILE_SIZE, TILE_SIZE, context => {
      fillRectangle(context, 0, 0, 16, 16, deepColor);
      fillRectangle(context, (frame * 3) % 16, 4, 3, 1, surfaceColor);
      fillRectangle(context, (frame * 3 + 9) % 16, 10, 3, 1, surfaceColor);
    });
    frames.push({ surface, depth });
  }
  return frames;
}

/** Puente de madera del castillo. */
function createBridgeTile() {
  return createCanvas(TILE_SIZE, TILE_SIZE, context => {
    fillRectangle(context, 0, 0, 16, 6, '#a06c30');
    fillRectangle(context, 0, 0, 16, 1, '#d8a060');
    fillRectangle(context, 0, 5, 16, 1, '#4c2c10');
    fillRectangle(context, 7, 0, 1, 6, '#4c2c10');
    fillRectangle(context, 15, 0, 1, 6, '#4c2c10');
    fillRectangle(context, 3, 6, 2, 3, '#4c2c10');
    fillRectangle(context, 11, 6, 2, 3, '#4c2c10');
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
 * @property {{surface:HTMLCanvasElement, depth:HTMLCanvasElement}[]} lavaFrames
 * @property {{surface:HTMLCanvasElement, depth:HTMLCanvasElement}[]} waterFrames
 * @property {HTMLCanvasElement} bridge
 */

/**
 * Genera todas las imágenes de baldosas de un tema.
 * @param {import('../world/themes.js').Theme} theme
 * @returns {TileImages}
 */
export function createTileImages(theme) {
  return {
    groundSurface: createGroundTile(theme.ground, true),
    groundFill: createGroundTile(theme.ground, false),
    brick: createBrickTile(theme.brickColors),
    questionBlockFrames: [0, 1, 2, 3].map(createQuestionBlockTile),
    usedBlock: createUsedBlockTile(),
    azulejo: createAzulejoTile(),
    barrel: createBarrelTiles(),
    oneWayPlatform: createOneWayPlatformTile(theme.oneWayPlatform),
    lavaFrames: createLiquidFrames({ surfaceColor: '#e83c00', deepColor: '#c02000', waveColor: '#fc9c00', sparkleColor: '#fc7c00', waveBaseline: 4 }),
    waterFrames: createLiquidFrames({ surfaceColor: '#1c64c8', deepColor: '#1450a8', waveColor: '#5ca8fc', sparkleColor: '#a8d8fc', waveBaseline: 4 }),
    bridge: createBridgeTile()
  };
}

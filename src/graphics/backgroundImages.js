/**
 * @file Fondos con efecto parallax para cada ciudad.
 *
 * Cada fondo tiene tres partes:
 *   - `sky`: una columna de 1 píxel con las franjas de color del cielo (se estira).
 *   - `farLayer`: siluetas lejanas que se desplazan despacio (20 % de la cámara).
 *   - `nearLayer`: edificios o árboles cercanos que se desplazan más (50 %).
 * Las capas miden 512 píxeles de ancho y se repiten en horizontal.
 *
 * Todo se dibuja con formas sencillas y un generador aleatorio con semilla, así
 * cada ciudad tiene siempre el mismo aspecto.
 */
import { SCREEN_HEIGHT, GROUND_SURFACE_Y } from '../config/constants.js';
import { createCanvas, fillRectangle, fillCircle, fillTriangle } from '../core/canvas.js';
import { createSeededRandom, randomItem } from '../core/math.js';
import { drawText, measureTextWidth } from './font.js';

/** Ancho de las capas del fondo; se repiten para cubrir el nivel entero. */
export const BACKGROUND_LAYER_WIDTH = 512;
/** Fracción del movimiento de la cámara que recorre cada capa. */
export const PARALLAX_FACTORS = Object.freeze({ farLayer: 0.2, nearLayer: 0.5 });

/**
 * Dibuja una cuadrícula de ventanas dentro de un edificio.
 * @param {CanvasRenderingContext2D} context
 * @param {Object} building Rectángulo del edificio y medidas de las ventanas.
 * @param {() => number} [randomSource] Si se indica, algunas ventanas quedan apagadas.
 */
function paintWindows(context, { left, top, width, height, color, spacingX = 6, spacingY = 8, windowWidth = 3, windowHeight = 4 }, randomSource) {
  for (let y = top + 4; y < top + height - windowHeight - 2; y += spacingY) {
    for (let x = left + 3; x < left + width - windowWidth - 1; x += spacingX) {
      const isLit = !randomSource || randomSource() > 0.18;
      if (isLit) fillRectangle(context, x, y, windowWidth, windowHeight, color);
    }
  }
}

/**
 * Cada función pinta las dos capas de una ciudad.
 * Parámetros comunes: (far, near, randomSource), donde `far` y `near` son los
 * contextos de las capas lejana y cercana.
 */
const CITY_BACKGROUND_PAINTERS = {
  /** Madrid: cúpula, las dos torres inclinadas, rascacielos y fachadas con balcones. */
  madrid(far, near, randomSource) {
    const silhouetteColor = '#6c94d8';
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 24) {
      const height = 30 + Math.floor(randomSource() * 40);
      fillRectangle(far, x, 190 - height, 22, height + 50, silhouetteColor);
    }
    // Edificio con cúpula y estatua.
    fillRectangle(far, 120, 120, 30, 120, silhouetteColor);
    fillCircle(far, 135, 120, 15, silhouetteColor);
    fillRectangle(far, 134, 96, 2, 10, silhouetteColor);
    fillRectangle(far, 131, 98, 8, 3, silhouetteColor);
    // Dos torres inclinadas la una hacia la otra.
    for (let step = 0; step < 70; step++) {
      fillRectangle(far, 300 + Math.round(step * 0.25), 90 + step, 14, 1, silhouetteColor);
      fillRectangle(far, 350 - Math.round(step * 0.25), 90 + step, 14, 1, silhouetteColor);
    }
    fillRectangle(far, 300, 160, 64, 80, silhouetteColor);
    fillRectangle(far, 420, 70, 18, 170, silhouetteColor);
    fillRectangle(far, 446, 60, 16, 180, silhouetteColor);
    fillRectangle(far, 470, 80, 14, 160, silhouetteColor);

    const facadeColors = ['#e8b888', '#d89478', '#f0d0a0', '#e0a890', '#c8a078'];
    let x = 0;
    while (x < BACKGROUND_LAYER_WIDTH) {
      const width = 40 + Math.floor(randomSource() * 30);
      const height = 60 + Math.floor(randomSource() * 50);
      const top = GROUND_SURFACE_Y - height;
      fillRectangle(near, x, top, width, height + 32, randomItem(facadeColors, randomSource));
      fillRectangle(near, x, top, width, 3, '#8c5c3c');
      paintWindows(near, { left: x, top: top + 4, width, height, color: '#3c4c7c', spacingX: 9, spacingY: 13, windowWidth: 4, windowHeight: 7 });
      // Barandillas de los balcones.
      for (let railY = top + 15; railY < 196; railY += 13) fillRectangle(near, x + 2, railY, width - 4, 1, '#3c3c3c');
      x += width + 2 + Math.floor(randomSource() * 10);
      if (randomSource() > 0.5) {
        fillRectangle(near, x + 6, 170, 3, 40, '#5c3c24');
        fillCircle(near, x + 7, 164, 10, '#4c8c3c');
        x += 18;
      }
    }
  },

  /** Benidorm: el mar, rascacielos blancos, una torre con arco dorado y palmeras. */
  benidorm(far, near, randomSource) {
    fillRectangle(far, 0, 176, BACKGROUND_LAYER_WIDTH, 64, '#2878d8');
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 12) fillRectangle(far, x + (x % 24), 182 + (x % 5) * 4, 6, 1, '#7cc0fc');
    let x = 4;
    while (x < BACKGROUND_LAYER_WIDTH) {
      const width = 18 + Math.floor(randomSource() * 16);
      const height = 70 + Math.floor(randomSource() * 90);
      fillRectangle(far, x, 178 - height, width, height, '#d8e4f0');
      paintWindows(far, { left: x, top: 178 - height, width, height, color: '#98acc8', spacingX: 5, spacingY: 6, windowWidth: 3, windowHeight: 3 });
      x += width + 6 + Math.floor(randomSource() * 18);
    }
    for (const towerX of [250, 282]) {
      fillRectangle(far, towerX, 20, 16, 158, '#e8eef8');
      paintWindows(far, { left: towerX, top: 20, width: 16, height: 158, color: '#98acc8', spacingX: 5, spacingY: 6, windowWidth: 3, windowHeight: 3 });
    }
    fillRectangle(far, 250, 14, 48, 8, '#e8b030');
    fillTriangle(far, 262, 14, 24, 10, '#e8b030');

    for (let palmX = 20; palmX < BACKGROUND_LAYER_WIDTH; palmX += 90 + Math.floor(randomSource() * 60)) {
      for (let step = 0; step < 60; step++) fillRectangle(near, palmX + Math.round(Math.sin(step / 20) * 4), GROUND_SURFACE_Y - step, 4, 1, '#8c5c30');
      const crownX = palmX + Math.round(Math.sin(3) * 4);
      const crownY = 148;
      for (let frond = 0; frond < 6; frond++) {
        const angle = -Math.PI + frond * Math.PI / 5;
        for (let length = 0; length < 20; length++) {
          fillRectangle(near, crownX + Math.cos(angle) * length, crownY + Math.sin(angle) * length * 0.6 + length * length / 60, 3, 2, '#3c9c3c');
        }
      }
    }
  },

  /** Sevilla: casas blancas, la Giralda, casetas de feria a rayas y farolillos. */
  sevilla(far, near, randomSource) {
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 30) {
      const height = 20 + Math.floor(randomSource() * 25);
      fillRectangle(far, x, 190 - height, 28, height + 50, '#f8ecd8');
      fillRectangle(far, x, 190 - height, 28, 2, '#e8c890');
    }
    const towerX = 240;
    const stone = '#d8945c';
    const shadow = '#b87038';
    fillRectangle(far, towerX, 60, 26, 180, stone);
    fillRectangle(far, towerX + 3, 34, 20, 26, stone);
    fillRectangle(far, towerX + 6, 18, 14, 16, stone);
    fillRectangle(far, towerX + 9, 8, 8, 10, stone);
    fillRectangle(far, towerX + 12, 0, 2, 8, shadow);
    for (let y = 70; y < 180; y += 16) {
      fillRectangle(far, towerX + 6, y, 4, 8, shadow);
      fillRectangle(far, towerX + 16, y, 4, 8, shadow);
    }
    fillRectangle(far, towerX + 30, 110, 90, 130, stone);
    fillTriangle(far, towerX + 30, 110, 90, 20, shadow);

    const stripePairs = [['#fc4040', '#fcfcfc'], ['#00a844', '#fcfcfc']];
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 68) {
      const [mainColor, stripeColor] = randomItem(stripePairs, randomSource);
      for (let stripe = 0; stripe < 48; stripe += 6) fillRectangle(near, x + stripe, 168, 6, 40, (stripe / 6) % 2 ? stripeColor : mainColor);
      fillTriangle(near, x - 2, 168, 52, 18, mainColor);
      fillRectangle(near, x + 18, 184, 12, 24, '#3c2410');
    }
    const lanternColors = ['#fc4040', '#00c050', '#fcd800', '#fcfcfc'];
    for (let stringX = 0; stringX < BACKGROUND_LAYER_WIDTH; stringX += 64) {
      for (let offset = 0; offset < 64; offset += 4) {
        const y = 140 + Math.round(Math.sin(offset / 64 * Math.PI) * 14);
        fillRectangle(near, stringX + offset, y, 1, 1, '#3c3c3c');
        if (offset % 8 === 0) fillRectangle(near, stringX + offset - 1, y + 1, 3, 4, lanternColors[(offset / 8) % 4]);
      }
    }
  },

  /** Pamplona: montes verdes y casas de piedra con balcones y pañuelos rojos. */
  pamplona(far, near, randomSource) {
    for (let x = -40; x < BACKGROUND_LAYER_WIDTH + 40; x += 70) fillTriangle(far, x, 180, 140, 60 + Math.floor(randomSource() * 40), '#6c8c7c');
    for (let x = -20; x < BACKGROUND_LAYER_WIDTH + 20; x += 50) fillTriangle(far, x, 190, 90, 40, '#5c7c6c');
    let x = 0;
    while (x < BACKGROUND_LAYER_WIDTH) {
      const width = 44 + Math.floor(randomSource() * 20);
      const height = 80 + Math.floor(randomSource() * 40);
      const top = GROUND_SURFACE_Y - height;
      fillRectangle(near, x, top, width, height, randomItem(['#c8b89c', '#b8a88c', '#d4c4a4'], randomSource));
      fillTriangle(near, x - 4, top, width + 8, 12, '#8c4c30');
      for (let balconyY = top + 14; balconyY < 190; balconyY += 22) {
        fillRectangle(near, x + 4, balconyY, width - 8, 12, '#6c4020');
        fillRectangle(near, x + 4, balconyY + 10, width - 8, 2, '#3c2010');
        for (let flagX = x + 6; flagX < x + width - 8; flagX += 12) fillRectangle(near, flagX, balconyY + 12, 6, 8, '#d82020');
      }
      x += width + 4;
    }
  },

  /** Metro: pared de azulejos, franja azul, carteles de estaciones y columnas. */
  metro(far, near) {
    fillRectangle(far, 0, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT, '#2c3040');
    for (let y = 40; y < 200; y += 6) {
      for (let x = (y / 6) % 2 ? 0 : 5; x < BACKGROUND_LAYER_WIDTH; x += 10) fillRectangle(far, x, y, 9, 5, '#3c4458');
    }
    fillRectangle(far, 0, 100, BACKGROUND_LAYER_WIDTH, 10, '#1c3ca8');
    fillRectangle(far, 0, 102, BACKGROUND_LAYER_WIDTH, 2, '#5c7cf8');
    ['SOL', 'CALLAO', 'ÓPERA', 'TRIBUNAL'].forEach((stationName, index) => {
      const signWidth = measureTextWidth(stationName) + 16;
      const signX = index * 128 + 20;
      fillRectangle(far, signX, 70, signWidth, 16, '#1c3ca8');
      fillRectangle(far, signX + 1, 71, signWidth - 2, 14, '#2c50c8');
      drawText(far, stationName, signX + 8, 75, '#fcfcfc');
    });
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 64) {
      fillRectangle(near, x + 20, 30, 12, 178, '#1c2030');
      fillRectangle(near, x + 22, 30, 2, 178, '#3c4458');
    }
  },

  /** Galicia: colinas verdes, un faro, hórreos y eucaliptos. */
  galicia(far, near, randomSource) {
    for (let x = -30; x < BACKGROUND_LAYER_WIDTH + 40; x += 60) fillCircle(far, x, 200, 50 + Math.floor(randomSource() * 30), '#3c6c4c');
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH + 40; x += 40) fillCircle(far, x, 215, 36, '#2c5c3c');
    fillRectangle(far, 400, 90, 10, 60, '#d8d8d8');
    fillRectangle(far, 398, 84, 14, 8, '#c83c28');
    fillRectangle(far, 402, 80, 6, 4, '#fcd800');
    let x = 10;
    while (x < BACKGROUND_LAYER_WIDTH) {
      if (randomSource() > 0.4) {
        // Hórreo: granero de piedra sobre pies con tejado a dos aguas y cruz.
        fillRectangle(near, x, 196, 3, 12, '#8c8c8c');
        fillRectangle(near, x + 25, 196, 3, 12, '#8c8c8c');
        fillRectangle(near, x - 2, 194, 32, 3, '#9c9c9c');
        fillRectangle(near, x - 1, 170, 30, 24, '#a89878');
        for (let slat = 2; slat < 28; slat += 4) fillRectangle(near, x - 1 + slat, 172, 1, 20, '#7c6c54');
        fillTriangle(near, x - 5, 170, 38, 10, '#6c6c74');
        fillRectangle(near, x + 13, 154, 2, 8, '#6c6c74');
        fillRectangle(near, x + 10, 156, 8, 2, '#6c6c74');
        x += 60;
      } else {
        fillRectangle(near, x + 4, 120, 3, 88, '#9c8c7c');
        fillCircle(near, x + 5, 118, 12, '#4c7c5c');
        fillCircle(near, x + 5, 136, 10, '#4c7c5c');
        x += 40;
      }
    }
  },

  /** Valencia: ciudad al atardecer, el edificio con forma de ojo y figuras de fallas. */
  valencia(far, near, randomSource) {
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 22) {
      const height = 30 + Math.floor(randomSource() * 50);
      fillRectangle(far, x, 200 - height, 20, height + 40, '#3c2c50');
      paintWindows(far, { left: x, top: 200 - height, width: 20, height, color: '#fcd87c', spacingX: 6, spacingY: 8, windowWidth: 2, windowHeight: 3 }, randomSource);
    }
    for (let step = 0; step < 90; step++) {
      const height = Math.round(Math.sin(step / 90 * Math.PI) * 26);
      fillRectangle(far, 200 + step, 176 - height, 1, height + 4, '#d8d8ec');
    }
    for (let step = 20; step < 70; step++) {
      const height = Math.round(Math.sin((step - 20) / 50 * Math.PI) * 10);
      fillRectangle(far, 200 + step, 164 - height, 1, height * 2, '#6c8cc8');
    }
    let x = 20;
    while (x < BACKGROUND_LAYER_WIDTH) {
      // "Ninot" de falla: figura caricaturesca sobre un pedestal.
      fillRectangle(near, x, 188, 50, 20, '#8c5c3c');
      const clothesColor = randomItem(['#fca0c0', '#8cd8fc', '#fce07c', '#b8fc9c'], randomSource);
      fillRectangle(near, x + 14, 130, 22, 58, clothesColor);
      fillCircle(near, x + 25, 118, 16, '#fcd0b0');
      fillCircle(near, x + 25, 124, 6, '#fc7c7c');
      fillRectangle(near, x + 17, 112, 4, 4, '#101010');
      fillRectangle(near, x + 29, 112, 4, 4, '#101010');
      fillRectangle(near, x + 6, 140, 8, 26, clothesColor);
      fillRectangle(near, x + 36, 132, 8, 22, clothesColor);
      fillRectangle(near, x + 10, 98, 30, 6, '#3c3c3c');
      fillRectangle(near, x + 16, 86, 18, 12, '#3c3c3c');
      x += 110 + Math.floor(randomSource() * 40);
    }
  },

  /** La Mancha de noche: estrellas, luna llena, colinas y molinos de viento. */
  mancha(far, near, randomSource) {
    for (let star = 0; star < 90; star++) {
      fillRectangle(far, Math.floor(randomSource() * BACKGROUND_LAYER_WIDTH), Math.floor(randomSource() * 140), 1, 1, randomSource() > 0.8 ? '#fcfcfc' : '#8c9cc8');
    }
    fillCircle(far, 400, 46, 16, '#f8f0c8');
    fillCircle(far, 395, 42, 3, '#e0d8b0');
    fillCircle(far, 406, 52, 2, '#e0d8b0');
    for (let x = -30; x < BACKGROUND_LAYER_WIDTH + 40; x += 80) fillTriangle(far, x, 200, 160, 40 + Math.floor(randomSource() * 20), '#1c2448');
    let x = 30;
    while (x < BACKGROUND_LAYER_WIDTH) {
      for (let step = 0; step < 44; step++) {
        const width = 12 + Math.round(step * 0.12);
        fillRectangle(near, x + 9 - width / 2, GROUND_SURFACE_Y - step, width, 1, '#b8b8cc');
      }
      fillTriangle(near, x - 1, GROUND_SURFACE_Y - 44, 20, 12, '#2c2c44');
      fillRectangle(near, x + 6, GROUND_SURFACE_Y - 12, 5, 12, '#2c2c44');
      const hubX = x + 9;
      const hubY = GROUND_SURFACE_Y - 40;
      for (let length = 0; length < 22; length++) {
        const offset = length * 0.7;
        for (const [signX, signY] of [[1, -1], [-1, 1], [1, 1], [-1, -1]]) fillRectangle(near, hubX + offset * signX, hubY + offset * signY, 2, 2, '#1c1c2c');
      }
      x += 120 + Math.floor(randomSource() * 60);
    }
  },

  /** Canarias: el mar, el Teide humeante y dragos. */
  canarias(far, near, randomSource) {
    fillRectangle(far, 0, 186, BACKGROUND_LAYER_WIDTH, 60, '#2c5c9c');
    for (let x = 0; x < BACKGROUND_LAYER_WIDTH; x += 14) fillRectangle(far, x, 190 + (x % 3) * 5, 6, 1, '#5c8cc8');
    for (let step = 0; step < 130; step++) {
      const width = 20 + step * 3;
      fillRectangle(far, 256 - width / 2, 56 + step, width, 1, step < 18 ? '#e8e0e0' : '#6c3c2c');
    }
    fillRectangle(far, 246, 52, 20, 6, '#fc6c20');
    for (let puff = 0; puff < 6; puff++) fillCircle(far, 250 + puff * 6 + Math.round(randomSource() * 6), 40 - puff * 7, 4 + puff, '#9c8c8c');
    for (let x = -20; x < BACKGROUND_LAYER_WIDTH + 20; x += 60) fillTriangle(far, x, 190, 90, 24, '#4c2c24');
    let x = 30;
    while (x < BACKGROUND_LAYER_WIDTH) {
      fillRectangle(near, x + 10, 170, 8, 38, '#8c7c6c');
      for (let branch = -2; branch <= 2; branch++) {
        fillRectangle(near, x + 13 + branch * 6, 158, 2, 14, '#8c7c6c');
        fillCircle(near, x + 14 + branch * 7, 152, 7, '#3c7c3c');
      }
      fillRectangle(near, x - 6, 196, 40, 12, '#201c24');
      x += 100 + Math.floor(randomSource() * 60);
    }
  },

  /** Castillo de Hacienda: muro de piedra con estandartes de impuestos y rejas. */
  hacienda(far, near) {
    fillRectangle(far, 0, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT, '#241c2c');
    for (let y = 32; y < SCREEN_HEIGHT; y += 8) {
      for (let x = (y / 8) % 2 ? 0 : 8; x < BACKGROUND_LAYER_WIDTH; x += 16) {
        fillRectangle(far, x, y, 15, 7, '#2c2434');
        fillRectangle(far, x, y, 15, 1, '#342c3c');
      }
    }
    ['IVA', 'IRPF', '21%', 'IBI'].forEach((taxName, index) => {
      const bannerX = index * 128 + 40;
      fillRectangle(far, bannerX, 50, 32, 60, '#8c1c1c');
      fillRectangle(far, bannerX + 2, 52, 28, 56, '#b82828');
      fillTriangle(far, bannerX, 124, 32, 14, '#8c1c1c');
      fillRectangle(far, bannerX - 4, 46, 40, 4, '#c8a040');
      drawText(far, taxName, bannerX + 16, 70, '#fcd800', { align: 'center' });
    });
    for (let x = 100; x < BACKGROUND_LAYER_WIDTH; x += 128) {
      fillRectangle(far, x, 120, 20, 30, '#100c14');
      for (let bar = 2; bar < 20; bar += 5) fillRectangle(far, x + bar, 120, 2, 30, '#5c5464');
    }
    for (let x = 30; x < BACKGROUND_LAYER_WIDTH; x += 128) {
      fillRectangle(near, x, 140, 4, 14, '#5c3c24');
      fillRectangle(near, x - 2, 136, 8, 4, '#3c2c1c');
    }
  }
};

/**
 * @typedef {Object} BackgroundImages
 * @property {HTMLCanvasElement} sky Columna con las franjas del cielo.
 * @property {HTMLCanvasElement} farLayer
 * @property {HTMLCanvasElement} nearLayer
 */

/**
 * Genera el fondo de una ciudad.
 * @param {import('../world/themes.js').Theme} theme
 * @returns {BackgroundImages}
 */
export function createBackgroundImages(theme) {
  const randomSource = createSeededRandom(theme.name.length * 131 + 17);
  const farLayer = createCanvas(BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
  const nearLayer = createCanvas(BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
  CITY_BACKGROUND_PAINTERS[theme.name](farLayer.getContext('2d'), nearLayer.getContext('2d'), randomSource);
  const [topSky, middleSky, lowSky] = theme.skyColors;
  const sky = createCanvas(1, SCREEN_HEIGHT, context => {
    fillRectangle(context, 0, 0, 1, 120, topSky);
    fillRectangle(context, 0, 120, 1, 50, middleSky);
    fillRectangle(context, 0, 170, 1, 70, lowSky);
  });
  return { sky, farLayer, nearLayer };
}

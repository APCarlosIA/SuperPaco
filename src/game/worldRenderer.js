/**
 * @file Dibujado del escenario de un nivel: cielo, fondos con parallax,
 * decorados, baldosas y efectos de clima. Los personajes se dibujan a sí mismos.
 *
 * Orden de dibujo (de atrás hacia delante), coordinado desde World.draw():
 *   cielo → fondo lejano → fuegos artificiales → fondo cercano → decorados →
 *   entidades "detrás" → baldosas → plataformas → entidades → Paco → efectos → lluvia → marcador.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE, GROUND_SURFACE_Y, GROUND_TOP_ROW, RENDER_SCALE } from '../config/constants.js';
import { OUTLINE_COLOR } from '../graphics/hd.js';
import { fillRectangle, fillCircle, fillTriangle } from '../core/canvas.js';
import { SPRITES, drawSprite } from '../graphics/sprites.js';
import { drawText, measureTextWidth } from '../graphics/font.js';
import { BACKGROUND_LAYER_WIDTH, PARALLAX_FACTORS } from '../graphics/backgroundConstants.js';
import { TILE_ANIMATION_FRAMES } from '../graphics/tileImages.js';
import { getGroundDecorationImage, getBarImage, BAR_SIZE } from '../graphics/decorationImages.js';
import { TILE, isSolidTile } from '../world/tileTypes.js';
import { GOAL_POLE_TOP_ROW } from '../world/LevelBuilder.js';
import { HAM_START_Y } from './GoalSequence.js';

/** Número de columnas visibles más una de margen para el desplazamiento. */
const VISIBLE_COLUMNS = SCREEN_WIDTH / TILE_SIZE + 1;
/** Orden de los fotogramas del brillo de los bloques "¿?" y de las pesetas. */
const PING_PONG_FRAMES = [0, 1, 2, 1];
/** Pasos que dura cada fotograma de las animaciones de baldosas. */
const STEPS_PER_TILE_FRAME = 8;
/** Fila en la que pisan los personajes. */
const STANDING_ROW = GROUND_TOP_ROW - 1;

/**
 * Dibuja una capa del fondo repetida en horizontal con desplazamiento parallax.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {HTMLCanvasElement} layerImage Capa en alta resolución.
 * @param {number} cameraX
 * @param {number} parallaxFactor
 */
function drawRepeatingLayer(context, layerImage, cameraX, parallaxFactor) {
  const offset = -Math.floor(((cameraX * parallaxFactor) % BACKGROUND_LAYER_WIDTH) * RENDER_SCALE) / RENDER_SCALE;
  context.drawImage(layerImage, offset, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
  context.drawImage(layerImage, offset + BACKGROUND_LAYER_WIDTH, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
}

/**
 * Dibuja el cielo, las tres capas del fondo y los fuegos artificiales.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {import('../graphics/backgroundImages.js').BackgroundImages} backgroundImages
 * @param {import('../world/themes.js').Theme} theme
 * @param {number} cameraX
 * @param {Array<{x:number,y:number,color:string,ageInSteps:number}>} [fireworkParticles]
 */
export function drawBackground(context, backgroundImages, theme, cameraX, fireworkParticles = [], stepCounter = 0) {
  context.drawImage(backgroundImages.sky, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  // Las nubes avanzan solas despacio, además del parallax con la cámara.
  if (backgroundImages.cloudLayer) drawRepeatingLayer(context, backgroundImages.cloudLayer, cameraX * 0.5 + stepCounter * 0.15, PARALLAX_FACTORS.farLayer * 0.6);
  drawRepeatingLayer(context, backgroundImages.farLayer, cameraX, PARALLAX_FACTORS.farLayer);
  for (const particle of fireworkParticles) {
    const isFadingOut = particle.ageInSteps >= 30 && particle.ageInSteps % 4 >= 2;
    fillRectangle(context, particle.x, particle.y, 2, 2, isFadingOut ? '#fcfcfc' : particle.color);
  }
  drawRepeatingLayer(context, backgroundImages.midLayer, cameraX, PARALLAX_FACTORS.midLayer);
  drawRepeatingLayer(context, backgroundImages.nearLayer, cameraX, PARALLAX_FACTORS.nearLayer);
}

/**
 * Elige la imagen del suelo: con capa superior (hierba, arena…) si no tiene
 * nada sólido encima, o interior si está tapado. El techo siempre es interior.
 */
function chooseGroundImage(tileMap, column, row, theme, tileImages) {
  const isCeiling = theme.hasCeiling && row < 2;
  if (isCeiling) return tileImages.groundFill;
  const isExposed = row > 0 && !isSolidTile(tileMap.getTile(column, row - 1));
  return isExposed ? tileImages.groundSurface : tileImages.groundFill;
}

/**
 * Elige la imagen de lava o agua: superficie con olas o profundidad.
 */
function chooseLiquidImage(tileMap, column, row, liquidTile, frames, animationFrame) {
  const isBelowSameLiquid = row > 0 && tileMap.getTile(column, row - 1) === liquidTile;
  return isBelowSameLiquid ? frames[animationFrame].depth : frames[animationFrame].surface;
}

/**
 * Dibuja las baldosas visibles.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Object} scene
 * @param {import('../world/TileMap.js').TileMap} scene.tileMap
 * @param {import('../graphics/tileImages.js').TileImages} scene.tileImages
 * @param {import('../world/themes.js').Theme} scene.theme
 * @param {Map<string, number>} scene.blockBumpOffsets Desplazamiento vertical de los bloques que están botando.
 * @param {number} scene.stepCounter Para las animaciones.
 * @param {number} cameraX
 */
export function drawTileLayer(context, { tileMap, tileImages, theme, blockBumpOffsets, stepCounter }, cameraX) {
  const firstColumn = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const lastColumn = Math.min(tileMap.widthInTiles - 1, firstColumn + VISIBLE_COLUMNS);
  const animationStep = Math.floor(stepCounter / STEPS_PER_TILE_FRAME);
  const pingPongFrame = PING_PONG_FRAMES[animationStep % PING_PONG_FRAMES.length];
  const liquidFrame = animationStep % TILE_ANIMATION_FRAMES;

  for (let row = 0; row < tileMap.heightInTiles; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      const tile = tileMap.getTile(column, row);
      if (tile === TILE.EMPTY || tile === TILE.HIDDEN_BLOCK) continue;
      const screenX = Math.round(column * TILE_SIZE - cameraX);
      const screenY = row * TILE_SIZE - (blockBumpOffsets.get(`${column},${row}`) || 0);

      if (tile === TILE.COIN) {
        drawSprite(context, SPRITES[`peseta_spin${pingPongFrame}`], screenX, screenY + 1);
        continue;
      }
      const image = chooseTileImage(tile, { tileMap, tileImages, theme, column, row, pingPongFrame, liquidFrame });
      if (image) context.drawImage(image, screenX, screenY, TILE_SIZE, TILE_SIZE);
      if (tile === TILE.GROUND) drawGroundOutline(context, tileMap, column, row, screenX, screenY);
      else if (tile === TILE.QUESTION_BLOCK) drawBlockGlow(context, screenX, screenY, stepCounter, column);
    }
  }
}

/** Grosor (en píxeles lógicos) del contorno oscuro del terreno. */
const OUTLINE_WIDTH = 2 / RENDER_SCALE * 1.5;

/** Contorno oscuro en los bordes del suelo que dan al aire (arriba, huecos laterales). */
function drawGroundOutline(context, tileMap, column, row, screenX, screenY) {
  const isOpen = (c, r) => r >= 0 && r < tileMap.heightInTiles && c >= 0 && c < tileMap.widthInTiles && !isSolidTile(tileMap.getTile(c, r));
  context.fillStyle = OUTLINE_COLOR;
  if (row > 0 && isOpen(column, row - 1)) context.fillRect(screenX, screenY - OUTLINE_WIDTH * 0.6, TILE_SIZE, OUTLINE_WIDTH * 1.2);
  if (isOpen(column - 1, row)) context.fillRect(screenX, screenY, OUTLINE_WIDTH, TILE_SIZE);
  if (isOpen(column + 1, row)) context.fillRect(screenX + TILE_SIZE - OUTLINE_WIDTH, screenY, OUTLINE_WIDTH, TILE_SIZE);
  if (isOpen(column, row + 1)) context.fillRect(screenX, screenY + TILE_SIZE - OUTLINE_WIDTH, TILE_SIZE, OUTLINE_WIDTH);
}

/** Resplandor pulsante alrededor de los bloques "¿?". */
function drawBlockGlow(context, screenX, screenY, stepCounter, column) {
  const pulse = 0.5 + 0.5 * Math.sin(stepCounter / 14 + column);
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(screenX + 8, screenY + 8, 2, screenX + 8, screenY + 8, 20);
  gradient.addColorStop(0, `rgba(255, 190, 70, ${0.22 + pulse * 0.16})`);
  gradient.addColorStop(1, 'rgba(255, 150, 40, 0)');
  context.fillStyle = gradient;
  context.fillRect(screenX - 14, screenY - 14, 44, 44);
  context.restore();
}

/** @private Imagen que corresponde a cada tipo de baldosa. */
function chooseTileImage(tile, { tileMap, tileImages, theme, column, row, pingPongFrame, liquidFrame }) {
  switch (tile) {
    case TILE.GROUND: return chooseGroundImage(tileMap, column, row, theme, tileImages);
    case TILE.BRICK: return tileImages.brick;
    case TILE.QUESTION_BLOCK: return tileImages.questionBlockFrames[pingPongFrame];
    case TILE.USED_BLOCK: return tileImages.usedBlock;
    case TILE.AZULEJO: return tileImages.azulejo;
    case TILE.BARREL_TOP_LEFT: return tileImages.barrel.topLeft;
    case TILE.BARREL_TOP_RIGHT: return tileImages.barrel.topRight;
    case TILE.BARREL_BODY_LEFT: return tileImages.barrel.bodyLeft;
    case TILE.BARREL_BODY_RIGHT: return tileImages.barrel.bodyRight;
    case TILE.ONE_WAY_PLATFORM: return tileImages.oneWayPlatform;
    case TILE.BRIDGE: return tileImages.bridge;
    case TILE.LAVA: return chooseLiquidImage(tileMap, column, row, TILE.LAVA, tileImages.lavaFrames, liquidFrame);
    case TILE.WATER: return chooseLiquidImage(tileMap, column, row, TILE.WATER, tileImages.waterFrames, liquidFrame);
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/* Decorados                                                           */
/* ------------------------------------------------------------------ */

/** Cartel de madera con texto clavado en el suelo. */
function drawSign(context, screenX, text) {
  const boardWidth = measureTextWidth(text.toUpperCase()) + 8;
  const boardLeft = screenX + 8 - Math.round(boardWidth / 2);
  fillRectangle(context, screenX + 7, GROUND_SURFACE_Y - 22, 3, 22, '#5c3418');
  fillRectangle(context, boardLeft, GROUND_SURFACE_Y - 34, boardWidth, 13, '#5c3418');
  fillRectangle(context, boardLeft + 1, GROUND_SURFACE_Y - 33, boardWidth - 2, 11, '#e8c890');
  drawText(context, text, boardLeft + 4, GROUND_SURFACE_Y - 31, '#3c2410');
}

/** Banderín del punto de control: gris hasta que Paco lo pasa, rojo y amarillo después. */
function drawCheckpointFlag(context, screenX, isReached) {
  fillRectangle(context, screenX + 7, GROUND_SURFACE_Y - 34, 2, 34, '#d0d0d0');
  fillCircle(context, screenX + 8, GROUND_SURFACE_Y - 35, 2, '#fcd800');
  if (isReached) {
    fillRectangle(context, screenX + 9, GROUND_SURFACE_Y - 32, 14, 3, '#c8102e');
    fillRectangle(context, screenX + 9, GROUND_SURFACE_Y - 29, 14, 5, '#fcd800');
    fillRectangle(context, screenX + 9, GROUND_SURFACE_Y - 24, 14, 3, '#c8102e');
  } else {
    fillRectangle(context, screenX + 9, GROUND_SURFACE_Y - 32, 12, 9, '#9c9ca8');
    fillRectangle(context, screenX + 9, GROUND_SURFACE_Y - 32, 12, 1, '#c8c8d0');
  }
}

/** Cucaña de la meta (poste a rayas) con el jamón colgado. */
function drawGoalPole(context, screenX, hamY) {
  const poleLeft = screenX + 7;
  const poleTop = GOAL_POLE_TOP_ROW * TILE_SIZE;
  const poleBottom = STANDING_ROW * TILE_SIZE;
  fillRectangle(context, poleLeft, poleTop, 3, poleBottom - poleTop, '#f0f0f0');
  for (let stripeY = poleTop + 2; stripeY < poleBottom; stripeY += 8) fillRectangle(context, poleLeft, stripeY, 3, 3, '#d82800');
  fillCircle(context, poleLeft + 1, poleTop - 2, 3, '#fcd800');
  drawSprite(context, SPRITES.jamon, poleLeft - 12, hamY);
}

/** Torre de molino manchego (las aspas son una entidad aparte). */
function drawWindmillTower(context, screenX) {
  const hubX = screenX + TILE_SIZE + 8;
  const towerTop = 112;
  for (let y = towerTop; y < GROUND_SURFACE_Y; y++) {
    const width = Math.round(18 + (y - towerTop) * 12 / (GROUND_SURFACE_Y - towerTop));
    fillRectangle(context, hubX - width / 2, y, width, 1, '#d4d4e0');
    fillRectangle(context, hubX - width / 2, y, 2, 1, '#9c9cb0');
  }
  fillTriangle(context, hubX - 13, towerTop + 2, 26, 18, '#3c3c54');
  fillRectangle(context, hubX - 3, GROUND_SURFACE_Y - 14, 7, 14, '#3c2c1c');
  fillRectangle(context, hubX - 2, 140, 4, 6, '#3c2c1c');
}

/** Pedestal con la tortilla y la receta flotando (sala final del castillo). */
function drawRecipePedestal(context, screenX, stepCounter) {
  fillRectangle(context, screenX + 4, GROUND_SURFACE_Y - 18, 24, 18, '#8c8494');
  fillRectangle(context, screenX, GROUND_SURFACE_Y - 22, 32, 4, '#b0a4b8');
  fillCircle(context, screenX + 16, GROUND_SURFACE_Y - 26, 9, '#fcfcfc');
  drawSprite(context, SPRITES.tortilla, screenX + 8, GROUND_SURFACE_Y - 34);
  const floatOffset = Math.round(Math.sin(stepCounter / 15) * 2);
  drawSprite(context, SPRITES.receta, screenX + 10, GROUND_SURFACE_Y - 56 + floatOffset);
}

/**
 * Dibuja los decorados visibles del nivel.
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Object} scene
 * @param {import('../world/LevelBuilder.js').Decoration[]} scene.decorations
 * @param {import('../world/themes.js').Theme} scene.theme
 * @param {boolean} scene.isCheckpointReached
 * @param {number|null} scene.hamY Altura del jamón (cambia durante la escena de meta).
 * @param {number} scene.stepCounter
 * @param {number} cameraX
 */
export function drawDecorations(context, { decorations, theme, isCheckpointReached, hamY, stepCounter }, cameraX) {
  for (const decoration of decorations) {
    const screenX = Math.round(decoration.column * TILE_SIZE - cameraX);
    const isFarOffScreen = screenX < -130 || screenX > SCREEN_WIDTH + 40;
    if (isFarOffScreen) continue;
    switch (decoration.type) {
      case 'cloud': break; // las nubes son ahora parte del fondo
      case 'sign': drawSign(context, screenX, decoration.text); break;
      case 'checkpoint': drawCheckpointFlag(context, screenX, isCheckpointReached); break;
      case 'goalPole': drawGoalPole(context, screenX, hamY === null ? HAM_START_Y : hamY); break;
      case 'bar': context.drawImage(getBarImage(), screenX, GROUND_SURFACE_Y - BAR_SIZE.height); break;
      case 'windmillTower': drawWindmillTower(context, screenX); break;
      case 'abuela': drawSprite(context, SPRITES.abuela, screenX, GROUND_SURFACE_Y - SPRITES.abuela.height, { mirrored: true }); break;
      case 'recipePedestal': drawRecipePedestal(context, screenX, stepCounter); break;
      default: {
        // Plantas y farolas: se apoyan sobre el suelo.
        const image = getGroundDecorationImage(decoration.type);
        if (image) context.drawImage(image, screenX, GROUND_SURFACE_Y - image.height);
      }
    }
  }
}

/**
 * Dibuja las gotas de lluvia (Galicia).
 * @param {CanvasRenderingContext2D} context Dónde dibujar.
 * @param {Array<{x:number, y:number}>} rainDrops Posiciones en pantalla.
 */
export function drawRain(context, rainDrops) {
  context.fillStyle = '#b8d0ec';
  for (const drop of rainDrops) context.fillRect(Math.round(drop.x), Math.round(drop.y), 1, 4);
}

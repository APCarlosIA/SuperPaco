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
import { roundedPath, fillWithOutline } from '../graphics/shapes.js';
import { SPRITES, drawSprite } from '../graphics/sprites.js';
import { drawText, measureTextWidth } from '../graphics/font.js';
import { BACKGROUND_LAYER_WIDTH, PARALLAX_FACTORS } from '../graphics/backgroundConstants.js';
import { getGroundDecorationImage, drawGroundDecoration, getBarImage, BAR_SIZE, DECORATION_PADDING } from '../graphics/decorationImages.js';
import { TILE, isSolidTile, isBeatTile } from '../world/tileTypes.js';
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
 * Dibuja el primer plano: siluetas desenfocadas que pasan por delante de todo,
 * más deprisa que el suelo.
 * @param {CanvasRenderingContext2D} context
 * @param {import('../graphics/backgroundImages.js').BackgroundImages} backgroundImages
 * @param {number} cameraX
 */
export function drawForeground(context, backgroundImages, cameraX) {
  if (!backgroundImages.frontLayer) return;
  const offset = -(((cameraX * PARALLAX_FACTORS.frontLayer) % BACKGROUND_LAYER_WIDTH) * RENDER_SCALE | 0) / RENDER_SCALE;
  context.save();
  context.imageSmoothingEnabled = true;
  context.globalAlpha = 0.92;
  context.drawImage(backgroundImages.frontLayer, offset, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
  context.drawImage(backgroundImages.frontLayer, offset + BACKGROUND_LAYER_WIDTH, 0, BACKGROUND_LAYER_WIDTH, SCREEN_HEIGHT);
  context.restore();
}

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
    const fade = particle.ageInSteps >= 30 ? Math.max(0, 1 - (particle.ageInSteps - 30) / 24) : 1;
    context.save();
    context.globalCompositeOperation = 'lighter';
    const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 6);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.globalAlpha = 0.85 * fade;
    context.fillStyle = gradient;
    context.fillRect(particle.x - 6, particle.y - 6, 12, 12);
    context.globalAlpha = fade;
    context.fillStyle = '#ffffff';
    context.fillRect(particle.x - 0.7, particle.y - 0.7, 1.4, 1.4);
    context.restore();
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
export function drawTileLayer(context, { tileMap, tileImages, theme, blockBumpOffsets, stepCounter, isBeatWarning = false }, cameraX) {
  const firstColumn = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const lastColumn = Math.min(tileMap.widthInTiles - 1, firstColumn + VISIBLE_COLUMNS);
  const animationStep = Math.floor(stepCounter / STEPS_PER_TILE_FRAME);
  const pingPongFrame = PING_PONG_FRAMES[animationStep % PING_PONG_FRAMES.length];

  for (let row = 0; row < tileMap.heightInTiles; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      const tile = tileMap.getTile(column, row);
      if (tile === TILE.EMPTY || tile === TILE.HIDDEN_BLOCK) continue;
      const screenX = Math.round(column * TILE_SIZE - cameraX);
      const screenY = row * TILE_SIZE - (blockBumpOffsets.get(`${column},${row}`) || 0);

      if (isBeatTile(tile)) {
        drawBeatTile(context, tile, screenX, screenY, stepCounter, isBeatWarning);
        continue;
      }
      if (tile === TILE.LAVA || tile === TILE.WATER) {
        drawLiquidTile(context, tileMap, column, row, tile, screenX, screenY, stepCounter);
        continue;
      }
      if (tile === TILE.COIN) {
        drawSprite(context, SPRITES[`peseta_spin${pingPongFrame}`], screenX, screenY + 1);
        continue;
      }
      const image = chooseTileImage(tile, { tileMap, tileImages, theme, column, row, pingPongFrame });
      if (image) context.drawImage(image, screenX, screenY, TILE_SIZE, TILE_SIZE);
      if (tile === TILE.GROUND) {
        drawGroundOutline(context, tileMap, column, row, screenX, screenY);
        if (theme.ground.topLayer === 'grass' && row > 0 && !isSolidTile(tileMap.getTile(column, row - 1))) drawGrassBlades(context, column, screenX, screenY, stepCounter);
      }
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
  gradient.addColorStop(0, `rgba(255, 190, 70, ${0.1 + pulse * 0.1})`);
  gradient.addColorStop(1, 'rgba(255, 150, 40, 0)');
  context.fillStyle = gradient;
  context.fillRect(screenX - 14, screenY - 14, 44, 44);
  context.restore();
}

/** Plataformas "al ritmo": sólidas con una nota musical o fantasmas punteadas. */
function drawBeatTile(context, tile, screenX, screenY, stepCounter, isWarning) {
  const isGroupA = tile === TILE.BEAT_A_ON || tile === TILE.BEAT_A_OFF;
  const isSolid = tile === TILE.BEAT_A_ON || tile === TILE.BEAT_B_ON;
  const [light, dark, glowRgb] = isGroupA ? ['#9af2ff', '#1a7ad8', '90, 210, 255'] : ['#ffb0f4', '#b02aa8', '255, 120, 235'];
  const flicker = isWarning && Math.floor(stepCounter / 3) % 2 === 0;
  if (isSolid) {
    context.save();
    context.globalAlpha = flicker ? 0.45 : 1;
    roundedPath(context, screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1, 3);
    fillWithOutline(context, light, dark, screenY, screenY + TILE_SIZE, 1);
    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.fillRect(screenX + 2.4, screenY + 1.8, TILE_SIZE - 4.8, 1);
    // Nota musical.
    context.fillStyle = '#ffffff';
    context.beginPath(); context.ellipse(screenX + 6.4, screenY + 11, 2.4, 1.8, -0.4, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#ffffff'; context.lineWidth = 0.9;
    context.beginPath(); context.moveTo(screenX + 8.4, screenY + 10.4); context.lineTo(screenX + 8.4, screenY + 4); context.lineTo(screenX + 11.4, screenY + 5.6); context.stroke();
    context.restore();
    addGlowTile(context, screenX + 8, screenY + 8, glowRgb, 0.22 + 0.1 * Math.sin(stepCounter / 10));
  } else {
    context.save();
    context.globalAlpha = isWarning && !flicker ? 0.85 : 0.35;
    roundedPath(context, screenX + 0.8, screenY + 0.8, TILE_SIZE - 1.6, TILE_SIZE - 1.6, 3);
    context.setLineDash([2, 2]);
    context.strokeStyle = light;
    context.lineWidth = 1;
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = `rgba(${glowRgb}, 0.1)`;
    context.fill();
    context.restore();
  }
}

/** Resplandor aditivo sobre una baldosa. */
function addGlowTile(context, x, y, rgb, intensity) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(x, y, 1, x, y, 18);
  gradient.addColorStop(0, `rgba(${rgb}, ${intensity})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(x - 18, y - 18, 36, 36);
  context.restore();
}

/** Colores de la lava y el agua: superficie (de arriba abajo) y profundidad. */
const LIQUID_STYLES = Object.freeze({
  lava: { surface: ['#fff08a', '#ff8a1c', '#e0380a'], deep: ['#d4300a', '#8a1404'], line: '#fff6b8', glow: '255, 120, 30' },
  water: { surface: ['#a8ecff', '#44a4f4', '#1e64c8'], deep: ['#1e64c8', '#12408a'], line: 'rgba(255,255,255,0.85)', glow: '80, 170, 255' }
});

/** Dibuja una baldosa de lava o agua con olas continuas entre baldosas vecinas. */
function drawLiquidTile(context, tileMap, column, row, tileType, screenX, screenY, stepCounter) {
  const style = LIQUID_STYLES[tileType === TILE.LAVA ? 'lava' : 'water'];
  const isSurface = !(row > 0 && tileMap.getTile(column, row - 1) === tileType);
  const worldX = column * TILE_SIZE;
  if (!isSurface) {
    const gradient = context.createLinearGradient(0, screenY, 0, screenY + TILE_SIZE);
    gradient.addColorStop(0, style.deep[0]);
    gradient.addColorStop(1, style.deep[1]);
    context.fillStyle = gradient;
    context.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    // Manchas que se desplazan (corteza de la lava, ondas del agua).
    context.fillStyle = tileType === TILE.LAVA ? 'rgba(60, 8, 0, 0.35)' : 'rgba(255, 255, 255, 0.1)';
    for (let patch = 0; patch < 2; patch++) {
      const px = screenX + ((worldX * 0.37 + patch * 8 + stepCounter * 0.25) % TILE_SIZE);
      const py = screenY + 3 + patch * 7 + Math.sin(stepCounter / 30 + column + patch) * 1.4;
      context.beginPath(); context.ellipse(px, py, 3, 1.1, 0, 0, Math.PI * 2); context.fill();
    }
    return;
  }
  const waveAt = x => 3.4 + Math.sin((worldX + x + stepCounter * 0.9) / 7) * 1.1 + Math.sin((worldX + x) * 0.6 / 5 - stepCounter * 0.07) * 0.7;
  context.beginPath();
  context.moveTo(screenX, screenY + TILE_SIZE);
  for (let x = 0; x <= TILE_SIZE; x++) context.lineTo(screenX + x, screenY + waveAt(x));
  context.lineTo(screenX + TILE_SIZE, screenY + TILE_SIZE);
  context.closePath();
  const gradient = context.createLinearGradient(0, screenY + 2, 0, screenY + TILE_SIZE);
  gradient.addColorStop(0, style.surface[0]);
  gradient.addColorStop(0.3, style.surface[1]);
  gradient.addColorStop(0.65, style.surface[2]);
  gradient.addColorStop(1, style.deep[0]);
  context.fillStyle = gradient;
  context.fill();
  context.beginPath();
  for (let x = 0; x <= TILE_SIZE; x++) (x ? context.lineTo(screenX + x, screenY + waveAt(x)) : context.moveTo(screenX, screenY + waveAt(0)));
  context.strokeStyle = style.line;
  context.lineWidth = 1;
  context.stroke();
  if (tileType === TILE.LAVA) {
    // Burbujas que suben y estallan, y resplandor sobre la lava.
    const phase = ((stepCounter + column * 23) % 90) / 90;
    if (phase < 0.8) {
      context.fillStyle = 'rgba(255, 220, 120, 0.85)';
      context.beginPath(); context.arc(screenX + 4 + (column * 5) % 9, screenY + 14 - phase * 12, 1.2 + phase, 0, Math.PI * 2); context.fill();
    }
  }
  context.save();
  context.globalCompositeOperation = 'lighter';
  const glow = context.createLinearGradient(0, screenY - 22, 0, screenY + 4);
  glow.addColorStop(0, `rgba(${style.glow}, 0)`);
  glow.addColorStop(1, `rgba(${style.glow}, ${tileType === TILE.LAVA ? 0.34 : 0.14})`);
  context.fillStyle = glow;
  context.fillRect(screenX, screenY - 22, TILE_SIZE, 26);
  context.restore();
}

/** @private Imagen que corresponde a cada tipo de baldosa. */
function chooseTileImage(tile, { tileMap, tileImages, theme, column, row, pingPongFrame }) {
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
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/* Decorados                                                           */
/* ------------------------------------------------------------------ */

/** Cartel de madera con texto clavado en el suelo. */
function drawSign(context, screenX, text) {
  const boardWidth = measureTextWidth(text.toUpperCase()) + 10;
  const boardLeft = screenX + 8 - boardWidth / 2;
  const boardTop = GROUND_SURFACE_Y - 36;
  roundedPath(context, screenX + 6.6, GROUND_SURFACE_Y - 24, 2.8, 24, 0.8);
  fillWithOutline(context, '#a8743c', '#6a4220', GROUND_SURFACE_Y - 24, GROUND_SURFACE_Y, 0.7);
  roundedPath(context, boardLeft, boardTop, boardWidth, 14, 2.4);
  fillWithOutline(context, '#fff0c4', '#e2c07c', boardTop, boardTop + 14, 0.9);
  context.strokeStyle = 'rgba(120,70,20,0.45)';
  context.lineWidth = 0.4;
  context.strokeRect(boardLeft + 1.2, boardTop + 1.2, boardWidth - 2.4, 11.6);
  for (const nailX of [boardLeft + 2.4, boardLeft + boardWidth - 2.4]) {
    context.fillStyle = '#7a5a30';
    context.beginPath(); context.arc(nailX, boardTop + 2.6, 0.55, 0, Math.PI * 2); context.fill();
  }
  drawText(context, text, boardLeft + 5, boardTop + 3.6, '#4a2c10');
}

/** Banderín del punto de control: gris hasta que Paco lo pasa, rojo y amarillo ondeando después. */
function drawCheckpointFlag(context, screenX, isReached, stepCounter) {
  const poleX = screenX + 7;
  roundedPath(context, poleX, GROUND_SURFACE_Y - 36, 2, 36, 0.8);
  fillWithOutline(context, '#f0f0f6', '#9898a8', GROUND_SURFACE_Y - 36, GROUND_SURFACE_Y, 0.7);
  context.beginPath(); context.arc(poleX + 1, GROUND_SURFACE_Y - 37, 2.2, 0, Math.PI * 2);
  fillWithOutline(context, '#fff3a0', '#e8a810', GROUND_SURFACE_Y - 39, GROUND_SURFACE_Y - 35, 0.7);
  const flagTop = GROUND_SURFACE_Y - 34;
  const flagHeight = 11;
  const flagWidth = 16;
  const waveAt = x => Math.sin(stepCounter / 6 - x * 0.45) * (isReached ? 1.4 : 0.35) * (x / flagWidth);
  context.beginPath();
  context.moveTo(poleX + 2, flagTop);
  for (let x = 0; x <= flagWidth; x += 2) context.lineTo(poleX + 2 + x, flagTop + waveAt(x));
  for (let x = flagWidth; x >= 0; x -= 2) context.lineTo(poleX + 2 + x, flagTop + flagHeight + waveAt(x));
  context.closePath();
  if (isReached) {
    const gradient = context.createLinearGradient(0, flagTop, 0, flagTop + flagHeight);
    gradient.addColorStop(0, '#d41e36'); gradient.addColorStop(0.28, '#d41e36');
    gradient.addColorStop(0.28, '#ffd51c'); gradient.addColorStop(0.72, '#ffd51c');
    gradient.addColorStop(0.72, '#d41e36'); gradient.addColorStop(1, '#d41e36');
    context.fillStyle = gradient;
    context.fill();
  } else {
    context.fillStyle = '#a6a6b4';
    context.fill();
  }
  context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.8; context.stroke();
}

/** Cucaña de la meta (poste a rayas) con el jamón colgado. */
function drawGoalPole(context, screenX, hamY, stepCounter) {
  const poleLeft = screenX + 7;
  const poleTop = GOAL_POLE_TOP_ROW * TILE_SIZE;
  const poleBottom = STANDING_ROW * TILE_SIZE;
  roundedPath(context, poleLeft, poleTop, 3.2, poleBottom - poleTop, 1);
  fillWithOutline(context, '#ffffff', '#cfcfdc', poleTop, poleBottom, 0.8);
  context.save();
  roundedPath(context, poleLeft, poleTop, 3.2, poleBottom - poleTop, 1);
  context.clip();
  context.fillStyle = '#e02a1c';
  for (let stripeY = poleTop - 4; stripeY < poleBottom; stripeY += 9) {
    context.beginPath(); context.moveTo(poleLeft - 1, stripeY + 4); context.lineTo(poleLeft + 5, stripeY); context.lineTo(poleLeft + 5, stripeY + 4); context.lineTo(poleLeft - 1, stripeY + 8); context.closePath(); context.fill();
  }
  context.restore();
  context.beginPath(); context.arc(poleLeft + 1.6, poleTop - 2.4, 3.2, 0, Math.PI * 2);
  fillWithOutline(context, '#fff3a0', '#e8a810', poleTop - 6, poleTop + 1, 0.8);
  const sparkle = 0.5 + 0.5 * Math.sin(stepCounter / 10);
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(poleLeft + 1.6, poleTop - 2.4, 1, poleLeft + 1.6, poleTop - 2.4, 16);
  gradient.addColorStop(0, `rgba(255, 220, 100, ${0.35 + sparkle * 0.25})`);
  gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
  context.fillStyle = gradient;
  context.fillRect(poleLeft - 16, poleTop - 20, 36, 36);
  context.restore();
  drawSprite(context, SPRITES.jamon, poleLeft - 12, hamY);
}

/** Torre de molino manchego (las aspas son una entidad aparte). */
function drawWindmillTower(context, screenX) {
  const hubX = screenX + TILE_SIZE + 8;
  const towerTop = 112;
  const topHalf = 9;
  const bottomHalf = 15;
  context.beginPath();
  context.moveTo(hubX - topHalf, towerTop); context.lineTo(hubX + topHalf, towerTop);
  context.lineTo(hubX + bottomHalf, GROUND_SURFACE_Y); context.lineTo(hubX - bottomHalf, GROUND_SURFACE_Y); context.closePath();
  const gradient = context.createLinearGradient(hubX - bottomHalf, 0, hubX + bottomHalf, 0);
  gradient.addColorStop(0, '#fbfbff'); gradient.addColorStop(0.55, '#c8c8e0'); gradient.addColorStop(1, '#8484aa');
  context.fillStyle = gradient; context.fill();
  context.strokeStyle = OUTLINE_COLOR; context.lineWidth = 0.9; context.lineJoin = 'round'; context.stroke();
  context.strokeStyle = 'rgba(70,70,110,0.25)'; context.lineWidth = 0.4;
  for (let y = towerTop + 8; y < GROUND_SURFACE_Y - 4; y += 9) { context.beginPath(); context.moveTo(hubX - topHalf - (y - towerTop) * 0.04, y); context.lineTo(hubX + topHalf + (y - towerTop) * 0.04, y); context.stroke(); }
  context.beginPath(); context.moveTo(hubX - topHalf - 3, towerTop + 1); context.lineTo(hubX + topHalf + 3, towerTop + 1); context.lineTo(hubX, towerTop - 17); context.closePath();
  fillWithOutline(context, '#5a5a78', '#2c2c46', towerTop - 17, towerTop + 1, 0.9);
  roundedPath(context, hubX - 3.4, GROUND_SURFACE_Y - 15, 6.8, 15, 3);
  fillWithOutline(context, '#6a4224', '#3a2010', GROUND_SURFACE_Y - 15, GROUND_SURFACE_Y, 0.7);
  roundedPath(context, hubX - 2, 138, 4, 7, 2);
  fillWithOutline(context, '#fff2b0', '#ffc860', 138, 145, 0.6);
}

/** Pedestal con la tortilla y la receta flotando (sala final del castillo). */
function drawRecipePedestal(context, screenX, stepCounter) {
  roundedPath(context, screenX + 4, GROUND_SURFACE_Y - 18, 24, 18, 1.6);
  fillWithOutline(context, '#b8b0c6', '#6c6480', GROUND_SURFACE_Y - 18, GROUND_SURFACE_Y, 0.9);
  roundedPath(context, screenX, GROUND_SURFACE_Y - 23, 32, 6, 2);
  fillWithOutline(context, '#e0d8ec', '#9890ac', GROUND_SURFACE_Y - 23, GROUND_SURFACE_Y - 17, 0.9);
  const floatOffset = Math.sin(stepCounter / 15) * 2;
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(screenX + 16, GROUND_SURFACE_Y - 40, 2, screenX + 16, GROUND_SURFACE_Y - 40, 34);
  gradient.addColorStop(0, `rgba(255, 235, 150, ${0.5 + 0.15 * Math.sin(stepCounter / 12)})`);
  gradient.addColorStop(1, 'rgba(255, 220, 120, 0)');
  context.fillStyle = gradient;
  context.fillRect(screenX - 20, GROUND_SURFACE_Y - 76, 72, 72);
  context.restore();
  drawSprite(context, SPRITES.tortilla, screenX + 8, GROUND_SURFACE_Y - 34);
  drawSprite(context, SPRITES.receta, screenX + 10, GROUND_SURFACE_Y - 56 + floatOffset);
}

/** Resplandor cálido de una farola, con un leve parpadeo. */
function drawLampGlow(context, x, y, stepCounter) {
  const flicker = 0.85 + 0.15 * Math.sin(stepCounter / 9 + x);
  context.save();
  context.globalCompositeOperation = 'lighter';
  const gradient = context.createRadialGradient(x, y, 1, x, y, 30);
  gradient.addColorStop(0, `rgba(255, 220, 130, ${0.55 * flicker})`);
  gradient.addColorStop(1, 'rgba(255, 190, 90, 0)');
  context.fillStyle = gradient;
  context.fillRect(x - 30, y - 30, 60, 60);
  context.restore();
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
      case 'checkpoint': drawCheckpointFlag(context, screenX, isCheckpointReached, stepCounter); break;
      case 'goalPole': drawGoalPole(context, screenX, hamY === null ? HAM_START_Y : hamY, stepCounter); break;
      case 'bar': { const barImage = getBarImage(); context.drawImage(barImage, screenX - DECORATION_PADDING, GROUND_SURFACE_Y - BAR_SIZE.height - DECORATION_PADDING, barImage.width / RENDER_SCALE, barImage.height / RENDER_SCALE); break; }
      case 'windmillTower': drawWindmillTower(context, screenX); break;
      case 'abuela': drawSprite(context, SPRITES.abuela, screenX, GROUND_SURFACE_Y - SPRITES.abuela.height, { mirrored: true }); break;
      case 'recipePedestal': drawRecipePedestal(context, screenX, stepCounter); break;
      default: {
        // Plantas y farolas: se apoyan sobre el suelo.
        const decorationImage = getGroundDecorationImage(decoration.type);
        if (decorationImage) {
          drawGroundDecoration(context, decorationImage, screenX, GROUND_SURFACE_Y);
          if (decoration.type === 'farola') drawLampGlow(context, screenX + 6, GROUND_SURFACE_Y - 40, stepCounter);
        }
      }
    }
  }
}

/** Briznas de hierba que se mecen con el viento sobre el suelo expuesto. */
function drawGrassBlades(context, column, screenX, screenY, stepCounter) {
  for (let blade = 0; blade < 4; blade++) {
    const seed = (column * 31 + blade * 17) % 11;
    const baseX = screenX + 1.5 + blade * 4 + (seed % 3) * 0.6;
    const height = 3 + (seed % 4) * 0.7;
    const sway = Math.sin(stepCounter / 22 + column * 0.7 + blade) * 0.9 + 0.4;
    context.beginPath();
    context.moveTo(baseX - 0.8, screenY + 0.6);
    context.quadraticCurveTo(baseX + sway * 0.4, screenY - height * 0.6, baseX + sway, screenY - height);
    context.quadraticCurveTo(baseX + 0.3 + sway * 0.4, screenY - height * 0.5, baseX + 0.8, screenY + 0.6);
    context.closePath();
    context.fillStyle = blade % 2 ? '#4fc44a' : '#7fe05a';
    context.fill();
    context.strokeStyle = '#1b6a2a';
    context.lineWidth = 0.4;
    context.stroke();
  }
}

/** Busca la altura (en píxeles) de la primera baldosa sólida bajo un punto, o null si no hay (foso). */
function findGroundBelow(tileMap, centerX, fromY) {
  const column = Math.floor(centerX / TILE_SIZE);
  if (column < 0 || column >= tileMap.widthInTiles) return null;
  for (let row = Math.max(0, Math.floor(fromY / TILE_SIZE)); row < tileMap.heightInTiles; row++) {
    if (isSolidTile(tileMap.getTile(column, row))) return row * TILE_SIZE;
  }
  return null;
}

/** Sombra suave en el suelo bajo un personaje; se encoge y desvanece con la altura. */
function drawShadow(context, tileMap, centerX, feetY, halfWidth, cameraX) {
  const groundY = findGroundBelow(tileMap, centerX, feetY - 2);
  if (groundY === null) return;
  const distance = Math.max(0, groundY - feetY);
  if (distance > 120) return;
  const fade = 1 - distance / 130;
  const radiusX = halfWidth * (0.6 + 0.5 * fade);
  const screenX = centerX - cameraX;
  context.save();
  context.translate(screenX, groundY + 0.4);
  context.scale(1, 0.24);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  gradient.addColorStop(0, `rgba(12, 6, 30, ${0.5 * fade})`);
  gradient.addColorStop(1, 'rgba(12, 6, 30, 0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, radiusX, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * Dibuja las sombras de Paco y de los enemigos.
 * @param {CanvasRenderingContext2D} context
 * @param {Object} scene
 * @param {import('../world/TileMap.js').TileMap} scene.tileMap
 * @param {Array} scene.entities
 * @param {import('../entities/Player.js').Player} scene.player
 * @param {number} cameraX
 */
export function drawShadows(context, { tileMap, entities, player }, cameraX) {
  for (const entity of entities) {
    if (!entity.isEnemy || entity.isDefeated || entity.drawsBehindTiles) continue;
    if (entity.x + entity.width < cameraX - 8 || entity.x > cameraX + SCREEN_WIDTH + 8) continue;
    drawShadow(context, tileMap, entity.centerX, entity.bottom, Math.max(6, entity.width * 0.6), cameraX);
  }
  if (!player.isDead && !player.isHidden) drawShadow(context, tileMap, player.centerX, player.bottom, 8, cameraX);
}

/** Lienzo auxiliar para el oscurecimiento de las escenas con poca luz. */
let lightCanvas = null;

/**
 * Oscurece la escena dejando círculos de luz (alrededor de Paco y de otras fuentes).
 * @param {CanvasRenderingContext2D} context
 * @param {{darkness:number, color:string, playerLightRadius:number}} lighting
 * @param {Array<{x:number, y:number, radius:number}>} lights Posiciones en pantalla.
 */
export function drawLighting(context, lighting, lights) {
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.width = SCREEN_WIDTH * RENDER_SCALE;
    lightCanvas.height = SCREEN_HEIGHT * RENDER_SCALE;
  }
  const lightContext = lightCanvas.getContext('2d');
  lightContext.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  lightContext.globalCompositeOperation = 'source-over';
  lightContext.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  lightContext.fillStyle = lighting.color;
  lightContext.globalAlpha = lighting.darkness;
  lightContext.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  lightContext.globalAlpha = 1;
  lightContext.globalCompositeOperation = 'destination-out';
  for (const light of lights) {
    const gradient = lightContext.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.65)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    lightContext.fillStyle = gradient;
    lightContext.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
  }
  context.drawImage(lightCanvas, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * Antorchas del castillo: llamas que bailan y un halo cálido. Están en la capa
 * cercana del fondo, así que se mueven con su parallax. Devuelve sus posiciones
 * en pantalla para que también iluminen.
 * @returns {Array<{x:number, y:number, radius:number}>}
 */
export function drawTorches(context, cameraX, stepCounter) {
  const lights = [];
  const period = 128;
  const offset = (((101.5 - cameraX * PARALLAX_FACTORS.nearLayer) % period) + period) % period;
  for (let torch = -1; torch < 4; torch++) {
    const x = offset + torch * period;
    if (x < -30 || x > SCREEN_WIDTH + 30) continue;
    const flicker = 0.8 + 0.2 * Math.sin(stepCounter / 3 + torch * 2.3) + 0.08 * Math.sin(stepCounter / 1.7 + torch);
    const y = 121;
    context.save();
    context.globalCompositeOperation = 'lighter';
    const halo = context.createRadialGradient(x, y, 1, x, y, 46);
    halo.addColorStop(0, `rgba(255,170,70,${0.5 * flicker})`);
    halo.addColorStop(1, 'rgba(255,120,40,0)');
    context.fillStyle = halo;
    context.fillRect(x - 46, y - 46, 92, 92);
    context.restore();
    context.beginPath();
    context.moveTo(x - 3.2, y + 3);
    context.quadraticCurveTo(x - 4.6, y - 3, x, y - 11 * flicker);
    context.quadraticCurveTo(x + 4.6, y - 3, x + 3.2, y + 3);
    context.closePath();
    const flame = context.createLinearGradient(0, y - 11, 0, y + 3);
    flame.addColorStop(0, '#fff3a0'); flame.addColorStop(0.5, '#ff9a2a'); flame.addColorStop(1, '#d4301c');
    context.fillStyle = flame;
    context.fill();
    lights.push({ x, y, radius: 62 });
  }
  return lights;
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

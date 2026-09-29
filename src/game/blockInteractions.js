/**
 * @file Qué pasa cuando Paco golpea un bloque con la cabeza.
 *
 *   - Bloque "¿?" u oculto: suelta su premio (peseta, bocadillo, churros…) y
 *     se convierte en un bloque usado.
 *   - Ladrillo con premio: igual que un bloque "¿?".
 *   - Ladrillo normal: Paco grande lo rompe; Paco pequeño solo lo hace botar.
 * Además, todo lo que esté encima del bloque golpeado sale despedido:
 * los enemigos quedan noqueados y los objetos dan un saltito.
 */
import { TILE_SIZE, GAME_RULES } from '../config/constants.js';
import { random, rectanglesOverlap } from '../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { TILE, BLOCK_CONTENT } from '../world/tileTypes.js';
import { blockKey } from '../world/LevelBuilder.js';
import { GAMEPLAY_MESSAGES } from '../world/texts.js';
import { POWER_LEVEL } from '../entities/Player.js';
import { PowerUpItem, POWER_UP_KIND } from '../entities/PowerUpItem.js';
import { PopUpOctopus } from '../entities/enemies/PopUpOctopus.js';

/** Probabilidad de que Paco pequeño se queje al no poder romper un ladrillo. */
const COMPLAINT_PROBABILITY = 0.08;
/** Velocidades de los cuatro trozos de un ladrillo roto: [horizontal, vertical]. */
const BRICK_DEBRIS_VELOCITIES = [[-1.2, -5], [1.2, -5], [-1.2, -3], [1.2, -3]];

/**
 * Decide qué bloque se golpea cuando la cabeza toca dos a la vez: el más
 * cercano al centro de Paco.
 * @param {import('./World.js').World} world
 * @param {import('../entities/Player.js').Player} player
 * @param {import('../world/tileCollision.js').HeadBump} headBump
 */
export function handlePlayerHeadBump(world, player, headBump) {
  let closestColumn = headBump.columns[0];
  let closestDistance = Infinity;
  for (const column of headBump.columns) {
    const distance = Math.abs(column * TILE_SIZE + TILE_SIZE / 2 - player.centerX);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColumn = column;
    }
  }
  bumpBlockFromBelow(world, closestColumn, headBump.row, player);
}

/**
 * Golpea un bloque concreto desde abajo.
 * @param {import('./World.js').World} world
 * @param {number} column
 * @param {number} row
 * @param {import('../entities/Player.js').Player} player
 */
export function bumpBlockFromBelow(world, column, row, player) {
  const tile = world.tileMap.getTile(column, row);
  const content = world.level.blockContents.get(blockKey(column, row));
  const isPrizeBlock = tile === TILE.QUESTION_BLOCK || tile === TILE.HIDDEN_BLOCK || (tile === TILE.BRICK && content);

  if (isPrizeBlock) {
    releaseBlockPrize(world, column, row, content, player);
    world.startBlockBumpAnimation(column, row);
    launchEverythingOnTopOfBlock(world, column, row);
  } else if (tile === TILE.BRICK) {
    if (player.isBig) breakBrick(world, column, row);
    else {
      world.startBlockBumpAnimation(column, row);
      soundEngine.playSoundEffect(SOUND_EFFECT.BUMP);
      if (random() < COMPLAINT_PROBABILITY) world.showFloatingText(GAMEPLAY_MESSAGES.brickTooHard, column * TILE_SIZE + 8, row * TILE_SIZE - 4, '#fcd800');
    }
    launchEverythingOnTopOfBlock(world, column, row);
  } else {
    soundEngine.playSoundEffect(SOUND_EFFECT.BUMP);
  }
}

/**
 * Suelta el premio de un bloque y, si se ha vaciado, lo marca como usado.
 * @private
 */
function releaseBlockPrize(world, column, row, content, player) {
  let isEmptyNow = true;
  if (content === BLOCK_CONTENT.MULTI_COIN) {
    const key = blockKey(column, row);
    const coinsLeft = (world.remainingCoinsInBlocks.has(key) ? world.remainingCoinsInBlocks.get(key) : GAME_RULES.coinsInMultiCoinBlock) - 1;
    world.remainingCoinsInBlocks.set(key, coinsLeft);
    isEmptyNow = coinsLeft <= 0;
    world.popCoinOutOfBlock(column, row);
  } else if (!content || content === BLOCK_CONTENT.COIN) {
    world.popCoinOutOfBlock(column, row);
  } else {
    world.addEntity(new PowerUpItem(choosePowerUpKind(content, player), column, row));
    soundEngine.playSoundEffect(SOUND_EFFECT.ITEM_APPEARS);
  }
  if (isEmptyNow) world.tileMap.setTile(column, row, TILE.USED_BLOCK);
}

/**
 * Convierte el contenido guardado en el bloque en el objeto que sale.
 * Un "potenciador" es un bocadillo si Paco es pequeño y un pimiento si ya es grande.
 * @private
 */
function choosePowerUpKind(content, player) {
  switch (content) {
    case BLOCK_CONTENT.POWER_UP: return player.powerLevel === POWER_LEVEL.SMALL ? POWER_UP_KIND.BOCADILLO : POWER_UP_KIND.PIMIENTO;
    case BLOCK_CONTENT.CHURROS: return POWER_UP_KIND.CHURROS;
    default: return POWER_UP_KIND.LOTERIA;
  }
}

/** @private Rompe un ladrillo en cuatro trozos. */
function breakBrick(world, column, row) {
  world.tileMap.setTile(column, row, TILE.EMPTY);
  BRICK_DEBRIS_VELOCITIES.forEach(([velocityX, velocityY], index) => {
    const pieceX = column * TILE_SIZE + (index % 2 ? 9 : 1);
    const pieceY = row * TILE_SIZE + (index < 2 ? 1 : 9);
    world.spawnBrickDebris(pieceX, pieceY, velocityX, velocityY);
  });
  soundEngine.playSoundEffect(SOUND_EFFECT.BRICK_BREAK);
  world.session.addPoints(GAME_RULES.pointsPerBrokenBrick);
}

/**
 * Lanza por los aires lo que esté apoyado sobre el bloque golpeado y recoge
 * la peseta que haya justo encima.
 * @private
 */
function launchEverythingOnTopOfBlock(world, column, row) {
  const blockTopY = row * TILE_SIZE;
  const blockArea = { x: column * TILE_SIZE, y: blockTopY - 3, width: TILE_SIZE, height: 6 };
  for (const entity of world.entities) {
    if (entity.isDefeated || entity.shouldBeRemoved) continue;
    const hitbox = entity.getHitbox();
    const feetArea = { x: hitbox.x, y: hitbox.y + hitbox.height - 1, width: hitbox.width, height: 2 };
    if (!rectanglesOverlap(feetArea, blockArea)) continue;
    const canBeKnockedFromBelow = entity.isEnemy && !entity.resistsShellsAndExplosions && !(entity instanceof PopUpOctopus);
    if (canBeKnockedFromBelow) {
      entity.knockOut(0);
      world.awardPoints(GAME_RULES.pointsForEnemyKnockedFromBelow, entity.centerX, entity.y);
      soundEngine.playSoundEffect(SOUND_EFFECT.KICK);
    } else if (entity.isPowerUp && !entity.isEmerging) {
      entity.bounceFromBlockBelow(entity.centerX < column * TILE_SIZE + TILE_SIZE / 2 ? -1 : 1);
    }
  }
  if (row > 0 && world.tileMap.getTile(column, row - 1) === TILE.COIN) {
    world.tileMap.setTile(column, row - 1, TILE.EMPTY);
    world.popCoinOutOfBlock(column, row - 1);
  }
}

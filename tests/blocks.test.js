/**
 * @file Tests de los bloques: premios, ladrillos, bloques ocultos y pesetas.
 *
 * En todos, Paco está justo debajo de un bloque en la columna 4, fila 9
 * (4 baldosas por encima del suelo), y salta para golpearlo con la cabeza.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GAME_RULES } from '../src/config/constants.js';
import { BUTTON } from '../src/core/input.js';
import { TILE, BLOCK_CONTENT } from '../src/world/tileTypes.js';
import { POWER_LEVEL } from '../src/entities/Player.js';
import { PowerUpItem, POWER_UP_KIND } from '../src/entities/PowerUpItem.js';
import { createTestWorld, advanceSteps, advanceUntil, placePlayerOnGround, spawnEnemy } from './support/worldTestKit.js';

const BLOCK_COLUMN = 4;
const BLOCK_ROW = 9;

/**
 * Crea un mundo con suelo, deja a Paco bajo el bloque y le da tiempo a asentarse.
 * @param {(level: import('../src/world/LevelBuilder.js').LevelBuilder) => void} addBlocks
 * @param {number} [powerLevel]
 */
function createWorldWithBlock(addBlocks, powerLevel = POWER_LEVEL.SMALL) {
  const scenario = createTestWorld({
    powerLevel,
    buildLevel: level => {
      level.addGround(0, 39);
      addBlocks(level);
    }
  });
  placePlayerOnGround(scenario.world, BLOCK_COLUMN);
  advanceSteps(scenario.world, scenario.controls, 3);
  return scenario;
}

/**
 * Paco salta una vez y espera a volver al suelo.
 * @param {import('./support/worldTestKit.js').TestScenario} scenario
 */
function jumpOnceAndLand({ world, controls }) {
  controls.hold(BUTTON.JUMP);
  advanceSteps(world, controls, 20);
  controls.release(BUTTON.JUMP);
  advanceUntil(world, controls, () => world.player.isOnGround, 120);
  advanceSteps(world, controls, 2);
}

const blockTile = world => world.tileMap.getTile(BLOCK_COLUMN, BLOCK_ROW);
const findPowerUps = world => world.entities.filter(entity => entity instanceof PowerUpItem);

test('golpear un bloque ¿? da una peseta con sus puntos y lo deja usado', () => {
  const scenario = createWorldWithBlock(level => level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW));
  jumpOnceAndLand(scenario);
  assert.equal(scenario.session.coins, 1);
  assert.equal(scenario.session.score, GAME_RULES.pointsPerCoin);
  assert.equal(blockTile(scenario.world), TILE.USED_BLOCK);
});

test('el bloque de potenciador da un bocadillo a Paco pequeño', () => {
  const scenario = createWorldWithBlock(level => level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW, BLOCK_CONTENT.POWER_UP));
  jumpOnceAndLand(scenario);
  assert.deepEqual(findPowerUps(scenario.world).map(item => item.kind), [POWER_UP_KIND.BOCADILLO]);
});

test('el bloque de potenciador da un pimiento a Paco grande', () => {
  const scenario = createWorldWithBlock(level => level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW, BLOCK_CONTENT.POWER_UP), POWER_LEVEL.BIG);
  jumpOnceAndLand(scenario);
  assert.deepEqual(findPowerUps(scenario.world).map(item => item.kind), [POWER_UP_KIND.PIMIENTO]);
});

test('coger el bocadillo hace crecer a Paco', () => {
  const scenario = createWorldWithBlock(level => level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW, BLOCK_CONTENT.POWER_UP));
  const { world, controls } = scenario;
  jumpOnceAndLand(scenario);
  // Se espera a que el bocadillo termine de salir del bloque; después se desliza
  // hacia la derecha y Paco, que es más rápido, lo alcanza.
  const [bocadillo] = findPowerUps(world);
  advanceUntil(world, controls, () => !bocadillo.isEmerging, 60);
  controls.hold(BUTTON.RIGHT);
  const steps = advanceUntil(world, controls, () => world.player.powerLevel === POWER_LEVEL.BIG, 400);
  assert.notEqual(steps, -1, 'Paco no llegó a coger el bocadillo');
});

test(`el bloque de varias pesetas da ${GAME_RULES.coinsInMultiCoinBlock} pesetas y luego se agota`, () => {
  const scenario = createWorldWithBlock(level => level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW, BLOCK_CONTENT.MULTI_COIN));
  for (let attempt = 0; attempt < 12 && blockTile(scenario.world) !== TILE.USED_BLOCK; attempt++) jumpOnceAndLand(scenario);
  assert.equal(scenario.session.coins, GAME_RULES.coinsInMultiCoinBlock);
  assert.equal(blockTile(scenario.world), TILE.USED_BLOCK);
});

test('Paco pequeño no rompe los ladrillos', () => {
  const scenario = createWorldWithBlock(level => level.addBricks(BLOCK_COLUMN, BLOCK_ROW));
  jumpOnceAndLand(scenario);
  assert.equal(blockTile(scenario.world), TILE.BRICK);
});

test('Paco grande rompe los ladrillos y suma sus puntos', () => {
  const scenario = createWorldWithBlock(level => level.addBricks(BLOCK_COLUMN, BLOCK_ROW), POWER_LEVEL.BIG);
  jumpOnceAndLand(scenario);
  assert.equal(blockTile(scenario.world), TILE.EMPTY);
  assert.equal(scenario.session.score, GAME_RULES.pointsPerBrokenBrick);
});

test('golpear un bloque noquea al enemigo que está encima', () => {
  const scenario = createWorldWithBlock(level => {
    level.addBricks(BLOCK_COLUMN - 2, BLOCK_ROW, 5);
    level.addQuestionBlock(BLOCK_COLUMN, BLOCK_ROW);
  });
  const guiri = spawnEnemy(scenario.world, 'guiri', BLOCK_COLUMN, BLOCK_ROW - 1);
  jumpOnceAndLand(scenario);
  assert.ok(guiri.isKnockedOut);
});

test('el bloque oculto aparece al golpearlo y suelta un décimo de lotería', () => {
  const scenario = createWorldWithBlock(level => level.addHiddenBlock(BLOCK_COLUMN, BLOCK_ROW, BLOCK_CONTENT.EXTRA_LIFE));
  assert.equal(blockTile(scenario.world), TILE.HIDDEN_BLOCK);
  jumpOnceAndLand(scenario);
  assert.equal(blockTile(scenario.world), TILE.USED_BLOCK);
  assert.deepEqual(findPowerUps(scenario.world).map(item => item.kind), [POWER_UP_KIND.LOTERIA]);
});

test('las pesetas sueltas se recogen al tocarlas', () => {
  const { world, controls, session } = createTestWorld({
    buildLevel: level => {
      level.addGround(0, 39);
      level.addCoinRow(6, 12, 3);
    }
  });
  controls.hold(BUTTON.RIGHT);
  advanceSteps(world, controls, 90);
  assert.equal(session.coins, 3);
  assert.equal(world.tileMap.getTile(6, 12), TILE.EMPTY);
});

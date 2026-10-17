/**
 * @file Tests de las Flores Maravilla, las monedas gigantes, las salas
 * secretas y las plataformas al ritmo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TILE_SIZE } from '../src/config/constants.js';
import { BUTTON } from '../src/core/input.js';
import { TILE } from '../src/world/tileTypes.js';
import { LevelBuilder } from '../src/world/LevelBuilder.js';
import { WonderSeed } from '../src/entities/wonder/WonderSeed.js';
import { FallingCoin } from '../src/entities/wonder/FallingCoin.js';
import { StampedeBull } from '../src/entities/wonder/StampedeBull.js';
import { BigCoin } from '../src/entities/wonder/BigCoin.js';
import { createTestWorld, advanceSteps, advanceUntil, placePlayerOnGround } from './support/worldTestKit.js';

/** Mundo con una Flor Maravilla en la columna 6 y fin del tramo en la 30. */
function createWonderWorld(kind, extra = () => {}) {
  const scenario = createTestWorld({
    widthInTiles: 60,
    buildLevel: level => {
      level.addGround(0, 59);
      level.addWonder({ column: 6, kind, endColumn: 30 });
      extra(level);
    }
  });
  placePlayerOnGround(scenario.world, 2);
  return scenario;
}

test('al tocar la Flor Maravilla se activa y al terminar el tramo aparece la semilla', () => {
  const scenario = createWonderWorld('moon');
  const { world, controls } = scenario;
  advanceSteps(world, controls, 130);
  assert.equal(world.wonder.isActive, false, 'antes de tocar la flor no hay maravilla');
  placePlayerOnGround(world, 2);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 4);
  assert.equal(world.wonder.isActive, true);
  placePlayerOnGround(world, 31);
  advanceSteps(world, controls, 3);
  assert.equal(world.wonder.isActive, false);
  assert.ok(world.entities.some(entity => entity instanceof WonderSeed), 'aparece la Semilla Maravilla');
});

test('en la maravilla lunar la gravedad baja y luego se restablece', () => {
  const { world, controls } = createWonderWorld('moon');
  advanceSteps(world, controls, 130);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 4);
  assert.ok(world.player.gravityScale < 0.5);
  placePlayerOnGround(world, 31);
  advanceSteps(world, controls, 3);
  assert.equal(world.player.gravityScale, 1);
});

test('coger la Semilla Maravilla la guarda en la partida una sola vez', () => {
  const { world, controls, session } = createWonderWorld('moon');
  const seed = new WonderSeed(20, 9);
  world.addEntity(seed);
  world.player.x = seed.x;
  world.player.y = seed.y;
  advanceSteps(world, controls, 3);
  assert.ok(session.seeds.has(world.levelIndex));
  const scoreAfterFirst = session.score;
  assert.equal(session.collectSeed(world.levelIndex), false, 'la segunda vez ya no es nueva');
  assert.ok(session.score >= scoreAfterFirst);
});

test('la lluvia de pesetas hace caer monedas y se pueden recoger', () => {
  const { world, controls, session } = createWonderWorld('rain');
  advanceSteps(world, controls, 130);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 40);
  assert.ok(world.entities.some(entity => entity instanceof FallingCoin), 'llueven pesetas');
  const coinsBefore = session.coins;
  const coin = world.entities.find(entity => entity instanceof FallingCoin);
  world.player.x = coin.x;
  world.player.y = coin.y;
  advanceSteps(world, controls, 2);
  assert.ok(session.coins > coinsBefore);
});

test('en la estampida aparece un toro que persigue a Paco y desaparece al terminar', () => {
  const { world, controls } = createWonderWorld('stampede');
  advanceSteps(world, controls, 130);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 4);
  const bull = world.entities.find(entity => entity instanceof StampedeBull);
  assert.ok(bull, 'aparece el toro gigante');
  const startX = bull.x;
  advanceSteps(world, controls, 20);
  assert.ok(bull.x > startX, 'el toro avanza');
  placePlayerOnGround(world, 31);
  advanceSteps(world, controls, 3);
  assert.equal(world.entities.some(entity => entity instanceof StampedeBull), false);
});

test('las plataformas al ritmo empiezan dormidas, despiertan con la flor y se alternan', () => {
  const { world, controls } = createWonderWorld('rhythm', level => {
    level.addBeatPlatforms(10, 8, 3, 'A');
    level.addBeatPlatforms(14, 8, 3, 'B');
  });
  assert.equal(world.tileMap.getTile(10, 8), TILE.BEAT_A_OFF, 'dormidas al empezar');
  assert.equal(world.tileMap.isSolid(10, 8), false);
  advanceSteps(world, controls, 130);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 4);
  assert.equal(world.tileMap.getTile(10, 8), TILE.BEAT_A_ON);
  assert.equal(world.tileMap.getTile(14, 8), TILE.BEAT_B_OFF);
  world.wonder.active.endX = 59 * TILE_SIZE; // que no termine mientras esperamos el pulso
  placePlayerOnGround(world, 8);
  advanceSteps(world, controls, 60);
  assert.equal(world.tileMap.getTile(10, 8), TILE.BEAT_A_OFF, 'tras un pulso cambian');
  assert.equal(world.tileMap.getTile(14, 8), TILE.BEAT_B_ON);
});

test('el desfile vuelve inofensivos a los enemigos del tramo', () => {
  const { world, controls } = createWonderWorld('parade', level => level.addEnemy('guiri', 20));
  advanceSteps(world, controls, 130);
  world.player.x = 6 * TILE_SIZE;
  advanceSteps(world, controls, 4);
  world.player.x = 14 * TILE_SIZE;
  advanceSteps(world, controls, 3);
  const guiri = world.entities.find(entity => entity.isEnemy);
  assert.ok(guiri, 'el guiri ha aparecido');
  assert.equal(guiri.isDancing, true);
  assert.equal(guiri.isHarmful, false);
});

test('las monedas gigantes se cuentan por nivel y solo la primera vez', () => {
  const { world, controls, session } = createTestWorld({
    widthInTiles: 40,
    buildLevel: level => { level.addGround(0, 39); level.addBigCoin(10, 10); level.addBigCoin(14, 10); }
  });
  advanceSteps(world, controls, 120);
  const coin = new BigCoin(8, 11, { number: 0 });
  world.addEntity(coin);
  world.player.x = coin.x;
  world.player.y = coin.y;
  advanceSteps(world, controls, 2);
  assert.equal(session.countBigCoinsInLevel(world.levelIndex), 1);
  assert.equal(session.collectBigCoin(world.levelIndex, 0), false);
  assert.equal(world.level.bigCoinCount, 2);
});

test('una alcantarilla lleva a una sala secreta y la puerta de salida devuelve a Paco', () => {
  const scenario = createTestWorld({
    widthInTiles: 60,
    buildLevel: level => {
      level.addGround(0, 59);
      level.addDoor({ column: 10, look: 'manhole', roomId: 'tesoro' });
      level.addRoom('tesoro', () => {
        const room = new LevelBuilder(30, 'taberna');
        room.addGround(0, 29);
        room.setRoomExit(26);
        room.addBigCoin(12, 10);
        return room.build();
      });
    }
  });
  const { world, controls } = scenario;
  placePlayerOnGround(world, 10);
  advanceSteps(world, controls, 10);
  const mainTileMap = world.tileMap;
  const doorX = world.player.x;
  controls.hold(BUTTON.DOWN);
  advanceUntil(world, controls, () => world.areas.isInRoom, 120);
  controls.release(BUTTON.DOWN);
  assert.equal(world.areas.isInRoom, true, 'Paco ha entrado en la sala');
  assert.equal(world.theme.name, 'taberna');
  assert.equal(world.level.isRoom, true);
  assert.notEqual(world.tileMap, mainTileMap);
  advanceSteps(world, controls, 40);
  // Paco va hasta la puerta de salida y la usa.
  placePlayerOnGround(world, 26);
  advanceSteps(world, controls, 6);
  controls.hold(BUTTON.UP);
  advanceUntil(world, controls, () => !world.areas.isInRoom, 200);
  controls.release(BUTTON.UP);
  assert.equal(world.areas.isInRoom, false);
  assert.equal(world.tileMap, mainTileMap, 'vuelve al mapa principal');
  assert.ok(Math.abs(world.player.x - doorX) < 1);
});

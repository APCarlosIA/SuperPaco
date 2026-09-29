/**
 * @file Tests del flujo de la partida: meta, punto de control, vidas, pesetas
 * y paso entre pantallas (fin de partida, siguiente nivel y final del juego).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GAME_RULES, TILE_SIZE } from '../src/config/constants.js';
import { GameSession } from '../src/game/GameSession.js';
import { Game } from '../src/game/Game.js';
import { World } from '../src/game/World.js';
import { GameOverScreen } from '../src/game/screens/GameOverScreen.js';
import { LevelIntroScreen } from '../src/game/screens/LevelIntroScreen.js';
import { EndingScreen } from '../src/game/screens/EndingScreen.js';
import { POWER_LEVEL } from '../src/entities/Player.js';
import { LEVELS } from '../src/world/levels.js';
import { GOAL_POLE_TOP_ROW } from '../src/world/LevelBuilder.js';
import { ScriptedControls } from './support/ScriptedControls.js';
import { createTestWorld, advanceSteps, advanceUntil, placePlayerOnGround } from './support/worldTestKit.js';

const GOAL_COLUMN = 12;
const POLE_BOTTOM_Y = 12 * TILE_SIZE;

/**
 * Crea un nivel corto con meta y deja a Paco tocando la cucaña a la altura indicada.
 * @param {number} feetY Altura de los pies de Paco al agarrarse.
 */
function grabGoalPoleAt(feetY) {
  const scenario = createTestWorld({
    buildLevel: level => {
      level.addGround(0, 39);
      level.setGoal(GOAL_COLUMN);
    }
  });
  const player = scenario.world.player;
  player.x = GOAL_COLUMN * TILE_SIZE + 6 - player.width;
  player.y = feetY - player.height;
  advanceSteps(scenario.world, scenario.controls, 1);
  return scenario;
}

/* ---------------- Sesión de juego ---------------- */

test(`cada ${GAME_RULES.coinsPerExtraLife} pesetas se gana una vida`, () => {
  const session = new GameSession();
  session.coins = GAME_RULES.coinsPerExtraLife - 1;
  assert.equal(session.addCoin(), true);
  assert.equal(session.coins, 0);
  assert.equal(session.lives, GAME_RULES.startingLives + 1);
});

test('al perder una vida se pierde también el poder acumulado', () => {
  const session = new GameSession();
  session.carriedPowerLevel = POWER_LEVEL.SPICY;
  assert.equal(session.loseLife(), GAME_RULES.startingLives - 1);
  assert.equal(session.carriedPowerLevel, POWER_LEVEL.SMALL);
});

test('al pasar de nivel se conserva el poder y se olvida el punto de control', () => {
  const session = new GameSession();
  session.hasReachedCheckpoint = true;
  session.advanceToNextLevel(POWER_LEVEL.BIG);
  assert.equal(session.levelIndex, 1);
  assert.equal(session.carriedPowerLevel, POWER_LEVEL.BIG);
  assert.equal(session.hasReachedCheckpoint, false);
});

/* ---------------- Meta y punto de control ---------------- */

test('agarrarse arriba de la cucaña da 5000 puntos', () => {
  const { session, world } = grabGoalPoleAt(GOAL_POLE_TOP_ROW * TILE_SIZE + 4);
  assert.ok(world.goalSequence, 'debería empezar la escena de la meta');
  assert.equal(session.score, GAME_RULES.goalPolePoints[0].points);
});

test('agarrarse abajo de la cucaña da solo 100 puntos', () => {
  const { session } = grabGoalPoleAt(POLE_BOTTOM_Y - 1);
  assert.equal(session.score, 100);
});

test('tras la meta, el tiempo sobrante se convierte en puntos y el nivel se completa', () => {
  const { world, controls, session, events } = grabGoalPoleAt(GOAL_POLE_TOP_ROW * TILE_SIZE + 4);
  const timeLeftAtGoal = world.timeRemaining;
  const scoreAtGoal = session.score;
  assert.notEqual(advanceUntil(world, controls, () => events.levelsCompleted === 1, 3000), -1, 'el nivel no se completó');
  assert.equal(world.timeRemaining, 0);
  assert.equal(session.score, scoreAtGoal + timeLeftAtGoal * GAME_RULES.pointsPerTimeUnitLeft);
  assert.ok(world.player.isHidden, 'Paco debería haber entrado en el bar');
});

test('tras pasar el punto de control, Paco reaparece allí', () => {
  const checkpointColumn = 10;
  const buildLevel = level => {
    level.addGround(0, 39);
    level.setCheckpoint(checkpointColumn);
  };
  const first = createTestWorld({ buildLevel });
  placePlayerOnGround(first.world, checkpointColumn + 1);
  advanceSteps(first.world, first.controls, 1);
  assert.ok(first.session.hasReachedCheckpoint);

  const second = createTestWorld({ buildLevel, session: first.session });
  assert.equal(Math.floor(second.world.player.x / TILE_SIZE), checkpointColumn);
});

/* ---------------- Paso entre pantallas ---------------- */

/**
 * Crea una partida y entra directamente en un nivel.
 * @param {number} levelIndex
 * @param {number} lives
 */
function startGameAtLevel(levelIndex, lives) {
  const controls = new ScriptedControls();
  const game = new Game({ controls });
  game.start();
  game.session.startNewGame(levelIndex);
  game.session.lives = lives;
  game.startCurrentLevel();
  return { game, controls };
}

/** Avanza el juego completo hasta que la pantalla activa sea de un tipo. */
function advanceGameUntilScreen(game, controls, ScreenClass, maxSteps = 600) {
  for (let step = 0; step < maxSteps; step++) {
    controls.update();
    game.update();
    if (game.activeScreen instanceof ScreenClass) return true;
  }
  return false;
}

test('al perder una vida con vidas de sobra se vuelve a la presentación del nivel', () => {
  const { game, controls } = startGameAtLevel(0, 3);
  game.activeScreen.killPlayer({ fellIntoPit: true });
  assert.ok(advanceGameUntilScreen(game, controls, LevelIntroScreen));
  assert.equal(game.session.lives, 2);
});

test('al perder la última vida aparece la pantalla de fin de partida', () => {
  const { game, controls } = startGameAtLevel(0, 1);
  game.activeScreen.killPlayer({ fellIntoPit: true });
  assert.ok(advanceGameUntilScreen(game, controls, GameOverScreen));
});

test('al superar un nivel se pasa al siguiente conservando el poder', () => {
  const { game } = startGameAtLevel(0, 3);
  const world = game.activeScreen;
  assert.ok(world instanceof World);
  world.player.setPowerLevel(POWER_LEVEL.BIG);
  world.callbacks.onLevelCompleted(world);
  assert.ok(game.activeScreen instanceof LevelIntroScreen);
  assert.equal(game.session.levelIndex, 1);
  assert.equal(game.session.carriedPowerLevel, POWER_LEVEL.BIG);
});

test('al superar el último nivel aparece el final del juego', () => {
  const { game } = startGameAtLevel(LEVELS.length - 1, 3);
  const world = game.activeScreen;
  world.callbacks.onLevelCompleted(world);
  assert.ok(game.activeScreen instanceof EndingScreen);
});

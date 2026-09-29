/**
 * @file Utilidades para montar escenarios de prueba y avanzar la simulación.
 *
 * Permiten escribir tests cortos y legibles del tipo:
 *   const { world, controls } = createTestWorld({ buildLevel: level => level.addGround(0, 39) });
 *   controls.hold(BUTTON.RIGHT);
 *   advanceSteps(world, controls, 60);
 */
import { TILE_SIZE } from '../../src/config/constants.js';
import { seedGameplayRandom } from '../../src/core/math.js';
import { LevelBuilder } from '../../src/world/LevelBuilder.js';
import { GameSession } from '../../src/game/GameSession.js';
import { World } from '../../src/game/World.js';
import { createEntityForSpawnPoint } from '../../src/game/entityFactory.js';
import { ScriptedControls } from './ScriptedControls.js';

/** Semilla fija para que el comportamiento aleatorio sea siempre el mismo. */
export const TEST_RANDOM_SEED = 20260925;

/**
 * @typedef {Object} TestScenario
 * @property {World} world
 * @property {ScriptedControls} controls
 * @property {GameSession} session
 * @property {{levelsCompleted: number, deathAnimationsFinished: number}} events
 *   Cuántas veces ha avisado el mundo de cada cosa.
 */

/**
 * Crea un mundo de prueba con un nivel hecho a medida.
 * @param {Object} [options]
 * @param {number} [options.widthInTiles]
 * @param {string} [options.themeName] Tema del nivel (decide, p. ej., si los fosos tienen lava).
 * @param {(level: LevelBuilder) => void} [options.buildLevel] Construye el nivel. Por defecto, suelo liso.
 * @param {number} [options.powerLevel] Poder con el que empieza Paco (0 pequeño, 1 grande, 2 picante).
 * @param {number} [options.timeLimit]
 * @param {GameSession} [options.session] Sesión a reutilizar (p. ej. para probar el punto de control).
 * @returns {TestScenario}
 */
export function createTestWorld({
  widthInTiles = 40,
  themeName = 'madrid',
  buildLevel = level => level.addGround(0, widthInTiles - 1),
  powerLevel = 0,
  timeLimit = 400,
  session = new GameSession()
} = {}) {
  seedGameplayRandom(TEST_RANDOM_SEED);
  session.carriedPowerLevel = powerLevel;
  const levelDefinition = {
    name: 'PRUEBA',
    subtitle: 'ESCENARIO DE TEST',
    musicName: 'feria',
    timeLimit,
    build() {
      const level = new LevelBuilder(widthInTiles, themeName);
      buildLevel(level);
      return level.build();
    }
  };
  return createWorldForDefinition(levelDefinition, { session });
}

/**
 * Crea un mundo para una definición de nivel (propia o de las 10 del juego).
 * @param {import('../../src/world/levels.js').LevelDefinition} levelDefinition
 * @param {Object} [options]
 * @param {number} [options.levelIndex]
 * @param {GameSession} [options.session]
 * @returns {TestScenario}
 */
export function createWorldForDefinition(levelDefinition, { levelIndex = 0, session = new GameSession() } = {}) {
  const controls = new ScriptedControls();
  const events = { levelsCompleted: 0, deathAnimationsFinished: 0 };
  const world = new World({
    levelDefinition,
    levelIndex,
    session,
    controls,
    callbacks: {
      onLevelCompleted: () => { events.levelsCompleted++; },
      onPlayerDeathFinished: () => { events.deathAnimationsFinished++; }
    }
  });
  return { world, controls, session, events };
}

/**
 * Avanza la simulación varios pasos, igual que el bucle real del juego.
 * @param {World} world
 * @param {ScriptedControls} controls
 * @param {number} steps
 */
export function advanceSteps(world, controls, steps) {
  for (let step = 0; step < steps; step++) {
    controls.update();
    world.update();
  }
}

/**
 * Avanza hasta que se cumpla una condición o se agote el límite de pasos.
 * @param {World} world
 * @param {ScriptedControls} controls
 * @param {() => boolean} condition
 * @param {number} [maxSteps]
 * @returns {number} Pasos que han hecho falta, o -1 si no se ha cumplido.
 */
export function advanceUntil(world, controls, condition, maxSteps = 600) {
  for (let step = 1; step <= maxSteps; step++) {
    controls.update();
    world.update();
    if (condition()) return step;
  }
  return -1;
}

/**
 * Fila de la superficie del suelo de una columna, buscando desde abajo. Así,
 * si hay un bloque flotando encima, se devuelve el suelo y no el bloque.
 * @param {World} world
 * @param {number} column
 * @returns {number}
 */
export function findGroundSurfaceRow(world, column) {
  let row = world.tileMap.heightInTiles - 1;
  while (row > 0 && world.tileMap.isSolid(column, row - 1)) row--;
  return row;
}

/**
 * Coloca a Paco de pie sobre el suelo de una columna (por debajo de los bloques).
 * @param {World} world
 * @param {number} column
 */
export function placePlayerOnGround(world, column) {
  const player = world.player;
  player.x = column * TILE_SIZE + 2;
  player.y = findGroundSurfaceRow(world, column) * TILE_SIZE - player.height;
  player.velocityX = 0;
  player.velocityY = 0;
}

/**
 * Añade un enemigo del catálogo al mundo, como si hubiera aparecido en el nivel.
 * @param {World} world
 * @param {string} enemyId Clave del catálogo ('guiri', 'toro'…).
 * @param {number} column
 * @param {number} [row] Fila que pisa (12 = suelo normal).
 * @returns {import('../../src/entities/enemies/Enemy.js').Enemy}
 */
export function spawnEnemy(world, enemyId, column, row = 12) {
  const enemy = createEntityForSpawnPoint({ kind: 'enemy', enemyId, column, row }, world.level, world.theme);
  world.addEntity(enemy);
  return enemy;
}

/**
 * Deja a Paco justo encima de una entidad y cayendo, para simular un pisotón.
 * @param {World} world
 * @param {import('../../src/entities/Entity.js').Entity} target
 */
export function dropPlayerOnto(world, target) {
  const player = world.player;
  player.x = target.centerX - player.width / 2;
  player.y = target.y - player.height - 2;
  player.velocityX = 0;
  player.velocityY = 3;
  player.isOnGround = false;
}

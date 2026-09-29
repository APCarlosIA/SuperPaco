/**
 * @file Test de recorrido completo: el piloto automático juega los 10 niveles.
 *
 * Comprueba que cada nivel se puede terminar de principio a fin: saltos,
 * escaleras, huecos, plataformas móviles, la meta y el jefe final (vencido a
 * pisotones). Se repite con varias semillas aleatorias para que el resultado no
 * dependa de la suerte (saltos de la madre, ataques del jefe…).
 *
 * Los enemigos se neutralizan dando a Paco invencibilidad en cada paso: este
 * test mide si el RECORRIDO es posible. El combate se prueba por separado en
 * `enemies.test.js` y `boss.test.js`. Caer a un foso, quemarse en la lava o
 * quedarse sin tiempo siguen haciendo fallar el test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TILE_SIZE, LEVEL_TIMER } from '../src/config/constants.js';
import { seedGameplayRandom } from '../src/core/math.js';
import { LEVELS } from '../src/world/levels.js';
import { createWorldForDefinition } from './support/worldTestKit.js';
import { Autopilot } from './support/Autopilot.js';

/** Semillas con las que se juega cada nivel. */
const RANDOM_SEEDS = [11, 2024, 90210];
/** Pasos máximos: el tiempo del nivel más la escena final con margen. */
const MAX_STEPS_PER_LEVEL = 400 * LEVEL_TIMER.stepsPerTimeUnit + 2000;
/** Pasos entre cada punto de la trayectoria que se guarda para el mensaje de error. */
const TRAIL_SAMPLE_INTERVAL = 250;

/**
 * Juega un nivel con el piloto automático hasta completarlo o fallar.
 * @param {number} levelIndex
 * @param {number} seed
 * @returns {{completed: boolean, reason: string, trail: number[]}}
 */
function playLevelWithAutopilot(levelIndex, seed) {
  const { world, controls, events } = createWorldForDefinition(LEVELS[levelIndex], { levelIndex });
  seedGameplayRandom(seed);
  const autopilot = new Autopilot(world, controls);
  const trail = [];

  for (let step = 0; step < MAX_STEPS_PER_LEVEL; step++) {
    world.player.invincibleSteps = 60;
    autopilot.decideButtons();
    controls.update();
    world.update();
    if (step % TRAIL_SAMPLE_INTERVAL === 0) trail.push(Math.floor(world.player.x / TILE_SIZE));
    if (events.levelsCompleted > 0) return { completed: true, reason: 'completado', trail };
    if (world.phase === 'playerDying') {
      const column = Math.floor(world.player.x / TILE_SIZE);
      const cause = world.timeRemaining === 0 ? 'se acabó el tiempo' : world.didFallIntoPit ? 'cayó a un foso' : 'perdió una vida';
      return { completed: false, reason: `${cause} en la columna ${column}`, trail };
    }
  }
  return { completed: false, reason: 'no terminó en el número máximo de pasos', trail };
}

for (const [levelIndex, level] of LEVELS.entries()) {
  test(`nivel ${levelIndex + 1} (${level.name}) se puede recorrer hasta el final`, () => {
    for (const seed of RANDOM_SEEDS) {
      const result = playLevelWithAutopilot(levelIndex, seed);
      assert.ok(result.completed, `semilla ${seed}: ${result.reason}. Columnas recorridas: ${result.trail.join(' → ')}`);
    }
  });
}

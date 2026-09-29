/**
 * @file Tests del movimiento de Paco: saltos, paredes, fosos, lava, tiempo,
 * agacharse y lanzar pimientos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TILE_SIZE, LEVEL_TIMER } from '../src/config/constants.js';
import { BUTTON } from '../src/core/input.js';
import { WORLD_PHASE } from '../src/game/World.js';
import { POWER_LEVEL } from '../src/entities/Player.js';
import { PlayerFireball } from '../src/entities/PlayerFireball.js';
import { BURNED_MESSAGES } from '../src/world/texts.js';
import { createTestWorld, advanceSteps, advanceUntil } from './support/worldTestKit.js';

/**
 * Mide cuántos píxeles sube Paco en un salto, manteniendo el botón los pasos indicados.
 * @param {import('./support/worldTestKit.js').TestScenario} scenario
 * @param {number} jumpHoldSteps
 * @returns {number}
 */
function measureJumpRise({ world, controls }, jumpHoldSteps) {
  const startFeetY = world.player.bottom;
  let highestFeetY = startFeetY;
  controls.hold(BUTTON.JUMP);
  for (let step = 0; step < 90; step++) {
    if (step === jumpHoldSteps) controls.release(BUTTON.JUMP);
    advanceSteps(world, controls, 1);
    highestFeetY = Math.min(highestFeetY, world.player.bottom);
  }
  return startFeetY - highestFeetY;
}

test('desde parado, Paco salta entre 3 y 4,5 baldosas de altura', () => {
  const scenario = createTestWorld();
  advanceSteps(scenario.world, scenario.controls, 5);
  const rise = measureJumpRise(scenario, 60);
  assert.ok(rise > 3 * TILE_SIZE && rise < 4.5 * TILE_SIZE, `sube ${rise.toFixed(1)} px`);
});

test('con carrerilla salta más alto, sin pasar de 5 baldosas', () => {
  const standing = createTestWorld();
  advanceSteps(standing.world, standing.controls, 5);
  const standingRise = measureJumpRise(standing, 60);

  const running = createTestWorld({ widthInTiles: 80 });
  running.controls.hold(BUTTON.RIGHT);
  running.controls.hold(BUTTON.RUN);
  advanceSteps(running.world, running.controls, 60);
  const runningRise = measureJumpRise(running, 60);

  assert.ok(runningRise > standingRise, `con carrerilla ${runningRise.toFixed(1)} px, parado ${standingRise.toFixed(1)} px`);
  assert.ok(runningRise <= 5 * TILE_SIZE, `sube ${runningRise.toFixed(1)} px`);
});

test('soltar pronto el botón de salto hace un salto más bajo', () => {
  const tapped = createTestWorld();
  advanceSteps(tapped.world, tapped.controls, 5);
  const tapRise = measureJumpRise(tapped, 1);

  const held = createTestWorld();
  advanceSteps(held.world, held.controls, 5);
  const holdRise = measureJumpRise(held, 60);

  assert.ok(tapRise < holdRise - TILE_SIZE, `pulsación corta ${tapRise.toFixed(1)} px, mantenida ${holdRise.toFixed(1)} px`);
});

test('Paco no atraviesa las paredes', () => {
  const { world, controls } = createTestWorld({
    buildLevel: level => {
      level.addGround(0, 39);
      level.addAzulejoBlocks(8, 8, 1, 5);
    }
  });
  controls.hold(BUTTON.RIGHT);
  controls.hold(BUTTON.RUN);
  advanceSteps(world, controls, 120);
  assert.ok(world.player.x + world.player.width <= 8 * TILE_SIZE, `Paco llega a x=${world.player.x}`);
});

test('caer a un foso quita una vida y avisa al terminar la animación', () => {
  const { world, controls, events } = createTestWorld({ buildLevel: level => level.addGround(0, 5) });
  controls.hold(BUTTON.RIGHT);
  const stepsUntilFalling = advanceUntil(world, controls, () => world.phase === WORLD_PHASE.PLAYER_DYING, 300);
  assert.notEqual(stepsUntilFalling, -1, 'Paco no llegó a caer');
  assert.ok(world.didFallIntoPit);
  const stepsUntilAnimationEnds = advanceUntil(world, controls, () => events.deathAnimationsFinished === 1, 400);
  assert.notEqual(stepsUntilAnimationEnds, -1, 'la animación de muerte no terminó');
});

test('la lava quema a Paco', () => {
  // En el tema de Canarias los fosos están llenos de lava.
  const { world, controls } = createTestWorld({ themeName: 'canarias', buildLevel: level => level.addGround(0, 5) });
  controls.hold(BUTTON.RIGHT);
  assert.notEqual(advanceUntil(world, controls, () => world.phase === WORLD_PHASE.PLAYER_DYING, 300), -1);
  assert.ok(!world.didFallIntoPit, 'debería quemarse antes de caer fuera de la pantalla');
  assert.ok(BURNED_MESSAGES.includes(world.lifeLostMessage));
});

test('si se acaba el tiempo, Paco pierde una vida', () => {
  const { world, controls } = createTestWorld({ timeLimit: 2 });
  advanceSteps(world, controls, 2 * LEVEL_TIMER.stepsPerTimeUnit + 1);
  assert.equal(world.timeRemaining, 0);
  assert.equal(world.phase, WORLD_PHASE.PLAYER_DYING);
});

test('Paco grande se agacha y ocupa menos altura', () => {
  const { world, controls } = createTestWorld({ powerLevel: POWER_LEVEL.BIG });
  advanceSteps(world, controls, 3);
  const standingHeight = world.player.height;
  controls.hold(BUTTON.DOWN);
  advanceSteps(world, controls, 2);
  assert.ok(world.player.isCrouching);
  assert.ok(world.player.height < standingHeight);
});

test('con el pimiento de Padrón lanza pimientos picantes, como mucho dos a la vez', () => {
  const { world, controls } = createTestWorld({ widthInTiles: 60, powerLevel: POWER_LEVEL.SPICY });
  const countFireballs = () => world.entities.filter(entity => entity instanceof PlayerFireball).length;
  for (let throwAttempt = 0; throwAttempt < 3; throwAttempt++) {
    controls.tap(BUTTON.RUN);
    advanceSteps(world, controls, 13);
  }
  assert.equal(countFireballs(), 2);
});

test('Paco pequeño no puede lanzar pimientos', () => {
  const { world, controls } = createTestWorld();
  controls.tap(BUTTON.RUN);
  advanceSteps(world, controls, 5);
  assert.equal(world.entities.filter(entity => entity instanceof PlayerFireball).length, 0);
});

/**
 * @file Tests de los enemigos: pisotones, daño, caparazones, invencibilidad,
 * pimientos y comportamientos especiales (toro, pulpo, chispa, madre).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GAME_RULES, TILE_SIZE } from '../src/config/constants.js';
import { BUTTON } from '../src/core/input.js';
import { WORLD_PHASE } from '../src/game/World.js';
import { POWER_LEVEL } from '../src/entities/Player.js';
import { SHELL_STATE } from '../src/entities/enemies/ShellEnemy.js';
import { BULL_STATE } from '../src/entities/enemies/ChargingBull.js';
import { PopUpOctopus, OCTOPUS_STATE } from '../src/entities/enemies/PopUpOctopus.js';
import { LavaBubble } from '../src/entities/enemies/LavaBubble.js';
import { ThrownSandal } from '../src/entities/hazards/ThrownSandal.js';
import {
  createTestWorld, advanceSteps, advanceUntil, placePlayerOnGround, spawnEnemy, dropPlayerOnto
} from './support/worldTestKit.js';

test('pisar a un guiri lo aplasta, da 100 puntos y hace rebotar a Paco', () => {
  const { world, controls, session } = createTestWorld();
  const guiri = spawnEnemy(world, 'guiri', 8);
  advanceSteps(world, controls, 2);
  dropPlayerOnto(world, guiri);
  assert.notEqual(advanceUntil(world, controls, () => guiri.isDefeated, 30), -1, 'el guiri no fue derrotado');
  assert.ok(guiri.squashedStepsLeft > 0, 'debería quedar aplastado');
  assert.equal(session.score, GAME_RULES.stompComboPoints[0]);
  assert.ok(world.player.velocityY < 0, 'Paco debería rebotar hacia arriba');
});

test('los pisotones seguidos dan cada vez más puntos y al final una vida', () => {
  const { world } = createTestWorld();
  GAME_RULES.stompComboPoints.forEach((points, index) => assert.equal(world.getComboPoints(index + 1), points));
  assert.equal(world.getComboPoints(GAME_RULES.stompComboPoints.length + 1), '1UP');
});

test('tocar un guiri de lado hace encoger a Paco grande, que queda invulnerable un rato', () => {
  const { world, controls } = createTestWorld({ powerLevel: POWER_LEVEL.BIG });
  spawnEnemy(world, 'guiri', 6);
  const steps = advanceUntil(world, controls, () => world.player.powerLevel === POWER_LEVEL.SMALL, 300);
  assert.notEqual(steps, -1, 'el guiri no llegó a tocar a Paco');
  assert.ok(world.player.invulnerableSteps > 0);
  // Mientras parpadea, el mismo guiri no puede quitarle la vida.
  advanceSteps(world, controls, 40);
  assert.equal(world.phase, WORLD_PHASE.PLAYING);
});

test('tocar un guiri de lado siendo pequeño quita una vida', () => {
  const { world, controls } = createTestWorld();
  spawnEnemy(world, 'guiri', 6);
  assert.notEqual(advanceUntil(world, controls, () => world.phase === WORLD_PHASE.PLAYER_DYING, 300), -1);
});

test('el caparazón pateado derrota a los enemigos que encuentra', () => {
  const { world, controls } = createTestWorld();
  const tourist = spawnEnemy(world, 'turista', 6);
  const guiri = spawnEnemy(world, 'guiri', 16);
  advanceSteps(world, controls, 2);
  dropPlayerOnto(world, tourist);
  advanceUntil(world, controls, () => tourist.state === SHELL_STATE.HIDING, 30);
  assert.equal(tourist.state, SHELL_STATE.HIDING, 'al pisarlo debería esconderse tras su maleta');

  // Tras el rebote, Paco caería otra vez sobre la maleta y la patearía hacia
  // cualquier lado. Para que el test sea predecible, se le pone en el suelo a la
  // izquierda de la maleta y se la patea hacia la derecha, donde está el guiri.
  placePlayerOnGround(world, Math.floor(tourist.x / TILE_SIZE) - 1);
  controls.hold(BUTTON.RIGHT);
  assert.notEqual(advanceUntil(world, controls, () => tourist.state === SHELL_STATE.SLIDING, 60), -1, 'la maleta no salió disparada');
  controls.release(BUTTON.RIGHT);
  assert.notEqual(advanceUntil(world, controls, () => guiri.isKnockedOut, 200), -1, 'la maleta no derrotó al guiri');
});

test('con los churros, tocar a un enemigo lo derrota sin hacer daño a Paco', () => {
  const { world, controls } = createTestWorld();
  const guiri = spawnEnemy(world, 'guiri', 6);
  world.player.invincibleSteps = GAME_RULES.churrosInvincibilitySteps;
  assert.notEqual(advanceUntil(world, controls, () => guiri.isKnockedOut, 300), -1);
  assert.equal(world.phase, WORLD_PHASE.PLAYING);
});

test('un pimiento picante derrota a un guiri', () => {
  const { world, controls } = createTestWorld({ powerLevel: POWER_LEVEL.SPICY });
  const guiri = spawnEnemy(world, 'guiri', 12);
  controls.tap(BUTTON.RUN);
  assert.notEqual(advanceUntil(world, controls, () => guiri.isKnockedOut, 120), -1);
});

test('el toro embiste cuando ve a Paco delante', () => {
  const { world, controls } = createTestWorld();
  const bull = spawnEnemy(world, 'toro', 12);
  assert.notEqual(advanceUntil(world, controls, () => bull.state === BULL_STATE.CHARGING, 120), -1, 'el toro no llegó a embestir');
  // La velocidad de embestida se aplica en el paso siguiente al cambio de estado.
  advanceSteps(world, controls, 2);
  assert.ok(bull.velocityX < -2.5, `debería correr hacia Paco (a la izquierda), velocidad ${bull.velocityX}`);
});

test('el pulpo no asoma del tonel si Paco está al lado, y sí cuando se aleja', () => {
  const { world, controls } = createTestWorld({
    buildLevel: level => {
      level.addGround(0, 39);
      level.addBarrel(10, 2, { withOctopus: true });
    }
  });
  advanceSteps(world, controls, 1);
  const octopus = world.entities.find(entity => entity instanceof PopUpOctopus);
  assert.ok(octopus, 'el pulpo debería haber aparecido en su tonel');

  placePlayerOnGround(world, 9);
  advanceSteps(world, controls, 400);
  assert.equal(octopus.state, OCTOPUS_STATE.HIDDEN);

  placePlayerOnGround(world, 2);
  assert.notEqual(advanceUntil(world, controls, () => octopus.state !== OCTOPUS_STATE.HIDDEN, 200), -1);
});

test('la chispa de lava no se puede pisar: hace daño aunque Paco caiga encima', () => {
  const { world } = createTestWorld();
  const lavaBubble = new LavaBubble(6);
  lavaBubble.y = 150;
  dropPlayerOnto(world, lavaBubble);
  lavaBubble.onPlayerContact(world.player, world);
  assert.equal(world.phase, WORLD_PHASE.PLAYER_DYING);
});

test('la madre lanza chanclas hacia Paco', () => {
  const { world, controls } = createTestWorld();
  spawnEnemy(world, 'madre', 12);
  const findSandal = () => world.entities.find(entity => entity instanceof ThrownSandal);
  assert.notEqual(advanceUntil(world, controls, () => Boolean(findSandal()), 300), -1, 'no lanzó ninguna chancla');
  assert.ok(findSandal().velocityX < 0, 'la chancla debería ir hacia Paco (a la izquierda)');
});

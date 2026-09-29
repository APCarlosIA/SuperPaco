/**
 * @file Tests de Don Hacienda, el jefe final.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTestWorld, advanceSteps, advanceUntil, spawnEnemy, dropPlayerOnto } from './support/worldTestKit.js';

/** Vida inicial del jefe y daño de cada ataque (según su diseño). */
const BOSS_MAX_HEALTH = 6;
const STOMP_DAMAGE = 2;
const FIREBALL_DAMAGE = 1;

/**
 * Crea la arena del combate con Don Hacienda. Paco es invencible para que las
 * facturas no interrumpan el test (el jefe resiste la invencibilidad: solo le
 * afectan los pisotones y los pimientos).
 * @param {number} [widthInTiles]
 */
function createBossArena(widthInTiles = 40) {
  const scenario = createTestWorld({
    widthInTiles,
    buildLevel: level => {
      level.addGround(0, widthInTiles - 1);
      level.setBossArena(0, 19);
    }
  });
  const boss = spawnEnemy(scenario.world, 'hacienda', 12);
  scenario.world.player.invincibleSteps = 100000;
  advanceSteps(scenario.world, scenario.controls, 2);
  return { ...scenario, boss };
}

/**
 * Espera a que el jefe se pueda volver a dañar y le cae encima.
 * @returns {boolean} true si el pisotón le ha quitado vida.
 */
function stompBoss({ world, controls, boss }) {
  advanceUntil(world, controls, () => boss.invulnerableSteps === 0 && boss.isOnGround, 300);
  const healthBefore = boss.health;
  dropPlayerOnto(world, boss);
  return advanceUntil(world, controls, () => boss.health < healthBefore, 20) !== -1;
}

test('el combate empieza cuando la cámara llega a la arena', () => {
  const { world, boss } = createBossArena();
  assert.ok(boss.hasStartedFight);
  assert.ok(world.isBossFightActive);
});

test(`cada pisotón le quita ${STOMP_DAMAGE} puntos de vida y cae tras 3`, () => {
  const arena = createBossArena();
  for (let stomp = 1; stomp <= 3; stomp++) {
    assert.ok(stompBoss(arena), `el pisotón ${stomp} no le hizo daño`);
    assert.equal(arena.boss.health, BOSS_MAX_HEALTH - stomp * STOMP_DAMAGE);
  }
  assert.ok(arena.boss.isDefeated);
  assert.notEqual(advanceUntil(arena.world, arena.controls, () => arena.world.isBossDefeated, 300), -1, 'no llegó a caer a la lava');
});

test(`cada pimiento picante le quita ${FIREBALL_DAMAGE} punto de vida, con un respiro entre golpes`, () => {
  const { world, controls, boss } = createBossArena();
  const fakeFireball = { velocityX: 1 };
  boss.onHitByFireball(fakeFireball, world);
  assert.equal(boss.health, BOSS_MAX_HEALTH - FIREBALL_DAMAGE);
  boss.onHitByFireball(fakeFireball, world);
  assert.equal(boss.health, BOSS_MAX_HEALTH - FIREBALL_DAMAGE, 'justo después de un golpe no debería recibir daño');
  advanceSteps(world, controls, 25);
  boss.onHitByFireball(fakeFireball, world);
  assert.equal(boss.health, BOSS_MAX_HEALTH - 2 * FIREBALL_DAMAGE);
});

test('tocar al jefe de lado hace daño a Paco', () => {
  const { world, controls, boss } = createBossArena();
  world.player.invincibleSteps = 0;
  world.player.x = boss.x - world.player.width + 2;
  world.player.y = boss.bottom - world.player.height;
  advanceSteps(world, controls, 1);
  assert.equal(world.phase, 'playerDying');
});

test('tras vencerle, Paco camina solo hasta la abuela y el nivel termina', () => {
  const arena = createBossArena(160);
  for (let stomp = 0; stomp < 3; stomp++) stompBoss(arena);
  const steps = advanceUntil(arena.world, arena.controls, () => arena.events.levelsCompleted === 1, 4000);
  assert.notEqual(steps, -1, 'Paco no llegó a la sala de la abuela');
});

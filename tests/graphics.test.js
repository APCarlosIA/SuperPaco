/**
 * @file Tests de la parte gráfica que no necesita navegador: el estado de los
 * efectos de pantalla, la correspondencia entre las posturas de Paco y su
 * dibujo, y que cada ciudad tenga fondo y ajustes de color válidos.
 * (El dibujo en sí hay que mirarlo a mano.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { screenFx } from '../src/graphics/screenFx.js';
import { PACO_POSES, PACO_PALETTES } from '../src/graphics/pacoArt.js';
import { PACO_COLOR_VARIANTS } from '../src/graphics/spriteData.js';
import { CITY_PAINTERS } from '../src/graphics/cityBackgrounds.js';
import { PARALLAX_FACTORS } from '../src/graphics/backgroundConstants.js';
import { THEMES } from '../src/world/themes.js';
import { Player } from '../src/entities/Player.js';

test('el temblor decae con el tiempo y se queda dentro de su potencia', () => {
  screenFx.reset();
  screenFx.shake(4, 10);
  for (let step = 0; step < 10; step++) {
    const offset = screenFx.getShakeOffset();
    assert.ok(Math.abs(offset.x) <= 4 && Math.abs(offset.y) <= 4);
    screenFx.update();
  }
  assert.deepEqual(screenFx.getShakeOffset(), { x: 0, y: 0 });
});

test('un temblor débil no pisa a uno más fuerte que sigue activo', () => {
  screenFx.reset();
  screenFx.shake(6, 20);
  screenFx.shake(1, 5);
  assert.equal(screenFx.shakePower, 6);
  screenFx.reset();
});

test('la congelación de golpes gasta un paso cada vez y se acaba', () => {
  screenFx.reset();
  screenFx.hitStop(3);
  assert.equal(screenFx.consumeHitStop(), true);
  assert.equal(screenFx.consumeHitStop(), true);
  assert.equal(screenFx.consumeHitStop(), true);
  assert.equal(screenFx.consumeHitStop(), false);
});

test('el destello se desvanece y reset() lo quita todo menos la calidad', () => {
  screenFx.reset();
  screenFx.quality = 1;
  screenFx.flash('#ff0000', 0.6);
  for (let step = 0; step < 20; step++) screenFx.update();
  assert.equal(screenFx.flashAlpha, 0);
  screenFx.shake(3, 10);
  screenFx.hitStop(5);
  screenFx.reset();
  assert.equal(screenFx.shakeStepsLeft, 0);
  assert.equal(screenFx.hitStopStepsLeft, 0);
  assert.equal(screenFx.quality, 1);
  screenFx.quality = 0;
});

test('todas las posturas que elige Paco tienen dibujo', () => {
  const player = new Player(0, 0);
  const seen = new Set();
  const record = isBig => seen.add(player.choosePose(isBig));

  record(false);                                   // quieto
  player.ageInSteps = 40; record(false);           // quieto, respirando
  player.isOnGround = true;
  for (const speed of [0.5, 1.4, 2.5]) {           // andar y correr, todos los fotogramas
    player.velocityX = speed;
    for (let progress = 0; progress < 5; progress += 0.25) { player.walkAnimationProgress = progress; record(false); }
  }
  player.velocityX = -2; player.facing = 1; record(false); // derrape
  player.velocityX = 0;
  player.isCrouching = true; record(true);         // agachado
  player.isCrouching = false;
  player.isOnGround = false;
  player.velocityY = -3; record(false);            // subiendo
  player.velocityY = 3; record(false);             // cayendo
  player.isHoldingGoalPole = true; record(false);  // en la cucaña
  player.isHoldingGoalPole = false;
  player.isDead = true; record(false);             // muerto

  for (const pose of seen) assert.ok(PACO_POSES.includes(pose), `falta el dibujo de la postura "${pose}"`);
  assert.ok(seen.has('skid') && seen.has('jumpUp') && seen.has('jumpDown') && seen.has('pole') && seen.has('crouch'));
});

test('cada variante de color de Paco tiene su paleta vectorial', () => {
  assert.deepEqual(Object.keys(PACO_PALETTES).sort(), Object.keys(PACO_COLOR_VARIANTS).sort());
});

test('cada ciudad tiene fondo, y sus ajustes de color y luz son válidos', () => {
  assert.deepEqual(Object.keys(CITY_PAINTERS).sort(), Object.keys(THEMES).sort());
  for (const [name, theme] of Object.entries(THEMES)) {
    if (theme.grade) {
      assert.match(theme.grade.color, /^#[0-9a-f]{6}$/i, `${name}: color de tono`);
      assert.ok(theme.grade.alpha >= 0 && theme.grade.alpha <= 1, `${name}: opacidad del tono`);
    }
    if (theme.lighting) {
      assert.ok(theme.lighting.darkness > 0 && theme.lighting.darkness < 1, `${name}: oscuridad`);
      assert.ok(theme.lighting.playerLightRadius > 0, `${name}: radio de luz`);
    }
  }
});

test('las capas lejanas del fondo se mueven más despacio que las cercanas', () => {
  assert.ok(PARALLAX_FACTORS.farLayer < PARALLAX_FACTORS.midLayer);
  assert.ok(PARALLAX_FACTORS.midLayer < PARALLAX_FACTORS.nearLayer);
  assert.ok(PARALLAX_FACTORS.nearLayer < 1);
});

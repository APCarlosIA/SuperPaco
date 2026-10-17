/**
 * @file Tests de los datos del juego (se ejecutan con `npm test`).
 *
 * Comprueban lo que es fácil romper al editar a mano: filas de sprites con el
 * ancho equivocado, letras mal dibujadas, canciones desincronizadas y niveles
 * imposibles (huecos demasiado grandes, meta inexistente, enemigos desconocidos…).
 * Solo importan módulos de datos, que no necesitan navegador.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PIXEL_COLORS } from '../src/graphics/palette.js';
import { findSpriteDefinitionProblems } from '../src/graphics/spriteData.js';
import { GLYPH_BITMAPS, GLYPH_WIDTH, GLYPH_HEIGHT } from '../src/graphics/fontGlyphs.js';
import { SONGS } from '../src/audio/songs.js';
import { parseNoteSequence, totalDurationInSteps } from '../src/audio/musicNotation.js';
import { LEVELS } from '../src/world/levels.js';
import { TILE, isSolidTile } from '../src/world/tileTypes.js';
import { THEMES } from '../src/world/themes.js';
import { ENEMY_CATALOG } from '../src/entities/enemies/enemyCatalog.js';

/** Hueco máximo (en columnas) que se permite sin plataforma ni roca de apoyo. */
const MAX_UNAIDED_GAP = 4;
const GROUND_ROWS = [13, 14];

test('todos los sprites tienen filas del mismo ancho y colores válidos', () => {
  assert.deepEqual(findSpriteDefinitionProblems(PIXEL_COLORS), []);
});

test('todas las letras de la fuente son de 5×7 bits', () => {
  for (const [character, bitmap] of Object.entries(GLYPH_BITMAPS)) {
    const rows = bitmap.split(' ');
    assert.equal(rows.length, GLYPH_HEIGHT, `"${character}" debe tener ${GLYPH_HEIGHT} filas`);
    for (const row of rows) assert.match(row, new RegExp(`^[01]{${GLYPH_WIDTH}}$`), `"${character}" tiene una fila inválida: ${row}`);
  }
});

test('todas las notas de las canciones se entienden', () => {
  for (const [songName, song] of Object.entries(SONGS)) {
    for (const track of song.tracks) {
      for (const note of parseNoteSequence(track.notes)) {
        const isRest = note.source.startsWith('r:');
        const isValid = isRest || note.drumHit || note.frequency > 0;
        assert.ok(isValid, `${songName}: nota no reconocida "${note.source}"`);
        assert.ok(note.durationInSteps > 0, `${songName}: duración inválida en "${note.source}"`);
      }
    }
  }
});

test('en las canciones con bucle todas las pistas duran lo mismo', () => {
  for (const [songName, song] of Object.entries(SONGS)) {
    if (!song.loops) continue;
    const durations = song.tracks.map(track => totalDurationInSteps(track.notes));
    assert.ok(durations.every(duration => duration === durations[0]), `${songName}: pistas con duraciones distintas ${durations.join(', ')}`);
  }
});

/**
 * Columnas cubiertas por el recorrido de alguna plataforma móvil.
 * @param {import('../src/world/LevelBuilder.js').LevelData} level
 * @returns {Set<number>}
 */
function columnsServedByMovingPlatforms(level) {
  const covered = new Set();
  for (const spawn of level.spawnPoints) {
    if (spawn.kind !== 'movingPlatform') continue;
    const { lengthInTiles, axis, travelInTiles } = spawn.settings;
    const firstColumn = spawn.column + (axis === 'horizontal' ? Math.min(0, travelInTiles) : 0);
    const lastColumn = spawn.column + lengthInTiles - 1 + (axis === 'horizontal' ? Math.max(0, travelInTiles) : 0);
    for (let column = firstColumn; column <= lastColumn; column++) covered.add(column);
  }
  return covered;
}

/**
 * ¿Se puede pisar algo en esta columna (suelo, bloque bajo o plataforma)?
 * @param {import('../src/world/TileMap.js').TileMap} tileMap
 * @param {number} column
 */
function columnHasFooting(tileMap, column) {
  for (let row = 8; row <= 14; row++) {
    const tile = tileMap.getTile(column, row);
    if (isSolidTile(tile) || tile === TILE.ONE_WAY_PLATFORM) return true;
  }
  return false;
}

for (const [levelIndex, definition] of LEVELS.entries()) {
  const levelLabel = `nivel ${levelIndex + 1} (${definition.name})`;

  test(`${levelLabel}: se construye y tiene un final alcanzable`, () => {
    const level = definition.build();
    assert.ok(THEMES[level.themeName], 'tema inexistente');
    assert.ok(level.goalColumn !== null || level.bossArena, 'no tiene meta ni jefe');
    assert.ok(level.tileMap.findFirstSolidRow(2) > 0, 'Paco no tiene suelo al empezar');
    if (level.checkpointColumn !== null) assert.ok(level.tileMap.findFirstSolidRow(level.checkpointColumn) > 0, 'el punto de control no tiene suelo');
    if (level.goalColumn !== null) assert.ok(level.goalColumn + 9 < level.tileMap.widthInTiles, 'el bar de la meta no cabe en el nivel');
  });

  test(`${levelLabel}: solo usa enemigos del catálogo y dentro del mapa`, () => {
    const level = definition.build();
    for (const spawn of level.spawnPoints) {
      assert.ok(spawn.column >= 0 && spawn.column < level.tileMap.widthInTiles, `aparición fuera del mapa en la columna ${spawn.column}`);
      if (spawn.kind === 'enemy') assert.ok(ENEMY_CATALOG[spawn.enemyId], `enemigo desconocido "${spawn.enemyId}"`);
    }
  });

  test(`${levelLabel}: ningún hueco supera ${MAX_UNAIDED_GAP} columnas sin ayuda`, () => {
    const level = definition.build();
    const servedByPlatform = columnsServedByMovingPlatforms(level);
    let currentGap = 0;
    let widestGap = 0;
    for (let column = 0; column < level.tileMap.widthInTiles; column++) {
      const isPit = GROUND_ROWS.every(row => !isSolidTile(level.tileMap.getTile(column, row)));
      const needsJump = isPit && !columnHasFooting(level.tileMap, column) && !servedByPlatform.has(column);
      currentGap = needsJump ? currentGap + 1 : 0;
      widestGap = Math.max(widestGap, currentGap);
    }
    assert.ok(widestGap <= MAX_UNAIDED_GAP, `hay un hueco de ${widestGap} columnas`);
  });
}

for (const [levelIndex, definition] of LEVELS.entries()) {
  test(`nivel ${levelIndex + 1} (${definition.name}): tiene Flor Maravilla, 3 monedas gigantes y salas con salida`, () => {
    const level = definition.build();
    const spawns = kind => level.spawnPoints.filter(spawn => spawn.kind === kind);
    assert.equal(spawns('wonderFlower').length, 1, 'debe tener una Flor Maravilla');
    assert.equal(level.bigCoinCount, 3, 'debe tener 3 monedas gigantes');
    const doorRooms = new Set(spawns('door').filter(door => door.settings.direction === 'enter').map(door => door.settings.roomId));
    assert.deepEqual([...doorRooms].sort(), Object.keys(level.roomBuilders).sort(), 'puertas y salas no coinciden');
    for (const buildRoom of Object.values(level.roomBuilders)) {
      const room = buildRoom();
      assert.ok(room.spawnPoints.some(spawn => spawn.kind === 'door' && spawn.settings.direction === 'exit'), 'la sala no tiene puerta de salida');
    }
  });
}

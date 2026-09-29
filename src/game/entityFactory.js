/**
 * @file Fábrica de entidades: convierte los "puntos de aparición" definidos en
 * los niveles en objetos reales (enemigos, plataformas, peligros).
 *
 * Es el único sitio que conoce todas las clases de entidades; así el resto del
 * juego no necesita saber qué clase corresponde a cada tipo.
 */
import { ENEMY_CATALOG, ENEMY_BEHAVIOR } from '../entities/enemies/enemyCatalog.js';
import { WalkingEnemy } from '../entities/enemies/WalkingEnemy.js';
import { ShellEnemy } from '../entities/enemies/ShellEnemy.js';
import { FlyingEnemy } from '../entities/enemies/FlyingEnemy.js';
import { ChargingBull } from '../entities/enemies/ChargingBull.js';
import { PopUpOctopus } from '../entities/enemies/PopUpOctopus.js';
import { SandalThrowingMother } from '../entities/enemies/SandalThrowingMother.js';
import { LavaBubble } from '../entities/enemies/LavaBubble.js';
import { TaxInspectorBoss } from '../entities/enemies/TaxInspectorBoss.js';
import { RotatingHazard } from '../entities/hazards/RotatingHazard.js';
import { MovingPlatform } from '../entities/MovingPlatform.js';

/**
 * Crea un enemigo a partir de su identificador del catálogo.
 * @param {string} enemyId
 * @param {number} column
 * @param {number} row
 * @param {import('../world/LevelBuilder.js').LevelData} level
 * @returns {import('../entities/Entity.js').Entity|null}
 */
function createEnemy(enemyId, column, row, level) {
  const profile = ENEMY_CATALOG[enemyId];
  if (!profile) {
    console.warn(`Enemigo desconocido en el nivel: "${enemyId}"`);
    return null;
  }
  switch (profile.behavior) {
    case ENEMY_BEHAVIOR.WALKER: return new WalkingEnemy(column, row, profile);
    case ENEMY_BEHAVIOR.SHELLED: return new ShellEnemy(column, row, profile);
    case ENEMY_BEHAVIOR.FLYER: return new FlyingEnemy(column, row, profile);
    case ENEMY_BEHAVIOR.CHARGER: return new ChargingBull(column, row);
    case ENEMY_BEHAVIOR.POP_UP: return new PopUpOctopus(column, row);
    case ENEMY_BEHAVIOR.THROWER: return new SandalThrowingMother(column, row);
    case ENEMY_BEHAVIOR.BOSS: return new TaxInspectorBoss(column, row, level.bossArena);
    default: return null;
  }
}

/**
 * Crea la entidad correspondiente a un punto de aparición.
 * @param {import('../world/LevelBuilder.js').SpawnPoint} spawnPoint
 * @param {import('../world/LevelBuilder.js').LevelData} level
 * @param {import('../world/themes.js').Theme} theme
 * @returns {import('../entities/Entity.js').Entity|null}
 */
export function createEntityForSpawnPoint(spawnPoint, level, theme) {
  const { kind, column, row, settings } = spawnPoint;
  switch (kind) {
    case 'enemy': return createEnemy(spawnPoint.enemyId, column, row, level);
    case 'movingPlatform': return new MovingPlatform(column, row, settings, theme.movingPlatformLook);
    case 'fireBar': return RotatingHazard.createFireBar(column, row, settings);
    case 'windmillBlades': return RotatingHazard.createWindmillBlades(column, row);
    case 'lavaBubble': return new LavaBubble(column);
    default:
      console.warn(`Tipo de aparición desconocido: "${kind}"`);
      return null;
  }
}

/**
 * ¿Debe aparecer este elemento antes de que su columna entre en pantalla?
 * Las plataformas y los peligros giratorios se crean antes para que no
 * "aparezcan de golpe" a la vista (sus brazos sobresalen de su casilla).
 * @param {import('../world/LevelBuilder.js').SpawnPoint} spawnPoint
 * @returns {boolean}
 */
export function spawnsAheadOfCamera(spawnPoint) {
  return spawnPoint.kind === 'movingPlatform' || spawnPoint.kind === 'fireBar' || spawnPoint.kind === 'windmillBlades';
}

/**
 * ¿Es un enemigo que podría estar encima de Paco justo al empezar el nivel?
 * @param {import('../world/LevelBuilder.js').SpawnPoint} spawnPoint
 * @returns {boolean}
 */
export function isEnemySpawn(spawnPoint) {
  return spawnPoint.kind === 'enemy' || spawnPoint.kind === 'lavaBubble';
}

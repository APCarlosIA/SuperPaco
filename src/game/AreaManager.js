/**
 * @file Salas secretas: al usar una puerta o una alcantarilla, el mundo cambia
 * a otra "área" (un mapa pequeño con su propio tema) y al salir vuelve
 * exactamente al punto donde Paco había entrado. El cambio se hace con una
 * transición de iris.
 */
import { TILE_SIZE } from '../config/constants.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { THEMES } from '../world/themes.js';
import { GAMEPLAY_MESSAGES } from '../world/texts.js';
import { WonderDirector } from './WonderDirector.js';

/** Pasos que tarda en cerrarse (y en abrirse) el iris. */
const IRIS_STEPS = 16;

export class AreaManager {
  /** @param {import('./World.js').World} world */
  constructor(world) {
    this.world = world;
    /** Estado del mundo principal mientras Paco está en una sala (o null). */
    this.snapshot = null;
    /** @type {{phase: 'closing'|'opening', steps: number, door: Object}|null} */
    this.transition = null;
  }

  /** ¿Está Paco en una sala secreta? */
  get isInRoom() {
    return this.snapshot !== null;
  }

  /**
   * Cuánto está abierto el iris (1 = todo visible, 0 = todo negro).
   * @returns {number}
   */
  get irisOpenness() {
    if (!this.transition) return 1;
    const progress = this.transition.steps / IRIS_STEPS;
    return this.transition.phase === 'closing' ? 1 - progress : progress;
  }

  /**
   * Paco ha usado una puerta: empieza la transición.
   * @param {import('../entities/wonder/Doorway.js').Doorway} door
   */
  useDoor(door) {
    if (this.transition) return;
    soundEngine.playSoundEffect(SOUND_EFFECT.DOOR);
    this.transition = { phase: 'closing', steps: 0, door };
  }

  /**
   * Avanza la transición.
   * @returns {boolean} true si el mundo debe quedarse quieto este paso.
   */
  update() {
    if (!this.transition) return false;
    this.transition.steps++;
    if (this.transition.steps < IRIS_STEPS) return true;
    if (this.transition.phase === 'closing') {
      if (this.transition.door.direction === 'exit') this.exitRoom(this.transition.door);
      else this.enterRoom(this.transition.door);
      this.transition = { phase: 'opening', steps: 0, door: this.transition.door };
      return true;
    }
    this.transition = null;
    return false;
  }

  /** @private */
  enterRoom(door) {
    const world = this.world;
    const buildRoom = world.level.roomBuilders[door.roomId];
    if (!buildRoom) return;
    this.snapshot = {
      level: world.level,
      tileMap: world.tileMap,
      theme: world.theme,
      entities: world.entities,
      platforms: world.platforms,
      spawnQueue: world.spawnQueue,
      nextSpawnIndex: world.nextSpawnIndex,
      cameraX: world.cameraX,
      remainingCoinsInBlocks: world.remainingCoinsInBlocks,
      blockBumps: world.blockBumps,
      wonder: world.wonder,
      door,
      playerX: world.player.x,
      playerY: world.player.y
    };
    this.loadArea(buildRoom());
    world.player.x = 2 * TILE_SIZE + 2;
    world.player.y = world.tileMap.findFirstSolidRow(2) * TILE_SIZE - world.player.height;
    world.player.velocityX = 0;
    world.player.velocityY = 0;
    world.cameraX = 0;
    world.showBanner(GAMEPLAY_MESSAGES.secretRoom, 90);
    soundEngine.playSoundEffect(SOUND_EFFECT.SECRET);
  }

  /** @private */
  exitRoom() {
    const world = this.world;
    const snapshot = this.snapshot;
    if (!snapshot) return;
    world.level = snapshot.level;
    world.tileMap = snapshot.tileMap;
    world.theme = snapshot.theme;
    world.entities = snapshot.entities;
    world.platforms = snapshot.platforms;
    world.spawnQueue = snapshot.spawnQueue;
    world.nextSpawnIndex = snapshot.nextSpawnIndex;
    world.remainingCoinsInBlocks = snapshot.remainingCoinsInBlocks;
    world.blockBumps = snapshot.blockBumps;
    world.blockBumpOffsets = new Map();
    world.visualEffects = [];
    world.wonder = snapshot.wonder;
    world.cameraX = snapshot.cameraX;
    world.player.x = snapshot.playerX;
    world.player.y = snapshot.playerY;
    world.player.velocityX = 0;
    world.player.velocityY = 0;
    snapshot.door.cooldown = 60;
    this.snapshot = null;
    soundEngine.playSoundEffect(SOUND_EFFECT.DOOR);
  }

  /** @private Sustituye el área actual del mundo por otra. */
  loadArea(levelData) {
    const world = this.world;
    world.level = levelData;
    world.tileMap = levelData.tileMap;
    world.theme = THEMES[levelData.themeName];
    world.entities = [];
    world.platforms = [];
    world.visualEffects = [];
    world.blockBumps = [];
    world.blockBumpOffsets = new Map();
    world.remainingCoinsInBlocks = new Map();
    world.wonder = new WonderDirector(world);
    world.cameraX = 0;
    world.prepareSpawnQueue();
  }
}
